import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Save, Eye, EyeOff } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface PaymentIntegration {
  id: string;
  platform: string;
  is_active: boolean;
  api_key: string | null;
  api_secret: string | null;
  webhook_url: string | null;
}

const PLATFORMS = [
  { id: "hotmart", name: "Hotmart", icon: "🔥" },
  { id: "braip", name: "Braip", icon: "💰" },
  { id: "monetizze", name: "Monetizze", icon: "💵" },
  { id: "mercadopago", name: "Mercado Pago", icon: "💳" },
  { id: "pagseguro", name: "PagSeguro", icon: "🔐" },
  { id: "stripe", name: "Stripe", icon: "💸" },
];

export const PaymentIntegrationsManager = () => {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<PaymentIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_integrations')
      .select('*')
      .order('platform');

    if (!error && data) {
      setIntegrations(data);
    }
    setLoading(false);
  };

  const handleSaveIntegration = async (platform: string, formData: Partial<PaymentIntegration>) => {
    const existingIntegration = integrations.find(i => i.platform === platform);

    if (existingIntegration) {
      const { error } = await supabase
        .from('payment_integrations')
        .update(formData)
        .eq('id', existingIntegration.id);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Integração atualizada",
          description: `${platform} foi atualizada com sucesso.`,
        });
        fetchIntegrations();
      }
    } else {
      const { error } = await supabase
        .from('payment_integrations')
        .insert([{ platform, ...formData }]);

      if (error) {
        toast({
          title: "Erro ao criar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Integração criada",
          description: `${platform} foi configurada com sucesso.`,
        });
        fetchIntegrations();
      }
    }
  };

  const toggleShowSecret = (platform: string) => {
    setShowSecrets(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const IntegrationForm = ({ platform }: { platform: { id: string; name: string; icon: string } }) => {
    const existingIntegration = integrations.find(i => i.platform === platform.id);
    const [isActive, setIsActive] = useState(existingIntegration?.is_active || false);
    const [apiKey, setApiKey] = useState(existingIntegration?.api_key || "");
    const [apiSecret, setApiSecret] = useState(existingIntegration?.api_secret || "");
    const [webhookUrl, setWebhookUrl] = useState(existingIntegration?.webhook_url || "");

    useEffect(() => {
      if (existingIntegration) {
        setIsActive(existingIntegration.is_active);
        setApiKey(existingIntegration.api_key || "");
        setApiSecret(existingIntegration.api_secret || "");
        setWebhookUrl(existingIntegration.webhook_url || "");
      }
    }, [existingIntegration]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSaveIntegration(platform.id, {
        is_active: isActive,
        api_key: apiKey,
        api_secret: apiSecret,
        webhook_url: webhookUrl,
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${platform.id}-active`} className="text-base">
            Ativar integração
          </Label>
          <Switch
            id={`${platform.id}-active`}
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${platform.id}-api-key`}>API Key / Token</Label>
          <div className="relative">
            <Input
              id={`${platform.id}-api-key`}
              type={showSecrets[platform.id] ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole aqui sua API Key"
              disabled={!isActive}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full"
              onClick={() => toggleShowSecret(platform.id)}
            >
              {showSecrets[platform.id] ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${platform.id}-api-secret`}>API Secret (opcional)</Label>
          <div className="relative">
            <Input
              id={`${platform.id}-api-secret`}
              type={showSecrets[platform.id] ? "text" : "password"}
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Cole aqui seu API Secret"
              disabled={!isActive}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${platform.id}-webhook`}>Webhook URL</Label>
          <Input
            id={`${platform.id}-webhook`}
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            disabled={!isActive}
          />
        </div>

        <Button type="submit" disabled={!isActive} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </form>
    );
  };

  return (
    <Card className="p-6 glass">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/10 p-3 rounded-xl">
          <CreditCard className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Integrações de Pagamento</h2>
          <p className="text-sm text-muted-foreground">
            Configure suas plataformas de afiliados e pagamento
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Carregando...</p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {PLATFORMS.map((platform) => (
            <AccordionItem key={platform.id} value={platform.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.icon}</span>
                  <span className="font-semibold">{platform.name}</span>
                  {integrations.find(i => i.platform === platform.id && i.is_active) && (
                    <span className="ml-2 px-2 py-1 text-xs bg-success/10 text-success rounded-full">
                      Ativa
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <IntegrationForm platform={platform} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Card>
  );
};
