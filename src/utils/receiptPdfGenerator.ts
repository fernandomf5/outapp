import jsPDF from "jspdf";

interface ReceiptData {
  receipt_number: string;
  receipt_title?: string;
  date: string;
  client_name: string;
  client_document?: string;
  client_address?: string;
  client_email?: string;
  client_phone?: string;
  items: { description: string; quantity: number; unit_price: number }[];
  payment_method: string;
  notes?: string;
  company_name?: string;
  company_document?: string;
  company_address?: string;
  company_phone?: string;
  primary_color?: string;
  logo_url?: string;
  issuer_signer_name?: string;
  client_signer_name?: string;
  warranty_text?: string;
  terms_text?: string;
  discount_type?: 'fixed' | 'percentage';
  discount_value?: number;
}

const paymentMethodLabels: Record<string, string> = {
  pix: 'PIX', cash: 'Dinheiro', credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito', bank_transfer: 'Transferência Bancária',
  boleto: 'Boleto', other: 'Outro',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function generateReceiptPDF(receiptData: ReceiptData, logoDataUrl?: string): jsPDF {
  const doc = new jsPDF();
  const color = receiptData.primary_color || '#6366f1';
  const cr = parseInt(color.slice(1, 3), 16);
  const cg = parseInt(color.slice(3, 5), 16);
  const cb = parseInt(color.slice(5, 7), 16);

  // Header - taller to avoid overlap
  doc.setFillColor(cr, cg, cb);
  doc.rect(0, 0, 210, 48, 'F');

  const leftStart = logoDataUrl ? 50 : 15;

  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'PNG', 10, 6, 32, 32); } catch {}
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const title = receiptData.receipt_title || 'RECIBO';
  // Truncate title to avoid overlapping date
  const titleMaxWidth = 90;
  const titleLines = doc.splitTextToSize(title, titleMaxWidth);
  doc.text(titleLines[0], leftStart, 16);
  if (titleLines[1]) {
    doc.setFontSize(13);
    doc.text(titleLines[1], leftStart, 24);
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº ${receiptData.receipt_number}`, leftStart, titleLines[1] ? 32 : 26);

  const dateStr = receiptData.date?.includes('-') ? receiptData.date.split('-').reverse().join('/') : receiptData.date;
  doc.setFontSize(10);
  doc.text(`Data: ${dateStr}`, 155, 16, { align: 'left' });

  // Company info
  let y = 56;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  if (receiptData.company_name) { doc.text(receiptData.company_name, 15, y); y += 7; }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (receiptData.company_document) { doc.text(`CNPJ/CPF: ${receiptData.company_document}`, 15, y); y += 5; }
  if (receiptData.company_address) {
    const addrLines = doc.splitTextToSize(receiptData.company_address, 180);
    doc.text(addrLines, 15, y);
    y += addrLines.length * 5;
  }
  if (receiptData.company_phone) { doc.text(`Tel: ${receiptData.company_phone}`, 15, y); y += 5; }

  // Client section - dynamic height
  y += 6;
  const clientStartY = y;
  const clientLines: string[] = [];
  if (receiptData.client_name) clientLines.push(`Nome: ${receiptData.client_name}`);
  if (receiptData.client_document) clientLines.push(`CPF/CNPJ: ${receiptData.client_document}`);

  let clientAddrLines: string[] = [];
  if (receiptData.client_address) {
    clientAddrLines = doc.splitTextToSize(`Endereço: ${receiptData.client_address}`, 175);
  }

  const totalClientLines = clientLines.length + clientAddrLines.length;
  const clientBoxH = 12 + totalClientLines * 5;
  doc.setFillColor(245, 245, 245);
  doc.rect(10, clientStartY - 4, 190, clientBoxH, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 15, y + 2);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  clientLines.forEach(line => { doc.text(line, 15, y); y += 5; });
  if (clientAddrLines.length) { doc.text(clientAddrLines, 15, y); y += clientAddrLines.length * 5; }

  // Items header
  y += 8;
  doc.setFillColor(cr, cg, cb);
  doc.rect(10, y - 4, 190, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Descrição', 15, y + 1);
  doc.text('Qtd', 120, y + 1);
  doc.text('Valor Unit.', 140, y + 1);
  doc.text('Subtotal', 175, y + 1);
  y += 8;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const items = receiptData.items || [];
  items.forEach((item) => {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.text(item.description || '-', 15, y);
    doc.text(String(item.quantity), 120, y);
    doc.text(formatCurrency(item.unit_price), 140, y);
    doc.text(formatCurrency(item.quantity * item.unit_price), 175, y);
    y += 7;
  });

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const discountValue = receiptData.discount_value || 0;
  const discountAmount = receiptData.discount_type === 'percentage'
    ? (subtotal * discountValue) / 100
    : discountValue;
  const total = Math.max(0, subtotal - discountAmount);

  y += 3;
  doc.setDrawColor(cr, cg, cb);
  doc.line(10, y, 200, y);
  y += 8;

  if (discountAmount > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 140, y);
    doc.text(formatCurrency(subtotal), 175, y);
    y += 6;
    doc.setTextColor(200, 0, 0);
    doc.text(`Desconto${receiptData.discount_type === 'percentage' ? ` (${discountValue}%)` : ''}:`, 140, y);
    doc.text(`- ${formatCurrency(discountAmount)}`, 175, y);
    y += 8;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL:', 140, y);
  doc.setTextColor(cr, cg, cb);
  doc.text(formatCurrency(total), 175, y);

  y += 10;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const methodLabel = paymentMethodLabels[receiptData.payment_method] || receiptData.payment_method || '';
  if (methodLabel) doc.text(`Forma de Pagamento: ${methodLabel}`, 15, y);

  if (receiptData.notes) {
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(`Observações: ${receiptData.notes}`, 15, y, { maxWidth: 180 });
    const notesLines = doc.splitTextToSize(`Observações: ${receiptData.notes}`, 180);
    y += notesLines.length * 5;
  }

  if (receiptData.warranty_text) {
    y += 8;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(cr, cg, cb);
    doc.text('GARANTIA / LAUDO', 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const wLines = doc.splitTextToSize(receiptData.warranty_text, 180);
    doc.text(wLines, 15, y);
    y += wLines.length * 4.5;
  }

  if (receiptData.terms_text) {
    y += 8;
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(cr, cg, cb);
    doc.text('TERMOS E CONDIÇÕES', 15, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const tLines = doc.splitTextToSize(receiptData.terms_text, 180);
    doc.text(tLines, 15, y);
    y += tLines.length * 4.5;
  }

  y = Math.max(y + 25, 220);
  const sigY = y > 270 ? 40 : y;
  if (y > 270) doc.addPage();

  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);
  doc.line(20, sigY, 90, sigY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(receiptData.issuer_signer_name || receiptData.company_name || 'Emissor', 55, sigY + 5, { align: 'center' });

  doc.line(120, sigY, 190, sigY);
  doc.text(receiptData.client_signer_name || receiptData.client_name || 'Cliente', 155, sigY + 5, { align: 'center' });

  return doc;
}

export function downloadReceiptPDF(receiptData: ReceiptData, logoDataUrl?: string) {
  const doc = generateReceiptPDF(receiptData, logoDataUrl);
  doc.save(`recibo-${receiptData.receipt_number}.pdf`);
}
