import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Play, Pause, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Slide {
  id: string;
  title?: string;
  subtitle?: string;
  body?: string;
  image_url?: string;
  layout?: "center" | "left" | "right" | "image-bg";
  bg_color?: string;
}

export interface SlidesData {
  slides: Slide[];
  autoPlay?: boolean;
  interval?: number;
}

export function parseSlidesContent(content: string): SlidesData {
  const fallback: SlidesData = { slides: [] };
  if (!content) return fallback;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return { slides: parsed.filter(Boolean) };
    }
    if (parsed && typeof parsed === "object") {
      return {
        slides: Array.isArray(parsed.slides) ? parsed.slides.filter(Boolean) : [],
        autoPlay: !!parsed.autoPlay,
        interval: parsed.interval || 5000,
      };
    }
  } catch {
    // Legacy rich-text fallback: render as a single slide
    return {
      slides: [{ id: "legacy", title: "", body: content, layout: "center" }],
    };
  }
  return fallback;
}

export function stringifySlidesContent(data: SlidesData) {
  return JSON.stringify(data);
}

interface Props {
  content: string;
  accentColor?: string;
  textColor?: string;
  cardBackgroundColor?: string;
}

export function MembersSlides({
  content,
  accentColor = "#22c55e",
  textColor = "inherit",
  cardBackgroundColor = "#0f172a",
}: Props) {
  const { slides, autoPlay, interval } = parseSlidesContent(content);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = slides.length;
  const current = total > 0 ? slides[index] : null;

  const next = useCallback(() => {
    setIndex((i) => (total > 0 ? (i + 1) % total : 0));
  }, [total]);

  const prev = useCallback(() => {
    setIndex((i) => (total > 0 ? (i - 1 + total) % total : 0));
  }, [total]);

  // autoplay
  useEffect(() => {
    if (!autoPlay || total < 2 || !isPlaying) return;
    const t = setInterval(next, interval || 5000);
    return () => clearInterval(t);
  }, [autoPlay, interval, isPlaying, next, total]);

  // keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, isFullscreen]);

  // fullscreen change listener
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  if (total === 0) {
    return (
      <div className="p-6 rounded-lg border border-dashed text-center text-muted-foreground">
        <Presentation className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum slide adicionado ainda.</p>
      </div>
    );
  }

  const getLayoutClasses = (layout?: string) => {
    switch (layout) {
      case "left":
        return "text-left items-start";
      case "right":
        return "text-right items-end";
      case "image-bg":
        return "text-center items-center";
      case "center":
      default:
        return "text-center items-center";
    }
  };

  const hasImageBg = current?.layout === "image-bg" && current?.image_url;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl overflow-hidden border bg-black ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0" : ""
      }`}
      style={{ backgroundColor: cardBackgroundColor }}
    >
      {/* Slide viewport 16:9 */}
      <div className="relative w-full aspect-video">
        {/* Background image for image-bg layout */}
        {hasImageBg && (
          <div className="absolute inset-0">
            <img
              src={current.image_url}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
        )}

        {/* Solid background color */}
        {!hasImageBg && current?.bg_color && (
          <div className="absolute inset-0" style={{ backgroundColor: current.bg_color }} />
        )}

        {/* Content */}
        <div
          className={`absolute inset-0 flex flex-col justify-center p-6 md:p-10 transition-opacity duration-500 ${getLayoutClasses(
            current?.layout
          )}`}
        >
          {current?.image_url && current?.layout !== "image-bg" && (
            <div className="mb-4 max-h-[35%]">
              <img
                src={current.image_url}
                alt={current.title || "Slide"}
                className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
          )}

          {current?.subtitle && (
            <p
              className="text-xs md:text-sm uppercase tracking-widest mb-2 opacity-80"
              style={{ color: accentColor }}
            >
              {current.subtitle}
            </p>
          )}

          {current?.title && (
            <h3
              className="text-xl md:text-3xl lg:text-4xl font-bold leading-tight mb-3"
              style={{ color: textColor }}
            >
              {current.title}
            </h3>
          )}

          {current?.body && (
            <div
              className="text-sm md:text-base lg:text-lg leading-relaxed max-w-3xl whitespace-pre-line"
              style={{ color: `${textColor}e6` }}
            >
              {current.body}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            aria-label="Próximo slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Bottom toolbar */}
      <div className="absolute bottom-0 inset-x-0 p-3 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 24 : 8,
                backgroundColor: i === index ? accentColor : "rgba(255,255,255,0.5)",
              }}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/80">
            {index + 1} / {total}
          </span>

          {autoPlay && total > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? "Pausar" : "Reproduzir"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
