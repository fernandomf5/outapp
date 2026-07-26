import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ContactOption {
  id: string;
  name: string;
  company: string | null;
  registration_category_id: string | null;
}

export interface CategoryOption {
  id: string;
  name: string;
}

const ALL = "__all__";
const NONE = "__none__";
const NO_CATEGORY = "__nocat__";

interface Props {
  value: string | null;
  onChange: (contactId: string | null) => void;
  contacts?: ContactOption[];
  categories?: CategoryOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Category filter + searchable contact list.
 * First choose the category, then pick the cadastro from that category.
 */
export function ContactCategoryPicker({
  value,
  onChange,
  contacts: contactsProp,
  categories: categoriesProp,
  disabled,
  placeholder = "Avulso (sem cadastro)",
  className,
}: Props) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ContactOption[]>(contactsProp || []);
  const [categories, setCategories] = useState<CategoryOption[]>(categoriesProp || []);
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contactsProp) setContacts(contactsProp);
  }, [contactsProp]);
  useEffect(() => {
    if (categoriesProp) setCategories(categoriesProp);
  }, [categoriesProp]);

  useEffect(() => {
    const load = async () => {
      if (contactsProp || !user?.id) return;
      const [{ data: cats }, { data: cts }] = await Promise.all([
        supabase
          .from("registration_categories")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name"),
        supabase
          .from("contacts")
          .select("id, name, company, registration_category_id")
          .eq("user_id", user.id)
          .order("name")
          .limit(1000),
      ]);
      setCategories((cats || []) as CategoryOption[]);
      setContacts((cts || []) as ContactOption[]);
    };
    load();
  }, [user?.id, contactsProp]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const selected = contacts.find((c) => c.id === value) || null;

  // Keep category filter in sync with the currently selected contact
  useEffect(() => {
    if (selected?.registration_category_id) setCategoryId(selected.registration_category_id);
  }, [selected?.registration_category_id]);

  const filtered = useMemo(() => {
    if (categoryId === ALL) return contacts;
    if (categoryId === NO_CATEGORY)
      return contacts.filter(
        (c) =>
          !c.registration_category_id ||
          !categories.some((cat) => cat.id === c.registration_category_id)
      );
    return contacts.filter((c) => c.registration_category_id === categoryId);
  }, [contacts, categories, categoryId]);

  const visibleContacts = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return filtered;
    return filtered.filter((contact) => {
      const searchable = `${contact.name} ${contact.company || ""}`.toLowerCase();
      return searchable.includes(term);
    });
  }, [filtered, query]);

  const handleSelect = (contactId: string | null) => {
    onChange(contactId);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0", className)}>
      <Select value={categoryId} onValueChange={setCategoryId} disabled={disabled}>
        <SelectTrigger className="h-9 text-sm min-w-0">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent className="max-h-[300px] z-[400]">
          <SelectItem value={ALL}>Todas as categorias</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
          <SelectItem value={NO_CATEGORY}>Sem categoria</SelectItem>
        </SelectContent>
      </Select>

      <div ref={pickerRef} className="relative min-w-0">
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            onClick={() => setOpen((current) => !current)}
            className="h-9 w-full min-w-0 justify-between font-normal text-sm"
          >
            <span className="truncate">
              {selected ? selected.name : placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
          {open && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-[500] rounded-md border bg-popover text-popover-foreground shadow-lg">
              <div className="border-b p-2">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Pesquisar cadastro..."
                  className="h-9"
                  autoFocus
                />
              </div>
              <div className="max-h-[260px] overflow-y-auto p-1">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-full justify-start px-2 font-normal"
                  onClick={() => handleSelect(null)}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")}
                  />
                  <span className="truncate">{placeholder}</span>
                </Button>

                {visibleContacts.length === 0 ? (
                  <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                    Nenhum cadastro encontrado.
                  </div>
                ) : (
                  visibleContacts.map((contact) => (
                    <Button
                      key={contact.id}
                      type="button"
                      variant="ghost"
                      className="h-9 w-full justify-start px-2 font-normal"
                      onClick={() => handleSelect(contact.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          value === contact.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span className="truncate text-left">
                        {contact.name}
                        {contact.company ? ` — ${contact.company}` : ""}
                      </span>
                    </Button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

export { NONE };
