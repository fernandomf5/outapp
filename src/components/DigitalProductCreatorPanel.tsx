import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Plus,
  Download,
  Trash2,
  Edit,
  DollarSign,
  Eye,
  ShoppingCart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DigitalProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cover_image_url?: string;
  pdf_url?: string;
  is_published: boolean;
  sales_count: number;
  views_count: number;
  created_at: string;
}

export const DigitalProductCreatorPanel = () => {
  const [products, setProducts] = useState<DigitalProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    cover_image_url: '',
    pdf_url: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('digital_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data as any || []);
    } catch (error: any) {
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('digital_products')
        .insert([{
          user_id: user.id,
          ...formData,
          price: parseFloat(formData.price),
          is_published: true,
          sales_count: 0,
          views_count: 0
        }]);

      if (error) throw error;

      toast.success("Produto criado com sucesso!");
      setIsAddDialogOpen(false);
      loadProducts();
      
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        cover_image_url: '',
        pdf_url: ''
      });
    } catch (error: any) {
      toast.error("Erro ao criar produto");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('digital_products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Produto excluído!");
      loadProducts();
    } catch (error: any) {
      toast.error("Erro ao excluir produto");
    }
  };

  const totalRevenue = products.reduce((sum, p) => sum + (p.sales_count * p.price), 0);
  const totalSales = products.reduce((sum, p) => sum + p.sales_count, 0);
  const totalViews = products.reduce((sum, p) => sum + p.views_count, 0);
  const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produtos Digitais PDF</h2>
          <p className="text-muted-foreground">Crie e venda seus produtos digitais</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary shadow-glow">
              <Plus className="mr-2 h-4 w-4" />
              Criar Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Criar Produto Digital</DialogTitle>
              <DialogDescription>Configure seu produto digital em PDF</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome do Produto</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: E-book Marketing Digital 2024"
                />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descreva seu produto..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ebook">E-book</SelectItem>
                      <SelectItem value="curso">Curso PDF</SelectItem>
                      <SelectItem value="template">Template</SelectItem>
                      <SelectItem value="guia">Guia</SelectItem>
                      <SelectItem value="checklist">Checklist</SelectItem>
                      <SelectItem value="planilha">Planilha</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Preço (R$)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="29.90"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>URL da Imagem de Capa</Label>
                <Input 
                  value={formData.cover_image_url}
                  onChange={(e) => setFormData({...formData, cover_image_url: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-2">
                <Label>URL do PDF</Label>
                <Input 
                  value={formData.pdf_url}
                  onChange={(e) => setFormData({...formData, pdf_url: e.target.value})}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Faça upload do PDF no Supabase Storage ou outro serviço
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddProduct} className="gradient-primary">
                Criar Produto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">R$ {totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">em vendas</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter(p => p.is_published).length} publicados
            </p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
            <p className="text-xs text-muted-foreground">transações</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversão</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{totalViews} visualizações</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Meus Produtos Digitais</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Nenhum produto criado ainda
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Produto
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-smooth overflow-hidden">
                  {product.cover_image_url && (
                    <div className="relative aspect-video bg-muted">
                      <img 
                        src={product.cover_image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 left-2 bg-success/20 text-success">
                        {product.category}
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base mb-1">{product.name}</CardTitle>
                        <p className="text-2xl font-bold text-success">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Vendas</p>
                        <p className="font-semibold">{product.sales_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Visualizações</p>
                        <p className="font-semibold">{product.views_count}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Receita</p>
                        <p className="font-semibold text-success">
                          R$ {(product.sales_count * product.price).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Conversão</p>
                        <p className="font-semibold">
                          {product.views_count > 0 
                            ? ((product.sales_count / product.views_count) * 100).toFixed(1) 
                            : 0}%
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <Badge 
                      variant={product.is_published ? 'default' : 'secondary'}
                      className="w-full justify-center"
                    >
                      {product.is_published ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
