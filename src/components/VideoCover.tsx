import { useState } from 'react';
import { Play } from 'lucide-react';
import outAppLogo from '@/assets/out-app-logo.png';

interface VideoCoverProps {
  videoUrl: string;
  logoUrl?: string;
}

export const VideoCover = ({ videoUrl, logoUrl }: VideoCoverProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const getEmbedUrl = (url: string) => {
    return url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') + '?autoplay=1';
  };

  if (isPlaying) {
    return (
      <div className="relative w-full aspect-[4/3] xs:aspect-[16/10] sm:aspect-video rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl bg-muted mx-auto max-w-[95%] sm:max-w-full">
        <iframe
          src={getEmbedUrl(videoUrl)}
          title="Video demonstração"
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div 
      className="relative w-full aspect-[4/3] xs:aspect-[16/10] sm:aspect-video rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl cursor-pointer group mx-auto max-w-[95%] sm:max-w-full"
      onClick={handlePlay}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-secondary" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-24 sm:w-32 h-24 sm:h-32 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Decorative lines */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent" />
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent" />
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-white to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white px-4">
        {/* Logo */}
        <img 
          src={logoUrl || outAppLogo} 
          alt="Out App" 
          className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain mb-6 sm:mb-8 drop-shadow-2xl animate-fade-in"
        />

        {/* Play button */}
        <div className="relative mb-6 sm:mb-8">
          {/* Pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-white/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          </div>
          
          {/* Play button */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 shadow-2xl">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Text */}
        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide animate-fade-in drop-shadow-lg">
          Aperte o Play
        </p>
        <p className="text-sm sm:text-base md:text-lg text-white/80 mt-2 sm:mt-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Descubra como funciona
        </p>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
    </div>
  );
};
