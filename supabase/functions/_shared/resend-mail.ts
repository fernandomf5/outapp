// Shared Resend sender + branded layout for Out App account emails.
const FROM = "Out App <noreply@outapp.com.br>";
const SITE = "https://outapp.com.br";

export const escapeHtml = (v: unknown): string =>
  String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

/** Wraps inner HTML in the Out App email layout (white body, green accent). */
export function layout(title: string, inner: string): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<div style="font-size:22px;font-weight:bold;color:#16a34a;margin-bottom:24px">Out App</div>
<h1 style="font-size:22px;margin:0 0 16px;color:#111827">${escapeHtml(title)}</h1>
${inner}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px">
<p style="font-size:12px;color:#9ca3af;margin:0">© ${new Date().getFullYear()} Out App · <a href="${SITE}" style="color:#9ca3af">outapp.com.br</a></p>
</div></body></html>`;
}

export const p = (t: string) => `<p style="font-size:15px;line-height:1.6;margin:0 0 16px;color:#374151">${t}</p>`;
export const codeBox = (code: string) =>
  `<div style="background:#f0fdf4;border:2px solid #16a34a;border-radius:10px;padding:20px;text-align:center;margin:24px 0"><span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#15803d;font-family:'Courier New',monospace">${escapeHtml(code)}</span></div>`;
export const button = (label: string, href: string) =>
  `<p style="margin:24px 0"><a href="${href}" style="background:#16a34a;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">${escapeHtml(label)}</a></p>`;
export const DASHBOARD_URL = `${SITE}/dashboard`;

/** Sends one email through Resend. Throws with provider status/body on failure. */
export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_API_KEY não configurada");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Resend falhou [${res.status}]: ${body}`);
    throw new Error(`Resend [${res.status}]: ${body}`);
  }
}

export const formatDate = (iso: string | null | undefined): string => {
  if (!iso) return "Sem data de expiração";
  const d = new Date(iso);
  if (d.getFullYear() - new Date().getFullYear() > 50) return "Vitalício";
  return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
};

export function verificationEmail(name: string, code: string) {
  return layout("Confirme seu cadastro",
    p(`Olá, ${escapeHtml(name || "tudo bem")}! Use o código abaixo para confirmar seu e-mail na Out App:`) +
    codeBox(code) + p("O código expira em 15 minutos. Se você não criou uma conta, ignore este e-mail."));
}

export function resetEmail(name: string, code: string) {
  return layout("Recuperação de senha",
    p(`Olá, ${escapeHtml(name || "tudo bem")}! Recebemos um pedido para redefinir sua senha. Use este código:`) +
    codeBox(code) + p("O código expira em 15 minutos. Se não foi você, ignore este e-mail — sua senha continua a mesma."));
}

export function planActivatedEmail(name: string, planName: string, expiresAt: string | null, viaVoucher?: string) {
  const origin = viaVoucher
    ? p(`Seu voucher <strong>${escapeHtml(viaVoucher)}</strong> foi resgatado com sucesso.`)
    : p("Recebemos a confirmação do seu pagamento. Obrigado!");
  return layout(viaVoucher ? "Voucher aplicado — plano ativo!" : "Pagamento confirmado — plano ativo!",
    p(`Olá, ${escapeHtml(name || "tudo bem")}!`) + origin +
    `<table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:15px">
<tr><td style="padding:8px 0;color:#6b7280">Plano</td><td style="padding:8px 0;text-align:right;font-weight:bold">${escapeHtml(planName)}</td></tr>
<tr><td style="padding:8px 0;color:#6b7280">Válido até</td><td style="padding:8px 0;text-align:right;font-weight:bold">${escapeHtml(formatDate(expiresAt))}</td></tr>
</table>` + p("Todos os recursos do seu plano já estão liberados.") + button("Acessar meu painel", DASHBOARD_URL));
}
