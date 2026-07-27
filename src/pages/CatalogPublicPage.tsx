import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Helmet } from "react-helmet-async";
import {
  MessageCircle,
  Package,
  Wrench,
  Clock,
  Box,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Store,
  Plus,
  Eye,
} from "lucide-react";
import { CatalogCart, CartItem } from "@/components/catalog/CatalogCart";
import { ProductDetailModal } from "@/components/catalog/ProductDetailModal";
import { BannerCarousel } from "@/components/catalog/BannerCarousel";
import {
  StoreTopBar,
  StoreHeader,
  StoreNav,
  StoreCategoryStrip,
  StoreBenefits,
  StoreFooter,
} from "@/components/catalog/StoreChrome";
import { mergeCatalogLayout } from "@/components/catalog/catalogLayout";

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
  linked_registration_category_ids: string[] | null;
  views_count: number;
  group_by_category: boolean;
  category_order: string[] | null;
  head_code: string | null;
  footer_code: string | null;
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
  image_url?: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  description_html: string | null;
  product_type: string;
  category: string | null;
  category_id: string | null;
  price: number;
  stock_quantity: number | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  description_html: string | null;
  category: string | null;
  category_id: string | null;
  price: number;
  price_type: string;
  duration_minutes: number | null;
  image_url: string | null;
  gallery_urls: string[] | null;
  is_active: boolean;
}

