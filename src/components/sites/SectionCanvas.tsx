import { useState } from "react";
import * as Icons from "lucide-react";
import { SiteBlock, SiteTheme, DEFAULT_THEME, mergeBlockStyle } from "./siteTypes";
import { SiteColumn, SiteElement, createElement, getElementDef } from "./elementTypes";
import { ElementRenderer } from "./ElementRenderer";
import { readSectionProps } from "./SectionRenderer";
import { cn } from "@/lib/utils";

export const DND_MIME = "application/x-outapp-element";

interface Props {
  block: SiteBlock;
  theme: SiteTheme;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onColumnsChange: (columns: SiteColumn[]) => void;
}

interface DropTarget {
  columnId: string;
  index: number;
}

/** Editor visual da seção: solte elementos nas colunas, reordene e selecione para editar. */
export function SectionCanvas({ block, theme: t, selectedElementId, onSelectElement, onColumnsChange }: Props) {
  const theme: SiteTheme = { ...DEFAULT_THEME, ...t, ...mergeBlockStyle((block.props || {}).style) };
  const s = readSectionProps(block);
  const [hover, setHover] = useState<DropTarget | null>(null);

  const applyDrop = (payload: string, target: DropTarget) => {
    const columns = s.columns.map((c) => ({ ...c, elements: [...c.elements] }));
    const col = columns.find((c) => c.id === target.columnId);
    if (!col) return;

    if (payload.startsWith("new:")) {
      col.elements.splice(target.index, 0, createElement(payload.slice(4)));
      onColumnsChange(columns);
      return;
    }
    if (payload.startsWith("move:")) {
      const elementId = payload.slice(5);
      let moved: SiteElement | null = null;
      for (const c of columns) {
        const i = c.elements.findIndex((e) => e.id === elementId);
        if (i >= 0) {
          moved = c.elements[i];
          c.elements.splice(i, 1);
          const sameCol = c.id === target.columnId;
          if (sameCol && i < target.index) target.index -= 1;
          break;
        }
      }
      if (!moved) return;
      const dest = columns.find((c) => c.id === target.columnId);
      dest?.elements.splice(Math.max(0, target.index), 0, moved);
      onColumnsChange(columns);
    }
  };

  const handleDrop = (e: React.DragEvent, target: DropTarget) => {
    e.preventDefault();
    e.stopPropagation();
    setHover(null);
    const payload = e.dataTransfer.getData(DND_MIME) || e.dataTransfer.getData("text/plain");
    if (payload) applyDrop(payload, target);
  };

  const removeElement = (id: string) => {
    onColumnsChange(s.columns.map((c) => ({ ...c, elements: c.elements.filter((e) => e.id !== id) })));
    if (selectedElementId === id) onSelectElement(null);
  };

  const duplicateElement = (id: string) => {
    onColumnsChange(
      s.columns.map((c) => {
        const i = c.elements.findIndex((e) => e.id === id);
        if (i < 0) return c;
        const copy: SiteElement = JSON.parse(JSON.stringify(c.elements[i]));
        copy.id = `${copy.type}-${Math.random().toString(36).slice(2, 9)}`;
        const elements = [...c.elements];
        elements.splice(i + 1, 0, copy);
        return { ...c, elements };
      })
    );
  };

  const DropZone = ({ columnId, index, tall }: { columnId: string; index: number; tall?: boolean }) => {
    const active = hover?.columnId === columnId && hover.index === index;
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setHover({ columnId, index });
        }}
        onDragLeave={() => setHover((h) => (h?.columnId === columnId && h.index === index ? null : h))}
        onDrop={(e) => handleDrop(e, { columnId, index })}
        className={cn(
          "rounded transition-all",
          tall ? "min-h-[72px] border-2 border-dashed" : "h-2",
          active
            ? "bg-primary/20 border-primary min-h-[40px]"
            : tall
            ? "border-muted-foreground/25"
            : "bg-transparent"
        )}
      >
        {tall && (
          <div className="h-full w-full grid place-items-center text-[11px] text-muted-foreground py-4 px-2 text-center">
            Arraste um elemento para cá
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      style={{
        position: "relative",
        background: s.backgroundImage ? `url(${s.backgroundImage}) center/cover no-repeat` : theme.background,
        padding: `${s.paddingY}px ${s.paddingX}px`,
      }}
    >
      {s.backgroundImage && !!s.overlay && (
        <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${(s.overlay || 0) / 100})` }} />
      )}
      <div
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
              minWidth: 200,
            }}
            className="rounded-md outline-1 outline-dashed outline-transparent hover:outline-primary/30"
          >
            {col.elements.length === 0 ? (
              <DropZone columnId={col.id} index={0} tall />
            ) : (
              <>
                <DropZone columnId={col.id} index={0} />
                {col.elements.map((el, i) => {
                  const def = getElementDef(el.type);
                  const isSel = selectedElementId === el.id;
                  return (
                    <div key={el.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(DND_MIME, `move:${el.id}`);
                          e.dataTransfer.setData("text/plain", `move:${el.id}`);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectElement(el.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelectElement(el.id);
                          }
                        }}
                        className={cn(
                          "relative group/el rounded-md border-2 p-1 cursor-move focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          isSel ? "border-primary" : "border-transparent hover:border-primary/40"
                        )}
                      >
                        <div className="absolute -top-2 right-1 z-30 hidden group-hover/el:flex items-center gap-1">
                          <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">
                            {def?.label || el.type}
                          </span>
                          <button
                            type="button"
                            aria-label="Duplicar elemento"
                            className="rounded bg-secondary p-1 text-secondary-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateElement(el.id);
                            }}
                          >
                            <Icons.Copy className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            aria-label="Remover elemento"
                            className="rounded bg-destructive p-1 text-destructive-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeElement(el.id);
                            }}
                          >
                            <Icons.Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="pointer-events-none">
                          <ElementRenderer element={el} theme={theme} preview />
                        </div>
                      </div>
                      <DropZone columnId={col.id} index={i + 1} />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
