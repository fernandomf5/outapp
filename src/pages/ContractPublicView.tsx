import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Lock, Download, CheckCircle2 } from "lucide-react";
import SignaturePadField from "@/components/contracts/SignaturePadField";
import jsPDF from "jspdf";
import { format } from "date-fns";

export default function ContractPublicView() {
  const { slug } = useParams();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accessCode, setAccessCode] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  useEffect(() => { load(); }, [slug]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("contracts").select("*").eq("public_slug", slug).maybeSingle();
    setContract(data);
    setLoading(false);
  }

  async function verify() {
    if (!contract) return;
    if (accessCode.trim().toUpperCase() !== contract.access_code.toUpperCase()) {
      return toast.error("Código inválido");
    }
    setAuthorized(true);
    setSignerName(contract.client_name || "");
    await supabase.from("contracts").update({ views_count: (contract.views_count || 0) + 1 }).eq("id", contract.id);
    await supabase.from("contract_history").insert({ contract_id: contract.id, event_type: "viewed", description: "Cliente visualizou o contrato" });
  }

  async function sign() {
    if (!signatureData) return toast.error("Faça ou digite sua assinatura");
    if (!signerName.trim()) return toast.error("Informe seu nome");
    setSigning(true);
    const { error } = await supabase.from("contracts").update({
      client_signature: signatureData,
      client_signer_name: signerName,
      client_signed_at: new Date().toISOString(),
      status: "signed_by_client",
    }).eq("id", contract.id);
    setSigning(false);
    if (error) return toast.error(error.message);
    await supabase.from("contract_history").insert({ contract_id: contract.id, event_type: "client_signed", description: `Cliente assinou (${signerName})` });
    toast.success("Assinatura registrada!");
    load();
  }

  function downloadPDF() {
    const c = contract;
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40; let y = 60;
    pdf.setFontSize(16); pdf.text(c.title, margin, y); y += 24;
    pdf.setFontSize(10);
    pdf.text(`Empresa: ${c.company_name || "-"}`, margin, y); y += 14;
    pdf.text(`Cliente: ${c.client_name || "-"}`, margin, y); y += 20;
    pdf.setFontSize(11);
    const lines = pdf.splitTextToSize(c.content || "", 515);
    lines.forEach((line: string) => { if (y > 760) { pdf.addPage(); y = 60; } pdf.text(line, margin, y); y += 14; });
    y += 20;
    if (c.client_signature) {
      if (y > 680) { pdf.addPage(); y = 60; }
      pdf.setFontSize(10); pdf.text("Assinatura do Cliente:", margin, y); y += 8;
      pdf.addImage(c.client_signature, "PNG", margin, y, 180, 60);
      pdf.text(`${c.client_signer_name || ""} - ${c.client_signed_at ? format(new Date(c.client_signed_at), "dd/MM/yyyy HH:mm") : ""}`, margin, y + 72);
      y += 90;
    }
    if (c.company_signature) {
      if (y > 680) { pdf.addPage(); y = 60; }
      pdf.text("Assinatura da Empresa:", margin, y); y += 8;
      pdf.addImage(c.company_signature, "PNG", margin, y, 180, 60);
      pdf.text(`${c.company_signer_name || ""} - ${c.company_signed_at ? format(new Date(c.company_signed_at), "dd/MM/yyyy HH:mm") : ""}`, margin, y + 72);
    }
    pdf.save(`${c.title || "contrato"}.pdf`);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!contract) return <div className="min-h-screen flex items-center justify-center">Contrato não encontrado</div>;

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
        <Card className="p-8 max-w-md w-full space-y-4">
          <div className="text-center space-y-2">
            <Lock className="h-12 w-12 mx-auto text-primary" />
            <h1 className="text-xl font-bold">{contract.title}</h1>
            <p className="text-sm text-muted-foreground">Insira o código de acesso fornecido para visualizar o contrato.</p>
          </div>
          <div>
            <Label>Código de Acesso</Label>
            <Input value={accessCode} onChange={e => setAccessCode(e.target.value)} className="font-mono" />
          </div>
          <Button onClick={verify} className="w-full">Acessar Contrato</Button>
        </Card>
      </div>
    );
  }

  const clientSigned = !!contract.client_signature;
  const completed = contract.status === "completed";

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <Card className="p-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">{contract.title}</h1>
            </div>
            {completed && <Button variant="outline" onClick={downloadPDF}><Download className="h-4 w-4 mr-2" />Baixar PDF</Button>}
          </div>
          <div className="text-sm text-muted-foreground space-y-1 border-b pb-3">
            <p><strong>Empresa:</strong> {contract.company_name || "-"}</p>
            <p><strong>Cliente:</strong> {contract.client_name || "-"}</p>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{contract.content}</div>

          {contract.client_signature && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-1">Assinatura do Cliente</p>
              <img src={contract.client_signature} alt="assinatura cliente" className="h-20 bg-white border rounded" />
              <p className="text-xs mt-1">{contract.client_signer_name} · {format(new Date(contract.client_signed_at), "dd/MM/yyyy HH:mm")}</p>
            </div>
          )}
          {contract.company_signature && (
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-1">Assinatura da Empresa</p>
              <img src={contract.company_signature} alt="assinatura empresa" className="h-20 bg-white border rounded" />
              <p className="text-xs mt-1">{contract.company_signer_name} · {format(new Date(contract.company_signed_at), "dd/MM/yyyy HH:mm")}</p>
            </div>
          )}
        </Card>

        {!clientSigned ? (
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Assinatura Digital</h2>
            <div><Label>Seu Nome Completo</Label><Input value={signerName} onChange={e => setSignerName(e.target.value)} /></div>
            <div>
              <Label>Sua Assinatura</Label>
              <SignaturePadField onChange={setSignatureData} defaultName={signerName} />
            </div>
            <Button onClick={sign} disabled={signing} className="w-full">{signing ? "Assinando..." : "Assinar Contrato"}</Button>
          </Card>
        ) : !completed ? (
          <Card className="p-6 text-center text-muted-foreground">
            Você assinou o contrato. Aguardando assinatura da empresa.
          </Card>
        ) : (
          <Card className="p-6 text-center text-green-600 font-medium flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> Contrato concluído por ambas as partes.
          </Card>
        )}
      </div>
    </div>
  );
}
