import { ReactNode, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Play } from "lucide-react";
import { getVideoEmbedUrl } from "@/lib/videoEmbed";
import { linkifyText } from "@/utils/linkify";

export type VideoLayout =
  | "stack"
  | "grid2"
  | "grid3"
  | "carousel"
  | "playlist"
  | "netflix"
  | "featured"
  | "accordion"
  | "tabs";

export interface GalleryVideo {
  url: string;
  title?: string;
  description?: string;
  thumbnail?: string;
}

export interface VideoGalleryData {
  layout: VideoLayout;
  videos: GalleryVideo[];
}

export const VIDEO_LAYOUT_OPTIONS: { value: VideoLayout; label: string }[] = [
  { value: "stack", label: "Lista — 1 vídeo por linha" },
  { value: "grid2", label: "Lado a lado — 2 por linha" },
  { value: "grid3", label: "Grade — 3 por linha" },
  { value: "carousel", label: "Carrossel (setas, 1 por vez)" },
  { value: "playlist", label: "Playlist (player + lista lateral)" },
  { value: "netflix", label: "Faixa deslizante estilo Netflix" },
  { value: "featured", label: "Destaque + miniaturas abaixo" },
  { value: "accordion", label: "Sanfona (abre um por vez)" },
  { value: "tabs", label: "Abas por título" },
];

/** Aceita formatos antigos ("url|||url", array JSON) e o novo objeto {layout, videos}. */
export function parseVideoGalleryContent(content: string): VideoGalleryData {
  const fallback: VideoGalleryData = { layout: "stack", videos: [] };
  if (!content) return fallback;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return { layout: "stack", videos: parsed.filter(Boolean) };
    }
    if (parsed && typeof parsed === "object") {
      return {
        layout: (parsed.layout as VideoLayout) || "stack",
        videos: Array.isArray(parsed.videos) ? parsed.videos.filter(Boolean) : [],
      };
    }
  } catch {
    return {
      layout: "stack",
      videos: content.split("|||").filter(Boolean).map((url) => ({ url })),
    };
  }
  return fallback;
}

export function stringifyVideoGalleryContent(data: VideoGalleryData): string {
  return JSON.stringify({ layout: data.layout, videos: data.videos });
}

