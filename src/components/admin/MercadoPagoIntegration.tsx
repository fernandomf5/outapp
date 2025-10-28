import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, CheckCircle2, AlertCircle } from "lucide-react";

export const MercadoPagoIntegration = () => {
  const { toast } = useToast();
  const [accessToken, setAccessToken] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoadingData(true);
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['mercadopago_access_token', 'mercadopago_public_key']);

      if (data) {
        data.forEach(item => {
          if (item.key === 'mercadopago_access_token' && item.value) {
            setAccessToken(item.value);
            setIsConnected(true);
          }
          if (item.key === 'mercadopago_public_key' && item.value) {
            setPublicKey(item.value);
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSave = async () => {
    if (!accessToken.trim() || !publicKey.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Salvar Access Token
      await supabase
        .from('site_settings')
        .upsert({
          key: 'mercadopago_access_token',
          value: accessToken.trim(),
        });

      // Salvar Public Key
      await supabase
        .from('site_settings')
        .upsert({
          key: 'mercadopago_public_key',
          value: publicKey.trim(),
        });

      setIsConnected(true);
      toast({
        title: "Mercado Pago configurado! 💳",
        description: "Suas credenciais foram salvas com sucesso. Os pagamentos já estão funcionando nos planos.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await supabase
        .from('site_settings')
        .delete()
        .in('key', ['mercadopago_access_token', 'mercadopago_public_key']);

      setAccessToken("");
      setPublicKey("");
      setIsConnected(false);
      toast({
        title: "Mercado Pago desconectado",
        description: "As credenciais foram removidas.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando configurações...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-3 rounded-xl">
            <DollarSign className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle>Integração Mercado Pago</CardTitle>
            <CardDescription>
              Configure suas credenciais para receber pagamentos automaticamente nos planos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isConnected && (
          <div className="flex items-center gap-2 p-4 bg-success/10 text-success rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Mercado Pago conectado e funcionando!</span>
          </div>
        )}

        {!isConnected && (
          <div className="flex items-start gap-2 p-4 bg-warning/10 text-warning rounded-lg">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-medium">Mercado Pago não configurado</p>
              <p className="text-sm">Adicione suas credenciais abaixo para começar a receber pagamentos</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="accessToken">Access Token *</Label>
            <Input
              id="accessToken"
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="APP_USR-..."
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Encontre em: Mercado Pago → Seu negócio → Credenciais → Access Token de produção
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="publicKey">Public Key *</Label>
            <Input
              id="publicKey"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="APP_USR-..."
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Encontre em: Mercado Pago → Seu negócio → Credenciais → Public Key de produção
            </p>
          </div>
        </div>

        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
          <h4 className="font-semibold mb-2 text-sm">📋 Como funciona:</h4>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Configure suas credenciais do Mercado Pago aqui</li>
            <li>Os usuários verão a opção de pagamento ao escolher um plano</li>
            <li>Os pagamentos serão processados automaticamente</li>
            <li>As assinaturas serão ativadas após confirmação do pagamento</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Salvando..." : "Salvar Configurações"}
          </Button>
          {isConnected && (
            <Button
              onClick={handleDisconnect}
              disabled={loading}
              variant="destructive"
            >
              Desconectar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};