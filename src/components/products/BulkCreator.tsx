import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { Loader2, ListPlus, Package, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Business {
  id: string;
  name: string;
}

interface BulkCreatorProps {
  businesses: Business[];
  onSuccess: () => void;
}

export default function BulkCreator({ businesses, onSuccess }: BulkCreatorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { categories } = useCategories();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "services">("products");
  const [loading, setLoading] = useState(false);

  // Products bulk state
  const [productsList, setProductsList] = useState("");
  const [productType, setProductType] = useState("physical");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productBusinessId, setProductBusinessId] = useState("");
  const [productDefaultPrice, setProductDefaultPrice] = useState("");

  // Services bulk state
  const [servicesList, setServicesList] = useState("");
  const [serviceCategoryId, setServiceCategoryId] = useState("");
  const [serviceBusinessId, setServiceBusinessId] = useState("");
  const [serviceDefaultPrice, setServiceDefaultPrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("");

  const parseItemsWithPrice = (text: string, defaultPrice: string) => {
    const lines = text.split("\n").filter((line) => line.trim());
    return lines.map((line) => {
      // Try to extract price from line (formats: "Item - 100", "Item 100", "Item R$ 100")
      const priceMatch = line.match(/[-–]\s*R?\$?\s*([\d.,]+)\s*$/i) || 
                         line.match(/\s+R?\$?\s*([\d.,]+)\s*$/i);
      
      if (priceMatch) {
        const priceStr = priceMatch[1].replace(",", ".");
        const price = parseFloat(priceStr);
        const name = line.replace(priceMatch[0], "").trim();
        return { name, price: isNaN(price) ? parseFloat(defaultPrice) || 0 : price };
      }
      
      return { 
        name: line.trim(), 
        price: parseFloat(defaultPrice) || 0 
      };
    }).filter((item) => item.name);
  };

  const handleBulkProducts = async () => {
    const items = parseItemsWithPrice(productsList, productDefaultPrice);
    
    if (items.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um produto", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const categoryName = productCategoryId 
        ? categories.find(c => c.id === productCategoryId)?.name || null 
        : null;

      const productsData = items.map((item) => ({
        user_id: user?.id,
        name: item.name,
        price: item.price,
        product_type: productType,
        category_id: productCategoryId || null,
        category: categoryName,
        business_id: productBusinessId || null,
        is_active: true,
        stock_quantity: productType === "physical" ? 0 : null,
      }));

      const { error } = await supabase.from("products" as any).insert(productsData);
      
      if (error) throw error;

      toast({ title: `${items.length} produto(s) criado(s) com sucesso!` });
      setProductsList("");
      setProductDefaultPrice("");
      onSuccess();
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao criar produtos", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkServices = async () => {
    const items = parseItemsWithPrice(servicesList, serviceDefaultPrice);
    
    if (items.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um serviço", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const categoryName = serviceCategoryId 
        ? categories.find(c => c.id === serviceCategoryId)?.name || null 
        : null;

      const servicesData = items.map((item) => ({
        user_id: user?.id,
        name: item.name,
        price: item.price,
        price_type: "fixed",
        category_id: serviceCategoryId || null,
        category: categoryName,
        business_id: serviceBusinessId || null,
        is_active: true,
        duration_minutes: serviceDuration ? parseInt(serviceDuration) : null,
        requires_scheduling: false,
      }));

      const { error } = await supabase.from("user_services" as any).insert(servicesData);
      
      if (error) throw error;

      toast({ title: `${items.length} serviço(s) criado(s) com sucesso!` });
      setServicesList("");
      setServiceDefaultPrice("");
      onSuccess();
      setOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao criar serviços", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activeCategories = categories.filter(c => c.is_active);
  const productCount = productsList.split("\n").filter(l => l.trim()).length;
  const serviceCount = servicesList.split("\n").filter(l => l.trim()).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ListPlus className="h-4 w-4 mr-2" />
          Cadastro em Massa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastro em Massa</DialogTitle>
          <DialogDescription>
            Adicione vários produtos ou serviços de uma só vez. Digite um por linha.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "products" | "services")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Wrench className="h-4 w-4" />
              Serviços
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="productsList">
                Lista de Produtos ({productCount} item(s))
              </Label>
              <Textarea
                id="productsList"
                value={productsList}
                onChange={(e) => setProductsList(e.target.value)}
                placeholder={`Digite um produto por linha:\n\nCamiseta Básica - 59.90\nCalça Jeans - 129.90\nTênis Esportivo - 199.90\n\nOu sem preço (usará o padrão):\nBonés\nMeias`}
                className="min-h-[180px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formato: "Nome do produto" ou "Nome - preço"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Produto</Label>
                <Select value={productType} onValueChange={setProductType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Físico</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="affiliate">Afiliado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Preço Padrão (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productDefaultPrice}
                  onChange={(e) => setProductDefaultPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={productCategoryId} onValueChange={setProductCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {activeCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.color || "#3b82f6" }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Negócio</Label>
                <Select value={productBusinessId} onValueChange={setProductBusinessId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem negócio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem negócio</SelectItem>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleBulkProducts} 
              disabled={loading || productCount === 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Criar {productCount} Produto(s)
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="services" className="space-y-4 mt-4">
            <div>
              <Label htmlFor="servicesList">
                Lista de Serviços ({serviceCount} item(s))
              </Label>
              <Textarea
                id="servicesList"
                value={servicesList}
                onChange={(e) => setServicesList(e.target.value)}
                placeholder={`Digite um serviço por linha:\n\nConsulta Inicial - 150\nManutenção Mensal - 200\nTreinamento - 500\n\nOu sem preço (usará o padrão):\nSuporte Técnico\nDesenvolvimento`}
                className="min-h-[180px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Formato: "Nome do serviço" ou "Nome - preço"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Preço Padrão (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={serviceDefaultPrice}
                  onChange={(e) => setServiceDefaultPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Duração Padrão (minutos)</Label>
                <Input
                  type="number"
                  value={serviceDuration}
                  onChange={(e) => setServiceDuration(e.target.value)}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={serviceCategoryId} onValueChange={setServiceCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {activeCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.color || "#3b82f6" }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Negócio</Label>
                <Select value={serviceBusinessId} onValueChange={setServiceBusinessId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem negócio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem negócio</SelectItem>
                    {businesses.map((business) => (
                      <SelectItem key={business.id} value={business.id}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleBulkServices} 
              disabled={loading || serviceCount === 0}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Criar {serviceCount} Serviço(s)
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
