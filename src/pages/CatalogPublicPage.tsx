import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Helmet } from "react-helmet-async";
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
  Plus,
  X,
} from "lucide-react";
import { CatalogCart, CartItem } from "@/components/catalog/CatalogCart";
import { toast } from "sonner";

// Horizontal scroll component with arrows and drag
const HorizontalScrollRow = ({ 
  children, 
  primaryColor 
}: { 
  children: React.ReactNode; 
  primaryColor: string;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    if (ref) {
      ref.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        ref.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [children]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = 'grab';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (scrollRef.current) {
        scrollRef.current.style.cursor = 'grab';
      }
    }
  };

  return (
    <div className="relative group">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          style={{ color: primaryColor }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      
      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-2 scrollbar-hide cursor-grab select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex gap-4">
          {children}
        </div>
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          style={{ color: primaryColor }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [viewAllCategory, setViewAllCategory] = useState<{ category: Category; items: any[] } | null>(null);

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
          <div className="flex gap-2 flex-shrink-0 self-center">
            <Button
              size="sm"
              onClick={() => addToCart({ ...item, type: isProduct ? "product" : "service" })}
              style={{ backgroundColor: catalog.primary_color }}
              className="text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </div>
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
            <Button
              size="sm"
              onClick={() => addToCart({ ...item, type: isProduct ? "product" : "service" })}
              style={{ backgroundColor: catalog.primary_color }}
              className="text-white w-full h-8 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Adicionar
            </Button>
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

                const displayItems = items.slice(0, 6);
                const hasMore = items.length > 6;

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
                        <span className="text-sm" style={{ color: `${textColor}60` }}>
                          ({items.length} {items.length === 1 ? "item" : "itens"})
                        </span>
                      </div>
                      {hasMore && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewAllCategory({ category, items })}
                          style={{ color: catalog.primary_color }}
                          className="text-sm hover:underline"
                        >
                          Ver todos
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>

                    {catalog.layout_style === "list" ? (
                      <div className="space-y-3">{displayItems.map(renderItem)}</div>
                    ) : (
                      <HorizontalScrollRow primaryColor={catalog.primary_color}>
                        {displayItems.map((item) => (
                          <div 
                            key={item.id} 
                            className="shrink-0 w-[calc(100%-0px)] sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]"
                          >
                            {renderItem(item)}
                          </div>
                        ))}
                      </HorizontalScrollRow>
                    )}
                  </div>
                );
              })}
              
              {/* Uncategorized items */}
              {itemsByCategory.uncategorized.length > 0 && (() => {
                const uncatItems = itemsByCategory.uncategorized;
                const displayItems = uncatItems.slice(0, 6);
                const hasMore = uncatItems.length > 6;

                return (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-muted" />
                        <h3 className="text-xl font-bold" style={{ color: textColor }}>
                          Outros
                        </h3>
                        <span className="text-sm" style={{ color: `${textColor}60` }}>
                          ({uncatItems.length} {uncatItems.length === 1 ? "item" : "itens"})
                        </span>
                      </div>
                      {hasMore && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewAllCategory({ 
                            category: { id: 'uncategorized', name: 'Outros', color: '#9ca3af', order_index: 999 }, 
                            items: uncatItems 
                          })}
                          style={{ color: catalog.primary_color }}
                          className="text-sm hover:underline"
                        >
                          Ver todos
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>

                    {catalog.layout_style === "list" ? (
                      <div className="space-y-3">{displayItems.map(renderItem)}</div>
                    ) : (
                      <HorizontalScrollRow primaryColor={catalog.primary_color}>
                        {displayItems.map((item) => (
                          <div 
                            key={item.id} 
                            className="shrink-0 w-[calc(100%-0px)] sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]"
                          >
                            {renderItem(item)}
                          </div>
                        ))}
                      </HorizontalScrollRow>
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

        {/* View All Category Dialog */}
        <Dialog open={!!viewAllCategory} onOpenChange={() => setViewAllCategory(null)}>
          <DialogContent 
            className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            style={{ backgroundColor, color: textColor }}
          >
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: viewAllCategory?.category.color }}
                />
                {viewAllCategory?.category.name}
                <span className="text-sm font-normal" style={{ color: `${textColor}60` }}>
                  ({viewAllCategory?.items.length} {viewAllCategory?.items.length === 1 ? "item" : "itens"})
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <div
                className={`grid gap-4 ${
                  catalog.layout_style === "cards"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : catalog.layout_style === "list"
                      ? "grid-cols-1"
                      : "grid-cols-2 sm:grid-cols-3"
                }`}
              >
                {viewAllCategory?.items.map(renderItem)}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
