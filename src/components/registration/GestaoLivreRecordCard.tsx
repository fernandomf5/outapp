import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Database, Loader2, ExternalLink } from "lucide-react";
import { buildResourceUrl, resourceIcon, resourceLabel } from "@/lib/resourceLinks";
import { Link } from "react-router-dom";

interface GestaoLivreRecordCardProps {
  contactId: string;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-BR");
  } catch {
    return "—";
  }
};

const BASE_FIELDS: { key: string; label: string }[] = [
  { key: "email", label: "E-mail" },
  { key: "phone", label: "Telefone" },
  { key: "document", label: "Documento" },
  { key: "company", label: "Empresa" },
  { key: "contact_person", label: "Pessoa de contato" },
  { key: "position", label: "Cargo" },
  { key: "market_area", label: "Área de atuação" },
  { key: "address", label: "Endereço" },
  { key: "website", label: "Site" },
  { key: "source", label: "Origem" },
];

const displayValue = (value: any): string => {
  if (value === null || value === undefined || value === "") return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
};

export function GestaoLivreRecordCard({ contactId }: GestaoLivreRecordCardProps) {
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      const { data: contactData } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", contactId)
        .maybeSingle();

      let categoryData: any = null;
      if (contactData?.registration_category_id) {
        const { data } = await supabase
          .from("registration_categories")
          .select("*")
          .eq("id", contactData.registration_category_id)
          .maybeSingle();
        categoryData = data;
      }

      const { data: linksData } = await supabase
        .from("contact_resource_links")
        .select("*")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false });

      if (!active) return;
      setContact(contactData);
      setCategory(categoryData);
      setLinks(linksData || []);
      setLoading(false);
    };

    if (contactId) load();
    return () => {
      active = false;
    };
  }, [contactId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!contact) return null;

  const schemaFields: any[] = Array.isArray(category?.custom_schema?.fields)
    ? category.custom_schema.fields
    : Array.isArray(category?.custom_schema)
    ? category.custom_schema
    : [];

  const customFields: Record<string, any> = contact.custom_fields || {};

  const customEntries = Object.entries(customFields)
    .map(([key, value]) => {
      const def = schemaFields.find((f: any) => (f?.key || f?.name || f?.id) === key);
      return { label: def?.label || def?.name || key, value: displayValue(value) };
    })
    .filter((e) => e.value !== "");

  const baseEntries = BASE_FIELDS.map((f) => ({
    label: f.label,
    value: displayValue(contact[f.key]),
  })).filter((e) => e.value !== "");

  const urls: any[] = Array.isArray(contact.urls) ? contact.urls : [];
  const tags: any[] = Array.isArray(contact.tags) ? contact.tags : [];

  return (
    <Card className="border-primary/30">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <div>
                <p className="font-semibold text-sm">Dados da Gestão Livre</p>
                <p className="text-xs text-muted-foreground">
                  {category?.name ? `Categoria: ${category.name}` : "Cadastro"} • Criado em{" "}
                  {formatDateTime(contact.created_at)}
                </p>
              </div>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {contact.status && <Badge variant="secondary">Status: {contact.status}</Badge>}
              {category?.entity_kind && <Badge variant="outline">{category.entity_kind}</Badge>}
              <Badge variant="outline">Atualizado em {formatDateTime(contact.updated_at)}</Badge>
              {tags.map((t, i) => (
                <Badge key={i} variant="outline">
                  {displayValue(t)}
                </Badge>
              ))}
            </div>

            {(baseEntries.length > 0 || customEntries.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...baseEntries, ...customEntries].map((e, i) => (
                  <div key={i} className="rounded-lg border bg-muted/30 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{e.label}</p>
                    <p className="text-sm break-words">{e.value}</p>
                  </div>
                ))}
              </div>
            )}

            {contact.notes && (
              <div className="rounded-lg border bg-muted/30 px-3 py-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Observações</p>
                <p className="text-sm whitespace-pre-wrap break-words">{contact.notes}</p>
              </div>
            )}

            {urls.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Links do cadastro</p>
                <div className="flex flex-wrap gap-2">
                  {urls.map((u: any, i: number) => {
                    const href = typeof u === "string" ? u : u?.url;
                    const label = typeof u === "string" ? u : u?.label || u?.url;
                    if (!href) return null;
                    return (
                      <a
                        key={i}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline text-primary break-all"
                      >
                        {label}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Recursos atribuídos ({links.length})
              </p>
              {links.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum recurso atribuído a este cadastro ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {links.map((link) => {
                    const Icon = resourceIcon(link.resource_type);
                    return (
                      <div
                        key={link.id}
                        className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="h-4 w-4 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">
                              {link.resource_title || resourceLabel(link.resource_type)}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {resourceLabel(link.resource_type)} • {formatDateTime(link.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button asChild size="sm" variant="ghost" className="gap-1">
                            <Link to={link.resource_url || buildResourceUrl(link.resource_type, link.resource_id)}>
                              <ExternalLink className="h-3.5 w-3.5" /> Abrir
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setToDelete(link);
                            }}
                            title="Remover atribuição"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
