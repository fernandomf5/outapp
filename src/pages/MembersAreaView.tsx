import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Play, Loader2 } from "lucide-react";
import { ContentPlayer } from "@/components/members-area/ContentPlayer";
import { toast } from "sonner";

interface MembersArea {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  banner_url?: string;
  logo_url?: string;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  video_url?: string;
  content_type: string;
  content_data?: string;
  category?: string;
  is_free: boolean;
  price?: number;
  is_active: boolean;
}

export default function MembersAreaView() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [area, setArea] = useState<MembersArea | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);
  const [requestingAccess, setRequestingAccess] = useState(false);
  const [accessForm, setAccessForm] = useState({ name: '', email: '' });
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: areaData } = await supabase
          .from('members_areas' as any)
          .select('*')
          .eq('id', areaId)
          .single();
        
        if (!areaData) {
          setArea(null);
          setLoading(false);
          return;
        }
        
        setArea(areaData as any);
        
        // Verificar se já existe uma solicitação de acesso aprovada
        const storedEmail = localStorage.getItem(`area_${areaId}_email`);
        if (storedEmail) {
          const { data: accessData } = await supabase
            .from('members_area_access_requests' as any)
            .select('*')
            .eq('area_id', areaId)
            .eq('email', storedEmail)
            .eq('status', 'approved')
            .single();
          
          if (accessData) {
            setHasAccess(true);
            // Carregar módulos
            const { data: modulesData } = await supabase
              .from('members_area_modules' as any)
              .select('*')
              .eq('members_area_id', areaId)
              .eq('is_active', true)
              .order('order_index', { ascending: true });
            setModules((modulesData as any) || []);
          }
        }
      } catch (e) {
        setArea(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [areaId]);

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessForm.email || !accessForm.name) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setRequestingAccess(true);
    try {
      const { error } = await supabase
        .from('members_area_access_requests' as any)
        .insert({
          area_id: areaId,
          email: accessForm.email,
          notes: accessForm.name, // Usando notes ao invés de name até types.ts ser atualizado
          status: 'pending'
        });

      if (error) throw error;

      setAccessRequested(true);
      toast.success("Solicitação enviada! Aguarde a aprovação do dono da área.");
    } catch (error: any) {
      console.error('Error requesting access:', error);
      toast.error("Erro ao solicitar acesso: " + error.message);
    } finally {
      setRequestingAccess(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-10 text-center text-muted-foreground">Carregando área...</CardContent>
        </Card>
      </div>
    );
  }

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-10 text-center text-muted-foreground">Área de membros não encontrada</CardContent>
        </Card>
      </div>
    );
  }

  // Se não tem acesso, mostrar formulário de solicitação
  if (!hasAccess && !accessRequested) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center space-y-2">
                {area.logo_url && (
                  <img src={area.logo_url} alt="Logo" className="h-16 w-16 mx-auto rounded" />
                )}
                <h1 className="text-2xl font-bold">{area.name || area.title}</h1>
                {area.description && (
                  <p className="text-muted-foreground">{area.description}</p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h2 className="text-lg font-semibold mb-4">Solicitar Acesso</h2>
                <form onSubmit={handleAccessRequest} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={accessForm.name}
                      onChange={(e) => setAccessForm({...accessForm, name: e.target.value})}
                      placeholder="Seu nome"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={accessForm.email}
                      onChange={(e) => setAccessForm({...accessForm, email: e.target.value})}
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={requestingAccess}>
                    {requestingAccess && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Solicitar Acesso
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se solicitou acesso mas ainda não foi aprovado
  if (accessRequested || (!hasAccess && accessRequested)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-10 text-center">
            <h2 className="text-2xl font-bold mb-4">Acesso Solicitado</h2>
            <p className="text-muted-foreground">
              Sua solicitação de acesso foi enviada com sucesso. Aguarde a aprovação do administrador da área.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = area.name || area.title || 'Área de Membros';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{`${title} | Área de Membros`}</title>
        <meta name="description" content={area.description || title} />
        <link rel="canonical" href={`${window.location.origin}/members/${area.id}`} />
      </Helmet>

      <header className="relative h-56 md:h-72 w-full overflow-hidden border-b">
        {area.banner_url ? (
          <img src={area.banner_url} alt={`Banner ${title}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/10" />
        <div className="absolute bottom-4 left-4 md:left-8 flex items-center gap-4">
          {area.logo_url && (
            <img src={area.logo_url} alt="Logo" className="h-12 w-12 md:h-16 md:w-16 rounded" />
          )}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            {area.description && (
              <p className="text-sm md:text-base text-muted-foreground max-w-2xl">{area.description}</p>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {modules.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum módulo publicado ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {modules.map((m) => (
              <div 
                key={m.id} 
                className="group cursor-pointer"
                onClick={() => {
                  setSelectedModule(m);
                  setIsPlayerOpen(true);
                }}
              >
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted">
                  {m.thumbnail_url ? (
                    <img 
                      src={m.thumbnail_url} 
                      alt={m.title} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                      loading="lazy" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Play className="w-10 h-10 text-primary" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {m.is_free && (
                    <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Grátis
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="font-medium line-clamp-2 text-sm">{m.title}</p>
                  {m.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{m.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ContentPlayer
        open={isPlayerOpen}
        onOpenChange={setIsPlayerOpen}
        module={selectedModule as any}
      />
    </div>
  );
}