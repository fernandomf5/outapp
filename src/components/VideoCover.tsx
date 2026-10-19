import { useState } from 'react';
import { Play } from 'lucide-react';
import { getVideoEmbedUrl } from '@/lib/videoEmbed';

interface VideoCoverProps {
  videoUrl: string;
  logoUrl?: string;
}

export const VideoCover = ({ videoUrl, logoUrl }: VideoCoverProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const brandLogo = logoUrl || '/outapp-video-logo.svg';

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const embedUrl = getVideoEmbedUrl(videoUrl, { autoplay: isPlaying });

  if (!embedUrl) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-cyan-500/40 bg-[#030a18] shadow-xl">
        <video
          src={videoUrl}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
          aria-label="Vídeo de apresentação da Out App"
        >
          Seu navegador não suporta a reprodução deste vídeo.
        </video>
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-[#06142c]/70 px-2.5 py-2 shadow-[0_0_22px_rgba(45,185,255,0.27)] backdrop-blur-md sm:left-5 sm:top-5">
          <img src={brandLogo} alt="" className="h-7 w-7 object-contain sm:h-10 sm:w-10" />
          <span className="text-xs font-semibold tracking-wider text-cyan-50 sm:text-sm">OUT APP</span>
        </div>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div className="relative mx-auto aspect-[4/3] w-full max-w-[95%] overflow-hidden rounded-lg bg-muted shadow-2xl xs:aspect-[16/10] xs:max-w-full sm:aspect-video sm:rounded-xl md:rounded-2xl lg:rounded-3xl laser-border">
        <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-[#06142c]/70 px-2.5 py-2 shadow-[0_0_22px_rgba(45,185,255,0.27)] backdrop-blur-md sm:left-5 sm:top-5">
          <img src={brandLogo} alt="" className="h-7 w-7 object-contain sm:h-10 sm:w-10" />
          <span className="text-xs font-semibold tracking-wider text-cyan-50 sm:text-sm">OUT APP</span>
        </div>
        <iframe
          src={embedUrl}
          title="Vídeo de apresentação da Out App"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto aspect-video w-full max-w-[95%] cursor-pointer overflow-hidden rounded-lg shadow-2xl shadow-black/20 group xs:max-w-full sm:rounded-xl md:rounded-2xl lg:rounded-3xl laser-border"
      onClick={handlePlay}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handlePlay();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Reproduzir vídeo de apresentação"
    >
      {/* Background plate inside the laser frame */}
      <div className="absolute inset-[3px] sm:inset-[5px] rounded-[calc(var(--radius)-2px)] overflow-hidden bg-background">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#030b1a] via-[#0c2c58] to-[#080a24]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(31,135,228,0.48),transparent_58%)] opacity-90" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(rgba(48,185,255,0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-hsl, 116 62% 38%) / 0.4) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-28 sm:w-48 md:w-72 h-28 sm:h-48 md:h-72 rounded-full bg-cyan-500/25 blur-[40px] sm:blur-[55px] md:blur-[70px] animate-pulse" />
          <div className="absolute top-1/2 -right-12 w-24 sm:w-40 md:w-56 h-24 sm:h-40 md:h-56 rounded-full bg-primary-glow/30 blur-[35px] sm:blur-[45px] md:blur-[55px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-8 left-1/3 w-20 sm:w-32 md:w-48 h-20 sm:h-32 md:h-48 rounded-full bg-primary/20 blur-[30px] sm:blur-[40px] md:blur-[50px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Inner glass card */}
        <div className="absolute inset-0 bg-[#06132c]/35 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-3 py-4 sm:px-4 sm:py-6">
        {/* Logo */}
        <img
          src={brandLogo}
          alt="Out App"
          className="h-14 w-14 xs:h-16 xs:w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 object-contain mb-2 xs:mb-3 sm:mb-4 drop-shadow-[0_0_22px_rgba(64,188,255,0.68)] animate-fade-in"
        />

        {/* Play button */}
        <div className="relative mb-2 xs:mb-3 sm:mb-4">
          {/* Pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 xs:w-16 xs:h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-cyan-400/25 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 xs:w-14 xs:h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full bg-violet-400/25 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          </div>

          {/* Play button */}
          <div className="relative w-10 h-10 xs:w-14 xs:h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-md border-2 border-cyan-400/70 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-400/25 transition-all duration-300 shadow-[0_0_30px_hsl(var(--primary-hsl,_116_62%_38%)/0.45)]">
            <Play className="w-4 h-4 xs:w-6 xs:h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white fill-white ml-0.5 drop-shadow-lg" />
          </div>
        </div>

        {/* Text */}
        <p className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-wide animate-fade-in text-glow">
          Aperte o Play
        </p>
        <p className="text-[10px] xs:text-xs sm:text-sm md:text-base text-white/90 mt-1 xs:mt-2 sm:mt-3 animate-fade-in max-w-[85%] text-center" style={{ animationDelay: '0.2s' }}>
          Descubra como funciona
        </p>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-[3px] sm:inset-[5px] rounded-[calc(var(--radius)-2px)] bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
    </div>
  );
};
