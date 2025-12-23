import { Play } from 'lucide-react';

interface VideoThumbnailProps {
  videoUrl: string;
  className?: string;
  onClick?: () => void;
}

export const VideoThumbnail = ({ videoUrl, className = '', onClick }: VideoThumbnailProps) => {
  return (
    <div 
      className={`relative bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* Video icon background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
          <Play className="w-8 h-8 text-primary fill-primary ml-1" />
        </div>
      </div>
      
      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <p className="text-white text-sm font-medium text-center">
          Clique para ver o vídeo
        </p>
      </div>
    </div>
  );
};
