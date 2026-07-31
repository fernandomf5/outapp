import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SITE_TYPES, NICHE_GROUPS, findNicheGroup } from "@/data/siteNiches";
import { SiteBlock, SiteTheme, DEFAULT_THEME } from "./siteTypes";
import { SiteEditor } from "./SiteEditor";
import { buildTemplate, buildTheme } from "./siteTemplates";

interface SiteRow {
  id: string;
  name: string;
  slug: string;
  site_type: string;
  niche: string | null;
  niche_group: string | null;
  theme: any;
  seo: any;
  is_published: boolean;
  views: number;
  created_at: string;
}

interface PageRow {
  id: string;
  site_id: string;
  title: string;
  path: string;
  blocks: any;
  is_home: boolean;
  sort_order: number;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

export function SitesCreatorPanel() {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<SiteRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);
    const { data, error } = await supabase
      .from("sites").select("*").eq("user_id", user.id)
      .order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar sites");
    setSites((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const togglePublish = async (site: SiteRow) => {
    const { error } = await supabase.from("sites").update({ is_published: !site.is_published }).eq("id", site.id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success(!site.is_published ? "Site publicado!" : "Site despublicado");
    load();
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("sites").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) return toast.error("Erro ao excluir");
    toast.success("Site excluído");
    load();
  };

  const duplicate = async (site: SiteRow) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: pages } = await supabase.from("site_pages").select("*").eq("site_id", site.id);
    const { data: newSite, error } = await supabase.from("sites").insert({
      user_id: user.id, name: `${site.name} (cópia)`, slug: `${site.slug}-${Date.now().toString(36).slice(-4)}`,
      site_type: site.site_type, niche: site.niche, niche_group: site.niche_group,
      theme: site.theme, seo: site.seo, is_published: false,
    }).select().single();
    if (error || !newSite) return toast.error("Erro ao duplicar");
    if (pages?.length) {
      await supabase.from("site_pages").insert(
        pages.map((p: any) => ({
          site_id: newSite.id, title: p.title, path: p.path, blocks: p.blocks,
          seo: p.seo, is_home: p.is_home, sort_order: p.sort_order,
        }))
      );
    }
    toast.success("Site duplicado");
    load();
  };

  const totalViews = sites.reduce((s, x) => s + (x.views || 0), 0);
  const published = sites.filter((s) => s.is_published).length;

