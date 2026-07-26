import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Loader2, ArrowLeft, Save, Eye, Copy, Trash2, ExternalLink, Share2,
  Monitor, Smartphone, LayoutTemplate, ListChecks, Palette, Settings2, Users, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { ResourceAssignmentsButton } from "@/components/registration/ResourceAssignmentsButton";
import {
  CaptureBlock, CaptureField, CapturePageRecord, CaptureSettings, CaptureTheme,
  DEFAULT_BLOCKS, DEFAULT_FIELDS, DEFAULT_SETTINGS, DEFAULT_THEME, slugify, uid,
} from "./capture/captureTypes";
import { CaptureBlocksEditor } from "./capture/CaptureBlocksEditor";
import { CaptureFormBuilder } from "./capture/CaptureFormBuilder";
import { CaptureThemeEditor } from "./capture/CaptureThemeEditor";
import { CapturePageRenderer } from "./capture/CapturePageRenderer";
import { CaptureLeadsPanel } from "./capture/CaptureLeadsPanel";
import { EmbedSettingsCard } from "./embeds/EmbedSettingsCard";

const db = supabase as any;

const normalize = (row: any): CapturePageRecord => ({
  ...row,
  blocks: Array.isArray(row.blocks) ? row.blocks : [],
  form_fields: Array.isArray(row.form_fields) ? row.form_fields : [],
  theme: { ...DEFAULT_THEME, ...(row.theme || {}) },
  settings: { ...DEFAULT_SETTINGS, ...(row.settings || {}) },
});

