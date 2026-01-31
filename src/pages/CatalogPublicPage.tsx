import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

interface Catalog {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string;
  whatsapp_number: string | null;
  show_prices: boolean;
  show_stock: boolean;
  show_description: boolean;
  layout_style: string;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  product_type: string;
  category: string | null;
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
  price: number;
  price_type: string;
  duration_minutes: number | null;
  image_url: string | null;
  is_active: boolean;
}

export default function CatalogPublicPage() {
  const { slug } = useParams<{ slug: string }>();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

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

      setCatalog(catalogData as any);

      // Increment views
      await supabase
        .from("catalogs" as any)
        .update({ views_count: ((catalogData as any).views_count || 0) + 1 })
        .eq("id", (catalogData as any).id);

      // Load products and services
      const [productsRes, servicesRes] = await Promise.all([
        supabase
          .from("products" as any)
          .select("*")
          .eq("user_id", (catalogData as any).user_id)
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("user_services" as any)
          .select("*")
          .eq("user_id", (catalogData as any).user_id)
          .eq("is_active", true)
          .order("name"),
      ]);

      setProducts((productsRes.data as any) || []);
      setServices((servicesRes.data as any) || []);
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

  const priceTypeLabels: Record<string, string> = {
    fixed: "",
    hourly: "/hora",
    daily: "/dia",
    monthly: "/mês",
    quote: "",
  };

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

  const renderItem = (item: any) => {
    const isProduct = item.type === "product";

    if (catalog.layout_style === "list") {
      return (
        <div
          key={item.id}
          className="flex gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow"
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
                <h3 className="font-semibold">{item.name}</h3>
                {catalog.show_description && item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="flex-shrink-0">
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
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {item.duration_minutes} min
                </span>
              )}
              {isProduct &&
                catalog.show_stock &&
                item.stock_quantity !== null && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Box className="w-3.5 h-3.5" />
                    {item.stock_quantity} em estoque
                  </span>
                )}
            </div>
          </div>
          {catalog.whatsapp_number && (
            <Button
              size="sm"
              onClick={() => handleWhatsAppContact(item.name)}
              style={{ backgroundColor: catalog.primary_color }}
              className="flex-shrink-0 self-center"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      );
    }

    // Grid or Cards layout
    const isCards = catalog.layout_style === "cards";

    return (
      <Card
        key={item.id}
        className="overflow-hidden hover:shadow-lg transition-shadow"
      >
        {item.image_url && (
          <div className={isCards ? "h-48" : "h-40"}>
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`font-semibold ${isCards ? "text-lg" : ""}`}>
              {item.name}
            </h3>
            <Badge variant="outline" className="flex-shrink-0 text-xs">
              {isProduct ? "Produto" : "Serviço"}
            </Badge>
          </div>
          {catalog.show_description && item.description && (
            <p
              className={`text-muted-foreground mb-3 ${isCards ? "line-clamp-3" : "text-sm line-clamp-2"}`}
            >
              {item.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {!isProduct && item.duration_minutes && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.duration_minutes} min
              </span>
            )}
            {isProduct && catalog.show_stock && item.stock_quantity !== null && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Box className="w-3 h-3" />
                {item.stock_quantity} un
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            {catalog.show_prices && (
              <span
                className={`font-bold ${isCards ? "text-xl" : "text-lg"}`}
                style={{ color: catalog.primary_color }}
              >
                {item.price_type === "quote"
                  ? "Sob consulta"
                  : formatPrice(item.price)}
                {!isProduct && priceTypeLabels[item.price_type]}
              </span>
            )}
            {catalog.whatsapp_number && (
              <Button
                size="sm"
                onClick={() => handleWhatsAppContact(item.name)}
                style={{ backgroundColor: catalog.primary_color }}
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                Contato
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Helmet>
        <title>{catalog.name} | Catálogo</title>
        <meta
          name="description"
          content={catalog.description || `Confira o catálogo ${catalog.name}`}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header
          className="relative"
          style={{
            background: catalog.cover_url
              ? undefined
              : `linear-gradient(135deg, ${catalog.primary_color} 0%, ${catalog.primary_color}dd 100%)`,
          }}
        >
          {catalog.cover_url && (
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
          <div className="relative z-10 container mx-auto px-4 py-12 text-center text-white">
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
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
              <TabsTrigger value="all">
                Todos ({allItems.length})
              </TabsTrigger>
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
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhum item encontrado
              </h3>
              <p className="text-muted-foreground">
                {activeTab === "products"
                  ? "Não há produtos disponíveis no momento."
                  : activeTab === "services"
                    ? "Não há serviços disponíveis no momento."
                    : "Não há itens disponíveis no momento."}
              </p>
            </div>
          ) : catalog.layout_style === "list" ? (
            <div className="space-y-3">{filteredItems.map(renderItem)}</div>
          ) : (
            <div
              className={`grid gap-4 ${
                catalog.layout_style === "cards"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              }`}
            >
              {filteredItems.map(renderItem)}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t">
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
      </div>
    </>
  );
}
