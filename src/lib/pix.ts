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

function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (factor: number) => {
    const sum = digits
      .slice(0, factor - 1)
      .split("")
      .reduce((acc, n, i) => acc + Number(n) * (factor - i), 0);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(10) === Number(digits[9]) && calc(11) === Number(digits[10]);
}

function isValidCnpj(digits: string): boolean {
  if (!/^\d{14}$/.test(digits) || /^(\d)\1{13}$/.test(digits)) return false;
  const calc = (base: string, weights: number[]) => {
    const sum = base.split("").reduce((acc, n, i) => acc + Number(n) * weights[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const first = calc(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calc(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return first === Number(digits[12]) && second === Number(digits[13]);
}

function normalizePixKey(raw: string): string {
  const key = (raw || "").trim();
  if (!key) return "";
  // Email
  if (/@/.test(key)) return key.replace(/\s/g, "").toLowerCase();
  // Random key (UUID)
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(key)) {
    return key.toLowerCase();
  }
  const digits = key.replace(/\D/g, "");
  // Phone with leading + or country code must stay in E.164 format.
  if (key.startsWith("+")) return "+" + digits;
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return "+" + digits;
  // CPF/CNPJ only when the verifier digits are valid. Otherwise 10/11 digits are treated as Brazilian phone.
  if (digits.length === 11 && isValidCpf(digits)) return digits;
  if (digits.length === 14 && isValidCnpj(digits)) return digits;
  if (digits.length === 10 || digits.length === 11) {
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