  if (editing) {
    return <SiteWorkspace site={editing} onBack={() => { setEditing(null); load(); }} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Criador de Sites</h2>
          <p className="text-sm text-muted-foreground">
            Monte sites completos com blocos de arrastar e soltar e modelos por nicho.
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="gradient-primary shadow-glow">
          <Icons.Plus className="h-4 w-4 mr-1" /> Novo site
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sites", value: sites.length, icon: Icons.Globe },
          { label: "Publicados", value: published, icon: Icons.Rocket },
          { label: "Visitas", value: totalViews, icon: Icons.Eye },
        ].map((s) => (
          <Card key={s.label} className="p-3 sm:p-4 glass">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-xl bg-primary/10"><s.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /></div>
              <div className="min-w-0">
                <div className="text-lg sm:text-2xl font-bold">{s.value}</div>
                <div className="text-[11px] sm:text-xs text-muted-foreground truncate">{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {loading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Carregando...</Card>
      ) : sites.length === 0 ? (
        <Card className="p-10 text-center space-y-3">
          <Icons.Globe className="h-10 w-10 mx-auto text-primary" />
          <h3 className="font-semibold">Nenhum site criado</h3>
          <p className="text-sm text-muted-foreground">Escolha um nicho e comece em segundos.</p>
          <Button onClick={() => setWizardOpen(true)}>Criar meu primeiro site</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((site) => {
            const type = SITE_TYPES.find((t) => t.id === site.site_type);
            const url = `${window.location.origin}/site/${site.slug}`;
            return (
              <Card key={site.id} className="p-4 glass space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{site.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">/site/{site.slug}</p>
                  </div>
                  <Badge variant={site.is_published ? "default" : "secondary"}>
                    {site.is_published ? "No ar" : "Rascunho"}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {type && <Badge variant="outline" className="text-[10px]">{type.label}</Badge>}
                  {site.niche && <Badge variant="outline" className="text-[10px]">{site.niche}</Badge>}
                  <Badge variant="outline" className="text-[10px]">{site.views || 0} visitas</Badge>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={site.is_published} onCheckedChange={() => togglePublish(site)} />
                    <span className="text-xs text-muted-foreground">Publicar</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Copiar link"
                      onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copiado"); }}>
                      <Icons.Link2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Abrir"
                      onClick={() => window.open(url, "_blank")}>
                      <Icons.ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Duplicar" onClick={() => duplicate(site)}>
                      <Icons.Copy className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Excluir"
                      onClick={() => setDeleteId(site.id)}>
                      <Icons.Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Button className="w-full" onClick={() => setEditing(site)}>
                  <Icons.Pencil className="h-4 w-4 mr-1" /> Editar site
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <SiteWizard open={wizardOpen} onOpenChange={setWizardOpen} onCreated={(s) => { load(); setEditing(s); }} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="z-[300]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir site?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as páginas e conteúdos deste site serão apagados. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------------- Wizard ---------------- */

function SiteWizard({ open, onOpenChange, onCreated }: any) {
  const [step, setStep] = useState(0);
  const [siteType, setSiteType] = useState("institucional");
  const [groupId, setGroupId] = useState<string>("");
  const [niche, setNiche] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const group = findNicheGroup(groupId);
  const niches = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = group ? group.niches : NICHE_GROUPS.flatMap((g) => g.niches);
    return q ? list.filter((n) => n.toLowerCase().includes(q)) : list;
  }, [group, search]);

  const reset = () => { setStep(0); setSiteType("institucional"); setGroupId(""); setNiche(""); setName(""); setSlug(""); setWhatsapp(""); setSearch(""); };

  const create = async () => {
    if (!name.trim()) return toast.error("Informe o nome do site");
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");
      const finalSlug = slugify(slug || name) || `site-${Date.now().toString(36)}`;
      const theme = buildTheme(group);
      const { data: site, error } = await supabase.from("sites").insert({
        user_id: user.id, name: name.trim(), slug: finalSlug, site_type: siteType,
        niche: niche || null, niche_group: groupId || null, theme: theme as any,
        seo: { title: name.trim(), description: `${name.trim()} — ${niche || "site oficial"}` } as any,
      }).select().single();
      if (error) throw error;
      const blocks = buildTemplate({ siteType, niche, group, brand: name.trim(), whatsapp });
      await supabase.from("site_pages").insert({
        site_id: site.id, title: "Início", path: "", is_home: true, sort_order: 0, blocks: blocks as any,
      });
      toast.success("Site criado! Agora é só editar.");
      onOpenChange(false);
      reset();
      onCreated(site);
    } catch (e: any) {
      toast.error(e.message?.includes("duplicate") ? "Esse endereço já está em uso" : "Erro ao criar site");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[250]">
        <DialogHeader><DialogTitle>Criar novo site</DialogTitle></DialogHeader>

        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Qual tipo de site você quer criar?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {SITE_TYPES.map((t) => {
                const Icon = (Icons as any)[t.icon] || Icons.Globe;
                return (
                  <button key={t.id} onClick={() => { setSiteType(t.id); setStep(1); }}
                    className={`text-left p-4 rounded-xl border transition-colors hover:border-primary hover:bg-primary/5 ${siteType === t.id ? "border-primary" : ""}`}>
                    <Icon className="h-5 w-5 text-primary mb-2" />
                    <div className="font-semibold text-sm">{t.label}</div>
                    <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Escolha o nicho para aplicar o modelo e as cores ideais.</p>
            <Input placeholder="Buscar nicho..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button size="sm" variant={groupId === "" ? "default" : "outline"} onClick={() => setGroupId("")}>Todos</Button>
              {NICHE_GROUPS.map((g) => (
                <Button key={g.id} size="sm" variant={groupId === g.id ? "default" : "outline"} className="whitespace-nowrap"
                  onClick={() => setGroupId(g.id)}>{g.label}</Button>
              ))}
            </div>
            <ScrollArea className="h-64 rounded-lg border p-2">
              <div className="grid gap-2 sm:grid-cols-3">
                {niches.map((n) => (
                  <button key={n} onClick={() => {
                    setNiche(n);
                    if (!groupId) {
                      const g = NICHE_GROUPS.find((x) => x.niches.includes(n));
                      if (g) setGroupId(g.id);
                    }
                    setStep(2);
                  }}
                    className={`p-2.5 rounded-lg border text-xs text-left hover:border-primary hover:bg-primary/5 ${niche === n ? "border-primary" : ""}`}>
                    {n}
                  </button>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>Voltar</Button>
              <Button variant="outline" onClick={() => setStep(2)}>Pular</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nome do site / marca *</Label>
              <Input value={name} placeholder="Ex.: Clínica Vida" onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Endereço do site</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">/site/</span>
                <Input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp (opcional)</Label>
              <Input value={whatsapp} placeholder="5511999999999" onChange={(e) => setWhatsapp(e.target.value)} />
            </div>
            <div className="text-xs text-muted-foreground rounded-lg border p-3">
              Modelo: <strong>{SITE_TYPES.find((t) => t.id === siteType)?.label}</strong>
              {niche && <> · Nicho: <strong>{niche}</strong></>}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>Voltar</Button>
              <Button onClick={create} disabled={saving}>{saving ? "Criando..." : "Criar site"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Workspace (editor + páginas + config) ---------------- */

function SiteWorkspace({ site, onBack }: { site: SiteRow; onBack: () => void }) {
  const [pages, setPages] = useState<PageRow[]>([]);
  const [activePageId, setActivePageId] = useState<string>("");
  const [blocks, setBlocks] = useState<SiteBlock[]>([]);
  const [theme, setTheme] = useState<SiteTheme>({ ...DEFAULT_THEME, ...(site.theme || {}) });
  const [seo, setSeo] = useState<any>(site.seo || {});
  const [name, setName] = useState(site.name);
  const [slug, setSlug] = useState(site.slug);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadPages = async () => {
    const { data } = await supabase.from("site_pages").select("*").eq("site_id", site.id).order("sort_order");
    const list = (data as any as PageRow[]) || [];
    setPages(list);
    const home = list.find((p) => p.is_home) || list[0];
    if (home) { setActivePageId(home.id); setBlocks((home.blocks as any) || []); }
  };

  useEffect(() => { loadPages(); }, [site.id]);

  const switchPage = (id: string) => {
    const page = pages.find((p) => p.id === id);
    if (!page) return;
    setActivePageId(id);
    setBlocks((page.blocks as any) || []);
  };

  const save = async () => {
    setSaving(true);
    try {
      await supabase.from("sites").update({
        name, slug: slugify(slug), theme: theme as any, seo: seo as any,
      }).eq("id", site.id);
      if (activePageId) {
        await supabase.from("site_pages").update({ blocks: blocks as any }).eq("id", activePageId);
        setPages((ps) => ps.map((p) => (p.id === activePageId ? { ...p, blocks } : p)));
      }
      setDirty(false);
      toast.success("Alterações salvas");
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const addPage = async () => {
    const title = window.prompt("Nome da nova página", "Sobre");
    if (!title) return;
    const { data, error } = await supabase.from("site_pages").insert({
      site_id: site.id, title, path: slugify(title), sort_order: pages.length, blocks: [] as any,
    }).select().single();
    if (error) return toast.error("Erro ao criar página");
    await loadPages();
    setActivePageId((data as any).id);
    setBlocks([]);
  };

  const deletePage = async (id: string) => {
    const page = pages.find((p) => p.id === id);
    if (page?.is_home) return toast.error("A página inicial não pode ser excluída");
    await supabase.from("site_pages").delete().eq("id", id);
    toast.success("Página excluída");
    loadPages();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack}><Icons.ArrowLeft className="h-4 w-4" /></Button>
          <div className="min-w-0">
            <div className="font-bold truncate">{name}</div>
            <div className="text-xs text-muted-foreground truncate">/site/{slug}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`/site/${site.slug}`, "_blank")}>
            <Icons.Eye className="h-4 w-4 mr-1" /> Ver
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            <Icons.Save className="h-4 w-4 mr-1" /> {saving ? "Salvando..." : dirty ? "Salvar*" : "Salvar"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="editor">
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="paginas">Páginas</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-3">
          <Card className="overflow-hidden h-[75vh] min-h-[520px]">
            <SiteEditor
              blocks={blocks}
              theme={theme}
              onBlocksChange={(b) => { setBlocks(b); setDirty(true); }}
              onThemeChange={(t) => { setTheme(t); setDirty(true); }}
            />
          </Card>
        </TabsContent>

        <TabsContent value="paginas" className="mt-3 space-y-3">
          <Button size="sm" onClick={addPage}><Icons.Plus className="h-4 w-4 mr-1" /> Nova página</Button>
          <div className="grid gap-2 sm:grid-cols-2">
            {pages.map((p) => (
              <Card key={p.id} className={`p-3 flex items-center justify-between gap-2 ${p.id === activePageId ? "border-primary" : ""}`}>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{p.title} {p.is_home && <Badge variant="secondary" className="ml-1 text-[10px]">Início</Badge>}</div>
                  <div className="text-xs text-muted-foreground truncate">/site/{slug}/{p.path}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => switchPage(p.id)}>Editar</Button>
                  {!p.is_home && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deletePage(p.id)}>
                      <Icons.Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="mt-3">
          <Card className="p-4 space-y-4 max-w-xl">
            <div className="space-y-1.5">
              <Label>Nome do site</Label>
              <Input value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Endereço (slug)</Label>
              <Input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setDirty(true); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Título para Google (SEO)</Label>
              <Input value={seo.title || ""} onChange={(e) => { setSeo({ ...seo, title: e.target.value }); setDirty(true); }} />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição para Google</Label>
              <Textarea rows={3} value={seo.description || ""} onChange={(e) => { setSeo({ ...seo, description: e.target.value }); setDirty(true); }} />
            </div>
            <Button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar configurações"}</Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SitesCreatorPanel;
