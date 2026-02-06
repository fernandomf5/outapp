import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  Link,
  TrendingUp,
  Warehouse,
  FolderOpen,
  ListPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import BulkCreator from "@/components/products/BulkCreator";
import CategoryManager from "@/components/products/CategoryManager";
import { useCategories } from "@/hooks/useCategories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductsAnalyticsPanel from "@/components/products/ProductsAnalyticsPanel";
import StockManagementPanel from "@/components/products/StockManagementPanel";
import GalleryImageUpload from "@/components/products/GalleryImageUpload";
import RichDescriptionEditor from "@/components/products/RichDescriptionEditor";

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
  category_id: string | null;
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
  affiliate_url: string | null;
  is_active: boolean;
  tags: string[] | null;
  created_at: string;
  business_id: string | null;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
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
  description_html: "",
  product_type: "physical",
  category: "",
  category_id: "",
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
  gallery_urls: [] as string[],
  download_url: "",
  download_limit: "",
  access_duration_days: "",
  affiliate_url: "",
  is_active: true,
  tags: "",
  business_id: "",
};

const defaultServiceForm = {
  name: "",
  description: "",
  description_html: "",
  category: "",
  category_id: "",
  price: "",
  price_type: "fixed",
  duration_minutes: "",
  image_url: "",
  gallery_urls: [] as string[],
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
  const [businessFilter, setBusinessFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Categories hook
  const { categories, loadCategories, getCategoryName } = useCategories();

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
        description_html: (editingProduct as any).description_html || "",
        product_type: editingProduct.product_type,
        category: editingProduct.category || "",
        category_id: editingProduct.category_id || "",
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
        gallery_urls: editingProduct.gallery_urls || [],
        download_url: editingProduct.download_url || "",
        download_limit: editingProduct.download_limit?.toString() || "",
        access_duration_days: editingProduct.access_duration_days?.toString() || "",
        affiliate_url: editingProduct.affiliate_url || "",
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
        description_html: (editingService as any).description_html || "",
        category: editingService.category || "",
        category_id: editingService.category_id || "",
        price: editingService.price.toString(),
        price_type: editingService.price_type,
        duration_minutes: editingService.duration_minutes?.toString() || "",
        image_url: editingService.image_url || "",
        gallery_urls: (editingService as any).gallery_urls || [],
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
      description_html: productForm.description_html || null,
      product_type: productForm.product_type,
      category: productForm.category || null,
      category_id: productForm.category_id || null,
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
      gallery_urls: productForm.gallery_urls.length > 0 ? productForm.gallery_urls : null,
      download_url: productForm.download_url || null,
      download_limit: productForm.download_limit ? parseInt(productForm.download_limit) : null,
      access_duration_days: productForm.access_duration_days ? parseInt(productForm.access_duration_days) : null,
      affiliate_url: productForm.affiliate_url || null,
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
      description_html: serviceForm.description_html || null,
      category: serviceForm.category || null,
      category_id: serviceForm.category_id || null,
      price: parseFloat(serviceForm.price),
      price_type: serviceForm.price_type,
      duration_minutes: serviceForm.duration_minutes ? parseInt(serviceForm.duration_minutes) : null,
      image_url: serviceForm.image_url || null,
      gallery_urls: serviceForm.gallery_urls.length > 0 ? serviceForm.gallery_urls : null,
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

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBusiness =
      businessFilter === "all" ||
      (businessFilter === "none" && !p.business_id) ||
      p.business_id === businessFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "none" && !p.category_id) ||
      p.category_id === categoryFilter;
    return matchesSearch && matchesBusiness && matchesCategory;
  });

  const filteredServices = services.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBusiness =
      businessFilter === "all" ||
      (businessFilter === "none" && !s.business_id) ||
      s.business_id === businessFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      (categoryFilter === "none" && !s.category_id) ||
      s.category_id === categoryFilter;
    return matchesSearch && matchesBusiness && matchesCategory;
  });

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const catId = product.category_id || "uncategorized";
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Group services by category
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    const catId = service.category_id || "uncategorized";
    if (!acc[catId]) acc[catId] = [];
    acc[catId].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  // Get sorted category keys (with active categories first, then uncategorized)
  const getSortedCategoryKeys = (grouped: Record<string, any[]>) => {
    const keys = Object.keys(grouped);
    return keys.sort((a, b) => {
      if (a === "uncategorized") return 1;
      if (b === "uncategorized") return -1;
      const catA = categories.find(c => c.id === a);
      const catB = categories.find(c => c.id === b);
      return (catA?.order_index || 0) - (catB?.order_index || 0);
    });
  };

  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.is_active).length,
    physicalProducts: products.filter((p) => p.product_type === "physical").length,
    digitalProducts: products.filter((p) => p.product_type === "digital").length,
    affiliateProducts: products.filter((p) => p.product_type === "affiliate").length,
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
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Wrench className="h-4 w-4" />
              Serviços
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Categorias
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-2">
              <Warehouse className="h-4 w-4" />
              Estoque
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {(activeTab === "products" || activeTab === "services") && (
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 sm:w-48 min-w-[150px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={businessFilter} onValueChange={setBusinessFilter}>
                <SelectTrigger className="w-[160px]">
                  <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Negócio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os negócios</SelectItem>
                  <SelectItem value="none">Sem negócio</SelectItem>
                  {businesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px]">
                  <FolderOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.filter(c => c.is_active).map((cat) => (
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
              <BulkCreator 
                businesses={businesses} 
                onSuccess={() => {
                  loadProducts();
                  loadServices();
                }} 
              />
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
          )}
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
            <div className="space-y-6">
              {getSortedCategoryKeys(productsByCategory).map((catId) => {
                const categoryProducts = productsByCategory[catId];
                const category = categories.find(c => c.id === catId);
                const categoryName = catId === "uncategorized" ? "Sem categoria" : (category?.name || "Outros");
                const categoryColor = category?.color || "#6b7280";
                const hasMoreThan3 = categoryProducts.length > 3;
                
                return (
                  <div key={catId}>
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: catId === "uncategorized" ? "#6b7280" : categoryColor }}
                      />
                      <h3 className="font-semibold text-lg">{categoryName}</h3>
                      <Badge variant="secondary" className="ml-1">{categoryProducts.length}</Badge>
                      {hasMoreThan3 && (
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <ChevronLeft className="h-3 w-3" />
                          Deslize para ver mais
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    {hasMoreThan3 ? (
                      <ScrollArea className="w-full whitespace-nowrap pb-4">
                        <div className="flex gap-4">
                          {categoryProducts.map((product) => (
                            <Card key={product.id} className="overflow-hidden w-[300px] md:w-[340px] flex-shrink-0">
                              {product.image_url && (
                                <div className="aspect-video w-full overflow-hidden">
                                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                  <CardTitle className="text-lg line-clamp-1 whitespace-normal">{product.name}</CardTitle>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                                      {product.is_active ? "Ativo" : "Inativo"}
                                    </Badge>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                {product.description && (
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2 whitespace-normal">{product.description}</p>
                                )}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                    <span className="text-xl font-bold">R$ {Number(product.price).toFixed(2)}</span>
                                  </div>
                                  {product.product_type === "physical" && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Layers className="h-4 w-4" />
                                      <span>{product.stock_quantity}</span>
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
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {categoryProducts.map((product) => (
                          <Card key={product.id} className="overflow-hidden">
                            {product.image_url && (
                              <div className="aspect-video w-full overflow-hidden">
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                                <div className="flex gap-1 flex-wrap">
                                  <Badge variant={product.is_active ? "default" : "secondary"}>
                                    {product.is_active ? "Ativo" : "Inativo"}
                                  </Badge>
                                  <Badge variant="outline">
                                    {product.product_type === "physical" ? "Físico" : product.product_type === "affiliate" ? "Afiliado" : "Digital"}
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
                  </div>
                );
              })}
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
            <div className="space-y-6">
              {getSortedCategoryKeys(servicesByCategory).map((catId) => {
                const categoryServices = servicesByCategory[catId];
                const category = categories.find(c => c.id === catId);
                const categoryName = catId === "uncategorized" ? "Sem categoria" : (category?.name || "Outros");
                const categoryColor = category?.color || "#6b7280";
                const hasMoreThan3 = categoryServices.length > 3;
                
                return (
                  <div key={catId}>
                    <div className="flex items-center gap-2 mb-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: catId === "uncategorized" ? "#6b7280" : categoryColor }}
                      />
                      <h3 className="font-semibold text-lg">{categoryName}</h3>
                      <Badge variant="secondary" className="ml-1">{categoryServices.length}</Badge>
                      {hasMoreThan3 && (
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <ChevronLeft className="h-3 w-3" />
                          Deslize para ver mais
                          <ChevronRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    {hasMoreThan3 ? (
                      <ScrollArea className="w-full whitespace-nowrap pb-4">
                        <div className="flex gap-4">
                          {categoryServices.map((service) => (
                            <Card key={service.id} className="overflow-hidden w-[300px] md:w-[340px] flex-shrink-0">
                              {service.image_url && (
                                <div className="aspect-video w-full overflow-hidden">
                                  <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <CardHeader className="pb-2">
                                <div className="flex items-start justify-between gap-2">
                                  <CardTitle className="text-lg line-clamp-1 whitespace-normal">{service.name}</CardTitle>
                                  <Badge variant={service.is_active ? "default" : "secondary"} className="text-xs flex-shrink-0">
                                    {service.is_active ? "Ativo" : "Inativo"}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                {service.description && (
                                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2 whitespace-normal">{service.description}</p>
                                )}
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-primary" />
                                    <span className="text-xl font-bold">R$ {Number(service.price).toFixed(2)}</span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">{priceTypeLabels[service.price_type]}</Badge>
                                </div>
                                {service.duration_minutes && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                                    <Clock className="h-4 w-4" />
                                    <span>{service.duration_minutes} min</span>
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
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {categoryServices.map((service) => (
                          <Card key={service.id} className="overflow-hidden">
                            {service.image_url && (
                              <div className="aspect-video w-full overflow-hidden">
                                <img src={service.image_url} alt={service.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <CardTitle className="text-lg line-clamp-1">{service.name}</CardTitle>
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
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoryManager onCategoriesChange={loadCategories} />
        </TabsContent>

        <TabsContent value="stock" className="mt-6">
          <StockManagementPanel />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <ProductsAnalyticsPanel />
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
                    <SelectItem value="affiliate">Afiliado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Categoria
                </Label>
                <Select
                  value={productForm.category_id || "none"}
                  onValueChange={(v) => setProductForm({ 
                    ...productForm, 
                    category_id: v === "none" ? "" : v,
                    category: v === "none" ? "" : (categories.find(c => c.id === v)?.name || "")
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.filter(c => c.is_active).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }} 
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Descrição Curta</Label>
                <Textarea
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Resumo do produto (aparece na listagem)"
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <RichDescriptionEditor
                  userId={user?.id || ""}
                  value={productForm.description}
                  htmlValue={productForm.description_html}
                  onChange={(text, html) => setProductForm({ 
                    ...productForm, 
                    description: text || productForm.description,
                    description_html: html 
                  })}
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

              {productForm.product_type === "affiliate" && (
                <div className="col-span-2">
                  <Label className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Link de Afiliado *
                  </Label>
                  <Input
                    value={productForm.affiliate_url}
                    onChange={(e) => setProductForm({ ...productForm, affiliate_url: e.target.value })}
                    placeholder="https://exemplo.com/seu-link-afiliado"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cole o link de afiliado que será enviado aos seus clientes
                  </p>
                </div>
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
                <GalleryImageUpload
                  userId={user?.id || ""}
                  mainImage={productForm.image_url}
                  galleryUrls={productForm.gallery_urls}
                  onMainImageChange={(url) => setProductForm({ ...productForm, image_url: url })}
                  onGalleryChange={(urls) => setProductForm({ ...productForm, gallery_urls: urls })}
                />
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
                <Label className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Categoria
                </Label>
                <Select
                  value={serviceForm.category_id || "none"}
                  onValueChange={(v) => setServiceForm({ 
                    ...serviceForm, 
                    category_id: v === "none" ? "" : v,
                    category: v === "none" ? "" : (categories.find(c => c.id === v)?.name || "")
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.filter(c => c.is_active).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }} 
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Descrição Curta</Label>
                <Textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Resumo do serviço (aparece na listagem)"
                  rows={2}
                />
              </div>
              <div className="col-span-2">
                <RichDescriptionEditor
                  userId={user?.id || ""}
                  value={serviceForm.description}
                  htmlValue={serviceForm.description_html}
                  onChange={(text, html) => setServiceForm({ 
                    ...serviceForm, 
                    description: text || serviceForm.description,
                    description_html: html 
                  })}
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
                <GalleryImageUpload
                  userId={user?.id || ""}
                  mainImage={serviceForm.image_url}
                  galleryUrls={serviceForm.gallery_urls}
                  onMainImageChange={(url) => setServiceForm({ ...serviceForm, image_url: url })}
                  onGalleryChange={(urls) => setServiceForm({ ...serviceForm, gallery_urls: urls })}
                />
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
