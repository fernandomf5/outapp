import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Store,
  StoreIcon,
  Image,
  Eye,
  Copy,
  ExternalLink,
  Settings,
  ArrowLeft,
  ShoppingBag,
  Users,
} from "lucide-react";
import CatalogBannersManager from "./CatalogBannersManager";
import CatalogOrdersPanel from "./CatalogOrdersPanel";
import CatalogCustomersPanel from "./CatalogCustomersPanel";

interface Catalog {
  id: string;
  name: string;
  slug: string;
  store_open: boolean;
  store_closed_message: string | null;
  views_count: number;
}

interface CatalogDashboardProps {
  catalog: Catalog;
  userId: string;
  onBack: () => void;
  onEdit: () => void;
}

export default function CatalogDashboard({
  catalog,
  userId,
  onBack,
  onEdit,
}: CatalogDashboardProps) {
  const { toast } = useToast();
  const [storeOpen, setStoreOpen] = useState(catalog.store_open);
  const [updating, setUpdating] = useState(false);
  const [bannerCount, setBannerCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);

  useEffect(() => {
    loadCounts();
  }, [catalog.id]);

  const loadCounts = async () => {
    const [banners, orders, customers] = await Promise.all([
      supabase
        .from("catalog_banners" as any)
        .select("*", { count: "exact", head: true })
        .eq("catalog_id", catalog.id)
        .eq("is_active", true),
      supabase
        .from("catalog_orders" as any)
        .select("*", { count: "exact", head: true })
        .eq("catalog_id", catalog.id),
      supabase
        .from("catalog_customers" as any)
        .select("*", { count: "exact", head: true })
        .eq("catalog_id", catalog.id),
    ]);

    setBannerCount(banners.count || 0);
    setOrdersCount(orders.count || 0);
    setCustomersCount(customers.count || 0);
  };

  const handleToggleStore = async (open: boolean) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("catalogs" as any)
        .update({ store_open: open })
        .eq("id", catalog.id);

      if (error) throw error;

      setStoreOpen(open);
      toast({
        title: open ? "Loja aberta!" : "Loja fechada!",
        description: open
          ? "Seus clientes podem ver e solicitar produtos."
          : "O catálogo mostrará uma mensagem de loja fechada.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getCatalogUrl = () => {
    return `${window.location.origin}/catalogo/${catalog.slug}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getCatalogUrl());
    toast({ title: "Link copiado!" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{catalog.name}</h2>
            <p className="text-sm text-muted-foreground">
              Dashboard do Catálogo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-1" />
            Copiar Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getCatalogUrl(), "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Ver Catálogo
          </Button>
          <Button size="sm" onClick={onEdit}>
            <Settings className="w-4 h-4 mr-1" />
            Editar
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-primary/70" />
            <p className="text-2xl font-bold">{catalog.views_count || 0}</p>
            <p className="text-xs text-muted-foreground">Visualizações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-primary/70" />
            <p className="text-2xl font-bold">{ordersCount}</p>
            <p className="text-xs text-muted-foreground">Pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto mb-2 text-primary/70" />
            <p className="text-2xl font-bold">{customersCount}</p>
            <p className="text-xs text-muted-foreground">Clientes</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {storeOpen ? (
                  <Store className="w-10 h-10 text-green-600 dark:text-green-500" />
                ) : (
                  <StoreIcon className="w-10 h-10 text-destructive" />
                )}
                <div>
                  <p className="font-semibold">
                    Loja {storeOpen ? "Aberta" : "Fechada"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {storeOpen
                      ? "Clientes podem ver produtos e fazer pedidos"
                      : "Catálogo mostra mensagem de fechado"}
                  </p>
                </div>
              </div>
              <Switch
                checked={storeOpen}
                onCheckedChange={handleToggleStore}
                disabled={updating}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Content */}
      <Tabs defaultValue="orders" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Pedidos</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="banners" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Banners</span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Pedidos Recebidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogOrdersPanel catalogId={catalog.id} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="customers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Clientes do Catálogo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogCustomersPanel catalogId={catalog.id} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="banners" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="w-5 h-5" />
                Gerenciar Banners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CatalogBannersManager catalogId={catalog.id} userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
