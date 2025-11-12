import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ImageUpload";
import { Plus, Trash2, Edit, DollarSign } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface HomePageManagerProps {
  areaId: string;
  availableModules: Array<{ id: string; title: string }>;
}

export function HomePageManager({ areaId, availableModules }: HomePageManagerProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [banners, setBanners] = useState<Array<{ id: string; image_url: string; link?: string }>>([]);
  const [featuredVideos, setFeaturedVideos] = useState<Array<{ id: string; title: string; video_url: string; thumbnail?: string }>>([]);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    modules_unlocked: [],
    payment_method: 'mercadopago',
    is_active: true,
  });

  useEffect(() => {
    loadHomePageData();
  }, [areaId]);

  const loadHomePageData = async () => {
    try {
      const { data, error } = await supabase
        .from('members_areas')
        .select('products, settings')
        .eq('id', areaId)
        .single();

      if (error) throw error;

      setProducts(Array.isArray(data?.products) ? (data.products as any[]) : []);
      
      const settings = data?.settings as any || {};
      setBanners(settings.banners || []);
      setFeaturedVideos(settings.featuredVideos || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.description) {
      toast.error('Preencha nome e descrição');
      return;
    }

    const newProduct = {
      id: editingProduct?.id || crypto.randomUUID(),
      ...formData,
    } as Product;

    let updatedProducts;
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? newProduct : p);
    } else {
      updatedProducts = [...products, newProduct];
    }

    try {
      const { error } = await supabase
        .from('members_areas')
        .update({ products: updatedProducts as any })
        .eq('id', areaId);

      if (error) throw error;

      setProducts(updatedProducts);
      toast.success(editingProduct ? 'Produto atualizado!' : 'Produto adicionado!');
      handleCloseDialog();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Excluir este produto?')) return;

    const updatedProducts = products.filter(p => p.id !== productId);

    try {
      const { error } = await supabase
        .from('members_areas')
        .update({ products: updatedProducts as any })
        .eq('id', areaId);

      if (error) throw error;

      setProducts(updatedProducts);
      toast.success('Produto excluído!');
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handleAddBanner = async (imageUrl: string) => {
    const newBanner = { id: crypto.randomUUID(), image_url: imageUrl };
    const updatedBanners = [...banners, newBanner];

    try {
      const { data: currentData } = await supabase
        .from('members_areas')
        .select('settings')
        .eq('id', areaId)
        .single();

      const settings = (currentData?.settings as any) || {};

      const { error } = await supabase
        .from('members_areas')
        .update({ settings: { ...settings, banners: updatedBanners } })
        .eq('id', areaId);

      if (error) throw error;

      setBanners(updatedBanners);
      toast.success('Banner adicionado!');
    } catch (error: any) {
      toast.error('Erro ao adicionar banner: ' + error.message);
    }
  };

  const handleRemoveBanner = async (bannerId: string) => {
    const updatedBanners = banners.filter(b => b.id !== bannerId);

    try {
      const { data: currentData } = await supabase
        .from('members_areas')
        .select('settings')
        .eq('id', areaId)
        .single();

      const settings = (currentData?.settings as any) || {};

      const { error } = await supabase
        .from('members_areas')
        .update({ settings: { ...settings, banners: updatedBanners } })
        .eq('id', areaId);

      if (error) throw error;

      setBanners(updatedBanners);
      toast.success('Banner removido!');
    } catch (error: any) {
      toast.error('Erro ao remover banner: ' + error.message);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      modules_unlocked: [],
      payment_method: 'mercadopago',
      is_active: true,
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">Produtos/Cursos</TabsTrigger>
          <TabsTrigger value="banners">Banners & Destaques</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Produtos e Cursos</CardTitle>
                  <CardDescription>
                    Configure os produtos disponíveis para venda na página inicial
                  </CardDescription>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar Produto
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum produto adicionado ainda
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {products.map((product) => (
                    <Card key={product.id} className="overflow-hidden">
                      <div className="aspect-video bg-muted relative">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-primary">
                            <DollarSign className="w-12 h-12 text-white" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{product.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                            <p className="text-lg font-bold text-primary mt-2">
                              R$ {product.price.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Método: {product.payment_method === 'mercadopago' ? 'Mercado Pago' : product.payment_method === 'pix' ? 'PIX' : 'Link Manual'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.modules_unlocked.length} módulo(s) desbloqueado(s)
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Banners Rotativos</CardTitle>
              <CardDescription>
                Adicione banners que aparecerão em destaque na página inicial (estilo Netflix)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                label="Adicionar Novo Banner"
                onImageSelect={handleAddBanner}
                bucketName="members-content"
              />
              
              {banners.length > 0 && (
                <div className="grid gap-4">
                  {banners.map((banner) => (
                    <div key={banner.id} className="relative group">
                      <img src={banner.image_url} alt="Banner" className="w-full h-48 object-cover rounded-lg" />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveBanner(banner.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto/Curso'}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome do Produto/Curso</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Curso Completo de Marketing Digital"
              />
            </div>

            <div className="grid gap-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o que está incluído neste produto..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <ImageUpload
                label="Imagem do Produto"
                currentImage={formData.image_url}
                onImageSelect={(url) => setFormData({ ...formData, image_url: url })}
                bucketName="members-content"
              />
            </div>

            <div className="grid gap-2">
              <Label>Método de Pagamento</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as any })}
              >
                <option value="mercadopago">Mercado Pago (Automático)</option>
                <option value="pix">PIX (Manual)</option>
                <option value="manual">Link de Pagamento (Manual)</option>
              </select>
            </div>

            {formData.payment_method === 'manual' && (
              <div className="grid gap-2">
                <Label>Link de Pagamento</Label>
                <Input
                  value={formData.payment_link || ''}
                  onChange={(e) => setFormData({ ...formData, payment_link: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}

            {formData.payment_method === 'pix' && (
              <div className="grid gap-2">
                <Label>Chave PIX</Label>
                <Input
                  value={formData.pix_key || ''}
                  onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                  placeholder="Chave PIX (email, telefone, CPF/CNPJ ou chave aleatória)"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Módulos que serão desbloqueados</Label>
              <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                {availableModules.map((module) => (
                  <div key={module.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={module.id}
                      checked={formData.modules_unlocked?.includes(module.id)}
                      onChange={(e) => {
                        const current = formData.modules_unlocked || [];
                        if (e.target.checked) {
                          setFormData({ ...formData, modules_unlocked: [...current, module.id] });
                        } else {
                          setFormData({ ...formData, modules_unlocked: current.filter(id => id !== module.id) });
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={module.id} className="cursor-pointer">{module.title}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Produto Ativo</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} className="gradient-primary">
              {editingProduct ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
