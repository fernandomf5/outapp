import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { Play, Loader2, LogOut } from "lucide-react";
import { ContentPlayer } from "@/components/members-area/ContentPlayer";
import { normalizeDomain } from "@/utils/domainUtils";
import { NetflixStyleCarousel } from "@/components/members-area/NetflixStyleCarousel";
import { toast } from "sonner";

interface MembersArea {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  banner_url?: string;
  logo_url?: string;
  products?: Product[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  modules_unlocked: string[];
  payment_method: 'mercadopago' | 'manual' | 'pix';
  payment_link?: string;
  pix_key?: string;
  is_active: boolean;
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
  const [memberSession, setMemberSession] = useState<any>(null);
  const [banners, setBanners] = useState<Array<{ id: string; image_url: string }>>([]);
  const [userProducts, setUserProducts] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const hostname = window.location.hostname;
        const normalizedHostname = normalizeDomain(hostname);
        
        // Verificar sessão do membro
        const sessionData = localStorage.getItem(`member_session_${areaId}`);
        if (!sessionData) {
          // Verifica se está usando domínio customizado (com normalização)
          const { data: customDomain } = await supabase
            .from('user_domains')
            .select('domain')
            .eq('domain', normalizedHostname)
            .eq('is_verified', true)
            .eq('is_active', true)
            .maybeSingle();

          if (customDomain) {
            // Redireciona mantendo o domínio customizado
            window.location.href = `/members-area-auth?area=${areaId}`;
          } else {
            navigate(`/members-area-auth?area=${areaId}`);
          }
          return;
        }

        const session = JSON.parse(sessionData);
        setMemberSession(session);

        const { data: areaData, error: areaError } = await supabase
          .from('members_areas' as any)
          .select('*')
          .eq('id', areaId)
          .maybeSingle();
        
        if (!areaData || areaError) {
          setArea(null);
          setLoading(false);
          return;
        }
        
        setArea(areaData as any);

        // Carregar banners das configurações
        const settings = (areaData as any)?.settings || {};
        setBanners(settings.banners || []);

        // Carregar módulos
        const { data: modulesData, error: modulesError } = await supabase
          .from('members_area_modules' as any)
          .select('*')
          .eq('members_area_id', areaId)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (modulesData && !modulesError) {
          setModules(modulesData as any);
        }

        // Verificar quais produtos o usuário já tem acesso
        const { data: subscriptions } = await supabase
          .from('members_area_subscriptions')
          .select('*')
          .eq('members_area_id', areaId)
          .eq('user_email', session.email)
          .eq('status', 'active');

        if (subscriptions) {
          // Extrair product_ids das subscrições
          const productIds = subscriptions
            .map(sub => (sub as any).product_id)
            .filter(Boolean);
          setUserProducts(productIds);
        }
      } catch (e) {
        console.error('Error loading area:', e);
        setArea(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [areaId, navigate]);

  const handleLogout = async () => {
    const hostname = window.location.hostname;
    const normalizedHostname = normalizeDomain(hostname);
    
    // Verifica se está usando domínio customizado (com normalização)
    const { data: customDomain } = await supabase
      .from('user_domains')
      .select('domain')
      .eq('domain', normalizedHostname)
      .eq('is_verified', true)
      .eq('is_active', true)
      .maybeSingle();

    localStorage.removeItem(`member_session_${areaId}`);
    
    if (customDomain) {
      window.location.href = `/members-area-auth?area=${areaId}`;
    } else {
      navigate(`/members-area-auth?area=${areaId}`);
    }
  };

  const handleBuyProduct = (product: Product) => {
    if (product.payment_method === 'mercadopago') {
      toast.error('Integração com Mercado Pago em desenvolvimento');
      // TODO: Integrar com Mercado Pago
    } else if (product.payment_method === 'pix') {
      // Mostrar chave PIX
      if (product.pix_key) {
        navigator.clipboard.writeText(product.pix_key);
        toast.success(`Chave PIX copiada: ${product.pix_key}`);
      } else {
        toast.error('Chave PIX não configurada');
      }
    } else if (product.payment_method === 'manual' && product.payment_link) {
      window.open(product.payment_link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-10 text-center text-muted-foreground">
            Área de membros não encontrada
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

      {/* Hero com Carousel estilo Netflix */}
      {banners.length > 0 ? (
        <div className="relative">
          <NetflixStyleCarousel banners={banners} />
          <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-4">
                {area.logo_url && (
                  <img src={area.logo_url} alt="Logo" className="h-16 w-16 rounded-lg shadow-lg border-2 border-primary" />
                )}
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">{title}</h1>
                  {area.description && (
                    <p className="text-sm md:text-base text-white/90 max-w-2xl drop-shadow-md">{area.description}</p>
                  )}
                </div>
              </div>
              {memberSession && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="gap-2 bg-background/80 backdrop-blur"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <header className="relative h-56 md:h-72 w-full overflow-hidden border-b">
          {area.banner_url ? (
            <img src={area.banner_url} alt={`Banner ${title}`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/10" />
          <div className="absolute bottom-4 left-4 md:left-8 right-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
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
            {memberSession && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            )}
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Produtos Disponíveis */}
        {area.products && area.products.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <div className="h-8 w-1 bg-primary rounded"></div>
              Cursos Disponíveis
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {area.products.filter(p => p.is_active).map((product) => {
                const hasAccess = userProducts.includes(product.id);
                
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative aspect-video bg-muted">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Play className="w-12 h-12 text-primary" />
                        </div>
                      )}
                      {hasAccess && (
                        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                          ✓ Você tem acesso
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {product.description}
                      </p>
                      {!hasAccess && (
                        <p className="text-2xl font-bold text-primary mb-4">
                          R$ {product.price.toFixed(2)}
                        </p>
                      )}
                      <Button 
                        className={`w-full ${hasAccess ? 'bg-green-600 hover:bg-green-700' : 'gradient-primary'}`}
                        onClick={() => {
                          if (hasAccess) {
                            // Scrollar para os módulos
                            document.getElementById('modulos-section')?.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            // Redirecionar para checkout
                            handleBuyProduct(product);
                          }
                        }}
                      >
                        {hasAccess ? 'Acessar Conteúdo' : 'Comprar Agora'}
                      </Button>
                      {!hasAccess && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          {product.modules_unlocked.length} módulo(s) incluído(s)
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Módulos de Conteúdo */}
        <div id="modulos-section">
          {modules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum módulo publicado ainda.</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <div className="h-8 w-1 bg-primary rounded"></div>
                Seu Conteúdo
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {modules.map((m) => (
                  <div 
                    key={m.id} 
                    className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
                    onClick={() => {
                      setSelectedModule(m);
                      setIsPlayerOpen(true);
                    }}
                  >
                    <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted shadow-lg">
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
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-2">
                          <Play className="w-12 h-12 text-white drop-shadow-lg" />
                          <span className="text-white text-xs font-semibold">Assistir</span>
                        </div>
                      </div>
                      {m.is_free && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded shadow-lg">
                          Grátis
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="font-medium line-clamp-2 text-sm group-hover:text-primary transition-colors">{m.title}</p>
                      {m.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{m.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <ContentPlayer
        open={isPlayerOpen}
        onOpenChange={setIsPlayerOpen}
        module={selectedModule as any}
      />
    </div>
  );
}
