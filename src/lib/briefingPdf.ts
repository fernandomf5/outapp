import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";

export interface BriefingPdfField {
  id?: string;
  label: string;
  type?: string;
}

export interface BriefingPdfData {
  id: string;
  briefing_title?: string;
  visitor_name?: string;
  visitor_email?: string;
  visitor_phone?: string;
  visitor_company?: string;
  created_at: string;
  responses: Record<string, any>;
  briefing_fields?: BriefingPdfField[];
}

const formatAddress = (addr: any): string => {
  const parts: string[] = [];
  if (addr.logradouro) parts.push(addr.logradouro);
  if (addr.numero) parts.push(addr.numero);
  if (addr.complemento) parts.push(addr.complemento);
  if (addr.bairro) parts.push(addr.bairro);
  if (addr.cidade && addr.estado) parts.push(`${addr.cidade} - ${addr.estado}`);
  else if (addr.cidade) parts.push(addr.cidade);
  if (addr.cep) parts.push(`CEP: ${addr.cep}`);
  return parts.join(", ");
};

export const formatPdfValue = (value: any): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") {
    if ("cep" in value || "logradouro" in value || "cidade" in value) return formatAddress(value);
    return JSON.stringify(value);
  }
  return String(value);
};

const getEntries = (data: BriefingPdfData) => {
  if (data.briefing_fields && data.briefing_fields.length > 0) {
    return data.briefing_fields
      .map((f) => ({ key: f.label, value: data.responses?.[f.label] }))
      .filter((i) => i.value !== undefined);
  }
  return Object.entries(data.responses || {}).map(([key, value]) => ({ key, value }));
};

export function buildBriefingPdf(data: BriefingPdfData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.briefing_title || "Briefing", margin, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  const date = new Date(data.created_at);
  doc.text(
    `Recebido em ${date.toLocaleDateString("pt-BR")} às ${date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`,
    margin,
    y
  );
  y += 24;
  doc.setTextColor(0);

  // Visitor info
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Informações do Visitante", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const info: Array<[string, string | undefined]> = [
    ["Nome", data.visitor_name],
    ["Email", data.visitor_email],
    ["Telefone", data.visitor_phone],
    ["Empresa", data.visitor_company],
  ];
  info.forEach(([label, value]) => {
    if (!value) return;
    ensureSpace(16);
    doc.text(`${label}: ${value}`, margin, y);
    y += 16;
  });

  y += 10;
  doc.setDrawColor(220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Respostas", margin, y);
  y += 18;

  getEntries(data).forEach(({ key, value }) => {
    const text = formatPdfValue(value);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    ensureSpace(18 + lines.length * 14 + 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(String(key), margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60);
    lines.forEach((line) => {
      ensureSpace(14);
      doc.text(line, margin, y);
      y += 14;
    });
    doc.setTextColor(0);
    y += 8;
  });

  return doc;
}

export const briefingPdfFilename = (data: BriefingPdfData) =>
  `briefing-${(data.briefing_title || "resposta").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${data.id.slice(0, 8)}.pdf`;

export function downloadBriefingPdf(data: BriefingPdfData) {
  const doc = buildBriefingPdf(data);
  doc.save(briefingPdfFilename(data));
}

export function briefingPdfBase64(data: BriefingPdfData): string {
  const doc = buildBriefingPdf(data);
  const output = doc.output("datauristring");
  return output.split(",")[1];
}

/** Uploads the PDF to public storage and returns its public URL (used for WhatsApp sharing). */
export async function uploadBriefingPdf(data: BriefingPdfData): Promise<string> {
  const doc = buildBriefingPdf(data);
  const blob = doc.output("blob");
  const path = `briefing-pdfs/${data.id}-${Date.now()}.pdf`;
  const { error } = await supabase.storage
    .from("briefing-files")
    .upload(path, blob, { contentType: "application/pdf", upsert: true });
  if (error) throw error;
  const { data: pub } = supabase.storage.from("briefing-files").getPublicUrl(path);
  return pub.publicUrl;
}
