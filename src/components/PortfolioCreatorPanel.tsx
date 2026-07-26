import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Loader2, ArrowLeft, Save, Eye, Copy, Trash2, ExternalLink, Share2, Monitor, Smartphone,
  LayoutTemplate, Palette, Settings2, Globe, FolderKanban, Mail, Contact2, Sparkles, ListChecks,
} from "lucide-react";
import { toast } from "sonner";
import { ResourceAssignmentsButton } from "@/components/registration/ResourceAssignmentsButton";
import { CaptureTheme, DEFAULT_THEME, slugify, uid } from "./capture/captureTypes";
import { CaptureThemeEditor } from "./capture/CaptureThemeEditor";
import { CaptureImageInput } from "./capture/CaptureImageInput";
import { CaptureFormBuilder } from "./capture/CaptureFormBuilder";
import {
  DEFAULT_CONTACT, DEFAULT_PORTFOLIO_THEME, DEFAULT_SECTIONS, LAYOUT_OPTIONS, PORTFOLIO_CATEGORIES,
  PORTFOLIO_TEMPLATES, PortfolioItemRecord, PortfolioLayout, PortfolioRecord, SOCIAL_FIELDS,
  fieldsFromCategory, getCategoryDef,
} from "./portfolio/portfolioTypes";
import { PortfolioSectionsEditor } from "./portfolio/PortfolioSectionsEditor";
import { PortfolioItemsEditor } from "./portfolio/PortfolioItemsEditor";
import { PortfolioRenderer } from "./portfolio/PortfolioRenderer";
import { PortfolioMessagesPanel } from "./portfolio/PortfolioMessagesPanel";

const db = supabase as any;

const normalize = (row: any): PortfolioRecord => ({
  ...row,
  theme: { ...DEFAULT_PORTFOLIO_THEME(), ...(row.theme || {}) },
  sections: Array.isArray(row.sections) && row.sections.length ? row.sections : DEFAULT_SECTIONS(),
  custom_fields: Array.isArray(row.custom_fields) ? row.custom_fields : [],
  contact: { ...DEFAULT_CONTACT, ...(row.contact || {}) },
  layout: (row.layout || "grid") as PortfolioLayout,
});

const normalizeItem = (row: any): PortfolioItemRecord => ({
  ...row,
  images: Array.isArray(row.images) ? row.images : [],
  tags: Array.isArray(row.tags) ? row.tags : [],
  links: Array.isArray(row.links) ? row.links : [],
  files: Array.isArray(row.files) ? row.files : [],
  custom_data: row.custom_data && typeof row.custom_data === "object" ? row.custom_data : {},
});

