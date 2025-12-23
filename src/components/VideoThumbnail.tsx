import { Play } from 'lucide-react';

interface VideoThumbnailProps {
  videoUrl: string;
  className?: string;
  onClick?: () => void;
}

export const VideoThumbnail = ({ videoUrl, className = '', onClick }: VideoThumbnailProps) => {
  return (
    <div 
      className={`relative bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center cursor-pointer group overflow-hidden ${className}`}
      onClick={onClick}
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />
      </div>
      
      {/* Video play icon */}
      <div className="flex flex-col items-center justify-center z-10">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-primary/30">
          <Play className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground fill-primary-foreground ml-0.5" />
        </div>
        <p className="text-white text-sm sm:text-base font-medium mt-3 px-4 text-center">
          Clique para ver o vídeo
        </p>
      </div>
    </div>
  );
};
