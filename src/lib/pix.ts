// PIX EMV BR Code (static) generator
// Spec: BACEN — Manual de Padrões para Iniciação do PIX

function emv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(text: string, max: number): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .toUpperCase();
}

function sanitizeTxid(text: string, max: number): string {
  const clean = (text || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, max);
  return clean || "***";
}

function normalizePixKey(raw: string): string {
  const key = (raw || "").trim();
  if (!key) return "";
  // Email
  if (/@/.test(key)) return key.toLowerCase();
  // Random key (UUID)
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(key)) {
    return key.toLowerCase();
  }
  // Phone with leading +
  if (key.startsWith("+")) return "+" + key.slice(1).replace(/\D/g, "");
  const digits = key.replace(/\D/g, "");
  // CPF (11) or CNPJ (14) — digits only
  if (digits.length === 11 || digits.length === 14) return digits;
  // Brazilian phone — prefix +55
  if (digits.length >= 10 && digits.length <= 13) {
    return "+" + (digits.startsWith("55") ? digits : "55" + digits);
  }
  return key;
}

export interface PixBRCodeParams {
  pixKey: string;
  amount?: number;
  merchantName?: string;
  merchantCity?: string;
  description?: string;
  txid?: string;
}

export function generatePixBRCode({
  pixKey,
  amount,
  merchantName = "RECEBEDOR",
  merchantCity = "SAO PAULO",
  txid,
}: PixBRCodeParams): string {
  const normalizedKey = normalizePixKey(pixKey);
  const gui = emv("00", "br.gov.bcb.pix");
  const key = emv("01", normalizedKey);
  // Omit description (02) — many bank apps reject when it contains unexpected chars.
  const merchantAccount = emv("26", gui + key);

  const payloadFormat = emv("00", "01");
  const merchantCategory = emv("52", "0000");
  const currency = emv("53", "986");
  const amountStr =
    amount && amount > 0 ? emv("54", amount.toFixed(2)) : "";
  const country = emv("58", "BR");
  const name = emv("59", sanitize(merchantName, 25) || "RECEBEDOR");
  const city = emv("60", sanitize(merchantCity, 15) || "SAOPAULO");
  const addData = emv("62", emv("05", sanitizeTxid(txid, 25)));

  const partial =
    payloadFormat +
    merchantAccount +
    merchantCategory +
    currency +
    amountStr +
    country +
    name +
    city +
    addData +
    "6304";

  return partial + crc16(partial);
}
