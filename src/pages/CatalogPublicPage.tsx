import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet-async";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Package,
  Wrench,
  Clock,
  DollarSign,
  Box,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Store,
  ArrowRight,
  X,
  ShoppingCart,
  Plus,
} from "lucide-react";
import { CatalogCart, CartItem } from "@/components/catalog/CatalogCart";
import { toast } from "sonner";

interface Catalog {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string;
  background_color: string | null;
  text_color: string | null;
  whatsapp_number: string | null;
  show_prices: boolean;
  show_stock: boolean;
  show_description: boolean;
  layout_style: string;
  is_active: boolean;
  store_open: boolean;
  store_closed_message: string | null;
  show_all_items: boolean;
  selected_product_ids: string[] | null;
  selected_service_ids: string[] | null;
  views_count: number;
  group_by_category: boolean;
  category_order: string[] | null;
}

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
  order_index: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  product_type: string;
  category: string | null;
  category_id: string | null;
  price: number;
  stock_quantity: number | null;
  image_url: string | null;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  category_id: string | null;
  price: number;
  price_type: string;
  duration_minutes: number | null;
  image_url: string | null;
  is_active: boolean;
}

export default function CatalogPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [viewAllCategory, setViewAllCategory] = useState<{
    category: Category | null;
    items: any[];
  } | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Cart functions
  const addToCart = (item: any) => {
    const itemType = item.type || (item.duration_minutes ? "service" : "product");
    
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price || 0,
          quantity: 1,
          type: itemType,
          image_url: item.image_url,
          price_type: item.price_type,
        },
      ];
    });
    toast.success(`${item.name} adicionado ao carrinho`);
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity } : item))
      );
    }
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  useEffect(() => {
    if (slug) {
      loadCatalog();
    }
  }, [slug]);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load catalog
      const { data: catalogData, error: catalogError } = await supabase
        .from("catalogs" as any)
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (catalogError || !catalogData) {
        setError("Catálogo não encontrado");
        setLoading(false);
        return;
      }

      const cat = catalogData as unknown as Catalog;
      setCatalog(cat);

      // Increment views
      await supabase
        .from("catalogs" as any)
        .update({ views_count: (cat.views_count || 0) + 1 })
        .eq("id", cat.id);

      // Load banners
      const { data: bannersData } = await supabase
        .from("catalog_banners" as any)
        .select("*")
        .eq("catalog_id", cat.id)
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      setBanners((bannersData as any) || []);

      // Load products, services, and categories
      const [productsRes, servicesRes, categoriesRes] = await Promise.all([
        supabase
          .from("products" as any)
          .select("*")
          .eq("user_id", cat.user_id)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("user_services" as any)
          .select("*")
          .eq("user_id", cat.user_id)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("product_categories" as any)
          .select("*")
          .eq("user_id", cat.user_id)
          .eq("is_active", true)
          .order("order_index", { ascending: true }),
      ]);

      setCategories((categoriesRes.data as any) || []);

      let filteredProducts = (productsRes.data as any) || [];
      let filteredServices = (servicesRes.data as any) || [];

      // Filter by selected IDs if not showing all items
      if (!cat.show_all_items) {
        if (cat.selected_product_ids && cat.selected_product_ids.length > 0) {
          filteredProducts = filteredProducts.filter((p: Product) =>
            cat.selected_product_ids!.includes(p.id)
          );
        } else {
          filteredProducts = [];
        }
        if (cat.selected_service_ids && cat.selected_service_ids.length > 0) {
          filteredServices = filteredServices.filter((s: Service) =>
            cat.selected_service_ids!.includes(s.id)
          );
        } else {
          filteredServices = [];
        }
      }

      setProducts(filteredProducts);
      setServices(filteredServices);
    } catch (err) {
      setError("Erro ao carregar catálogo");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleWhatsAppContact = (itemName?: string) => {
    if (!catalog?.whatsapp_number) return;

    const message = itemName
      ? `Olá! Vi seu catálogo "${catalog.name}" e gostaria de saber mais sobre: ${itemName}`
      : `Olá! Vi seu catálogo "${catalog.name}" e gostaria de saber mais!`;

    const url = `https://wa.me/${catalog.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleBannerClick = (banner: Banner) => {
    if (banner.link_url) {
      window.open(banner.link_url, "_blank");
    }
  };

  const priceTypeLabels: Record<string, string> = {
    fixed: "",
    hourly: "/hora",
    daily: "/dia",
    monthly: "/mês",
    quote: "",
  };

  // Group items by category - must be before early returns
  const allItemsForGrouping = useMemo(() => [
    ...products.map((p) => ({ ...p, type: "product" as const })),
    ...services.map((s) => ({ ...s, type: "service" as const })),
  ], [products, services]);

  const itemsByCategory = useMemo(() => {
    if (!catalog?.group_by_category) return null;

    const grouped: Record<string, typeof allItemsForGrouping> = {};
    const uncategorized: typeof allItemsForGrouping = [];

    allItemsForGrouping.forEach((item) => {
      const categoryId = item.category_id;
      if (categoryId) {
        if (!grouped[categoryId]) {
          grouped[categoryId] = [];
        }
        grouped[categoryId].push(item);
      } else {
        uncategorized.push(item);
      }
    });

    // Sort categories by order_index
    const sortedCategoryIds = categories
      .filter(c => grouped[c.id])
      .sort((a, b) => a.order_index - b.order_index)
      .map(c => c.id);

    return { grouped, sortedCategoryIds, uncategorized };
  }, [allItemsForGrouping, categories, catalog?.group_by_category]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !catalog) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Catálogo não encontrado</h1>
          <p className="text-muted-foreground">
            O catálogo que você procura não existe ou foi desativado.
          </p>
        </div>
      </div>
    );
  }

  const backgroundColor = catalog.background_color || "#ffffff";
  const textColor = catalog.text_color || "#1f2937";

  const allItems = [
    ...products.map((p) => ({ ...p, type: "product" as const })),
    ...services.map((s) => ({ ...s, type: "service" as const })),
  ];

  const filteredItems =
    activeTab === "all"
      ? allItems
      : activeTab === "products"
        ? products.map((p) => ({ ...p, type: "product" as const }))
        : services.map((s) => ({ ...s, type: "service" as const }));

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const renderItem = (item: any) => {
    const isProduct = item.type === "product";

    if (catalog.layout_style === "list") {
      return (
        <div
          key={item.id}
          className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
          style={{ borderColor: `${textColor}20` }}
        >
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold" style={{ color: textColor }}>
                  {item.name}
                </h3>
                {catalog.show_description && item.description && (
                  <p
                    className="text-sm line-clamp-2"
                    style={{ color: `${textColor}80` }}
                  >
                    {item.description}
                  </p>
                )}
              </div>
              <Badge
                variant="outline"
                className="flex-shrink-0"
                style={{ borderColor: catalog.primary_color, color: catalog.primary_color }}
              >
                {isProduct ? (
                  <Package className="w-3 h-3 mr-1" />
                ) : (
                  <Wrench className="w-3 h-3 mr-1" />
                )}
                {isProduct ? "Produto" : "Serviço"}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2">
              {catalog.show_prices && (
                <span
                  className="text-lg font-bold"
                  style={{ color: catalog.primary_color }}
                >
                  {item.price_type === "quote"
                    ? "Sob consulta"
                    : formatPrice(item.price)}
                  {!isProduct && priceTypeLabels[item.price_type]}
                </span>
              )}
              {!isProduct && item.duration_minutes && (
                <span
                  className="text-sm flex items-center gap-1"
                  style={{ color: `${textColor}80` }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {item.duration_minutes} min
                </span>
              )}
              {isProduct &&
                catalog.show_stock &&
                item.stock_quantity !== null && (
                  <span
                    className="text-sm flex items-center gap-1"
                    style={{ color: `${textColor}80` }}
                  >
                    <Box className="w-3.5 h-3.5" />
                    {item.stock_quantity} em estoque
                  </span>
                )}
            </div>
          </div>
          {catalog.whatsapp_number && (
            <div className="flex gap-2 flex-shrink-0 self-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addToCart({ ...item, type: isProduct ? "product" : "service" })}
                style={{ borderColor: catalog.primary_color, color: catalog.primary_color }}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleWhatsAppContact(item.name)}
                style={{ backgroundColor: catalog.primary_color }}
                className="text-white"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    // Grid or Cards layout
    const isCards = catalog.layout_style === "cards";

    return (
      <Card
        key={item.id}
        className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col"
        style={{ backgroundColor, borderColor: `${textColor}20` }}
      >
        {item.image_url && (
          <div className={isCards ? "h-40 flex-shrink-0" : "h-32 flex-shrink-0"}>
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardContent className="p-3 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3
              className="font-semibold text-sm line-clamp-2"
              style={{ color: textColor }}
            >
              {item.name}
            </h3>
            <Badge
              variant="outline"
              className="flex-shrink-0 text-[10px] px-1.5 py-0"
              style={{ borderColor: catalog.primary_color, color: catalog.primary_color }}
            >
              {isProduct ? "Produto" : "Serviço"}
            </Badge>
          </div>
          {catalog.show_description && item.description && (
            <p
              className="text-xs line-clamp-2 mb-2"
              style={{ color: `${textColor}80` }}
            >
              {item.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {!isProduct && item.duration_minutes && (
              <span
                className="text-[10px] flex items-center gap-0.5"
                style={{ color: `${textColor}80` }}
              >
                <Clock className="w-2.5 h-2.5" />
                {item.duration_minutes} min
              </span>
            )}
            {isProduct && catalog.show_stock && item.stock_quantity !== null && (
              <span
                className="text-[10px] flex items-center gap-0.5"
                style={{ color: `${textColor}80` }}
              >
                <Box className="w-2.5 h-2.5" />
                {item.stock_quantity} un
              </span>
            )}
          </div>
          <div className="mt-auto space-y-2">
            {catalog.show_prices && (
              <span
                className="font-bold text-base block"
                style={{ color: catalog.primary_color }}
              >
                {item.price_type === "quote"
                  ? "Sob consulta"
                  : formatPrice(item.price)}
                {!isProduct && priceTypeLabels[item.price_type]}
              </span>
            )}
            {catalog.whatsapp_number && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addToCart({ ...item, type: isProduct ? "product" : "service" })}
                  style={{ borderColor: catalog.primary_color, color: catalog.primary_color }}
                  className="flex-1 h-8 text-xs px-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleWhatsAppContact(item.name)}
                  style={{ backgroundColor: catalog.primary_color }}
                  className="text-white h-8 w-8 p-0"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Store closed overlay
  if (!catalog.store_open) {
    return (
      <>
        <Helmet>
          <title>{catalog.name} | Catálogo</title>
          <meta
            name="description"
            content={catalog.description || `Confira o catálogo ${catalog.name}`}
          />
        </Helmet>

        <div
          className="min-h-screen flex items-center justify-center"
          style={{ backgroundColor }}
        >
          <div className="text-center max-w-md mx-auto p-6">
            <Store
              className="w-20 h-20 mx-auto mb-6"
              style={{ color: catalog.primary_color }}
            />
            {catalog.logo_url && (
              <img
                src={catalog.logo_url}
                alt={catalog.name}
                className="w-24 h-24 mx-auto mb-4 rounded-full object-cover"
              />
            )}
            <h1 className="text-3xl font-bold mb-4" style={{ color: textColor }}>
              {catalog.name}
            </h1>
            <p className="text-lg mb-6" style={{ color: `${textColor}90` }}>
              {catalog.store_closed_message ||
                "Estamos fechados no momento. Volte em breve!"}
            </p>
            {catalog.whatsapp_number && (
              <Button
                onClick={() => handleWhatsAppContact()}
                size="lg"
                style={{ backgroundColor: catalog.primary_color }}
                className="text-white"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Fale Conosco
              </Button>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{catalog.name} | Catálogo</title>
        <meta
          name="description"
          content={catalog.description || `Confira o catálogo ${catalog.name}`}
        />
      </Helmet>

      <div className="min-h-screen" style={{ backgroundColor, color: textColor }}>
        {/* Banner Carousel */}
        {banners.length > 0 && (
          <div className="relative w-full h-48 md:h-64 lg:h-80 overflow-hidden">
            {banners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-500 cursor-pointer ${
                  index === currentBannerIndex ? "opacity-100" : "opacity-0"
                }`}
                onClick={() => handleBannerClick(banner)}
              >
                <img
                  src={banner.image_url}
                  alt={banner.title || "Banner"}
                  className="w-full h-full object-cover"
                />
                {(banner.title || banner.subtitle) && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white">
                      {banner.title && (
                        <h2 className="text-2xl md:text-4xl font-bold mb-2">
                          {banner.title}
                        </h2>
                      )}
                      {banner.subtitle && (
                        <p className="text-lg md:text-xl">{banner.subtitle}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {banners.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setCurrentBannerIndex(
                      (prev) => (prev - 1 + banners.length) % banners.length
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentBannerIndex
                          ? "bg-white"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Header */}
        <header
          className="relative"
          style={{
            background: catalog.cover_url || banners.length > 0
              ? undefined
              : `linear-gradient(135deg, ${catalog.primary_color} 0%, ${catalog.primary_color}dd 100%)`,
          }}
        >
          {catalog.cover_url && banners.length === 0 && (
            <div className="absolute inset-0">
              <img
                src={catalog.cover_url}
                alt=""
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ backgroundColor: `${catalog.primary_color}aa` }}
              />
            </div>
          )}
          <div
            className={`relative z-10 container mx-auto px-4 py-12 text-center ${
              catalog.cover_url || banners.length === 0 ? "text-white" : ""
            }`}
            style={
              !catalog.cover_url && banners.length > 0 ? { color: textColor } : {}
            }
          >
            {catalog.logo_url && (
              <img
                src={catalog.logo_url}
                alt={catalog.name}
                className="w-20 h-20 mx-auto mb-4 rounded-full object-cover border-4 border-white/30"
              />
            )}
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {catalog.name}
            </h1>
            {catalog.description && (
              <p className="text-lg opacity-90 max-w-2xl mx-auto">
                {catalog.description}
              </p>
            )}
            {catalog.whatsapp_number && (
              <Button
                onClick={() => handleWhatsAppContact()}
                className="mt-6"
                size="lg"
                variant="secondary"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Falar no WhatsApp
              </Button>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList
              className="grid w-full max-w-md mx-auto grid-cols-3"
              style={{ backgroundColor: `${textColor}10` }}
            >
              <TabsTrigger value="all">Todos ({allItems.length})</TabsTrigger>
              <TabsTrigger value="products">
                <Package className="w-4 h-4 mr-1" />
                Produtos ({products.length})
              </TabsTrigger>
              <TabsTrigger value="services">
                <Wrench className="w-4 h-4 mr-1" />
                Serviços ({services.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Items */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Package
                className="w-16 h-16 mx-auto mb-4"
                style={{ color: `${textColor}50` }}
              />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum item encontrado
              </h3>
              <p style={{ color: `${textColor}80` }}>
                {activeTab === "products"
                  ? "Não há produtos disponíveis no momento."
                  : activeTab === "services"
                    ? "Não há serviços disponíveis no momento."
                    : "Não há itens disponíveis no momento."}
              </p>
            </div>
          ) : catalog.group_by_category && itemsByCategory ? (
            /* Grouped by Category View */
            <div className="space-y-8">
              {itemsByCategory.sortedCategoryIds.map((categoryId) => {
                const category = getCategoryById(categoryId);
                const items = itemsByCategory.grouped[categoryId];
                if (!category || !items || items.length === 0) return null;

                const hasMany = items.length > 3;
                const displayItems = hasMany ? items.slice(0, 3) : items;

                return (
                  <div key={categoryId}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <h3
                          className="text-xl font-bold"
                          style={{ color: textColor }}
                        >
                          {category.name}
                        </h3>
                        <span
                          className="text-sm"
                          style={{ color: `${textColor}60` }}
                        >
                          ({items.length} {items.length === 1 ? "item" : "itens"})
                        </span>
                      </div>
                      {hasMany && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewAllCategory({ category, items })}
                          className="gap-1"
                          style={{ color: catalog.primary_color }}
                        >
                          Ver todos
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {catalog.layout_style === "list" ? (
                      <div className="space-y-3">{displayItems.map(renderItem)}</div>
                    ) : (
                      <div
                        className={`grid gap-4 ${
                          catalog.layout_style === "cards"
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                        }`}
                      >
                        {displayItems.map(renderItem)}
                        {hasMany && (
                          <div
                            className="flex items-center justify-center cursor-pointer rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50 min-h-[200px]"
                            style={{ borderColor: `${textColor}30` }}
                            onClick={() => setViewAllCategory({ category, items })}
                          >
                            <div className="text-center p-6">
                              <ArrowRight
                                className="w-8 h-8 mx-auto mb-2"
                                style={{ color: catalog.primary_color }}
                              />
                              <p
                                className="font-medium"
                                style={{ color: textColor }}
                              >
                                Ver todos
                              </p>
                              <p
                                className="text-sm"
                                style={{ color: `${textColor}60` }}
                              >
                                +{items.length - 3} itens
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Uncategorized items */}
              {itemsByCategory.uncategorized.length > 0 && (() => {
                const uncatItems = itemsByCategory.uncategorized;
                const hasMany = uncatItems.length > 3;
                const displayItems = hasMany ? uncatItems.slice(0, 3) : uncatItems;

                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-muted" />
                        <h3
                          className="text-xl font-bold"
                          style={{ color: textColor }}
                        >
                          Outros
                        </h3>
                        <span
                          className="text-sm"
                          style={{ color: `${textColor}60` }}
                        >
                          ({uncatItems.length} {uncatItems.length === 1 ? "item" : "itens"})
                        </span>
                      </div>
                      {hasMany && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewAllCategory({ category: null, items: uncatItems })}
                          className="gap-1"
                          style={{ color: catalog.primary_color }}
                        >
                          Ver todos
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {catalog.layout_style === "list" ? (
                      <div className="space-y-3">{displayItems.map(renderItem)}</div>
                    ) : (
                      <div
                        className={`grid gap-4 ${
                          catalog.layout_style === "cards"
                            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                        }`}
                      >
                        {displayItems.map(renderItem)}
                        {hasMany && (
                          <div
                            className="flex items-center justify-center cursor-pointer rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50 min-h-[200px]"
                            style={{ borderColor: `${textColor}30` }}
                            onClick={() => setViewAllCategory({ category: null, items: uncatItems })}
                          >
                            <div className="text-center p-6">
                              <ArrowRight
                                className="w-8 h-8 mx-auto mb-2"
                                style={{ color: catalog.primary_color }}
                              />
                              <p
                                className="font-medium"
                                style={{ color: textColor }}
                              >
                                Ver todos
                              </p>
                              <p
                                className="text-sm"
                                style={{ color: `${textColor}60` }}
                              >
                                +{uncatItems.length - 3} itens
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : catalog.layout_style === "list" ? (
            <div className="space-y-3">{filteredItems.map(renderItem)}</div>
          ) : (
            <div
              className={`grid gap-4 ${
                catalog.layout_style === "cards"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
              }`}
            >
              {filteredItems.map(renderItem)}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer
          className="py-6 text-center text-sm border-t"
          style={{ borderColor: `${textColor}20`, color: `${textColor}80` }}
        >
          <p>
            Catálogo criado com{" "}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: catalog.primary_color }}
            >
              Out App
            </a>
          </p>
        </footer>

        {/* View All Category Modal */}
        <Dialog
          open={!!viewAllCategory}
          onOpenChange={(open) => !open && setViewAllCategory(null)}
        >
          <DialogContent
            className="max-w-4xl h-[85vh] sm:h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6"
            style={{ backgroundColor, color: textColor }}
          >
            <DialogHeader className="flex-shrink-0 pb-4">
              <DialogTitle className="flex items-center gap-3">
                {viewAllCategory?.category && (
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: viewAllCategory.category.color }}
                  />
                )}
                <span className="truncate" style={{ color: textColor }}>
                  {viewAllCategory?.category?.name || "Outros"}
                </span>
                <Badge variant="secondary" className="flex-shrink-0">
                  {viewAllCategory?.items.length || 0} itens
                </Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {catalog.layout_style === "list" ? (
                <div className="space-y-3 pb-4 pr-2">
                  {viewAllCategory?.items.map(renderItem)}
                </div>
              ) : (
                <div className="grid gap-3 pb-4 pr-2 grid-cols-2 sm:grid-cols-2 md:grid-cols-3">
                  {viewAllCategory?.items.map(renderItem)}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Shopping Cart */}
        <CatalogCart
          items={cartItems}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          catalogName={catalog.name}
          whatsappNumber={catalog.whatsapp_number}
          primaryColor={catalog.primary_color}
          textColor={textColor}
          backgroundColor={backgroundColor}
          showPrices={catalog.show_prices}
        />
      </div>
    </>
  );
}