export default function CatalogPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [menuPages, setMenuPages] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [viewAllCategory, setViewAllCategory] = useState<{ category: Category; items: any[] } | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

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

      // Load published catalog pages (menu)
      const { data: pagesData } = await supabase
        .from("catalog_pages" as any)
        .select("id, title, slug, show_in_menu")
        .eq("catalog_id", cat.id)
        .eq("is_published", true)
        .order("sort_order", { ascending: true });

      setMenuPages(
        ((pagesData as any[]) || [])
          .filter((p) => p.show_in_menu !== false)
          .map((p) => ({ id: p.id, title: p.title, slug: p.slug }))
      );

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

      const baseCategories: Category[] = (categoriesRes.data as any) || [];

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

      // Itens vindos da Gestão Livre (categorias vinculadas)
      const linkedIds = cat.linked_registration_category_ids || [];
      if (linkedIds.length > 0) {
        const [linkedCatsRes, linkedItemsRes] = await Promise.all([
          supabase
            .from("registration_categories" as any)
            .select("id,name,color,entity_kind,item_groups,item_group_images,sort_order")
            .in("id", linkedIds),
          supabase
            .from("contacts" as any)
            .select("*")
            .in("registration_category_id", linkedIds)
            .order("name"),
        ]);

        const linkedCats = ((linkedCatsRes.data as any) || []) as any[];
        const linkedItems = ((linkedItemsRes.data as any) || []) as any[];
        const catById = new Map(linkedCats.map((c) => [c.id, c]));

        let orderBase = baseCategories.length;
        const syntheticCategories: Category[] = [];
        const ensureCategory = (id: string, name: string, color: string, image_url?: string | null) => {
          const existing = syntheticCategories.find((c) => c.id === id);
          if (existing) {
            if (image_url && !existing.image_url) existing.image_url = image_url;
            return;
          }
          syntheticCategories.push({ id, name, color, order_index: orderBase++, image_url: image_url || null });
        };

        const groupImage = (c: any, group: string): string | null => {
          const imgs = c?.item_group_images;
          if (!group || !imgs || typeof imgs !== "object") return null;
          return typeof imgs[group] === "string" ? imgs[group] : null;
        };

        linkedCats.forEach((c) => {
          const groups: string[] = Array.isArray(c.item_groups) ? c.item_groups : [];
          groups.forEach((g) =>
            ensureCategory(`rc:${c.id}:${g}`, g, c.color || cat.primary_color, groupImage(c, g))
          );
        });


        const num = (v: any) => {
          const n = parseFloat(String(v ?? "").replace(",", "."));
          return Number.isFinite(n) ? n : 0;
        };

        linkedItems.forEach((item) => {
          const parent = catById.get(item.registration_category_id);
          if (!parent) return;
          const cf = item.custom_fields || {};
          const group = typeof cf.__group === "string" && cf.__group ? cf.__group : "";
          // Somente subcategorias (grupos) criadas na Gestão Livre viram categorias do catálogo
          const categoryId = group ? `rc:${parent.id}:${group}` : null;
          if (group) {
            ensureCategory(categoryId!, group, parent.color || cat.primary_color, groupImage(parent, group));
          }
          const isService = parent.entity_kind === "service";
          const mapped: any = {
            id: item.id,
            name: item.name,
            description: cf.description || item.notes || null,
            description_html: null,
            category: group || null,
            category_id: categoryId,

            price: num(isService ? cf.price : cf.sale_price ?? cf.price),
            image_url: item.avatar_url || null,
            gallery_urls: null,
            is_active: true,
          };
          if (isService) {
            filteredServices = [...filteredServices, { ...mapped, price_type: "fixed", duration_minutes: null }];
          } else {
            filteredProducts = [
              ...filteredProducts,
              { ...mapped, product_type: "physical", stock_quantity: cf.stock != null ? num(cf.stock) : null },
            ];
          }
        });

        // Todas as subcategorias criadas na Gestão Livre aparecem no catálogo,
        // mesmo que ainda não tenham produtos vinculados
        setCategories(syntheticCategories);


      } else {
        setCategories(baseCategories);
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

  // Inject footer code
  useEffect(() => {
    if (!catalog?.footer_code) return;

    const scriptContainer = document.createElement("div");
    scriptContainer.id = "catalog-footer-scripts";
    scriptContainer.innerHTML = catalog.footer_code;

    // Extract and execute scripts
    const scripts = scriptContainer.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      document.body.appendChild(newScript);
    });

    // Append non-script elements
    const nonScriptContent = catalog.footer_code.replace(/<script[\s\S]*?<\/script>/gi, "");
    if (nonScriptContent.trim()) {
      const container = document.createElement("div");
      container.id = "catalog-footer-content";
      container.innerHTML = nonScriptContent;
      document.body.appendChild(container);
    }

    return () => {
      // Cleanup on unmount
      document.querySelectorAll("#catalog-footer-scripts script").forEach((el) => el.remove());
      document.getElementById("catalog-footer-content")?.remove();
    };
  }, [catalog?.footer_code]);

  const handleWhatsAppContact = (itemName?: string) => {
    if (!catalog?.whatsapp_number) return;

    const message = itemName
      ? `Olá! Vi seu catálogo "${catalog.name}" e gostaria de saber mais sobre: ${itemName}`
      : `Olá! Vi seu catálogo "${catalog.name}" e gostaria de saber mais!`;

    const url = `https://wa.me/${catalog.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
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

  const layout = mergeCatalogLayout((catalog as any).layout_settings);

  const allItems = [
    ...products.map((p) => ({ ...p, type: "product" as const })),
    ...services.map((s) => ({ ...s, type: "service" as const })),
  ];

  const filteredItems = allItems;

  const getCategoryById = (id: string) => categories.find(c => c.id === id);

  const palette = { primary: catalog.primary_color, text: textColor, background: backgroundColor };


  const isFiltering = activeCategory !== "all" || search.trim().length > 0;
  const term = search.trim().toLowerCase();
  const visibleItems = filteredItems.filter((item: any) => {
    if (activeCategory !== "all" && item.category_id !== activeCategory) return false;
    if (!term) return true;
    return (
      String(item.name || "").toLowerCase().includes(term) ||
      String(item.description || "").toLowerCase().includes(term) ||
      String(item.category || "").toLowerCase().includes(term)
    );
  });

  const renderItem = (item: any) => {
    const isProduct = item.type === "product";

    if (catalog.layout_style === "list") {
      return (
        <div
          key={item.id}
          className="flex gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:shadow-md transition-shadow"
          style={{ borderColor: `${textColor}20` }}
        >
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
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
          <div className="flex flex-wrap gap-2 flex-shrink-0 self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedItem(item)}
              style={{ 
                borderColor: catalog.primary_color, 
                color: catalog.primary_color 
              }}
              className="text-xs"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Detalhes</span>
            </Button>
            <Button
              size="sm"
              onClick={() => addToCart({ ...item, type: isProduct ? "product" : "service" })}
              style={{ backgroundColor: catalog.primary_color }}
              className="text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              <span className="hidden sm:inline">Adicionar</span>
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
        className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col cursor-pointer group"
        style={{ backgroundColor, borderColor: `${textColor}20` }}
        onClick={() => setSelectedItem(item)}
      >
        {item.image_url && (
          <div className={`${isCards ? "h-40" : "h-32"} flex-shrink-0 relative overflow-hidden`}>
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium flex items-center gap-1">
                <Eye className="w-4 h-4" />
                Ver Detalhes
              </span>
            </div>
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
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItem(item);
                }}
                style={{ 
                  borderColor: catalog.primary_color, 
                  color: catalog.primary_color 
                }}
                className="flex-1 h-8 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Detalhes
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart({ ...item, type: isProduct ? "product" : "service" });
                }}
                style={{ backgroundColor: catalog.primary_color }}
                className="text-white flex-1 h-8 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Adicionar
              </Button>
            </div>
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
          {catalog.head_code && (
            <script type="text/javascript">
              {`(function() { 
                var div = document.createElement('div');
                div.innerHTML = ${JSON.stringify(catalog.head_code)};
                var scripts = div.querySelectorAll('script');
                scripts.forEach(function(s) {
                  var ns = document.createElement('script');
                  Array.from(s.attributes).forEach(function(a) { ns.setAttribute(a.name, a.value); });
                  ns.textContent = s.textContent;
                  document.head.appendChild(ns);
                });
              })();`}
            </script>
          )}
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
        {catalog.head_code && (
          <script type="text/javascript">
            {`(function() { 
              var div = document.createElement('div');
              div.innerHTML = ${JSON.stringify(catalog.head_code)};
              var scripts = div.querySelectorAll('script');
              scripts.forEach(function(s) {
                var ns = document.createElement('script');
                Array.from(s.attributes).forEach(function(a) { ns.setAttribute(a.name, a.value); });
                ns.textContent = s.textContent;
                document.head.appendChild(ns);
              });
            })();`}
          </script>
        )}
      </Helmet>

      <div className="min-h-screen" style={{ backgroundColor, color: textColor }}>
        <div id="topo" />
        <StoreTopBar palette={palette} hasWhatsApp={!!catalog.whatsapp_number} config={layout.topbar} />
        <StoreHeader
          palette={palette}
          name={catalog.name}
          description={catalog.description}
          logoUrl={catalog.logo_url}
          search={search}
          onSearch={setSearch}
          onWhatsApp={catalog.whatsapp_number ? () => handleWhatsAppContact() : undefined}
          config={layout.header}
        />
        <StoreNav
          palette={palette}
          categories={categories}
          active={activeCategory}
          onSelect={(id) => {
            setActiveCategory(id);
            setSearch("");
          }}
          config={layout.categories}
          pages={menuPages}
          catalogSlug={slug}
        />

        {/* Hero: apenas os banners cadastrados no Dashboard > Banners */}
        {layout.hero.enabled && banners.length > 0 && (
          <div className="container mx-auto px-3 sm:px-4 pt-5">
            <BannerCarousel banners={banners} primaryColor={catalog.primary_color} textColor={textColor} />
          </div>
        )}



        {/* Content */}
        <main className="container mx-auto px-3 sm:px-4 py-8">
          {activeCategory === "all" && !search && layout.categories.showStrip && (
            <StoreCategoryStrip
              palette={palette}
              categories={categories}
              onSelect={setActiveCategory}
              title={layout.categories.title}
            />
          )}


          {/* Items */}
          {visibleItems.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 mx-auto mb-4" style={{ color: `${textColor}50` }} />
              <h3 className="text-lg font-semibold mb-2">Nenhum item encontrado</h3>
              <p style={{ color: `${textColor}80` }}>
                {search ? `Nada encontrado para "${search}".` : "Não há itens disponíveis no momento."}
              </p>
            </div>
          ) : isFiltering || !catalog.group_by_category || !itemsByCategory ? (
            <>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {search
                    ? `Resultados para “${search}”`
                    : activeCategory !== "all"
                      ? getCategoryById(activeCategory)?.name || "Itens"
                      : "Todos os itens"}
                </h2>
                <span className="text-xs" style={{ color: `${textColor}80` }}>{visibleItems.length} itens</span>
              </div>
              {catalog.layout_style === "list" ? (
                <div className="space-y-3">{visibleItems.map(renderItem)}</div>
              ) : (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {visibleItems.map(renderItem)}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-10">
              {itemsByCategory.sortedCategoryIds.map((categoryId, idx) => {
                const category = getCategoryById(categoryId);
                const items = itemsByCategory.grouped[categoryId];
                if (!category || !items || items.length === 0) return null;
                const displayItems = items.slice(0, 5);
                const hasMore = items.length > 5;

                return (
                  <div key={categoryId}>
                    {idx === 2 && <StoreBenefits palette={palette} config={layout.benefits} />}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={`Imagem da categoria ${category.name}`}
                            loading="lazy"
                            className="w-10 h-10 rounded-lg object-cover"
                            style={{ border: `2px solid ${category.color}` }}
                          />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: category.color }} />
                        )}
                        <h2 className="text-xl font-bold">{category.name}</h2>
                      </div>
                      {hasMore && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveCategory(category.id)}
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
                      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                        {displayItems.map(renderItem)}
                      </div>
                    )}
                  </div>
                );
              })}

              {itemsByCategory.uncategorized.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4">Outros</h2>
                  {catalog.layout_style === "list" ? (
                    <div className="space-y-3">{itemsByCategory.uncategorized.map(renderItem)}</div>
                  ) : (
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                      {itemsByCategory.uncategorized.map(renderItem)}
                    </div>
                  )}
                </div>
              )}

              <StoreBenefits palette={palette} config={layout.benefits} />

            </div>
          )}
        </main>

        <StoreFooter
          palette={palette}
          name={catalog.name}
          description={catalog.description}
          logoUrl={catalog.logo_url}
          categories={categories}
          onSelect={setActiveCategory}
          onWhatsApp={catalog.whatsapp_number ? () => handleWhatsAppContact() : undefined}
          config={layout.footer}
        />



        {/* Shopping Cart */}
        <CatalogCart
          items={cartItems}
          onUpdateQuantity={updateCartQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={clearCart}
          catalogId={catalog.id}
          catalogName={catalog.name}
          whatsappNumber={catalog.whatsapp_number}
          primaryColor={catalog.primary_color}
          textColor={textColor}
          backgroundColor={backgroundColor}
          showPrices={catalog.show_prices}
          paymentConfig={(catalog as any).payment_settings || null}
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

        {/* Product Detail Modal */}
        <ProductDetailModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
          catalog={catalog}
          formatPrice={formatPrice}
        />
      </div>
    </>
  );
}
