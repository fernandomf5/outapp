import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Search, Package, Wrench, ListFilter, CheckSquare, XSquare, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const [productSearch, setProductSearch] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("products");

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
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const category = product.category || "Sem categoria";
    if (!acc[category]) acc[category] = [];
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Group services by category
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    const category = service.category || "Sem categoria";
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

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

  const toggleCategoryProducts = (category: string, isSelected: boolean) => {
    const categoryProductIds = productsByCategory[category]?.map((p) => p.id) || [];
    if (isSelected) {
      // Remove all products from this category
      onChangeProducts(selectedProductIds.filter((id) => !categoryProductIds.includes(id)));
    } else {
      // Add all products from this category
      const newIds = [...new Set([...selectedProductIds, ...categoryProductIds])];
      onChangeProducts(newIds);
    }
  };

  const toggleCategoryServices = (category: string, isSelected: boolean) => {
    const categoryServiceIds = servicesByCategory[category]?.map((s) => s.id) || [];
    if (isSelected) {
      onChangeServices(selectedServiceIds.filter((id) => !categoryServiceIds.includes(id)));
    } else {
      const newIds = [...new Set([...selectedServiceIds, ...categoryServiceIds])];
      onChangeServices(newIds);
    }
  };

  const isCategoryFullySelectedProducts = (category: string) => {
    const categoryProductIds = productsByCategory[category]?.map((p) => p.id) || [];
    return categoryProductIds.every((id) => selectedProductIds.includes(id));
  };

  const isCategoryFullySelectedServices = (category: string) => {
    const categoryServiceIds = servicesByCategory[category]?.map((s) => s.id) || [];
    return categoryServiceIds.every((id) => selectedServiceIds.includes(id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalItems = products.length + services.length;
  const selectedTotal = selectedProductIds.length + selectedServiceIds.length;

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <Card className={showAll ? "border-primary/50 bg-primary/5" : "border-amber-500/50 bg-amber-500/5"}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${showAll ? "bg-primary/10" : "bg-amber-500/10"}`}>
                <ListFilter className={`w-5 h-5 ${showAll ? "text-primary" : "text-amber-500"}`} />
              </div>
              <div>
                <Label htmlFor="showAll" className="cursor-pointer font-medium">
                  {showAll ? "Exibindo todos os itens" : "Seleção personalizada"}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {showAll 
                    ? `Todos os ${totalItems} itens serão exibidos no catálogo`
                    : `${selectedTotal} de ${totalItems} itens selecionados`
                  }
                </p>
              </div>
            </div>
            <Switch
              id="showAll"
              checked={showAll}
              onCheckedChange={onChangeShowAll}
            />
          </div>
        </CardContent>
      </Card>

      {!showAll && (
        <div className="space-y-4">
          {/* Summary Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1">
              <Package className="w-3 h-3" />
              {selectedProductIds.length} produtos
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Wrench className="w-3 h-3" />
              {selectedServiceIds.length} serviços
            </Badge>
            {selectedTotal === 0 && (
              <Badge variant="destructive" className="gap-1">
                <Info className="w-3 h-3" />
                Selecione ao menos um item
              </Badge>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="products" className="gap-2">
                <Package className="w-4 h-4" />
                Produtos
                <Badge variant={selectedProductIds.length > 0 ? "default" : "secondary"} className="ml-1">
                  {selectedProductIds.length}/{products.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="services" className="gap-2">
                <Wrench className="w-4 h-4" />
                Serviços
                <Badge variant={selectedServiceIds.length > 0 ? "default" : "secondary"} className="ml-1">
                  {selectedServiceIds.length}/{services.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-3 mt-4">
              {products.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium">Nenhum produto cadastrado</p>
                    <p className="text-sm text-muted-foreground">
                      Cadastre produtos em "Produtos e Serviços"
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Search and Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar produto..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllProducts} className="gap-1">
                        <CheckSquare className="w-4 h-4" />
                        Todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearAllProducts} className="gap-1">
                        <XSquare className="w-4 h-4" />
                        Limpar
                      </Button>
                    </div>
                  </div>

                  {/* Products by Category */}
                  <div className="border rounded-lg max-h-72 overflow-y-auto">
                    {Object.keys(productsByCategory).length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Nenhum produto encontrado
                      </div>
                    ) : (
                      <Accordion type="multiple" defaultValue={Object.keys(productsByCategory)} className="w-full">
                        {Object.entries(productsByCategory).map(([category, categoryProducts]) => {
                          const isFullySelected = isCategoryFullySelectedProducts(category);
                          const selectedCount = categoryProducts.filter((p) => selectedProductIds.includes(p.id)).length;
                          
                          return (
                            <AccordionItem key={category} value={category} className="border-b last:border-b-0">
                              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                                <div className="flex items-center gap-3 w-full">
                                  <Checkbox
                                    checked={isFullySelected}
                                    onCheckedChange={() => toggleCategoryProducts(category, isFullySelected)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="font-medium flex-1 text-left">{category}</span>
                                  <Badge variant="outline" className="mr-2">
                                    {selectedCount}/{categoryProducts.length}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-0">
                                <div className="divide-y">
                                  {categoryProducts.map((product) => (
                                    <div
                                      key={product.id}
                                      className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                                        selectedProductIds.includes(product.id) ? "bg-primary/5" : ""
                                      }`}
                                      onClick={() => toggleProduct(product.id)}
                                    >
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
                                        <p className="text-sm font-medium truncate">{product.name}</p>
                                      </div>
                                      <span className="text-sm text-muted-foreground">
                                        {formatPrice(product.price)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-3 mt-4">
              {services.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Wrench className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium">Nenhum serviço cadastrado</p>
                    <p className="text-sm text-muted-foreground">
                      Cadastre serviços em "Produtos e Serviços"
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Search and Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar serviço..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={selectAllServices} className="gap-1">
                        <CheckSquare className="w-4 h-4" />
                        Todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearAllServices} className="gap-1">
                        <XSquare className="w-4 h-4" />
                        Limpar
                      </Button>
                    </div>
                  </div>

                  {/* Services by Category */}
                  <div className="border rounded-lg max-h-72 overflow-y-auto">
                    {Object.keys(servicesByCategory).length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Nenhum serviço encontrado
                      </div>
                    ) : (
                      <Accordion type="multiple" defaultValue={Object.keys(servicesByCategory)} className="w-full">
                        {Object.entries(servicesByCategory).map(([category, categoryServices]) => {
                          const isFullySelected = isCategoryFullySelectedServices(category);
                          const selectedCount = categoryServices.filter((s) => selectedServiceIds.includes(s.id)).length;
                          
                          return (
                            <AccordionItem key={category} value={category} className="border-b last:border-b-0">
                              <AccordionTrigger className="px-4 py-2 hover:no-underline">
                                <div className="flex items-center gap-3 w-full">
                                  <Checkbox
                                    checked={isFullySelected}
                                    onCheckedChange={() => toggleCategoryServices(category, isFullySelected)}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="font-medium flex-1 text-left">{category}</span>
                                  <Badge variant="outline" className="mr-2">
                                    {selectedCount}/{categoryServices.length}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-0">
                                <div className="divide-y">
                                  {categoryServices.map((service) => (
                                    <div
                                      key={service.id}
                                      className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${
                                        selectedServiceIds.includes(service.id) ? "bg-primary/5" : ""
                                      }`}
                                      onClick={() => toggleService(service.id)}
                                    >
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
                                        <p className="text-sm font-medium truncate">{service.name}</p>
                                      </div>
                                      <span className="text-sm text-muted-foreground">
                                        {formatPrice(service.price)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
