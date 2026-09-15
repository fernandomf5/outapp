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
      <div className="relative mx-auto aspect-[4/3] w-full max-w-[95%] overflow-hidden rounded-lg bg-muted shadow-2xl xs:aspect-[16/10] xs:max-w-full sm:aspect-video sm:rounded-xl md:rounded-2xl lg:rounded-3xl laser-border">
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
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted to-background" />
        <div className="absolute inset-0 gradient-animated opacity-90" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary-hsl, 116 62% 38%) / 0.4) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-hsl, 116 62% 38%) / 0.4) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Floating orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -left-10 w-28 sm:w-48 md:w-72 h-28 sm:h-48 md:h-72 rounded-full bg-primary/25 blur-[40px] sm:blur-[55px] md:blur-[70px] animate-pulse" />
          <div className="absolute top-1/2 -right-12 w-24 sm:w-40 md:w-56 h-24 sm:h-40 md:h-56 rounded-full bg-primary-glow/30 blur-[35px] sm:blur-[45px] md:blur-[55px] animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-8 left-1/3 w-20 sm:w-32 md:w-48 h-20 sm:h-32 md:h-48 rounded-full bg-primary/20 blur-[30px] sm:blur-[40px] md:blur-[50px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Inner glass card */}
        <div className="absolute inset-0 bg-card/50 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-3 py-4 sm:px-4 sm:py-6">
        {/* Logo */}
        <img
          src={logoUrl || outAppLogo}
          alt="Out App"
          className="w-12 h-12 xs:w-16 xs:h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 object-contain mb-2 xs:mb-3 sm:mb-4 drop-shadow-2xl animate-fade-in"
        />

        {/* Play button */}
        <div className="relative mb-2 xs:mb-3 sm:mb-4">
          {/* Pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 xs:w-16 xs:h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-primary/35 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 xs:w-14 xs:h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full bg-primary-glow/25 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          </div>

          {/* Play button */}
          <div className="relative w-10 h-10 xs:w-14 xs:h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-full bg-white/10 backdrop-blur-md border-2 border-primary/70 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/25 transition-all duration-300 shadow-[0_0_30px_hsl(var(--primary-hsl,_116_62%_38%)/0.45)]">
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
