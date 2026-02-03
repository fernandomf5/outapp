import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import CatalogBannersManager from "./CatalogBannersManager";

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

  useEffect(() => {
    loadBannerCount();
  }, [catalog.id]);

  const loadBannerCount = async () => {
    const { count } = await supabase
      .from("catalog_banners" as any)
      .select("*", { count: "exact", head: true })
      .eq("catalog_id", catalog.id)
      .eq("is_active", true);

    setBannerCount(count || 0);
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
      <div className="flex items-center justify-between">
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
        <div className="flex items-center gap-2">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{catalog.views_count || 0}</p>
            <p className="text-xs text-muted-foreground">Visualizações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Image className="w-8 h-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{bannerCount}</p>
            <p className="text-xs text-muted-foreground">Banners Ativos</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {storeOpen ? (
                  <Store className="w-10 h-10 text-green-500" />
                ) : (
                  <StoreIcon className="w-10 h-10 text-red-500" />
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

      {/* Banners Manager */}
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
    </div>
  );
}
