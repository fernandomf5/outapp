import { useState } from 'react';
import { Play } from 'lucide-react';
import outAppLogo from '@/assets/out-app-logo.png';
import { getVideoEmbedUrl } from '@/lib/videoEmbed';

interface VideoCoverProps {
  videoUrl: string;
  logoUrl?: string;
}

export const VideoCover = ({ videoUrl, logoUrl }: VideoCoverProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const embedUrl = getVideoEmbedUrl(videoUrl, { autoplay: isPlaying });

  if (!embedUrl) {
    return (
      <video
        src={videoUrl}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full rounded-lg bg-muted object-contain shadow-xl"
        aria-label="Vídeo de apresentação da Out App"
      >
        Seu navegador não suporta a reprodução deste vídeo.
      </video>
    );
  }

  if (isPlaying) {
    return (
      <div className="relative w-full aspect-[4/3] xs:aspect-[16/10] sm:aspect-video rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-muted mx-auto max-w-[95%] sm:max-w-full laser-border">
        <iframe
          src={embedUrl}
          title="Vídeo de apresentação da Out App"
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      className="relative mx-auto aspect-video w-full cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl md:rounded-3xl shadow-2xl shadow-black/20 group laser-border"
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
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted to-background" />
      <div className="absolute inset-0 gradient-animated opacity-80" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary-hsl, 116 62% 38%) / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-hsl, 116 62% 38%) / 0.35) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 sm:w-64 h-40 sm:h-64 rounded-full bg-primary/20 blur-[60px] animate-pulse" />
        <div className="absolute top-1/2 -right-12 w-32 sm:w-48 h-32 sm:h-48 rounded-full bg-primary-glow/25 blur-[50px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-8 left-1/3 w-28 sm:w-40 h-28 sm:h-40 rounded-full bg-primary/15 blur-[45px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Inner glass card */}
      <div className="absolute inset-[3px] rounded-[calc(var(--radius)-2px)] bg-card/40 backdrop-blur-sm border border-primary/10" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4 py-6">
        {/* Logo */}
        <img
          src={logoUrl || outAppLogo}
          alt="Out App"
          className="w-16 h-16 xs:w-20 xs:h-20 sm:w-32 sm:h-32 md:w-36 md:h-36 object-contain mb-3 xs:mb-4 sm:mb-6 drop-shadow-2xl animate-fade-in"
        />

        {/* Play button */}
        <div className="relative mb-3 xs:mb-4 sm:mb-6">
          {/* Pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 xs:w-20 xs:h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 xs:w-16 xs:h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-primary-glow/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          </div>

          {/* Play button */}
          <div className="relative w-14 h-14 xs:w-16 xs:h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-md border-2 border-primary/60 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300 shadow-[0_0_30px_hsl(var(--primary-hsl,_116_62%_38%)/0.35)]">
            <Play className="w-6 h-6 xs:w-7 xs:h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white fill-white ml-0.5 drop-shadow-lg" />
          </div>
        </div>

        {/* Text */}
        <p className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide animate-fade-in text-glow">
          Aperte o Play
        </p>
        <p className="text-xs xs:text-sm sm:text-base md:text-lg text-white/90 mt-1 xs:mt-2 sm:mt-3 animate-fade-in max-w-[85%] text-center" style={{ animationDelay: '0.2s' }}>
          Descubra como funciona
        </p>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
    </div>
  );
};
