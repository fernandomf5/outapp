import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Maximize, Minimize, Play, Pause, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";

export type SlideLayout =
  | "center"
  | "left"
  | "right"
  | "image-bg"
  | "split-left"
  | "split-right"
  | "image-top"
  | "text-only";

export type SlideImageFit = "cover" | "contain";

export interface Slide {
  id: string;
  title?: string;
  subtitle?: string;
  body?: string;
  image_url?: string;
  layout?: SlideLayout;
  bg_color?: string;
  title_color?: string;
  subtitle_color?: string;
  body_color?: string;
  image_fit?: SlideImageFit;
  overlay?: number; // 0-100, only for image-bg
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
  textColor = "#ffffff",
  cardBackgroundColor = "#0f172a",
}: Props) {
  const { slides, autoPlay, interval } = parseSlidesContent(content);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = slides.length;
  const current = total > 0 ? slides[index] : null;

  const next = useCallback(() => {
    setIndex((i) => (total > 0 ? (i + 1) % total : 0));
  }, [total]);

  const prev = useCallback(() => {
    setIndex((i) => (total > 0 ? (i - 1 + total) % total : 0));
  }, [total]);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [index]);

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

  const layout: SlideLayout = (current?.layout as SlideLayout) || "center";
  const isSplit = layout === "split-left" || layout === "split-right";
  const hasImage = !!current?.image_url;
  const hasImageBg = layout === "image-bg" && hasImage;
  const fit = current?.image_fit || (layout === "image-top" ? "cover" : "contain");

  const titleColor = current?.title_color || textColor;
  const subtitleColor = current?.subtitle_color || accentColor;
  const bodyColor = current?.body_color || textColor;

  const alignClasses =
    layout === "left" || layout === "split-right"
      ? "text-left items-start"
      : layout === "right"
      ? "text-right items-end"
      : isSplit
      ? "text-left items-start"
      : "text-center items-center";

  const overlay = typeof current?.overlay === "number" ? current!.overlay! / 100 : 0.55;

  const TextBlock = (
    <div
      key={animKey}
      className={`flex flex-col justify-center gap-2 md:gap-3 animate-fade-in ${alignClasses}`}
    >
      {current?.subtitle && (
        <p
          className="text-[10px] md:text-xs lg:text-sm font-semibold uppercase tracking-[0.18em]"
          style={{ color: subtitleColor }}
        >
          {current.subtitle}
        </p>
      )}
      {current?.title && (
        <h3
          className="text-lg md:text-3xl lg:text-4xl font-bold leading-[1.15] tracking-tight"
          style={{ color: titleColor }}
        >
          {current.title}
        </h3>
      )}
      {current?.title && (
        <span
          className="block h-[3px] w-10 md:w-14 rounded-full"
          style={{ backgroundColor: subtitleColor, opacity: 0.8 }}
        />
      )}
      {current?.body && (
        <div
          className="text-xs md:text-base lg:text-lg leading-relaxed max-w-2xl whitespace-pre-line opacity-95"
          style={{ color: bodyColor }}
        >
          {current.body}
        </div>
      )}
    </div>
  );

  const ImageBlock = hasImage ? (
    <div
      key={`img-${animKey}`}
      className="relative h-full w-full overflow-hidden rounded-xl animate-scale-in"
    >
      <img
        src={current!.image_url}
        alt={current?.title || "Slide"}
        className={`w-full h-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
        loading="lazy"
      />
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border shadow-lg ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none border-0" : ""
      }`}
      style={{ backgroundColor: current?.bg_color || cardBackgroundColor }}
    >
      {/* Slide viewport 16:9 */}
      <div className="relative w-full aspect-video">
        {/* Background image */}
        {hasImageBg && (
          <div className="absolute inset-0">
            <img
              src={current!.image_url}
              alt=""
              className={`w-full h-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, rgba(0,0,0,${Math.min(overlay + 0.2, 1)}), rgba(0,0,0,${overlay}))`,
              }}
            />
          </div>
        )}

        {/* Subtle vignette for non image-bg slides */}
        {!hasImageBg && (
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.04] to-black/20" />
        )}

        {/* Content */}
        {isSplit && hasImage ? (
          <div
            className={`absolute inset-0 grid grid-cols-2 gap-4 md:gap-8 p-4 md:p-8 pb-12 md:pb-16 ${
              layout === "split-right" ? "" : ""
            }`}
          >
            <div className={`min-h-0 ${layout === "split-right" ? "order-2" : "order-1"}`}>
              {ImageBlock}
            </div>
            <div
              className={`min-h-0 overflow-hidden flex ${
                layout === "split-right" ? "order-1" : "order-2"
              }`}
            >
              {TextBlock}
            </div>
          </div>
        ) : layout === "image-top" && hasImage ? (
          <div className="absolute inset-0 flex flex-col p-4 md:p-8 pb-12 md:pb-16 gap-3 md:gap-5">
            <div className="h-[45%] min-h-0">{ImageBlock}</div>
            <div className="flex-1 min-h-0 overflow-hidden flex">{TextBlock}</div>
          </div>
        ) : (
          <div
            className={`absolute inset-0 flex flex-col justify-center p-5 md:p-12 pb-12 md:pb-16 gap-3 ${alignClasses}`}
          >
            {hasImage && layout !== "image-bg" && layout !== "text-only" && (
              <div className="max-h-[38%] w-full flex justify-center mb-1">
                <img
                  src={current!.image_url}
                  alt={current?.title || "Slide"}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                />
              </div>
            )}
            {TextBlock}
          </div>
        )}

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${((index + 1) / total) * 100}%`, backgroundColor: accentColor }}
          />
        </div>
      </div>

      {/* Controls */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button
            type="button"
            onClick={next}
            className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
            aria-label="Próximo slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Bottom toolbar */}
      <div className="absolute bottom-0 inset-x-0 p-2 md:p-3 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-[55%] no-scrollbar">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full transition-all shrink-0"
              style={{
                width: i === index ? 24 : 8,
                backgroundColor: i === index ? accentColor : "rgba(255,255,255,0.45)",
              }}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-[11px] text-white/80 tabular-nums">
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
