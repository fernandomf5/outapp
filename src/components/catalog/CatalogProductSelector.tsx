import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Package, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Product {
  id: string;
  name: string;
  category: string | null;
  price: number;
  image_url: string | null;
}

interface Service {
  id: string;
  name: string;
  category: string | null;
  price: number;
  image_url: string | null;
}

interface CatalogProductSelectorProps {
  userId: string;
  selectedProductIds: string[];
  selectedServiceIds: string[];
  showAll: boolean;
  onChangeShowAll: (showAll: boolean) => void;
  onChangeProducts: (ids: string[]) => void;
  onChangeServices: (ids: string[]) => void;
}

export default function CatalogProductSelector({
  userId,
  selectedProductIds,
  selectedServiceIds,
  showAll,
  onChangeShowAll,
  onChangeProducts,
  onChangeServices,
}: CatalogProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadItems();
  }, [userId]);

  const loadItems = async () => {
    setLoading(true);
    const [productsRes, servicesRes] = await Promise.all([
      supabase
        .from("products" as any)
        .select("id, name, category, price, image_url")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("user_services" as any)
        .select("id, name, category, price, image_url")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("name"),
    ]);

    setProducts((productsRes.data as any) || []);
    setServices((servicesRes.data as any) || []);
    setLoading(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      onChangeProducts(selectedProductIds.filter((pid) => pid !== id));
    } else {
      onChangeProducts([...selectedProductIds, id]);
    }
  };

  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      onChangeServices(selectedServiceIds.filter((sid) => sid !== id));
    } else {
      onChangeServices([...selectedServiceIds, id]);
    }
  };

  const selectAllProducts = () => {
    onChangeProducts(products.map((p) => p.id));
  };

  const selectAllServices = () => {
    onChangeServices(services.map((s) => s.id));
  };

  const clearAllProducts = () => {
    onChangeProducts([]);
  };

  const clearAllServices = () => {
    onChangeServices([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="showAll"
            checked={showAll}
            onCheckedChange={(checked) => onChangeShowAll(!!checked)}
          />
          <Label htmlFor="showAll" className="cursor-pointer">
            Exibir todos os produtos e serviços
          </Label>
        </div>
      </div>

      {!showAll && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="products">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products" className="gap-1">
                <Package className="w-4 h-4" />
                Produtos ({selectedProductIds.length}/{products.length})
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-1">
                <Wrench className="w-4 h-4" />
                Serviços ({selectedServiceIds.length}/{services.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-3">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={selectAllProducts}>
                  Selecionar todos
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllProducts}>
                  Limpar seleção
                </Button>
              </div>

              {filteredProducts.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    Nenhum produto encontrado
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className={`cursor-pointer transition-colors ${
                        selectedProductIds.includes(product.id)
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Checkbox
                          checked={selectedProductIds.includes(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {product.name}
                          </p>
                          {product.category && (
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {formatPrice(product.price)}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="services" className="space-y-3">
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={selectAllServices}>
                  Selecionar todos
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllServices}>
                  Limpar seleção
                </Button>
              </div>

              {filteredServices.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    Nenhum serviço encontrado
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {filteredServices.map((service) => (
                    <Card
                      key={service.id}
                      className={`cursor-pointer transition-colors ${
                        selectedServiceIds.includes(service.id)
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                      onClick={() => toggleService(service.id)}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        <Checkbox
                          checked={selectedServiceIds.includes(service.id)}
                          onCheckedChange={() => toggleService(service.id)}
                        />
                        {service.image_url ? (
                          <img
                            src={service.image_url}
                            alt={service.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {service.name}
                          </p>
                          {service.category && (
                            <Badge variant="outline" className="text-xs">
                              {service.category}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {formatPrice(service.price)}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
