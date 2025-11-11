import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ShoppingBag, DollarSign, Package, Save } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { useState, useEffect } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  payment_link: string;
  image_url: string;
  modules_unlocked: string[];
}

interface ProductsManagerProps {
  products: Product[];
  onUpdate: (products: Product[]) => void;
  availableModules: Array<{ id: string; title: string }>;
}

export function ProductsManager({ products, onUpdate, availableModules }: ProductsManagerProps) {
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalProducts(products);
    setHasChanges(false);
  }, [products]);

  const addProduct = () => {
    const newProduct: Product = {
      id: `product-${Date.now()}`,
      name: '',
      description: '',
      price: '',
      payment_link: '',
      image_url: '',
      modules_unlocked: []
    };
    setLocalProducts([...localProducts, newProduct]);
    setHasChanges(true);
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setLocalProducts(localProducts.map(p => p.id === id ? { ...p, [field]: value } : p));
    setHasChanges(true);
  };

  const removeProduct = (id: string) => {
    setLocalProducts(localProducts.filter(p => p.id !== id));
    setHasChanges(true);
  };

  const toggleModule = (productId: string, moduleId: string) => {
    setLocalProducts(localProducts.map(p => {
      if (p.id !== productId) return p;
      const modules = p.modules_unlocked || [];
      const hasModule = modules.includes(moduleId);
      return {
        ...p,
        modules_unlocked: hasModule 
          ? modules.filter(m => m !== moduleId)
          : [...modules, moduleId]
      };
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localProducts);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Produtos da Área de Membros
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Venda produtos e libere conteúdos automaticamente
            </p>
          </div>
          <div className="flex gap-2">
            {hasChanges && (
              <Button size="sm" onClick={handleSave} className="gradient-primary">
                <Save className="h-3 w-3 mr-1" />
                Salvar Alterações
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={addProduct}>
              <Plus className="h-3 w-3 mr-1" />
              Novo Produto
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {localProducts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum produto adicionado</p>
            <p className="text-xs">Adicione produtos para vender dentro da área de membros</p>
          </div>
        ) : (
          localProducts.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
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
                    placeholder="Ex: Módulo Avançado"
                    value={product.name}
                    onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descrição do que será liberado..."
                    value={product.description}
                    onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Preço (R$)</Label>
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
                    <Label>Link de Pagamento</Label>
                    <Input
                      placeholder="https://..."
                      value={product.payment_link}
                      onChange={(e) => updateProduct(product.id, 'payment_link', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Imagem do Produto</Label>
                  <ImageUpload
                    currentImage={product.image_url}
                    onImageSelect={(url) => updateProduct(product.id, 'image_url', url)}
                    bucketName="members-content"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Módulos/Conteúdos Liberados com esta Compra</Label>
                  <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                    {availableModules.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Nenhum módulo disponível. Crie módulos primeiro.
                      </p>
                    ) : (
                      availableModules.map((module) => (
                        <label
                          key={module.id}
                          className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={(product.modules_unlocked || []).includes(module.id)}
                            onChange={() => toggleModule(product.id, module.id)}
                            className="rounded"
                          />
                          <span className="text-sm">{module.title}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selecione quais módulos serão liberados quando o cliente comprar este produto
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}