import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, Loader2, Plug, PowerOff, RefreshCw } from "lucide-react";
import { STATUS_LABEL, waManage, type WaConnection } from "./types";

interface Setup {
  webhookUrl: string;
  verifyToken: string | null;
  evolution_base_url: string | null;
  evolution_instance: string | null;
  evolution_api_key_masked: string | null;
  meta_phone_number_id: string | null;
  meta_access_token_masked: string | null;
}

export function ConnectionSetup({ connection }: { connection: WaConnection }) {
  const { toast } = useToast();
  const [setup, setSetup] = useState<Setup | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const isEvo = connection.provider === "evolution";

  const load = () => waManage<Setup>({ action: "get_setup", connectionId: connection.id })
    .then((s) => { setSetup(s); setForm({ evolution_base_url: s.evolution_base_url ?? "", evolution_instance: s.evolution_instance ?? "", meta_phone_number_id: s.meta_phone_number_id ?? "" }); })
    .catch((e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }));
  useEffect(() => { load(); }, [connection.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll Evolution state while waiting for the QR scan.
  useEffect(() => {
    if (connection.status !== "qr_code") return;
    const t = setInterval(() => { waManage({ action: "refresh_status", connectionId: connection.id }).catch(() => undefined); }, 5000);
    return () => clearInterval(t);
  }, [connection.status, connection.id]);

  const run = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try { await fn(); if (ok) toast({ title: ok }); }
    catch (e) { toast({ title: "Erro", description: (e as Error).message, variant: "destructive" }); }
    finally { setBusy(null); }
  };
  const save = () => run("save", async () => { await waManage({ action: "save_credentials", connectionId: connection.id, ...form }); setForm((f) => ({ ...f, evolution_api_key: "", meta_access_token: "" })); await load(); }, "Dados salvos");
  const connect = () => run("connect", () => waManage({ action: "connect", connectionId: connection.id }));
  const disconnect = () => run("disconnect", () => waManage({ action: "disconnect", connectionId: connection.id }), "Desconectado");
  const copy = (v: string) => { navigator.clipboard.writeText(v); toast({ title: "Copiado" }); };
  const field = (k: string, label: string, placeholder: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} placeholder={placeholder} value={form[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{isEvo ? "Evolution API (QR Code)" : "API oficial da Meta"}</CardTitle>
          <CardDescription>{isEvo ? "Informe os dados do seu servidor Evolution API." : "Informe os dados do WhatsApp Business Cloud API."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEvo ? (<>
            {field("evolution_base_url", "Endereço do servidor", "https://evolution.seudominio.com")}
            {field("evolution_api_key", "Chave da API", setup?.evolution_api_key_masked ?? "Cole a chave global", "password")}
            {field("evolution_instance", "Nome da instância", "minha-loja")}
          </>) : (<>
            {field("meta_phone_number_id", "ID do número de telefone", "123456789012345")}
            {field("meta_access_token", "Token de acesso permanente", setup?.meta_access_token_masked ?? "EAAG...", "password")}
          </>)}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" onClick={save} disabled={!!busy}>{busy === "save" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar dados</Button>
            <Button onClick={connect} disabled={!!busy}>{busy === "connect" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plug className="mr-2 h-4 w-4" />}Conectar</Button>
            {connection.status !== "disconnected" && <Button variant="ghost" onClick={disconnect} disabled={!!busy}><PowerOff className="mr-2 h-4 w-4" />Desconectar</Button>}
          </div>
          {!isEvo && setup && (
            <div className="space-y-2 rounded-md border border-border bg-muted/40 p-3 text-xs">
              <p className="font-medium text-foreground">No painel da Meta (Webhooks), configure:</p>
              {[["URL de retorno", setup.webhookUrl], ["Token de verificação", setup.verifyToken ?? "Salve os dados para gerar"]].map(([l, v]) => (
                <div key={l} className="flex items-center gap-2">
                  <span className="shrink-0 text-muted-foreground">{l}:</span>
                  <code className="min-w-0 flex-1 truncate">{v}</code>
                  <Button size="icon" variant="ghost" className="h-6 w-6" aria-label={`Copiar ${l}`} onClick={() => copy(v)}><Copy className="h-3 w-3" /></Button>
                </div>
              ))}
              <p className="text-muted-foreground">Assine o campo <b>messages</b>.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Status</CardTitle>
          <Badge variant={connection.status === "connected" ? "default" : connection.status === "error" ? "destructive" : "secondary"}>{STATUS_LABEL[connection.status] ?? connection.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {connection.phone_number && <p>Número: <b>{connection.phone_number}</b></p>}
          {connection.last_error && <p className="text-destructive">{connection.last_error}</p>}
          {connection.status === "qr_code" && connection.qr_code && (
            <div className="flex flex-col items-center gap-2">
              <img src={connection.qr_code.startsWith("data:") ? connection.qr_code : `data:image/png;base64,${connection.qr_code}`} alt="QR Code do WhatsApp" className="h-56 w-56 rounded-md bg-card p-2" />
              <p className="text-center text-muted-foreground">Abra o WhatsApp › Aparelhos conectados › Conectar aparelho.</p>
              <Button size="sm" variant="outline" onClick={connect} disabled={!!busy}><RefreshCw className="mr-2 h-4 w-4" />Novo QR Code</Button>
            </div>
          )}
          {connection.status === "connected" && <p className="text-muted-foreground">Tudo pronto. As mensagens recebidas aparecem na aba Conversas.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
