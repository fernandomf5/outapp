import { SiteBlock, SiteTheme, DEFAULT_THEME, mergeBlockStyle } from "./siteTypes";
import { SiteColumn, createColumn } from "./elementTypes";
import { ElementRenderer } from "./ElementRenderer";

export interface SectionProps {
  columns: SiteColumn[];
  gap: number;
  paddingY: number;
  paddingX: number;
  maxWidth: number;
  verticalAlign: "start" | "center" | "end";
  backgroundImage?: string;
  overlay?: number;
  stackOnMobile?: boolean;
}

export function readSectionProps(block: SiteBlock): SectionProps {
  const p = (block.props || {}) as Record<string, any>;
  const columns: SiteColumn[] = Array.isArray(p.columns) && p.columns.length ? p.columns : [createColumn(100)];
  return {
    columns,
    gap: typeof p.gap === "number" ? p.gap : 24,
    paddingY: typeof p.paddingY === "number" ? p.paddingY : 64,
    paddingX: typeof p.paddingX === "number" ? p.paddingX : 20,
    maxWidth: typeof p.maxWidth === "number" ? p.maxWidth : 1152,
    verticalAlign: (p.verticalAlign as SectionProps["verticalAlign"]) || "start",
    backgroundImage: p.backgroundImage || "",
    overlay: typeof p.overlay === "number" ? p.overlay : 0,
    stackOnMobile: p.stackOnMobile !== false,
  };
}

interface Props {
  block: SiteBlock;
  theme: SiteTheme;
  preview?: boolean;
}

/** Renderização pública de uma seção com colunas e elementos. */
export function SectionRenderer({ block, theme: t, preview }: Props) {
  const theme: SiteTheme = { ...DEFAULT_THEME, ...t, ...mergeBlockStyle((block.props || {}).style) };
  const s = readSectionProps(block);

  return (
    <section
      style={{
        position: "relative",
        background: s.backgroundImage
          ? `url(${s.backgroundImage}) center/cover no-repeat`
          : theme.background,
        padding: `${s.paddingY}px ${s.paddingX}px`,
      }}
    >
      {s.backgroundImage && !!s.overlay && (
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${(s.overlay || 0) / 100})` }} />
      )}
      <div
        className={s.stackOnMobile ? "site-section-grid" : undefined}
        style={{
          position: "relative",
          margin: "0 auto",
          width: "100%",
          maxWidth: `${s.maxWidth}px`,
          display: "flex",
          flexWrap: "wrap",
          gap: `${s.gap}px`,
          alignItems: s.verticalAlign === "center" ? "center" : s.verticalAlign === "end" ? "flex-end" : "flex-start",
        }}
      >
        {s.columns.map((col) => (
          <div
            key={col.id}
            style={{
              flex: `1 1 ${Math.max(col.width, 20)}%`,
              maxWidth: s.columns.length > 1 ? `calc(${col.width}% - ${s.gap}px)` : "100%",
              minWidth: 240,
              display: "grid",
              gap: `${s.gap / 2}px`,
              justifyItems: "stretch",
            }}
          >
            {col.elements.map((el) => (
              <ElementRenderer key={el.id} element={el} theme={theme} preview={preview} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
