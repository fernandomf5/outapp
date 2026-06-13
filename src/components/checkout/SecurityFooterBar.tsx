import { Shield, ShieldCheck, BadgeCheck, Lock } from "lucide-react";
import pixLogo from "@/assets/pix-logo.png.asset.json";


interface Props {
  settings?: any;
  compact?: boolean;
}

export const SecurityFooterBar = ({ settings = {}, compact = false }: Props) => {
  if (settings.security_bar_enabled === false) return null;

  const bg = settings.security_bar_bg_color || '#0b0b0b';
  const text = settings.security_bar_text_color || '#ffffff';
  const subtle = settings.security_bar_subtle_color || '#9ca3af';
  const accent = settings.security_bar_accent_color || '#16A34A';
  const divider = settings.security_bar_divider_color || 'rgba(255,255,255,0.12)';
  const radius = settings.security_bar_radius || 'rounded-3xl';

  const t = {
    title: settings.security_bar_title ?? 'PAGAMENTO SEGURO',
    subtitle: settings.security_bar_subtitle ?? 'Seus dados protegidos com criptografia de ponta a ponta',
    payTitle: settings.security_bar_pay_title ?? 'PAGUE COM',
    payHighlight: settings.security_bar_pay_highlight ?? 'PIX',
    payRest: settings.security_bar_pay_rest ?? 'OU CARTÃO',
    secureBadge: settings.security_bar_secure_badge ?? 'COMPRA 100% SEGURA',
    trust1Title: settings.security_bar_trust1_title ?? 'AMBIENTE',
    trust1Sub: settings.security_bar_trust1_sub ?? '100% SEGURO',
    trust2Title: settings.security_bar_trust2_title ?? 'EMPRESA',
    trust2Sub: settings.security_bar_trust2_sub ?? 'CONFIÁVEL',
    trust3Title: settings.security_bar_trust3_title ?? 'PROTEÇÃO TOTAL',
    trust3Sub: settings.security_bar_trust3_sub ?? 'DOS SEUS DADOS',
  };

  const showCards = settings.security_bar_show_cards !== false;
  const showPix = settings.security_bar_show_pix !== false;
  const showTrust = settings.security_bar_show_trust !== false;
  const showSecureBadge = settings.security_bar_show_secure_badge !== false;
  const showMainShield = settings.security_bar_show_main !== false;

  const cards = [
    { key: 'visa', src: 'https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons@main/flat/visa.svg' },
    { key: 'master', src: 'https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons@main/flat/mastercard.svg' },
    { key: 'elo', src: 'https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons@main/flat/elo.svg' },
    { key: 'amex', src: 'https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons@main/flat/amex.svg' },
    { key: 'hiper', src: 'https://cdn.jsdelivr.net/gh/aaronfagan/svg-credit-card-payment-icons@main/flat/hipercard.svg' },
  ].filter(c => settings[`security_bar_card_${c.key}`] !== false);


  return (
    <div className={`w-full ${radius} px-4 md:px-8 py-5 md:py-6`} style={{ backgroundColor: bg, color: text }}>
      <div className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-4 ${compact ? 'text-xs' : ''}`}>
        {showMainShield && (
          <div className="flex items-center gap-3 pr-6" style={{ borderRight: `1px solid ${divider}` }}>
            <Shield className="w-9 h-9" style={{ color: accent }} strokeWidth={1.5} />
            <div className="text-left">
              <p className="font-extrabold text-sm tracking-wide" style={{ color: text }}>{t.title}</p>
              <p className="text-[11px] leading-tight max-w-[200px]" style={{ color: subtle }}>{t.subtitle}</p>
            </div>
          </div>
        )}

        {showPix && (
          <div className="flex items-center gap-3 pr-6" style={{ borderRight: `1px solid ${divider}` }}>
            <img src={pixLogo.url} alt="PIX" className="h-7 w-7 object-contain" />
            <div className="text-left leading-tight">
              <p className="text-[10px] font-semibold" style={{ color: subtle }}>{t.payTitle}</p>
              <p className="text-sm font-extrabold" style={{ color: accent }}>{t.payHighlight}</p>
              <p className="text-[11px] font-bold" style={{ color: text }}>{t.payRest}</p>
            </div>
          </div>
        )}

        {showCards && cards.length > 0 && (
          <div className="flex items-center gap-2 pr-6" style={{ borderRight: showSecureBadge ? `1px solid ${divider}` : 'none' }}>
            {cards.map(c => (
              <div key={c.key} className="bg-white rounded-md px-1.5 py-1 flex items-center justify-center h-7 w-11">
                <img src={c.src} alt={c.key} className="max-h-full max-w-full object-contain" />
              </div>
            ))}
          </div>
        )}

        {showSecureBadge && (
          <div className="flex items-center gap-2">
            <Lock className="w-7 h-7" style={{ color: accent }} strokeWidth={1.5} />
            <div className="leading-tight text-left">
              <p className="text-[10px] font-bold" style={{ color: text }}>COMPRA 100%</p>
              <p className="text-[10px] font-extrabold" style={{ color: accent }}>SEGURA</p>
            </div>
          </div>
        )}
      </div>

      {showTrust && (
        <div className="mt-5 pt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3" style={{ borderTop: `1px solid ${divider}` }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" style={{ color: accent }} />
            <div className="leading-tight">
              <p className="text-[10px] font-bold" style={{ color: text }}>{t.trust1Title}</p>
              <p className="text-[10px] font-bold" style={{ color: subtle }}>{t.trust1Sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5" style={{ color: accent }} />
            <div className="leading-tight">
              <p className="text-[10px] font-bold" style={{ color: text }}>{t.trust2Title}</p>
              <p className="text-[10px] font-bold" style={{ color: subtle }}>{t.trust2Sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" style={{ color: accent }} />
            <div className="leading-tight">
              <p className="text-[10px] font-bold" style={{ color: text }}>{t.trust3Title}</p>
              <p className="text-[10px] font-bold" style={{ color: subtle }}>{t.trust3Sub}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
