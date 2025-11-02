import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Trash2, Monitor } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const AdminSecurityPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [trustedDevices, setTrustedDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecuritySettings();
  }, [user]);

  const loadSecuritySettings = async () => {
    if (!user) return;

    try {
      // Load 2FA settings
      const { data: twoFAData } = await supabase
        .from('user_2fa_settings')
        .select('is_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (twoFAData) {
        setIs2FAEnabled(twoFAData.is_enabled);
      }

      // Load trusted devices
      const { data: devices } = await supabase
        .from('user_trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .order('last_used_at', { ascending: false });

      if (devices) {
        setTrustedDevices(devices);
      }
    } catch (error: any) {
      console.error('Error loading security settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handle2FAToggle = async (enabled: boolean) => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('user_2fa_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_2fa_settings')
          .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('user_2fa_settings')
          .insert({ user_id: user.id, is_enabled: enabled });
      }

      setIs2FAEnabled(enabled);

      toast({
        title: enabled ? "2FA Ativado! 🔒" : "2FA Desativado",
        description: enabled
          ? "Você receberá um código por email ao fazer login de novos dispositivos."
          : "A verificação de duas etapas foi desativada.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await supabase
        .from('user_trusted_devices')
        .delete()
        .eq('id', deviceId);

      setTrustedDevices(trustedDevices.filter((d) => d.id !== deviceId));

      toast({
        title: "Dispositivo removido",
        description: "Este dispositivo não é mais confiável.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-3 rounded-xl shadow-glow">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
              Segurança da Conta
            </h2>
            <p className="text-sm text-muted-foreground">
              Proteja sua conta master com autenticação de duas etapas
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 2FA Toggle */}
          <div className="p-4 bg-gradient-to-br from-background to-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Autenticação de Duas Etapas (2FA)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Receba um código de verificação por email ao fazer login de novos dispositivos
                </p>
              </div>
              <Switch checked={is2FAEnabled} onCheckedChange={handle2FAToggle} />
            </div>
          </div>

          {/* Information Card */}
          {is2FAEnabled && (
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Como funciona
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Código enviado por email a cada novo login</li>
                <li>• Dispositivos conhecidos são confiáveis por 30 dias</li>
                <li>• Você pode remover dispositivos confiáveis a qualquer momento</li>
              </ul>
            </div>
          )}

          {/* Trusted Devices */}
          {is2FAEnabled && trustedDevices.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Dispositivos Confiáveis ({trustedDevices.length})
              </h4>
              <div className="space-y-2">
                {trustedDevices.map((device) => (
                  <Card key={device.id} className="p-4 bg-background border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{device.device_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Último acesso:{" "}
                          {format(new Date(device.last_used_at || device.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expira em:{" "}
                          {format(new Date(device.expires_at), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDevice(device.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