function VideoPlayer({ video, className = "" }: { video: GalleryVideo; className?: string }) {
  const embed = getVideoEmbedUrl(video.url);
  return (
    <div className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden ${className}`}>
      {embed ? (
        <iframe
          className="w-full h-full"
          src={embed}
          title={video.title || "Vídeo"}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
        />
      ) : (
        <video controls playsInline className="w-full h-full">
          <source src={video.url} />
        </video>
      )}
    </div>
  );
}

function VideoDescription({
  video,
  accentColor,
  textColor,
}: {
  video: GalleryVideo;
  accentColor: string;
  textColor: string;
}) {
  const [open, setOpen] = useState(false);
  if (!video.description) return null;
  return (
    <div className="mt-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity"
        style={{ color: accentColor }}
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        {open ? "Ocultar descrição" : "Ver descrição"}
      </button>
      {open && (
        <p className="text-xs leading-relaxed pl-1 mt-1" style={{ color: `${textColor}99` }}>
          {linkifyText(video.description)}
        </p>
      )}
    </div>
  );
}

function Thumb({
  video,
  index,
  active,
  accentColor,
  textColor,
  onClick,
  compact,
}: {
  video: GalleryVideo;
  index: number;
  active: boolean;
  accentColor: string;
  textColor: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group text-left rounded-lg overflow-hidden transition-all ${compact ? "flex items-center gap-2 p-1.5 w-full" : "w-full"}`}
      style={{
        backgroundColor: active ? `${accentColor}1a` : "transparent",
        outline: active ? `1px solid ${accentColor}` : "1px solid transparent",
      }}
    >
      <div
        className={`relative shrink-0 rounded-md overflow-hidden bg-black/80 flex items-center justify-center ${compact ? "w-24 aspect-video" : "w-full aspect-video"}`}
      >
        {video.thumbnail ? (
          <img src={video.thumbnail} alt={video.title || `Vídeo ${index + 1}`} className="w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${accentColor}cc` }}
          >
            <Play className="w-4 h-4 text-white fill-white" />
          </div>
        </div>
      </div>
      <span
        className={`block text-xs font-medium truncate ${compact ? "flex-1" : "px-1 py-1.5"}`}
        style={{ color: textColor }}
      >
        {video.title || `Vídeo ${index + 1}`}
      </span>
    </button>
  );
}

interface Props {
  content: string;
  accentColor: string;
  textColor: string;
  /** Renderiza o bloco de perguntas abaixo do vídeo (índice na lista original). */
  renderExtra?: (index: number) => ReactNode;
}

export function MembersVideoGallery({ content, accentColor, textColor, renderExtra }: Props) {
  const { layout, videos } = parseVideoGalleryContent(content);
  const [current, setCurrent] = useState(0);
  const [openAccordion, setOpenAccordion] = useState(0);

  useEffect(() => {
    if (current > videos.length - 1) setCurrent(0);
  }, [videos.length, current]);

  if (videos.length === 0) return null;

  const titleEl = (video: GalleryVideo, idx: number) =>
    video.title ? (
      <h4 className="text-sm font-medium truncate mb-1.5" style={{ color: textColor }}>
        {video.title}
      </h4>
    ) : null;

  const block = (video: GalleryVideo, idx: number) => (
    <div key={idx} className="flex flex-col">
      {titleEl(video, idx)}
      <VideoPlayer video={video} />
      <VideoDescription video={video} accentColor={accentColor} textColor={textColor} />
      {renderExtra?.(idx)}
    </div>
  );

  // Grades e lista
  if (layout === "stack" || layout === "grid2" || layout === "grid3") {
    const cols =
      layout === "grid2" ? "sm:grid-cols-2" : layout === "grid3" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1";
    return <div className={`grid grid-cols-1 ${cols} gap-5`}>{videos.map(block)}</div>;
  }

  // Faixa deslizante
  if (layout === "netflix") {
    return (
      <div className="space-y-3">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
          {videos.map((v, i) => (
            <div key={i} className="snap-start shrink-0 w-[240px] sm:w-[300px]">
              {titleEl(v, i)}
              <VideoPlayer video={v} />
              <VideoDescription video={v} accentColor={accentColor} textColor={textColor} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Carrossel
  if (layout === "carousel") {
    const v = videos[current] || videos[0];
    return (
      <div className="space-y-2">
        <div className="relative">
          {titleEl(v, current)}
          <VideoPlayer video={v} />
          {videos.length > 1 && (
            <>
              <button
                onClick={() => setCurrent((c) => (c - 1 + videos.length) % videos.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 backdrop-blur"
                style={{ backgroundColor: `${accentColor}cc` }}
                aria-label="Vídeo anterior"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setCurrent((c) => (c + 1) % videos.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 backdrop-blur"
                style={{ backgroundColor: `${accentColor}cc` }}
                aria-label="Próximo vídeo"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-1.5">
          {videos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === current ? 18 : 6,
                backgroundColor: i === current ? accentColor : `${textColor}40`,
              }}
              aria-label={`Ir para vídeo ${i + 1}`}
            />
          ))}
        </div>
        <VideoDescription video={v} accentColor={accentColor} textColor={textColor} />
        {renderExtra?.(current)}
      </div>
    );
  }

  // Playlist com lista lateral
  if (layout === "playlist") {
    const v = videos[current] || videos[0];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
        <div>
          {titleEl(v, current)}
          <VideoPlayer video={v} />
          <VideoDescription video={v} accentColor={accentColor} textColor={textColor} />
          {renderExtra?.(current)}
        </div>
        <div
          className="rounded-lg p-2 max-h-[420px] overflow-y-auto space-y-1"
          style={{ backgroundColor: `${accentColor}0d` }}
        >
          <p className="text-xs font-semibold px-1 pb-1" style={{ color: textColor }}>
            {videos.length} vídeos
          </p>
          {videos.map((vid, i) => (
            <Thumb
              key={i}
              video={vid}
              index={i}
              active={i === current}
              accentColor={accentColor}
              textColor={textColor}
              onClick={() => setCurrent(i)}
              compact
            />
          ))}
        </div>
      </div>
    );
  }

  // Destaque + miniaturas
  if (layout === "featured") {
    const v = videos[current] || videos[0];
    return (
      <div className="space-y-3">
        {titleEl(v, current)}
        <VideoPlayer video={v} />
        <VideoDescription video={v} accentColor={accentColor} textColor={textColor} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {videos.map((vid, i) => (
            <Thumb
              key={i}
              video={vid}
              index={i}
              active={i === current}
              accentColor={accentColor}
              textColor={textColor}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
        {renderExtra?.(current)}
      </div>
    );
  }

  // Abas
  if (layout === "tabs") {
    const v = videos[current] || videos[0];
    return (
      <div className="space-y-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {videos.map((vid, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
              style={{
                backgroundColor: i === current ? accentColor : `${accentColor}1a`,
                color: i === current ? "#fff" : textColor,
              }}
            >
              {vid.title || `Vídeo ${i + 1}`}
            </button>
          ))}
        </div>
        <VideoPlayer video={v} />
        <VideoDescription video={v} accentColor={accentColor} textColor={textColor} />
        {renderExtra?.(current)}
      </div>
    );
  }

  // Sanfona
  return (
    <div className="space-y-2">
      {videos.map((v, i) => {
        const open = openAccordion === i;
        return (
          <div key={i} className="rounded-lg overflow-hidden" style={{ border: `1px solid ${accentColor}33` }}>
            <button
              onClick={() => setOpenAccordion(open ? -1 : i)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
              style={{ backgroundColor: open ? `${accentColor}14` : "transparent" }}
            >
              <span className="text-sm font-medium truncate" style={{ color: textColor }}>
                {v.title || `Vídeo ${i + 1}`}
              </span>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                style={{ color: accentColor }}
              />
            </button>
            {open && (
              <div className="p-3 pt-0 space-y-2">
                <VideoPlayer video={v} />
                <VideoDescription video={v} accentColor={accentColor} textColor={textColor} />
                {renderExtra?.(i)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
