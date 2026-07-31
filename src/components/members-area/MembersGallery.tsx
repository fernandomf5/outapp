import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type GalleryLayout =
  | "carousel"
  | "carousel_auto"
  | "manual"
  | "grid1"
  | "grid2"
  | "grid3"
  | "grid4"
  | "masonry"
  | "strip";

export interface GalleryImage {
  url: string;
  title?: string;
  description?: string;
}

export interface GalleryData {
  layout: GalleryLayout;
  images: GalleryImage[];
}

export const GALLERY_LAYOUT_OPTIONS: { value: GalleryLayout; label: string }[] = [
  { value: "carousel_auto", label: "Carrossel automático (passa sozinho)" },
  { value: "carousel", label: "Carrossel manual (setas)" },
  { value: "manual", label: "Galeria 1 por 1 (navegação manual)" },
  { value: "grid1", label: "Lista — 1 por linha" },
  { value: "grid2", label: "Grade — 2 por linha" },
  { value: "grid3", label: "Grade — 3 por linha" },
  { value: "grid4", label: "Grade — 4 por linha" },
  { value: "masonry", label: "Mosaico (alturas variadas)" },
  { value: "strip", label: "Faixa deslizante (rolagem lateral)" },
];

/** Aceita formatos antigos ("url|||url", array JSON) e o novo objeto {layout, images}. */
export function parseGalleryContent(content: string): GalleryData {
  const fallback: GalleryData = { layout: "grid3", images: [] };
  if (!content) return fallback;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return { layout: "grid3", images: parsed.filter(Boolean) };
    }
    if (parsed && typeof parsed === "object") {
      return {
        layout: (parsed.layout as GalleryLayout) || "grid3",
        images: Array.isArray(parsed.images) ? parsed.images.filter(Boolean) : [],
      };
    }
  } catch {
    return {
      layout: "grid3",
      images: content.split("|||").filter(Boolean).map((url) => ({ url })),
    };
  }
  return fallback;
}

export function stringifyGalleryContent(data: GalleryData) {
  return JSON.stringify(data);
}

interface Props {
  content: string;
  accentColor?: string;
  textColor?: string;
}

export function MembersGallery({ content, accentColor = "#22c55e", textColor = "inherit" }: Props) {
  const { layout, images } = parseGalleryContent(content);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const isSlider = layout === "carousel" || layout === "carousel_auto" || layout === "manual";
  const total = images.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % Math.max(total, 1)), [total]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + Math.max(total, 1)) % Math.max(total, 1)), [total]);

  useEffect(() => {
    if (layout !== "carousel_auto" || total < 2) return;
    const t = setInterval(next, 4500);
    return () => clearInterval(t);
  }, [layout, total, next]);

  if (total === 0) return null;

  if (isSlider) {
    return (
      <div className="relative w-full overflow-hidden rounded-xl border bg-muted/20">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((img, i) => (
            <div key={i} className="min-w-full">
              <img
                src={img.url}
                alt={img.title || `Imagem ${i + 1}`}
                loading="lazy"
                className="w-full max-h-[420px] object-contain bg-black/5"
                onClick={() => setLightbox(i)}
              />
              {(img.title || img.description) && (
                <div className="p-3">
                  {img.title && <p className="text-sm font-medium" style={{ color: textColor }}>{img.title}</p>}
                  {img.description && <p className="text-xs opacity-70" style={{ color: textColor }}>{img.description}</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur p-2 hover:bg-background transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Próxima"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/70 backdrop-blur p-2 hover:bg-background transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Ir para imagem ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === index ? 20 : 6,
                    backgroundColor: i === index ? accentColor : "rgba(150,150,150,0.6)",
                  }}
                />
              ))}
            </div>
          </>
        )}
        {layout === "manual" && (
          <div className="absolute top-2 right-2 text-[11px] px-2 py-0.5 rounded-full bg-background/70">
            {index + 1}/{total}
          </div>
        )}
      </div>
    );
  }

  if (layout === "strip") {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        {images.map((img, i) => (
          <figure key={i} className="snap-start shrink-0 w-48">
            <img
              src={img.url}
              alt={img.title || `Imagem ${i + 1}`}
              loading="lazy"
              className="w-48 h-32 object-cover rounded-lg cursor-zoom-in"
              onClick={() => setLightbox(i)}
            />
            {img.title && <figcaption className="text-xs mt-1 truncate" style={{ color: textColor }}>{img.title}</figcaption>}
          </figure>
        ))}
        <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} />
      </div>
    );
  }

  if (layout === "masonry") {
    return (
      <>
        <div className="columns-2 md:columns-3 gap-3 [column-fill:_balance]">
          {images.map((img, i) => (
            <figure key={i} className="mb-3 break-inside-avoid">
              <img
                src={img.url}
                alt={img.title || `Imagem ${i + 1}`}
                loading="lazy"
                className="w-full rounded-lg cursor-zoom-in"
                onClick={() => setLightbox(i)}
              />
              {img.title && <figcaption className="text-xs mt-1" style={{ color: textColor }}>{img.title}</figcaption>}
            </figure>
          ))}
        </div>
        <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} />
      </>
    );
  }

  const cols =
    layout === "grid1" ? "grid-cols-1" :
    layout === "grid2" ? "grid-cols-1 sm:grid-cols-2" :
    layout === "grid4" ? "grid-cols-2 md:grid-cols-4" :
    "grid-cols-2 md:grid-cols-3";

  return (
    <>
      <div className={`grid ${cols} gap-3`}>
        {images.map((img, i) => (
          <figure key={i}>
            <img
              src={img.url}
              alt={img.title || `Imagem ${i + 1}`}
              loading="lazy"
              className={`w-full rounded-lg cursor-zoom-in object-cover ${layout === "grid1" ? "max-h-[420px] object-contain bg-black/5" : "aspect-square"}`}
              onClick={() => setLightbox(i)}
            />
            {img.title && <figcaption className="text-sm mt-1 font-medium" style={{ color: textColor }}>{img.title}</figcaption>}
          </figure>
        ))}
      </div>
      <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}

function Lightbox({ images, index, onClose }: { images: GalleryImage[]; index: number | null; onClose: () => void }) {
  if (index === null || !images[index]) return null;
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
    >
      <button type="button" className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={onClose} aria-label="Fechar">
        <X className="w-6 h-6" />
      </button>
      <img src={images[index].url} alt={images[index].title || "Imagem"} className="max-h-[90vh] max-w-full rounded-lg" />
    </div>
  );
}
