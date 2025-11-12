import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Key, Package, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DigitalProductsPanelProps {
  areaId: string;
}

export function DigitalProductsPanel({ areaId }: DigitalProductsPanelProps) {
  const [downloads, setDownloads] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [areaId]);

  const loadData = async () => {
    try {
      // Carregar downloads
      const { data: downloadsData } = await supabase
        .from('members_digital_downloads')
        .select('*')
        .eq('members_area_id', areaId)
        .order('created_at', { ascending: false });

      if (downloadsData) setDownloads(downloadsData);

      // Carregar licenças
      const { data: licensesData } = await supabase
        .from('members_product_licenses')
        .select('*')
        .eq('members_area_id', areaId)
        .order('created_at', { ascending: false });

      if (licensesData) setLicenses(licensesData);
    } catch (error: any) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const generateLicense = async (productId: string, userEmail: string) => {
    const licenseKey = `${productId.substring(0, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    try {
      const { error } = await supabase
        .from('members_product_licenses')
        .insert([{
          members_area_id: areaId,
          product_id: productId,
          user_email: userEmail,
          license_key: licenseKey,
          is_active: true
        }]);

      if (error) throw error;
      toast.success('Licença gerada com sucesso!');
      loadData();
    } catch (error: any) {
      toast.error('Erro ao gerar licença');
    }
  };

  const toggleLicenseStatus = async (licenseId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('members_product_licenses')
        .update({ is_active: !currentStatus })
        .eq('id', licenseId);

      if (error) throw error;
      toast.success(currentStatus ? 'Licença desativada' : 'Licença ativada');
      loadData();
    } catch (error) {
      toast.error('Erro ao atualizar licença');
    }
  };

  // Agrupar downloads por produto
  const downloadsByProduct = downloads.reduce((acc, download) => {
    if (!acc[download.product_id]) {
      acc[download.product_id] = {
        product_id: download.product_id,
        downloads: [],
        totalDownloads: 0,
        uniqueUsers: new Set()
      };
    }
    acc[download.product_id].downloads.push(download);
    acc[download.product_id].totalDownloads += download.download_count;
    acc[download.product_id].uniqueUsers.add(download.user_email);
    return acc;
  }, {} as any);

  const products = Object.values(downloadsByProduct) as any[];

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-sm text-muted-foreground">Produtos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {products.reduce((sum: number, p: any) => sum + p.totalDownloads, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Downloads Totais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{licenses.length}</div>
            <p className="text-sm text-muted-foreground">Licenças Ativas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="downloads" className="space-y-4">
        <TabsList>
          <TabsTrigger value="downloads">
            <Download className="w-4 h-4 mr-2" />
            Downloads
          </TabsTrigger>
          <TabsTrigger value="licenses">
            <Key className="w-4 h-4 mr-2" />
            Licenças
          </TabsTrigger>
        </TabsList>

        <TabsContent value="downloads" className="space-y-4">
          {products.map((product: any) => (
            <Card key={product.product_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Produto: {product.product_id}
                  </CardTitle>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{product.totalDownloads} downloads</span>
                    <span>{product.uniqueUsers.size} usuários</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {product.downloads.map((download: any) => (
                    <div key={download.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="w-6 h-6 text-primary" />
                        <div>
                          <div className="font-medium">{download.file_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {download.user_email} • Versão {download.version}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {download.download_count} downloads
                            {download.last_downloaded_at && (
                              <> • Último: {new Date(download.last_downloaded_at).toLocaleDateString('pt-BR')}</>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={download.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {products.length === 0 && (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                Nenhum download registrado ainda
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="licenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Licenças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {licenses.map((license) => (
                  <div key={license.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={license.is_active ? "default" : "secondary"}>
                            {license.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Produto: {license.product_id}
                          </span>
                        </div>
                        <div className="font-mono text-lg font-bold mb-2 tracking-wider">
                          {license.license_key}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Usuário: {license.user_email}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Criada em: {new Date(license.created_at).toLocaleDateString('pt-BR')}
                          {license.expires_at && (
                            <> • Expira em: {new Date(license.expires_at).toLocaleDateString('pt-BR')}</>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(license.license_key);
                            toast.success('Licença copiada!');
                          }}
                        >
                          Copiar
                        </Button>
                        <Button
                          variant={license.is_active ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleLicenseStatus(license.id, license.is_active)}
                        >
                          {license.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {licenses.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma licença gerada ainda
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}