import { ExternalLink } from "lucide-react";

export type ButtonsLayout =
  | "vertical"
  | "horizontal"
  | "grid2"
  | "grid3"
  | "grid4"
  | "inline"
  | "stack-mobile";

export type ButtonsAlign = "left" | "center" | "right";
export type ButtonsStyle = "solid" | "outline" | "soft" | "ghost" | "gradient";
export type ButtonsSize = "sm" | "md" | "lg";
export type ButtonsShape = "rounded" | "pill" | "square";

export interface ButtonItem {
  label: string;
  url: string;
}

export interface ButtonsData {
  items: ButtonItem[];
  layout: ButtonsLayout;
  align: ButtonsAlign;
  style: ButtonsStyle;
  size: ButtonsSize;
  shape: ButtonsShape;
  showIcon?: boolean;
}

export const BUTTONS_DEFAULTS: ButtonsData = {
  items: [{ label: "", url: "" }],
  layout: "horizontal",
  align: "left",
  style: "solid",
  size: "md",
  shape: "rounded",
  showIcon: false,
};

export const BUTTON_LAYOUT_OPTIONS: { value: ButtonsLayout; label: string }[] = [
  { value: "horizontal", label: "Lado a lado (horizontal)" },
  { value: "vertical", label: "Empilhado (vertical)" },
  { value: "stack-mobile", label: "Lado a lado no PC / empilhado no celular" },
  { value: "grid2", label: "Grade — 2 colunas" },
  { value: "grid3", label: "Grade — 3 colunas" },
  { value: "grid4", label: "Grade — 4 colunas" },
  { value: "inline", label: "Compacto (largura do texto)" },
];

export const BUTTON_ALIGN_OPTIONS: { value: ButtonsAlign; label: string }[] = [
  { value: "left", label: "Esquerda" },
  { value: "center", label: "Centralizado" },
  { value: "right", label: "Direita" },
];

export const BUTTON_STYLE_OPTIONS: { value: ButtonsStyle; label: string }[] = [
  { value: "solid", label: "Sólido" },
  { value: "outline", label: "Contorno" },
  { value: "soft", label: "Suave" },
  { value: "ghost", label: "Transparente" },
  { value: "gradient", label: "Degradê" },
];

export const BUTTON_SIZE_OPTIONS: { value: ButtonsSize; label: string }[] = [
  { value: "sm", label: "Pequeno" },
  { value: "md", label: "Médio" },
  { value: "lg", label: "Grande" },
];

export const BUTTON_SHAPE_OPTIONS: { value: ButtonsShape; label: string }[] = [
  { value: "rounded", label: "Cantos arredondados" },
  { value: "pill", label: "Totalmente redondo" },
  { value: "square", label: "Cantos retos" },
];

/** Aceita formatos antigos (URL simples) e o novo objeto. */
export function parseButtonsContent(content: string, fallbackLabel?: string): ButtonsData {
  if (!content) return { ...BUTTONS_DEFAULTS, items: [] };
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      const legacyLayout = parsed.layout === "horizontal" || parsed.layout === "vertical" ? parsed.layout : undefined;
      return {
        ...BUTTONS_DEFAULTS,
        ...parsed,
        layout: (parsed.layout as ButtonsLayout) || legacyLayout || "horizontal",
        items: parsed.items.filter(Boolean),
      };
    }
  } catch {
    // legacy plain URL
  }
  return {
    ...BUTTONS_DEFAULTS,
    items: [{ label: fallbackLabel || "Clique aqui", url: content }],
  };
}

export function stringifyButtonsContent(data: ButtonsData) {
  return JSON.stringify(data);
}

interface Props {
  content: string;
  fallbackLabel?: string;
  accentColor?: string;
  textColor?: string;
}

export function MembersButtons({ content, fallbackLabel, accentColor = "#22c55e", textColor = "inherit" }: Props) {
  const data = parseButtonsContent(content, fallbackLabel);
  const items = data.items.filter((i) => i && (i.url || i.label));
  if (items.length === 0) return null;

  const sizeClasses =
    data.size === "sm"
      ? "text-xs sm:text-sm px-3 py-2"
      : data.size === "lg"
      ? "text-sm sm:text-base px-5 py-3.5"
      : "text-sm px-4 py-3";

  const radius =
    data.shape === "pill" ? "rounded-full" : data.shape === "square" ? "rounded-none" : "rounded-xl";

  const alignClass =
    data.align === "center" ? "justify-center" : data.align === "right" ? "justify-end" : "justify-start";

  const containerClass = (() => {
    switch (data.layout) {
      case "vertical":
        return "flex flex-col";
      case "grid2":
        return "grid grid-cols-1 sm:grid-cols-2";
      case "grid3":
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      case "grid4":
        return "grid grid-cols-2 lg:grid-cols-4";
      case "inline":
        return `flex flex-wrap ${alignClass}`;
      case "stack-mobile":
        return "flex flex-col sm:flex-row sm:flex-wrap";
      default:
        return "flex flex-col sm:flex-row sm:flex-wrap";
    }
  })();

  const stretch = data.layout !== "inline";

  const itemStyle = (): React.CSSProperties => {
    switch (data.style) {
      case "outline":
        return { border: `2px solid ${accentColor}`, color: accentColor, backgroundColor: "transparent" };
      case "soft":
        return { backgroundColor: `${accentColor}1f`, color: accentColor };
      case "ghost":
        return { backgroundColor: "transparent", color: textColor };
      case "gradient":
        return {
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
          color: "#ffffff",
        };
      default:
        return { backgroundColor: accentColor, color: "#ffffff" };
    }
  };

  return (
    <div className={`${containerClass} gap-2 sm:gap-3 w-full`}>
      {items.map((item, idx) => (
        <a
          key={idx}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${stretch ? "flex-1 min-w-0" : ""} ${
            data.layout === "horizontal" || data.layout === "stack-mobile" ? "sm:min-w-[140px]" : ""
          } inline-flex items-center ${
            data.align === "center" ? "justify-center" : data.align === "right" ? "justify-end" : "justify-start"
          } gap-2 font-semibold transition-all hover:opacity-90 hover:shadow-md active:scale-[0.98] ${sizeClasses} ${radius} text-center`}
          style={itemStyle()}
        >
          <span className="truncate">{item.label || item.url || "Clique aqui"}</span>
          {data.showIcon && <ExternalLink className="w-4 h-4 shrink-0 opacity-80" />}
        </a>
      ))}
    </div>
  );
}