export const PortfolioCreatorPanel = () => {
  const [portfolios, setPortfolios] = useState<PortfolioRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PortfolioRecord | null>(null);
  const [items, setItems] = useState<PortfolioItemRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toDelete, setToDelete] = useState<PortfolioRecord | null>(null);
  const [tab, setTab] = useState("sections");
  const [view, setView] = useState<"list" | "messages">("list");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizard, setWizard] = useState({ name: "", category: "developer", template: "midnight" });
  const [creating, setCreating] = useState(false);

  const publicUrl = (slug: string | null) => `${window.location.origin}/portfolio/${slug || ""}`;

  const load = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return setLoading(false);
    const { data, error } = await db
      .from("portfolios")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar portfólios");
    setPortfolios((data || []).map(normalize));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const loadItems = async (portfolioId: string) => {
    const { data } = await db
      .from("portfolio_items")
      .select("*")
      .eq("portfolio_id", portfolioId)
      .order("display_order", { ascending: true });
    setItems((data || []).map(normalizeItem));
  };

  const openEditor = async (p: PortfolioRecord) => {
    setEditing(p);
    setTab("sections");
    await loadItems(p.id);
  };

  const createPortfolio = async () => {
    const name = wizard.name.trim() || "Meu portfólio";
    setCreating(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const cat = getCategoryDef(wizard.category);
      const tpl = PORTFOLIO_TEMPLATES.find((t) => t.key === wizard.template) || PORTFOLIO_TEMPLATES[0];
      const sections = DEFAULT_SECTIONS().map((s) =>
        s.type === "hero"
          ? { ...s, props: { ...s.props, title: name, subtitle: cat.subheadline, eyebrow: cat.headline } }
          : s,
      );
      const { data, error } = await db
        .from("portfolios")
        .insert({
          user_id: auth.user.id,
          name,
          slug: `${slugify(name) || "portfolio"}-${uid().slice(-6)}`,
          niche: wizard.category,
          category: wizard.category,
          template: tpl.key,
          layout: tpl.layout,
          is_public: false,
          is_active: true,
          theme: { ...DEFAULT_PORTFOLIO_THEME(), ...tpl.theme },
          sections,
          custom_fields: fieldsFromCategory(wizard.category),
          contact: DEFAULT_CONTACT,
        })
        .select()
        .single();
      if (error) throw error;
      const record = normalize(data);
      setPortfolios((p) => [record, ...p]);
      setWizardOpen(false);
      setWizard({ name: "", category: "developer", template: "midnight" });
      setItems([]);
      setEditing(record);
      setTab("sections");
      toast.success("Portfólio criado");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao criar portfólio");
    } finally {
      setCreating(false);
    }
  };

  const savePortfolio = async (p: PortfolioRecord, silent = false) => {
    setSaving(true);
    const { error } = await db
      .from("portfolios")
      .update({
        name: p.name,
        description: p.description,
        slug: p.slug,
        niche: p.niche,
        category: p.category,
        template: p.template,
        layout: p.layout,
        is_public: p.is_public,
        logo_url: p.logo_url,
        cover_url: p.cover_url,
        theme: p.theme,
        sections: p.sections,
        custom_fields: p.custom_fields,
        contact: p.contact,
      })
      .eq("id", p.id);
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Este endereço (slug) já está em uso." : error.message);
      return false;
    }
    setPortfolios((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    if (!silent) toast.success("Alterações salvas");
    return true;
  };

  const togglePublish = async (p: PortfolioRecord) => {
    const next = { ...p, is_public: !p.is_public };
    const ok = await savePortfolio(next, true);
    if (ok) {
      if (editing?.id === p.id) setEditing(next);
      toast.success(next.is_public ? "Portfólio publicado" : "Portfólio despublicado");
    }
  };

  const duplicatePortfolio = async (p: PortfolioRecord) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data, error } = await db
      .from("portfolios")
      .insert({
        user_id: auth.user.id,
        name: `${p.name} (cópia)`,
        description: p.description,
        slug: `${slugify(p.name) || "portfolio"}-${uid().slice(-6)}`,
        niche: p.niche,
        category: p.category,
        template: p.template,
        layout: p.layout,
        is_public: false,
        logo_url: p.logo_url,
        cover_url: p.cover_url,
        theme: p.theme,
        sections: p.sections,
        custom_fields: p.custom_fields,
        contact: p.contact,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    const created = normalize(data);
    const { data: srcItems } = await db.from("portfolio_items").select("*").eq("portfolio_id", p.id);
    if (srcItems?.length) {
      await db.from("portfolio_items").insert(
        srcItems.map((it: any) => {
          const { id, created_at, updated_at, ...rest } = it;
          return { ...rest, portfolio_id: created.id };
        }),
      );
    }
    setPortfolios((prev) => [created, ...prev]);
    toast.success("Portfólio duplicado");
  };

  const removePortfolio = async () => {
    if (!toDelete) return;
    const { error } = await db.from("portfolios").delete().eq("id", toDelete.id);
    if (error) return toast.error(error.message);
    setPortfolios((p) => p.filter((x) => x.id !== toDelete.id));
    if (editing?.id === toDelete.id) setEditing(null);
    setToDelete(null);
    toast.success("Portfólio excluído");
  };

  const copyLink = (p: PortfolioRecord) => {
    navigator.clipboard.writeText(publicUrl(p.slug));
    toast.success("Link copiado");
  };

  const sharePortfolio = async (p: PortfolioRecord) => {
    const url = publicUrl(p.slug);
    if (navigator.share) {
      try {
        await navigator.share({ title: p.name, url });
        return;
      } catch {
        /* cancelado */
      }
    }
    copyLink(p);
  };

  /* --------------------------------- Editor -------------------------------- */
  if (editing) {
    const patch = (v: Partial<PortfolioRecord>) => setEditing({ ...editing, ...v });

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
          <Input value={editing.name} onChange={(e) => patch({ name: e.target.value })} className="h-9 max-w-xs font-semibold" />
          <Badge variant={editing.is_public ? "default" : "secondary"}>{editing.is_public ? "Publicado" : "Rascunho"}</Badge>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
              <Eye className="mr-1 h-4 w-4" /> Prévia
            </Button>
            <Button variant="outline" size="sm" onClick={() => togglePublish(editing)}>
              <Globe className="mr-1 h-4 w-4" /> {editing.is_public ? "Despublicar" : "Publicar"}
            </Button>
            <Button size="sm" onClick={() => savePortfolio(editing)} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Salvar
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,440px)_1fr]">
          <Card className="p-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="sections" className="text-xs"><LayoutTemplate className="mr-1 h-3.5 w-3.5" />Seções</TabsTrigger>
                <TabsTrigger value="projects" className="text-xs"><FolderKanban className="mr-1 h-3.5 w-3.5" />Projetos</TabsTrigger>
                <TabsTrigger value="fields" className="text-xs"><ListChecks className="mr-1 h-3.5 w-3.5" />Campos</TabsTrigger>
                <TabsTrigger value="style" className="text-xs"><Palette className="mr-1 h-3.5 w-3.5" />Estilo</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs"><Settings2 className="mr-1 h-3.5 w-3.5" />Config</TabsTrigger>
              </TabsList>

              <div className="mt-3 max-h-[70vh] overflow-y-auto pr-1">
                <TabsContent value="sections" className="m-0">
                  <PortfolioSectionsEditor sections={editing.sections} onChange={(sections) => patch({ sections })} />
                </TabsContent>

                <TabsContent value="projects" className="m-0">
                  <PortfolioItemsEditor
                    portfolioId={editing.id}
                    items={items}
                    customFields={editing.custom_fields}
                    onReload={() => loadItems(editing.id)}
                  />
                </TabsContent>

                <TabsContent value="fields" className="m-0 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Campos personalizados aparecem no cadastro de cada projeto e são exibidos nos detalhes.
                  </p>
                  <CaptureFormBuilder fields={editing.custom_fields} onChange={(custom_fields) => patch({ custom_fields })} />
                </TabsContent>

                <TabsContent value="style" className="m-0 space-y-4">
                  <Card className="space-y-3 p-4">
                    <Label className="text-sm font-semibold">Template pronto</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {PORTFOLIO_TEMPLATES.map((t) => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() =>
                            patch({ template: t.key, layout: t.layout, theme: { ...editing.theme, ...t.theme } as CaptureTheme })
                          }
                          className={`rounded-lg border p-2 text-left transition ${editing.template === t.key ? "border-primary ring-1 ring-primary" : "hover:border-primary/50"}`}
                        >
                          <div className="mb-1 flex gap-1">
                            {[t.theme.background, t.theme.surface, t.theme.primary].map((c, i) => (
                              <span key={i} className="h-4 w-4 rounded-full border" style={{ background: c }} />
                            ))}
                          </div>
                          <div className="text-xs font-medium">{t.label}</div>
                          <div className="text-[10px] text-muted-foreground">{t.description}</div>
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Card className="space-y-2 p-4">
                    <Label className="text-sm font-semibold">Layout dos projetos</Label>
                    <Select value={editing.layout} onValueChange={(v) => patch({ layout: v as PortfolioLayout })}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-[300]">
                        {LAYOUT_OPTIONS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label} — {l.description}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Card>

                  <CaptureThemeEditor theme={editing.theme} onChange={(theme) => patch({ theme })} />
                </TabsContent>

                <TabsContent value="settings" className="m-0 space-y-4">
                  <Card className="space-y-3 p-4">
                    <div>
                      <Label className="text-xs">Endereço público (slug)</Label>
                      <Input className="h-9" value={editing.slug || ""} onChange={(e) => patch({ slug: slugify(e.target.value) })} />
                      <p className="mt-1 break-all text-xs text-muted-foreground">{publicUrl(editing.slug)}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Descrição (SEO)</Label>
                      <Textarea rows={2} value={editing.description || ""} onChange={(e) => patch({ description: e.target.value })} />
                    </div>
                    <CaptureImageInput label="Logo" value={editing.logo_url || ""} onChange={(v) => patch({ logo_url: v })} />
                    <CaptureImageInput label="Imagem de capa (compartilhamento)" value={editing.cover_url || ""} onChange={(v) => patch({ cover_url: v })} />
                    <div className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">Portfólio publicado</span>
                      <Switch checked={!!editing.is_public} onCheckedChange={() => togglePublish(editing)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyLink(editing)}><Copy className="mr-1 h-4 w-4" />Copiar link</Button>
                      <Button variant="outline" size="sm" onClick={() => sharePortfolio(editing)}><Share2 className="mr-1 h-4 w-4" />Compartilhar</Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(publicUrl(editing.slug), "_blank")}><ExternalLink className="mr-1 h-4 w-4" />Abrir</Button>
                    </div>
                  </Card>

                  <Card className="space-y-3 p-4">
                    <Label className="flex items-center gap-2 text-sm font-semibold"><Contact2 className="h-4 w-4" />Contato e redes sociais</Label>
                    {SOCIAL_FIELDS.map((f) => (
                      <div key={f.key}>
                        <Label className="text-xs">{f.label}</Label>
                        <Input
                          className="h-9"
                          placeholder={f.placeholder}
                          value={(editing.contact as any)[f.key] || ""}
                          onChange={(e) => patch({ contact: { ...editing.contact, [f.key]: e.target.value } })}
                        />
                      </div>
                    ))}
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </Card>

          <Card className="overflow-hidden p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Prévia ao vivo</span>
              <div className="flex gap-1">
                <Button variant={device === "desktop" ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setDevice("desktop")}><Monitor className="h-4 w-4" /></Button>
                <Button variant={device === "mobile" ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setDevice("mobile")}><Smartphone className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="mx-auto overflow-y-auto rounded-lg border" style={{ maxHeight: "72vh", width: device === "mobile" ? 390 : "100%", maxWidth: "100%" }}>
              <PortfolioRenderer portfolio={editing} items={items} mode="preview" />
            </div>
          </Card>
        </div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="z-[250] max-w-5xl p-0">
            <DialogHeader className="p-4 pb-0"><DialogTitle>Prévia do portfólio</DialogTitle></DialogHeader>
            <div className="max-h-[80vh] overflow-y-auto">
              <PortfolioRenderer portfolio={editing} items={items} mode="preview" />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ---------------------------------- Lista -------------------------------- */
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1">
          <h2 className="text-xl font-bold">Criador de Portfólio</h2>
          <p className="text-sm text-muted-foreground">Monte um portfólio profissional em minutos e compartilhe com seus clientes.</p>
        </div>
        <ResourceAssignmentsButton resourceType="portfolio" />
        <Button onClick={() => setWizardOpen(true)}><Plus className="mr-1 h-4 w-4" />Novo portfólio</Button>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList>
          <TabsTrigger value="list"><FolderKanban className="mr-1 h-4 w-4" />Meus portfólios</TabsTrigger>
          <TabsTrigger value="messages"><Mail className="mr-1 h-4 w-4" />Mensagens</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : portfolios.length === 0 ? (
            <Card className="p-10 text-center">
              <FolderKanban className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Nenhum portfólio criado ainda</p>
              <p className="mb-4 text-sm text-muted-foreground">Escolha sua área e comece com uma estrutura pronta.</p>
              <Button onClick={() => setWizardOpen(true)}><Plus className="mr-1 h-4 w-4" />Criar portfólio</Button>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {portfolios.map((p) => {
                const cat = getCategoryDef(p.category);
                const Icon = cat.icon;
                return (
                  <Card key={p.id} className="flex flex-col p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        <h3 className="min-w-0 flex-1 truncate font-semibold">{p.name}</h3>
                      </div>
                      <Badge variant={p.is_public ? "default" : "secondary"} className="shrink-0 text-[10px]">
                        {p.is_public ? "Publicado" : "Rascunho"}
                      </Badge>
                    </div>
                    <p className="mb-2 truncate text-xs text-muted-foreground">/portfolio/{p.slug}</p>
                    <div className="mb-3 flex gap-3 text-xs text-muted-foreground">
                      <span>{cat.label}</span>
                      <span>{p.views || 0} visitas</span>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1">
                      <Button size="sm" className="h-8 flex-1" onClick={() => openEditor(p)}>Editar</Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Copiar link" onClick={() => copyLink(p)}><Copy className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Abrir" onClick={() => window.open(publicUrl(p.slug), "_blank")}><ExternalLink className="h-4 w-4" /></Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Duplicar" onClick={() => duplicatePortfolio(p)}><Copy className="h-4 w-4 rotate-90" /></Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive" title="Excluir" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages" className="mt-4">
          <PortfolioMessagesPanel portfolios={portfolios.map((p) => ({ id: p.id, name: p.name }))} />
        </TabsContent>
      </Tabs>

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="z-[250] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Criar portfólio</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-1">
              <Label className="text-xs">Nome do portfólio</Label>
              <Input className="h-9" placeholder="Ex.: João Silva — Fotografia" value={wizard.name} onChange={(e) => setWizard({ ...wizard, name: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Qual é a sua área?</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {PORTFOLIO_CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setWizard({ ...wizard, category: c.key })}
                      className={`rounded-lg border p-2 text-left transition ${wizard.category === c.key ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}
                    >
                      <Icon className="mb-1 h-4 w-4 text-primary" />
                      <div className="text-xs font-medium">{c.label}</div>
                      <div className="line-clamp-2 text-[10px] text-muted-foreground">{c.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Escolha um visual</Label>
              <div className="grid gap-2 sm:grid-cols-3">
                {PORTFOLIO_TEMPLATES.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setWizard({ ...wizard, template: t.key })}
                    className={`rounded-lg border p-2 text-left transition ${wizard.template === t.key ? "border-primary ring-1 ring-primary" : "hover:border-primary/50"}`}
                  >
                    <div className="mb-1 flex gap-1">
                      {[t.theme.background, t.theme.surface, t.theme.primary].map((c, i) => (
                        <span key={i} className="h-4 w-4 rounded-full border" style={{ background: c }} />
                      ))}
                    </div>
                    <div className="text-xs font-medium">{t.label}</div>
                    <div className="text-[10px] text-muted-foreground">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setWizardOpen(false)}>Cancelar</Button>
            <Button onClick={createPortfolio} disabled={creating}>
              {creating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}Criar portfólio
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="z-[300]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir portfólio?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os projetos e mensagens deste portfólio serão removidos. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removePortfolio} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PortfolioCreatorPanel;