export const CapturePageCreatorPanel = () => {
  const [pages, setPages] = useState<CapturePageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CapturePageRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CapturePageRecord | null>(null);
  const [tab, setTab] = useState("content");
  const [view, setView] = useState<"list" | "leads">("list");

  const publicUrl = (slug: string) => `${window.location.origin}/captura/${slug}`;

  const load = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return setLoading(false);
    const { data, error } = await db
      .from("capture_pages")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar páginas");
    setPages((data || []).map(normalize));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createPage = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const base = slugify("captura") + "-" + uid().slice(-6);
    const { data, error } = await db
      .from("capture_pages")
      .insert({
        user_id: auth.user.id,
        title: "Nova página de captura",
        slug: base,
        blocks: DEFAULT_BLOCKS(),
        form_fields: DEFAULT_FIELDS(),
        theme: DEFAULT_THEME,
        settings: DEFAULT_SETTINGS,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    const page = normalize(data);
    setPages((p) => [page, ...p]);
    setEditing(page);
    setTab("content");
    toast.success("Página criada");
  };

  const duplicatePage = async (page: CapturePageRecord) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data, error } = await db
      .from("capture_pages")
      .insert({
        user_id: auth.user.id,
        title: `${page.title} (cópia)`,
        slug: `${slugify(page.title) || "captura"}-${uid().slice(-6)}`,
        blocks: page.blocks,
        form_fields: page.form_fields,
        theme: page.theme,
        settings: page.settings,
        internal_note: page.internal_note,
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    setPages((p) => [normalize(data), ...p]);
    toast.success("Página duplicada");
  };

  const savePage = async (page: CapturePageRecord, silent = false) => {
    setSaving(true);
    const { error } = await db
      .from("capture_pages")
      .update({
        title: page.title,
        internal_note: page.internal_note,
        slug: page.slug,
        is_published: page.is_published,
        blocks: page.blocks,
        theme: page.theme,
        form_fields: page.form_fields,
        settings: page.settings,
      })
      .eq("id", page.id);
    setSaving(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Este endereço (slug) já está em uso." : error.message);
      return false;
    }
    setPages((prev) => prev.map((p) => (p.id === page.id ? page : p)));
    if (!silent) toast.success("Alterações salvas");
    return true;
  };

  const togglePublish = async (page: CapturePageRecord) => {
    const next = { ...page, is_published: !page.is_published };
    const ok = await savePage(next, true);
    if (ok) {
      if (editing?.id === page.id) setEditing(next);
      toast.success(next.is_published ? "Página publicada" : "Página despublicada");
    }
  };

  const removePage = async () => {
    if (!toDelete) return;
    const { error } = await db.from("capture_pages").delete().eq("id", toDelete.id);
    if (error) return toast.error(error.message);
    setPages((p) => p.filter((x) => x.id !== toDelete.id));
    if (editing?.id === toDelete.id) setEditing(null);
    setToDelete(null);
    toast.success("Página excluída");
  };

  const copyLink = (page: CapturePageRecord) => {
    navigator.clipboard.writeText(publicUrl(page.slug));
    toast.success("Link copiado");
  };

  const sharePage = async (page: CapturePageRecord) => {
    const url = publicUrl(page.slug);
    if (navigator.share) {
      try {
        await navigator.share({ title: page.title, url });
        return;
      } catch {
        /* cancelado */
      }
    }
    copyLink(page);
  };

  const pageOptions = useMemo(() => pages.map((p) => ({ id: p.id, title: p.title })), [pages]);

  /* --------------------------------- Editor -------------------------------- */
  if (editing) {
    const patch = (p: Partial<CapturePageRecord>) => setEditing({ ...editing, ...p });

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>
          <Input
            value={editing.title}
            onChange={(e) => patch({ title: e.target.value })}
            className="h-9 max-w-xs font-semibold"
          />
          <Badge variant={editing.is_published ? "default" : "secondary"}>{editing.is_published ? "Publicada" : "Rascunho"}</Badge>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
              <Eye className="mr-1 h-4 w-4" /> Prévia
            </Button>
            <Button variant="outline" size="sm" onClick={() => togglePublish(editing)}>
              <Globe className="mr-1 h-4 w-4" /> {editing.is_published ? "Despublicar" : "Publicar"}
            </Button>
            <Button size="sm" onClick={() => savePage(editing)} disabled={saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Salvar
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_1fr]">
          <Card className="p-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content" className="text-xs"><LayoutTemplate className="mr-1 h-3.5 w-3.5" />Seções</TabsTrigger>
                <TabsTrigger value="form" className="text-xs"><ListChecks className="mr-1 h-3.5 w-3.5" />Campos</TabsTrigger>
                <TabsTrigger value="style" className="text-xs"><Palette className="mr-1 h-3.5 w-3.5" />Estilo</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs"><Settings2 className="mr-1 h-3.5 w-3.5" />Config</TabsTrigger>
              </TabsList>

              <div className="mt-3 max-h-[70vh] overflow-y-auto pr-1">
                <TabsContent value="content" className="m-0">
                  <CaptureBlocksEditor blocks={editing.blocks} onChange={(blocks: CaptureBlock[]) => patch({ blocks })} />
                </TabsContent>
                <TabsContent value="form" className="m-0">
                  <CaptureFormBuilder fields={editing.form_fields} onChange={(form_fields: CaptureField[]) => patch({ form_fields })} />
                </TabsContent>
                <TabsContent value="style" className="m-0">
                  <CaptureThemeEditor theme={editing.theme} onChange={(theme: CaptureTheme) => patch({ theme })} />
                </TabsContent>
                <TabsContent value="settings" className="m-0 space-y-4">
                  <Card className="space-y-3 p-4">
                    <div>
                      <Label className="text-xs">Endereço público (slug)</Label>
                      <Input
                        className="h-9"
                        value={editing.slug}
                        onChange={(e) => patch({ slug: slugify(e.target.value) })}
                      />
                      <p className="mt-1 break-all text-xs text-muted-foreground">{publicUrl(editing.slug)}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Observação interna</Label>
                      <Input className="h-9" value={editing.internal_note || ""} onChange={(e) => patch({ internal_note: e.target.value })} />
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-2">
                      <span className="text-sm">Página publicada</span>
                      <Switch checked={editing.is_published} onCheckedChange={() => togglePublish(editing)} />
                    </div>
                  </Card>

                  <Card className="space-y-3 p-4">
                    <Label className="text-sm font-semibold">Após o envio</Label>
                    <div>
                      <Label className="text-xs">Mensagem de sucesso</Label>
                      <Input className="h-9" value={editing.settings.successMessage} onChange={(e) => patch({ settings: { ...editing.settings, successMessage: e.target.value } as CaptureSettings })} />
                    </div>
                    <div>
                      <Label className="text-xs">Redirecionar para (opcional)</Label>
                      <Input className="h-9" placeholder="https://..." value={editing.settings.redirectUrl} onChange={(e) => patch({ settings: { ...editing.settings, redirectUrl: e.target.value } as CaptureSettings })} />
                    </div>
                    <div>
                      <Label className="text-xs">Botão de WhatsApp após envio (opcional)</Label>
                      <Input className="h-9" placeholder="https://wa.me/55..." value={editing.settings.whatsappRedirect} onChange={(e) => patch({ settings: { ...editing.settings, whatsappRedirect: e.target.value } as CaptureSettings })} />
                    </div>
                  </Card>

                  <Card className="space-y-3 p-4">
                    <Label className="text-sm font-semibold">SEO e compartilhamento</Label>
                    <div>
                      <Label className="text-xs">Título da página</Label>
                      <Input className="h-9" value={editing.settings.seoTitle} onChange={(e) => patch({ settings: { ...editing.settings, seoTitle: e.target.value } as CaptureSettings })} />
                    </div>
                    <div>
                      <Label className="text-xs">Descrição</Label>
                      <Input className="h-9" value={editing.settings.seoDescription} onChange={(e) => patch({ settings: { ...editing.settings, seoDescription: e.target.value } as CaptureSettings })} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyLink(editing)}><Copy className="mr-1 h-4 w-4" />Copiar link</Button>
                      <Button variant="outline" size="sm" onClick={() => sharePage(editing)}><Share2 className="mr-1 h-4 w-4" />Compartilhar</Button>
                      <Button variant="outline" size="sm" onClick={() => window.open(publicUrl(editing.slug), "_blank")}><ExternalLink className="mr-1 h-4 w-4" />Abrir</Button>
                    </div>
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
              <CapturePageRenderer page={editing} mode="preview" />
            </div>
          </Card>
        </div>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="z-[250] max-w-5xl p-0">
            <DialogHeader className="p-4 pb-0"><DialogTitle>Prévia da página</DialogTitle></DialogHeader>
            <div className="max-h-[80vh] overflow-y-auto">
              <CapturePageRenderer page={editing} mode="preview" />
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
          <h2 className="text-xl font-bold">Criador de Página de Captura</h2>
          <p className="text-sm text-muted-foreground">Crie páginas profissionais e capture leads direto na OUT APP.</p>
        </div>
        <ResourceAssignmentsButton resourceType="capture_page" />
        <Button onClick={createPage}><Plus className="mr-1 h-4 w-4" />Nova página</Button>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as any)}>
        <TabsList>
          <TabsTrigger value="list"><LayoutTemplate className="mr-1 h-4 w-4" />Minhas páginas</TabsTrigger>
          <TabsTrigger value="leads"><Users className="mr-1 h-4 w-4" />Leads capturados</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : pages.length === 0 ? (
            <Card className="p-10 text-center">
              <LayoutTemplate className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Nenhuma página criada ainda</p>
              <p className="mb-4 text-sm text-muted-foreground">Comece criando sua primeira página de captura.</p>
              <Button onClick={createPage}><Plus className="mr-1 h-4 w-4" />Criar página</Button>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pages.map((p) => (
                <Card key={p.id} className="flex flex-col p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 truncate font-semibold">{p.title}</h3>
                    <Badge variant={p.is_published ? "default" : "secondary"} className="shrink-0 text-[10px]">
                      {p.is_published ? "Publicada" : "Rascunho"}
                    </Badge>
                  </div>
                  <p className="mb-3 truncate text-xs text-muted-foreground">/captura/{p.slug}</p>
                  <div className="mb-3 flex gap-3 text-xs text-muted-foreground">
                    <span>{p.views || 0} visitas</span>
                    <span>{p.conversions || 0} conversões</span>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1">
                    <Button size="sm" className="h-8 flex-1" onClick={() => { setEditing(p); setTab("content"); }}>Editar</Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Copiar link" onClick={() => copyLink(p)}><Copy className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Abrir" onClick={() => window.open(publicUrl(p.slug), "_blank")}><ExternalLink className="h-4 w-4" /></Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" title="Duplicar" onClick={() => duplicatePage(p)}><Copy className="h-4 w-4 rotate-90" /></Button>
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive" title="Excluir" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <CaptureLeadsPanel pages={pageOptions} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="z-[300]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir página de captura?</AlertDialogTitle>
            <AlertDialogDescription>
              A página "{toDelete?.title}" e todos os leads capturados por ela serão excluídos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removePage} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CapturePageCreatorPanel;
