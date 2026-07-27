import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QrCode, CreditCard, Save, Loader2, ShieldCheck } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { generatePixBRCode } from "@/lib/pix";

export interface CatalogPaymentSettings {
  enable_pix?: boolean;
  pix_key?: string;
  pix_receiver_name?: string;
  pix_city?: string;
  pix_instructions?: string;
  pix_whatsapp?: string;
  enable_mp?: boolean;
  mp_public_key?: string;
}

interface Props {
  catalogId: string;
}

export default function CatalogPaymentSettingsPanel({ catalogId }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CatalogPaymentSettings>({});
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [hasStoredToken, setHasStoredToken] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogId]);

  const load = async () => {
    setLoading(true);
    const { data: catalog } = await supabase
      .from("catalogs" as any)
      .select("payment_settings")
      .eq("id", catalogId)
      .maybeSingle();

    const { data: creds } = await supabase
      .from("catalog_payment_credentials" as any)
      .select("mp_access_token")
      .eq("catalog_id", catalogId)
      .maybeSingle();

    setSettings(((catalog as any)?.payment_settings as CatalogPaymentSettings) || {});
    setHasStoredToken(!!(creds as any)?.mp_access_token);
    setLoading(false);
  };

  const update = (patch: Partial<CatalogPaymentSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("catalogs" as any)
        .update({ payment_settings: settings })
        .eq("id", catalogId);
      if (error) throw error;

      if (mpAccessToken.trim() || settings.mp_public_key) {
        const payload: Record<string, any> = { catalog_id: catalogId };
        if (mpAccessToken.trim()) payload.mp_access_token = mpAccessToken.trim();
        if (settings.mp_public_key) payload.mp_public_key = settings.mp_public_key;
        const { error: credError } = await supabase
          .from("catalog_payment_credentials" as any)
          .upsert(payload, { onConflict: "catalog_id" });
        if (credError) throw credError;
        if (mpAccessToken.trim()) {
          setHasStoredToken(true);
          setMpAccessToken("");
        }
      }

      toast({ title: "Pagamentos salvos!", description: "As formas de pagamento foram atualizadas." });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const previewPix = settings.pix_key
    ? generatePixBRCode({
        pixKey: settings.pix_key,
        amount: 10,
        merchantName: settings.pix_receiver_name || "RECEBEDOR",
        merchantCity: settings.pix_city || "SAO PAULO",
        txid: "PREVIEW",
      })
    : "";

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            PIX Manual (QR Code)
            {settings.enable_pix && <Badge variant="secondary">Ativo</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">Aceitar PIX manual</p>
              <p className="text-xs text-muted-foreground">
                O cliente vê o QR Code na finalização e envia o comprovante.
              </p>
            </div>
            <Switch
              checked={!!settings.enable_pix}
              onCheckedChange={(v) => update({ enable_pix: v })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input
                value={settings.pix_key || ""}
                onChange={(e) => update({ pix_key: e.target.value })}
                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              />
            </div>
            <div className="space-y-2">
              <Label>Nome do recebedor</Label>
              <Input
                value={settings.pix_receiver_name || ""}
                onChange={(e) => update({ pix_receiver_name: e.target.value })}
                placeholder="Nome que aparece no app do banco"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade do recebedor</Label>
              <Input
                value={settings.pix_city || ""}
                onChange={(e) => update({ pix_city: e.target.value })}
                placeholder="SAO PAULO"
              />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp para comprovante</Label>
              <Input
                value={settings.pix_whatsapp || ""}
                onChange={(e) => update({ pix_whatsapp: e.target.value })}
                placeholder="5511999999999"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instruções mostradas ao cliente</Label>
            <Textarea
              rows={3}
              value={settings.pix_instructions || ""}
              onChange={(e) => update({ pix_instructions: e.target.value })}
              placeholder="Após o pagamento, envie o comprovante para confirmarmos seu pedido."
            />
          </div>

          {previewPix && (
            <div className="flex items-center gap-4 rounded-lg border p-4 bg-muted/30">
              <div className="bg-white p-2 rounded-lg">
                <QRCodeCanvas value={previewPix} size={92} />
              </div>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Pré-visualização (R$ 10,00)</p>
                <p>Confira no app do seu banco se a chave e o nome estão corretos.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Mercado Pago
            {settings.enable_mp && <Badge variant="secondary">Ativo</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">Aceitar cartão, boleto e PIX automático</p>
              <p className="text-xs text-muted-foreground">
                O pedido é marcado como pago automaticamente após a confirmação.
              </p>
            </div>
            <Switch
              checked={!!settings.enable_mp}
              onCheckedChange={(v) => update({ enable_mp: v })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Public Key</Label>
              <Input
                value={settings.mp_public_key || ""}
                onChange={(e) => update({ mp_public_key: e.target.value })}
                placeholder="APP_USR-..."
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Access Token
                {hasStoredToken && (
                  <span className="text-[10px] text-green-600 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> salvo com segurança
                  </span>
                )}
              </Label>
              <Input
                type="password"
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
                placeholder={hasStoredToken ? "•••••••• (deixe vazio para manter)" : "APP_USR-..."}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            O Access Token fica guardado em uma tabela privada e nunca é exposto no catálogo público.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar pagamentos
        </Button>
      </div>
    </div>
  );
}
