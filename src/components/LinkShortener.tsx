import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Link2, Trash2, ExternalLink, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface ShortLink {
  id: string;
  original_url: string;
  short_code: string;
  custom_name: string | null;
  clicks: number;
  is_active: boolean;
  created_at: string;
}

export const LinkShortener = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [originalUrl, setOriginalUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLinks();
    }
  }, [user]);

  const fetchLinks = async () => {
    const { data, error } = await supabase
      .from("short_links")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao buscar links:", error);
      return;
    }

    setLinks(data || []);
  };

  const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const sanitizeSlug = (slug: string) => {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const createShortLink = async () => {
    if (!originalUrl) {
      toast({
        title: "URL obrigatória",
        description: "Por favor, insira a URL original.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    let finalShortCode: string;
    
    if (customSlug.trim()) {
      finalShortCode = sanitizeSlug(customSlug.trim());
      
      const { data: existing } = await supabase
        .from("short_links")
        .select("id")
        .eq("short_code", finalShortCode)
        .maybeSingle();
        
      if (existing) {
        toast({
          title: "Slug já existe",
          description: "Esta slug já está em uso. Por favor, escolha outra.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    } else {
      finalShortCode = generateShortCode();
    }

    const { error } = await supabase.from("short_links").insert({
      user_id: user?.id,
      original_url: originalUrl,
      short_code: finalShortCode,
      custom_name: customName || null,
    });

    if (error) {
      toast({
        title: "Erro ao criar link",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Link criado com sucesso!",
      description: "Seu link encurtado está pronto para uso.",
    });

    setOriginalUrl("");
    setCustomName("");
    setCustomSlug("");
    setIsLoading(false);
    fetchLinks();
  };

  const copyToClipboard = (shortCode: string) => {
    const shortUrl = `${window.location.origin}/s/${shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("short_links")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    fetchLinks();
    toast({
      title: "Status atualizado",
      description: !currentStatus ? "Link ativado" : "Link desativado",
    });
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from("short_links").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    fetchLinks();
    toast({
      title: "Link deletado",
      description: "O link foi removido com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Formulário de criação de link */}
      <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary/20 p-3 rounded-xl">
            <Link2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">Encurtador de Links</h3>
            <p className="text-sm text-muted-foreground">Estilo Bitly - Crie links curtos e personalizados</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="original-url" className="text-foreground font-semibold">
              URL Original *
            </Label>
            <Input
              id="original-url"
              type="url"
              placeholder="https://exemplo.com/sua-pagina"
              value={originalUrl}
              onChange={(e) => setOriginalUrl(e.target.value)}
              className="mt-2 border-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="custom-slug" className="text-foreground font-semibold">
              Slug Personalizada * (ex: meu-link)
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {window.location.origin}/s/
              </span>
              <Input
                id="custom-slug"
                type="text"
                placeholder="meu-link-customizado"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="border-primary/30 focus:border-primary transition-colors"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Deixe em branco para gerar automaticamente
            </p>
          </div>

          <div>
            <Label htmlFor="custom-name" className="text-foreground font-semibold">
              Nome/Descrição (opcional)
            </Label>
            <Input
              id="custom-name"
              type="text"
              placeholder="Meu Link Especial"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="mt-2 border-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <Button
            onClick={createShortLink}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4 mr-2" />
            {isLoading ? "Criando..." : "Criar Link Encurtado"}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          Meus Links ({links.length})
        </h4>

        {links.map((link) => (
          <Card
            key={link.id}
            className="p-4 bg-card border-2 border-border hover:border-primary/50 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {link.custom_name && (
                    <h5 className="font-semibold text-foreground mb-1">{link.custom_name}</h5>
                  )}
                  <p className="text-xs text-muted-foreground truncate">{link.original_url}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-lg font-mono">
                      {window.location.origin}/s/{link.short_code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(link.short_code)}
                      className="h-7 w-7 p-0 hover:bg-primary/20"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`/s/${link.short_code}`, "_blank")}
                      className="h-7 w-7 p-0 hover:bg-primary/20"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Cliques</p>
                      <p className="text-lg font-bold text-primary">{link.clicks}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={link.is_active}
                        onCheckedChange={() => toggleActive(link.id, link.is_active)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteLink(link.id)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {links.length === 0 && (
          <Card className="p-8 text-center border-2 border-dashed border-border">
            <Link2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">Nenhum link criado ainda</p>
            <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro link encurtado acima</p>
          </Card>
        )}
      </div>
    </div>
  );
};
