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
  const [isGeneratingWithAI, setIsGeneratingWithAI] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    productIdea: ''
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

  const handleGenerateWithAI = async () => {
    if (!formData.productIdea.trim()) {
      toast.error("Descreva o produto que você quer criar");
      return;
    }

    setIsGeneratingWithAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-digital-product', {
        body: { 
          productIdea: formData.productIdea,
          category: formData.category
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      setFormData(prev => ({
        ...prev,
        description: data.content.substring(0, 500) + '...'
      }));
      
      toast.success(`Produto gerado com sucesso! ${data.wordCount} palavras criadas.`);
    } catch (error: any) {
      console.error('Error generating product:', error);
      toast.error(error.message || "Erro ao gerar produto com IA");
    } finally {
      setIsGeneratingWithAI(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!formData.name || !formData.price) {
        toast.error("Preencha o nome e o preço do produto");
        return;
      }

      const { error } = await supabase
        .from('digital_products')
        .insert([{
          user_id: user.id,
          name: formData.name,
          description: formData.description,
          category: formData.category,
          price: parseFloat(formData.price),
          is_published: true,
          sales_count: 0,
          views_count: 0
        }]);

      if (error) throw error;

      toast.success("Produto criado! Agora você pode convertê-lo em PDF.");
      setIsAddDialogOpen(false);
      loadProducts();
      
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        productIdea: ''
      });
      setGeneratedContent('');
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
              <div className="grid gap-2 bg-primary/5 p-4 rounded-lg border-2 border-dashed border-primary/20">
                <Label className="font-semibold">✨ Gerar com IA</Label>
                <Textarea 
                  value={formData.productIdea}
                  onChange={(e) => setFormData({...formData, productIdea: e.target.value})}
                  placeholder="Descreva o produto que você quer criar. Ex: Um e-book completo sobre Marketing Digital para Iniciantes, com estratégias práticas e exemplos reais..."
                  rows={3}
                />
                <Button 
                  onClick={handleGenerateWithAI}
                  disabled={isGeneratingWithAI || !formData.productIdea.trim()}
                  className="gradient-primary"
                >
                  {isGeneratingWithAI ? 'Gerando conteúdo...' : '🤖 Gerar Conteúdo Completo com IA'}
                </Button>
                {generatedContent && (
                  <p className="text-xs text-success">
                    ✓ Conteúdo gerado com sucesso! {generatedContent.split(' ').length} palavras criadas.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label>Nome do Produto</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: E-book Marketing Digital 2024"
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

              {generatedContent && (
                <div className="grid gap-2">
                  <Label>Prévia do Conteúdo</Label>
                  <div className="bg-muted p-4 rounded-lg max-h-48 overflow-y-auto text-sm">
                    {generatedContent.substring(0, 500)}...
                  </div>
                </div>
              )}
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
