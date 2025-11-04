import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export const PageCreator = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");

  const handleCreate = async () => {
    if (!title || !slug) {
      toast({ title: "Campos obrigatórios", description: "Informe título e slug.", variant: "destructive" });
      return;
    }

    setCreating(true);
    setCreatedSlug(null);

    try {
      const cleanSlug = slugify(slug);

      // Definir order_index como a contagem atual para manter ordenação simples
      const { count } = await supabase
        .from('custom_pages')
        .select('*', { count: 'exact', head: true });

      const orderIndex = count ?? 0;

      const { data, error } = await supabase
        .from('custom_pages')
        .insert([
          {
            title,
            slug: cleanSlug,
            content,
            is_active: true,
            order_index: orderIndex,
          } as any,
        ])
        .select()
        .single();

      if (error) throw error;

      setCreatedSlug(data.slug);
      toast({ title: "Página criada!", description: `/${data.slug}` });
      // Limpar formulário minimamente, mantendo slug criado para fácil acesso
      setTitle("");
      setSlug("");
      setContent("");
    } catch (e: any) {
      toast({ title: "Erro ao criar página", description: e?.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criador de Páginas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Título</Label>
              <Input
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slug) setSlug(slugify(e.target.value));
                }}
                placeholder="Ex: Sobre nós"
              />
            </div>
            <div>
              <Label>Slug (URL)</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                placeholder="ex: sobre-nos"
              />
              <p className="text-xs text-muted-foreground mt-1">URL final: /{slugify(slug || title)}</p>
            </div>
          </div>

          <div>
            <Label>Conteúdo</Label>
            <Textarea
              className="min-h-[280px] font-mono text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={"Digite o conteúdo da página aqui..."}
            />
            <p className="text-xs text-muted-foreground mt-2">O conteúdo será exibido entre o cabeçalho e o rodapé do site.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Criando...' : 'Criar página'}
            </Button>
            {createdSlug && (
              <Button asChild variant="outline">
                <Link to={`/${createdSlug}`} target="_blank" rel="noopener noreferrer">
                  Ver página
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
