import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save } from "lucide-react";

interface PaymentIntegration {
  id: string;
  platform: string;
  is_active: boolean;
  api_key: string | null;
  api_secret: string | null;
  webhook_url: string | null;
}

export const MercadoPagoSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // @ts-ignore - Temporary fix for type instantiation issue
      const { data, error } = await supabase
        .from('payment_integrations')
        .select('id, platform, is_active, api_key, api_secret, webhook_url')
        .eq('platform', 'mercadopago')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const integration = data as PaymentIntegration;
        setIsActive(integration.is_active);
        setAccessToken(integration.api_key || "");
        setPublicKey(integration.api_secret || "");
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const webhookUrl = `${window.location.origin}/functions/v1/mercadopago-webhook`;

      const { error } = await supabase
        .from('payment_integrations')
        .upsert({
          user_id: user.id,
          platform: 'mercadopago',
          is_active: isActive,
          api_key: accessToken,
          api_secret: publicKey,
          webhook_url: webhookUrl,
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configurações do Mercado Pago salvas com sucesso",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mercado Pago</CardTitle>
        <CardDescription>
          Configure suas credenciais do Mercado Pago para processar pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Ativar Mercado Pago</Label>
            <div className="text-sm text-muted-foreground">
              Habilitar pagamentos via Mercado Pago
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="accessToken">Access Token</Label>
          <Input
            id="accessToken"
            type="password"
            placeholder="APP_USR-..."
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Seu Access Token do Mercado Pago (encontre em Suas integrações)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="publicKey">Public Key</Label>
          <Input
            id="publicKey"
            type="text"
            placeholder="APP_USR-..."
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Sua Public Key do Mercado Pago
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium">URL do Webhook</p>
          <code className="text-xs block bg-background p-2 rounded">
            {window.location.origin}/functions/v1/mercadopago-webhook
          </code>
          <p className="text-xs text-muted-foreground">
            Configure esta URL no painel do Mercado Pago em "Webhooks"
          </p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full sm:w-auto"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Configurações
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
