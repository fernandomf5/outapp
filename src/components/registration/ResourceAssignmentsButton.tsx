import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Link2, Loader2, Search } from "lucide-react";
import {
  buildResourceTitle,
  buildResourceUrl,
  getResourceType,
  resourceLabel,
} from "@/lib/resourceLinks";
import { ContactCategoryPicker } from "./ContactCategoryPicker";


interface Props {
  resourceType: string;
  /** Optional: restrict the dialog to a single resource */
  resourceId?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "icon";
  className?: string;
}

const NONE = "__none__";
const TABLE = "contact_resource_links" as any;

interface ContactOption {
  id: string;
  name: string;
  company: string | null;
  registration_category_id: string | null;
}

/**
 * Generic "assign to a cadastro/category" manager that can be dropped into
 * the header of any resource module.
 */
export function ResourceAssignmentsButton({
  resourceType,
  resourceId,
  label = "Atribuir a cadastro",
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<Array<{ id: string; title: string }>>([]);
  const [links, setLinks] = useState<Record<string, { id: string; contact_id: string }>>({});
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const def = getResourceType(resourceType);

  useEffect(() => {
    const load = async () => {
      if (!open || !user?.id || !def) return;
      setLoading(true);

      const resourceQuery = supabase
        .from(def.table as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(300);

      const [{ data: resourceRows }, { data: linkRows }, { data: cts }, { data: cats }] =
        await Promise.all([
          resourceQuery,
          supabase
            .from(TABLE)
            .select("id, contact_id, resource_id")
            .eq("user_id", user.id)
            .eq("resource_type", resourceType),
          supabase
            .from("contacts")
            .select("id, name, company, registration_category_id")
            .eq("user_id", user.id)
            .order("name")
            .limit(1000),
          supabase
            .from("registration_categories")
            .select("id, name")
            .eq("user_id", user.id)
            .order("name"),
        ]);

      let mapped = ((resourceRows || []) as any[]).map((r) => ({
        id: r.id,
        title: buildResourceTitle(resourceType, r),
      }));
      if (resourceId) mapped = mapped.filter((r) => r.id === resourceId);

      const linkMap: Record<string, { id: string; contact_id: string }> = {};
      ((linkRows || []) as any[]).forEach((l) => {
        linkMap[l.resource_id] = { id: l.id, contact_id: l.contact_id };
      });

      setRows(mapped);
      setLinks(linkMap);
      setContacts((cts || []) as ContactOption[]);
      setCategories((cats || []) as any);
      setLoading(false);
    };
    load();
  }, [open, user?.id, resourceType, resourceId, def]);

  const grouped = useMemo(
    () =>
      categories
        .map((cat) => ({
          category: cat,
          items: contacts.filter((c) => c.registration_category_id === cat.id),
        }))
        .filter((g) => g.items.length > 0),
    [categories, contacts]
  );

  const ungrouped = useMemo(
    () =>
      contacts.filter(
        (c) =>
          !c.registration_category_id ||
          !categories.some((cat) => cat.id === c.registration_category_id)
      ),
    [contacts, categories]
  );

  const categoryNameFor = (contactId?: string) => {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return null;
    return categories.find((cat) => cat.id === contact.registration_category_id)?.name || null;
  };

  const handleAssign = async (row: { id: string; title: string }, contactId: string | null) => {
    if (!user?.id) return;
    try {
      setSavingId(row.id);
      await supabase
        .from(TABLE)
        .delete()
        .eq("user_id", user.id)
        .eq("resource_type", resourceType)
        .eq("resource_id", row.id);

      if (!contactId) {
        setLinks((prev) => {
          const next = { ...prev };
          delete next[row.id];
          return next;
        });
        toast.success("Atribuição removida");
        return;
      }

      const contact = contacts.find((c) => c.id === contactId);
      const { data, error } = await supabase
        .from(TABLE)
        .insert({
          user_id: user.id,
          contact_id: contactId,
          category_id: contact?.registration_category_id ?? null,
          resource_type: resourceType,
          resource_id: row.id,
          resource_title: row.title,
          resource_url: buildResourceUrl(resourceType, row.id),
        } as any)
        .select("id")
        .maybeSingle();
      if (error) throw error;

      setLinks((prev) => ({ ...prev, [row.id]: { id: (data as any)?.id, contact_id: contactId } }));
      toast.success(`Atribuído a ${contact?.name || "cadastro"}`);
    } catch (e: any) {
      toast.error("Erro ao atribuir: " + (e?.message || ""));
    } finally {
      setSavingId(null);
    }
  };

  const filtered = rows.filter((r) =>
    search.trim() ? r.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Link2 className="h-4 w-4 mr-1" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-[560px] z-[300] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-base">
              Atribuir {resourceLabel(resourceType)} a um cadastro
            </DialogTitle>
            <DialogDescription className="text-xs">
              Escolha a categoria e depois o cadastro de cada item.
            </DialogDescription>
          </DialogHeader>

          {!resourceId && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar item..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}

          <div className="max-h-[55vh] overflow-y-auto overflow-x-hidden space-y-2 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhum item encontrado para atribuir.
              </div>
            ) : (
              filtered.map((row) => {
                const current = links[row.id]?.contact_id || null;
                const catName = categoryNameFor(current || undefined);
                return (
                  <div key={row.id} className="rounded-lg border p-3 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-medium text-sm truncate flex-1">{row.title}</p>
                      {catName && (
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {catName}
                        </Badge>
                      )}
                      {savingId === row.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                      )}
                    </div>
                    <ContactCategoryPicker
                      value={current}
                      onChange={(contactId) => handleAssign(row, contactId)}
                      contacts={contacts}
                      categories={categories}
                      disabled={savingId === row.id}
                      className="w-full"
                    />
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
