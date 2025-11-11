import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ShoppingCart, DollarSign } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  payment_link: string;
  image_url: string;
  category: string;
}

interface ProductsEditorProps {
  products: Product[];
  onUpdate: (products: Product[]) => void;
}

export function ProductsEditor({ products, onUpdate }: ProductsEditorProps) {
  const addProduct = () => {
    const newProduct: Product = {
      id: `product-${Date.now()}`,
      name: '',
      description: '',
      price: '',
      payment_link: '',
      image_url: '',
      category: ''
    };
    onUpdate([...products, newProduct]);
  };

  const updateProduct = (id: string, field: keyof Product, value: string) => {
    onUpdate(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeProduct = (id: string) => {
    onUpdate(products.filter(p => p.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Produtos do Catálogo
          </CardTitle>
          <Button size="sm" variant="outline" onClick={addProduct}>
            <Plus className="h-3 w-3 mr-1" />
            Novo Produto
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum produto adicionado</p>
            <p className="text-xs">Adicione produtos para criar um catálogo</p>
          </div>
        ) : (
          products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {product.name || 'Novo Produto'}
                </h4>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => removeProduct(product.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>Nome do Produto</Label>
                  <Input
                    placeholder="Ex: Produto Premium"
                    value={product.name}
                    onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descrição detalhada do produto..."
                    value={product.description}
                    onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Preço</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="99.90"
                        value={product.price}
                        onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                        className="pl-9"
                        type="number"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input
                      placeholder="Ex: Eletrônicos"
                      value={product.category}
                      onChange={(e) => updateProduct(product.id, 'category', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Link de Pagamento</Label>
                  <Input
                    placeholder="https://pay.com/seu-link"
                    value={product.payment_link}
                    onChange={(e) => updateProduct(product.id, 'payment_link', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole aqui o link do Mercado Pago, PagSeguro ou outra plataforma
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Imagem do Produto</Label>
                  <ImageUpload
                    currentImage={product.image_url}
                    onImageSelect={(url) => updateProduct(product.id, 'image_url', url)}
                    bucketName="chatbot-media"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}