import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Trash, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ChatbotProductsPanel = ({ chatbotId }: { chatbotId: string }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    type: "product",
    is_active: true,
    image_url: "",
  });

  useEffect(() => {
    loadProducts();
  }, [chatbotId]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_products')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading products:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim() || !formData.price) {
        toast({ 
          title: "Campos obrigatórios", 
          description: "Preencha nome e preço do produto",
          variant: "destructive" 
        });
        return;
      }

      const priceValue = parseFloat(formData.price);
      if (isNaN(priceValue) || priceValue < 0) {
        toast({ 
          title: "Preço inválido", 
          description: "Digite um preço válido",
          variant: "destructive" 
        });
        return;
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('chatbot_products')
          .update({ 
            name: formData.name,
            description: formData.description,
            price: priceValue,
            type: formData.type,
            is_active: formData.is_active,
          })
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast({ title: "Produto atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from('chatbot_products')
          .insert({ 
            chatbot_id: chatbotId,
            name: formData.name,
            description: formData.description,
            price: priceValue,
            type: formData.type,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast({ title: "Produto criado com sucesso" });
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      setFormData({ name: "", description: "", price: "", type: "product", is_active: true, image_url: "" });
      loadProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({ 
        title: "Erro ao salvar produto", 
        description: error.message || "Erro desconhecido",
        variant: "destructive" 
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${chatbotId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chatbot-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chatbot-media')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast({
        title: "Imagem enviada com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Produto excluído com sucesso" });
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({ title: "Erro ao excluir produto", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Produtos e Serviços</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingProduct(null);
              setFormData({ name: "", description: "", price: "", type: "product", is_active: true, image_url: "" });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Editar" : "Novo"} Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <Textarea
                placeholder="Descrição"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Preço"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Produto</SelectItem>
                  <SelectItem value="service">Serviço</SelectItem>
                </SelectContent>
              </Select>
              <div>
                {formData.image_url && (
                  <div className="mb-3 relative">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                    >
                      Remover
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG ou WEBP (máx. 5MB)
                </p>
              </div>
              <Button onClick={handleSubmit} className="w-full">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                  <p className="text-lg font-bold">R$ {product.price}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.is_active ? 'bg-success/10 text-success' : 'bg-muted'
                  }`}>
                    {product.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingProduct(product);
                      setFormData({
                        name: product.name,
                        description: product.description || "",
                        price: product.price.toString(),
                        type: product.type,
                        is_active: product.is_active,
                        image_url: product.image_url || "",
                      });
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};