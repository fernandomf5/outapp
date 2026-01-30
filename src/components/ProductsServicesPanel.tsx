import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package,
  Wrench,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Upload,
  Loader2,
  Search,
  Download,
  Clock,
  Box,
  Layers,
  BarChart3,
  Building2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Business {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  product_type: string;
  category: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  cost_price: number | null;
  stock_quantity: number | null;
  min_stock_alert: number | null;
  unit: string | null;
  weight_kg: number | null;
  dimensions_cm: any;
  image_url: string | null;
  gallery_urls: string[];
  download_url: string | null;
  download_limit: number | null;
  access_duration_days: number | null;
  is_active: boolean;
  tags: string[] | null;
  created_at: string;
  business_id: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  price_type: string;
  duration_minutes: number | null;
  image_url: string | null;
  requires_scheduling: boolean;
  max_capacity: number | null;
  is_active: boolean;
  tags: string[] | null;
  created_at: string;
  business_id: string | null;
}

const defaultProductForm = {
  name: "",
  description: "",
  product_type: "physical",
  category: "",
  sku: "",
  barcode: "",
  price: "",
  cost_price: "",
  stock_quantity: "0",
  min_stock_alert: "5",
  unit: "un",
  weight_kg: "",
  dimensions_length: "",
  dimensions_width: "",
  dimensions_height: "",
  image_url: "",
  download_url: "",
  download_limit: "",
  access_duration_days: "",
  is_active: true,
  tags: "",
  business_id: "",
};

const defaultServiceForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  price_type: "fixed",
  duration_minutes: "",
  image_url: "",
  requires_scheduling: false,
  max_capacity: "1",
  is_active: true,
  tags: "",
  business_id: "",
};

