import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface Props {
  title: string;
  companyName?: string;
  clientName?: string;
  content: string;
}

// A4 inner content area in mm (210x297 - 20mm padding each side)
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const PAD_MM = 20;
const INNER_W_MM = PAGE_W_MM - PAD_MM * 2;
const INNER_H_MM = PAGE_H_MM - PAD_MM * 2;

export default function A4ContractPreview({ title, companyName, clientName, content }: Props) {
  const measureRef = useRef<HTMLDivElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [innerHeightPx, setInnerHeightPx] = useState(0);
  const [totalHeightPx, setTotalHeightPx] = useState(0);
  const [scale, setScale] = useState(0.7);

  // Measure
  useLayoutEffect(() => {
    if (!measureRef.current) return;
    setTotalHeightPx(measureRef.current.scrollHeight);
    // Find one rendered inner page to get the px equivalent of INNER_H_MM
    const firstPage = document.getElementById("a4-page-inner-ref");
    if (firstPage) setInnerHeightPx(firstPage.clientHeight);
  }, [content, title, companyName, clientName]);

  // Responsive scale to fit container width
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      // 210mm ≈ 794px at 96dpi
      const pageWidthPx = 210 * (96 / 25.4);
      const s = Math.min(1, (rect.width - 8) / pageWidthPx);
      setScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pageCount = innerHeightPx > 0 ? Math.max(1, Math.ceil(totalHeightPx / innerHeightPx)) : 1;
  const pages = Array.from({ length: pageCount });

  // Shared inner content (rendered once, sliced via negative margin per page)
  const innerContent = (
    <div className="a4-inner-content" style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "11pt", lineHeight: 1.5, color: "#0a0a0a" }}>
      <h1 style={{ fontSize: "16pt", textAlign: "center", margin: "0 0 12pt", fontWeight: 700 }}>{title || "Contrato"}</h1>
      <div style={{ borderBottom: "1px solid #ccc", paddingBottom: "8pt", marginBottom: "12pt", fontSize: "10pt" }}>
        <div><strong>Empresa:</strong> {companyName || "—"}</div>
        <div><strong>Cliente:</strong> {clientName || "—"}</div>
      </div>
      <div style={{ whiteSpace: "pre-wrap", textAlign: "justify" }}>{content || "Conteúdo do contrato..."}</div>
    </div>
  );

  return (
    <div ref={wrapRef} className="w-full">
      {/* Hidden measurement node: same width as inner page, off-screen */}
      <div style={{ position: "absolute", left: -99999, top: 0, width: `${INNER_W_MM}mm`, visibility: "hidden", pointerEvents: "none" }}>
        <div ref={measureRef}>{innerContent}</div>
        {/* Reference page to capture inner height in px */}
        <div id="a4-page-inner-ref" style={{ width: `${INNER_W_MM}mm`, height: `${INNER_H_MM}mm` }} />
      </div>

      <div className="text-xs text-muted-foreground mb-2 text-center">
        {pageCount} {pageCount === 1 ? "página" : "páginas"} A4
      </div>

      <div className="flex flex-col items-center gap-4 max-h-[60vh] overflow-y-auto bg-muted/30 p-3 rounded">
        {pages.map((_, i) => (
          <div
            key={i}
            style={{
              width: `${PAGE_W_MM}mm`,
              height: `${PAGE_H_MM}mm`,
              padding: `${PAD_MM}mm`,
              background: "white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              marginBottom: `${(PAGE_H_MM * (scale - 1) * 96) / 25.4}px`,
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div style={{ width: `${INNER_W_MM}mm`, height: `${INNER_H_MM}mm`, overflow: "hidden", position: "relative" }}>
              <div style={{ marginTop: `-${i * INNER_H_MM}mm` }}>{innerContent}</div>
            </div>
            <div style={{ position: "absolute", bottom: "8mm", right: "12mm", fontSize: "9pt", color: "#888" }}>
              Página {i + 1} de {pageCount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