export default function ProductsServicesPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");

  // Businesses state
  const [businesses, setBusinesses] = useState<Business[]>([]);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(defaultProductForm);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState(defaultServiceForm);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [uploadingServiceImage, setUploadingServiceImage] = useState(false);

  useEffect(() => {
    if (user) {
      loadProducts();
      loadServices();
      loadBusinesses();
    }
  }, [user]);

  const loadBusinesses = async () => {
    const { data, error } = await supabase
      .from("businesses")
      .select("id, name, logo_url")
      .eq("user_id", user?.id)
      .order("name");

    if (!error && data) {
      setBusinesses(data);
    }
  };

  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        name: editingProduct.name,
        description: editingProduct.description || "",
        product_type: editingProduct.product_type,
        category: editingProduct.category || "",
        sku: editingProduct.sku || "",
        barcode: editingProduct.barcode || "",
        price: editingProduct.price.toString(),
        cost_price: editingProduct.cost_price?.toString() || "",
        stock_quantity: editingProduct.stock_quantity?.toString() || "0",
        min_stock_alert: editingProduct.min_stock_alert?.toString() || "5",
        unit: editingProduct.unit || "un",
        weight_kg: editingProduct.weight_kg?.toString() || "",
        dimensions_length: editingProduct.dimensions_cm?.length?.toString() || "",
        dimensions_width: editingProduct.dimensions_cm?.width?.toString() || "",
        dimensions_height: editingProduct.dimensions_cm?.height?.toString() || "",
        image_url: editingProduct.image_url || "",
        download_url: editingProduct.download_url || "",
        download_limit: editingProduct.download_limit?.toString() || "",
        access_duration_days: editingProduct.access_duration_days?.toString() || "",
        is_active: editingProduct.is_active,
        tags: editingProduct.tags?.join(", ") || "",
        business_id: editingProduct.business_id || "",
      });
    } else {
      setProductForm(defaultProductForm);
    }
  }, [editingProduct]);

  useEffect(() => {
    if (editingService) {
      setServiceForm({
        name: editingService.name,
        description: editingService.description || "",
        category: editingService.category || "",
        price: editingService.price.toString(),
        price_type: editingService.price_type,
        duration_minutes: editingService.duration_minutes?.toString() || "",
        image_url: editingService.image_url || "",
        requires_scheduling: editingService.requires_scheduling,
        max_capacity: editingService.max_capacity?.toString() || "1",
        is_active: editingService.is_active,
        tags: editingService.tags?.join(", ") || "",
        business_id: editingService.business_id || "",
      });
    } else {
      setServiceForm(defaultServiceForm);
    }
  }, [editingService]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    const { data, error } = await supabase
      .from("products" as any)
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar produtos", description: error.message, variant: "destructive" });
    } else {
      setProducts((data as any) || []);
    }
    setLoadingProducts(false);
  };

  const loadServices = async () => {
    setLoadingServices(true);
    const { data, error } = await supabase
      .from("user_services" as any)
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar serviços", description: error.message, variant: "destructive" });
    } else {
      setServices((data as any) || []);
    }
    setLoadingServices(false);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "product" | "service"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Erro", description: "Selecione uma imagem válida", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Erro", description: "A imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }

    if (type === "product") setUploadingProductImage(true);
    else setUploadingServiceImage(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chatbot-media")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chatbot-media")
        .getPublicUrl(fileName);

      if (type === "product") {
        setProductForm((prev) => ({ ...prev, image_url: publicUrl }));
      } else {
        setServiceForm((prev) => ({ ...prev, image_url: publicUrl }));
      }

      toast({ title: "Imagem enviada com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
    } finally {
      if (type === "product") setUploadingProductImage(false);
      else setUploadingServiceImage(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast({ title: "Erro", description: "Preencha o nome e preço", variant: "destructive" });
      return;
    }

    const dimensions = productForm.dimensions_length || productForm.dimensions_width || productForm.dimensions_height
      ? {
          length: parseFloat(productForm.dimensions_length) || null,
          width: parseFloat(productForm.dimensions_width) || null,
          height: parseFloat(productForm.dimensions_height) || null,
        }
      : null;

    const productData = {
      user_id: user?.id,
      name: productForm.name,
      description: productForm.description || null,
      product_type: productForm.product_type,
      category: productForm.category || null,
      sku: productForm.sku || null,
      barcode: productForm.barcode || null,
      price: parseFloat(productForm.price),
      cost_price: productForm.cost_price ? parseFloat(productForm.cost_price) : null,
      stock_quantity: parseInt(productForm.stock_quantity) || 0,
      min_stock_alert: parseInt(productForm.min_stock_alert) || 5,
      unit: productForm.unit,
      weight_kg: productForm.weight_kg ? parseFloat(productForm.weight_kg) : null,
      dimensions_cm: dimensions,
      image_url: productForm.image_url || null,
      download_url: productForm.download_url || null,
      download_limit: productForm.download_limit ? parseInt(productForm.download_limit) : null,
      access_duration_days: productForm.access_duration_days ? parseInt(productForm.access_duration_days) : null,
      is_active: productForm.is_active,
      tags: productForm.tags ? productForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      business_id: productForm.business_id || null,
    };

    try {
      if (editingProduct) {
        const { error } = await supabase.from("products" as any).update(productData).eq("id", editingProduct.id);
        if (error) throw error;
        toast({ title: "Produto atualizado!" });
      } else {
        const { error } = await supabase.from("products" as any).insert(productData);
        if (error) throw error;
        toast({ title: "Produto criado!" });
      }
      setProductDialogOpen(false);
      setEditingProduct(null);
      setProductForm(defaultProductForm);
      loadProducts();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.price) {
      toast({ title: "Erro", description: "Preencha o nome e preço", variant: "destructive" });
      return;
    }

    const serviceData = {
      user_id: user?.id,
      name: serviceForm.name,
      description: serviceForm.description || null,
      category: serviceForm.category || null,
      price: parseFloat(serviceForm.price),
      price_type: serviceForm.price_type,
      duration_minutes: serviceForm.duration_minutes ? parseInt(serviceForm.duration_minutes) : null,
      image_url: serviceForm.image_url || null,
      requires_scheduling: serviceForm.requires_scheduling,
      max_capacity: parseInt(serviceForm.max_capacity) || 1,
      is_active: serviceForm.is_active,
      tags: serviceForm.tags ? serviceForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
      business_id: serviceForm.business_id || null,
    };

    try {
      if (editingService) {
        const { error } = await supabase.from("user_services" as any).update(serviceData).eq("id", editingService.id);
        if (error) throw error;
        toast({ title: "Serviço atualizado!" });
      } else {
        const { error } = await supabase.from("user_services" as any).insert(serviceData);
        if (error) throw error;
        toast({ title: "Serviço criado!" });
      }
      setServiceDialogOpen(false);
      setEditingService(null);
      setServiceForm(defaultServiceForm);
      loadServices();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    const { error } = await supabase.from("products" as any).delete().eq("id", deleteProductId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produto excluído!" });
      loadProducts();
    }
    setDeleteProductId(null);
  };

  const handleDeleteService = async () => {
    if (!deleteServiceId) return;
    const { error } = await supabase.from("user_services" as any).delete().eq("id", deleteServiceId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Serviço excluído!" });
      loadServices();
    }
    setDeleteServiceId(null);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.is_active).length,
    physicalProducts: products.filter((p) => p.product_type === "physical").length,
    digitalProducts: products.filter((p) => p.product_type === "digital").length,
    totalServices: services.length,
    activeServices: services.filter((s) => s.is_active).length,
  };

  const priceTypeLabels: Record<string, string> = {
    fixed: "Fixo",
    hourly: "Por hora",
    daily: "Por dia",
    monthly: "Mensal",
    quote: "Sob consulta",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Produtos e Serviços</h2>
          <p className="text-muted-foreground">Gerencie seu catálogo de produtos físicos, digitais e serviços</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Box className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Produtos</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Download className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Digitais</p>
                <p className="text-2xl font-bold">{stats.digitalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Serviços</p>
                <p className="text-2xl font-bold">{stats.totalServices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold">{stats.activeProducts + stats.activeServices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Wrench className="h-4 w-4" />
              Serviços
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => {
                if (activeTab === "products") {
                  setEditingProduct(null);
                  setProductDialogOpen(true);
                } else {
                  setEditingService(null);
                  setServiceDialogOpen(true);
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo {activeTab === "products" ? "Produto" : "Serviço"}
            </Button>
          </div>
        </div>

        <TabsContent value="products" className="mt-6">
          {loadingProducts ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Nenhum produto cadastrado</p>
                <Button onClick={() => setProductDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  {product.image_url && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                        {product.category && (
                          <p className="text-sm text-muted-foreground">{product.category}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">
                          {product.product_type === "physical" ? "Físico" : "Digital"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-xl font-bold">R$ {Number(product.price).toFixed(2)}</span>
                      </div>
                      {product.product_type === "physical" && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Layers className="h-4 w-4" />
                          <span>Estoque: {product.stock_quantity}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditingProduct(product);
                          setProductDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteProductId(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-6">
          {loadingServices ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredServices.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Wrench className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Nenhum serviço cadastrado</p>
                <Button onClick={() => setServiceDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredServices.map((service) => (
                <Card key={service.id} className="overflow-hidden">
                  {service.image_url && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg line-clamp-1">{service.name}</CardTitle>
                        {service.category && (
                          <p className="text-sm text-muted-foreground">{service.category}</p>
                        )}
                      </div>
                      <Badge variant={service.is_active ? "default" : "secondary"}>
                        {service.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                    )}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-xl font-bold">R$ {Number(service.price).toFixed(2)}</span>
                      </div>
                      <Badge variant="outline">{priceTypeLabels[service.price_type]}</Badge>
                    </div>
                    {service.duration_minutes && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <Clock className="h-4 w-4" />
                        <span>Duração: {service.duration_minutes} min</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setEditingService(service);
                          setServiceDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => setDeleteServiceId(service.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription>Preencha as informações do produto</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome *</Label>
                <Input
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Nome do produto"
                />
              </div>
              {businesses.length > 0 && (
                <div className="col-span-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Negócio
                  </Label>
                  <Select
                    value={productForm.business_id || "none"}
                    onValueChange={(v) => setProductForm({ ...productForm, business_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um negócio (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (pessoal)</SelectItem>
                      {businesses.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={productForm.product_type}
                  onValueChange={(v) => setProductForm({ ...productForm, product_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">Físico</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  placeholder="Ex: Eletrônicos"
                />
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Descrição do produto"
                />
              </div>
              <div>
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Preço de custo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productForm.cost_price}
                  onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                />
              </div>
              <div>
                <Label>SKU</Label>
                <Input
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  placeholder="Código SKU"
                />
              </div>
              <div>
                <Label>Código de barras</Label>
                <Input
                  value={productForm.barcode}
                  onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                  placeholder="EAN/UPC"
                />
              </div>

              {productForm.product_type === "physical" && (
                <>
                  <div>
                    <Label>Estoque</Label>
                    <Input
                      type="number"
                      value={productForm.stock_quantity}
                      onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Alerta estoque mínimo</Label>
                    <Input
                      type="number"
                      value={productForm.min_stock_alert}
                      onChange={(e) => setProductForm({ ...productForm, min_stock_alert: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Unidade</Label>
                    <Select
                      value={productForm.unit}
                      onValueChange={(v) => setProductForm({ ...productForm, unit: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="un">Unidade</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="g">Gramas</SelectItem>
                        <SelectItem value="l">Litros</SelectItem>
                        <SelectItem value="ml">ML</SelectItem>
                        <SelectItem value="m">Metros</SelectItem>
                        <SelectItem value="cm">CM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Peso (kg)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={productForm.weight_kg}
                      onChange={(e) => setProductForm({ ...productForm, weight_kg: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-3 gap-2">
                    <div>
                      <Label>Comprimento (cm)</Label>
                      <Input
                        type="number"
                        value={productForm.dimensions_length}
                        onChange={(e) => setProductForm({ ...productForm, dimensions_length: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Largura (cm)</Label>
                      <Input
                        type="number"
                        value={productForm.dimensions_width}
                        onChange={(e) => setProductForm({ ...productForm, dimensions_width: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Altura (cm)</Label>
                      <Input
                        type="number"
                        value={productForm.dimensions_height}
                        onChange={(e) => setProductForm({ ...productForm, dimensions_height: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {productForm.product_type === "digital" && (
                <>
                  <div className="col-span-2">
                    <Label>URL de download</Label>
                    <Input
                      value={productForm.download_url}
                      onChange={(e) => setProductForm({ ...productForm, download_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Limite de downloads</Label>
                    <Input
                      type="number"
                      value={productForm.download_limit}
                      onChange={(e) => setProductForm({ ...productForm, download_limit: e.target.value })}
                      placeholder="Ilimitado"
                    />
                  </div>
                  <div>
                    <Label>Duração do acesso (dias)</Label>
                    <Input
                      type="number"
                      value={productForm.access_duration_days}
                      onChange={(e) => setProductForm({ ...productForm, access_duration_days: e.target.value })}
                      placeholder="Vitalício"
                    />
                  </div>
                </>
              )}

              <div className="col-span-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={productForm.tags}
                  onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="col-span-2">
                <Label>Imagem do produto</Label>
                {productForm.image_url && (
                  <div className="relative mb-3">
                    <img src={productForm.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setProductForm({ ...productForm, image_url: "" })}
                    >
                      Remover
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "product")}
                    disabled={uploadingProductImage}
                  />
                  {uploadingProductImage && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>

              <div className="col-span-2 flex items-center gap-2">
                <Switch
                  checked={productForm.is_active}
                  onCheckedChange={(checked) => setProductForm({ ...productForm, is_active: checked })}
                />
                <Label>Produto ativo</Label>
              </div>
            </div>

            <Button onClick={handleSaveProduct} className="w-full">
              {editingProduct ? "Atualizar" : "Criar"} Produto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            <DialogDescription>Preencha as informações do serviço</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nome *</Label>
                <Input
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder="Nome do serviço"
                />
              </div>
              {businesses.length > 0 && (
                <div className="col-span-2">
                  <Label className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Negócio
                  </Label>
                  <Select
                    value={serviceForm.business_id || "none"}
                    onValueChange={(v) => setServiceForm({ ...serviceForm, business_id: v === "none" ? "" : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um negócio (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (pessoal)</SelectItem>
                      {businesses.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="col-span-2">
                <Label>Categoria</Label>
                <Input
                  value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                  placeholder="Ex: Consultoria"
                />
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Descrição do serviço"
                />
              </div>
              <div>
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Tipo de preço</Label>
                <Select
                  value={serviceForm.price_type}
                  onValueChange={(v) => setServiceForm({ ...serviceForm, price_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixo</SelectItem>
                    <SelectItem value="hourly">Por hora</SelectItem>
                    <SelectItem value="daily">Por dia</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quote">Sob consulta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  value={serviceForm.duration_minutes}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: e.target.value })}
                />
              </div>
              <div>
                <Label>Capacidade máxima</Label>
                <Input
                  type="number"
                  value={serviceForm.max_capacity}
                  onChange={(e) => setServiceForm({ ...serviceForm, max_capacity: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input
                  value={serviceForm.tags}
                  onChange={(e) => setServiceForm({ ...serviceForm, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="col-span-2">
                <Label>Imagem do serviço</Label>
                {serviceForm.image_url && (
                  <div className="relative mb-3">
                    <img src={serviceForm.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setServiceForm({ ...serviceForm, image_url: "" })}
                    >
                      Remover
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "service")}
                    disabled={uploadingServiceImage}
                  />
                  {uploadingServiceImage && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={serviceForm.requires_scheduling}
                  onCheckedChange={(checked) => setServiceForm({ ...serviceForm, requires_scheduling: checked })}
                />
                <Label>Requer agendamento</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={serviceForm.is_active}
                  onCheckedChange={(checked) => setServiceForm({ ...serviceForm, is_active: checked })}
                />
                <Label>Serviço ativo</Label>
              </div>
            </div>

            <Button onClick={handleSaveService} className="w-full">
              {editingService ? "Atualizar" : "Criar"} Serviço
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialogs */}
      <DeleteConfirmDialog
        open={!!deleteProductId}
        onOpenChange={() => setDeleteProductId(null)}
        onConfirm={handleDeleteProduct}
        description="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
      />
      <DeleteConfirmDialog
        open={!!deleteServiceId}
        onOpenChange={() => setDeleteServiceId(null)}
        onConfirm={handleDeleteService}
        description="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
