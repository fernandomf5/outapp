import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  link_url: string | null;
}

interface BannerCarouselProps {
  banners: Banner[];
  primaryColor: string;
  textColor: string;
}

export function BannerCarousel({ banners, primaryColor, textColor }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1 || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [banners.length, isPaused]);

  if (banners.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleBannerClick = (banner: Banner) => {
    if (banner.link_url) {
      window.open(banner.link_url, "_blank");
    }
  };

  const handlePauseStart = () => {
    setIsPaused(true);
  };

  const handlePauseEnd = () => {
    setIsPaused(false);
  };

  return (
    <div 
      className="relative w-full overflow-hidden rounded-xl group"
      onMouseDown={handlePauseStart}
      onMouseUp={handlePauseEnd}
      onMouseLeave={handlePauseEnd}
      onTouchStart={handlePauseStart}
      onTouchEnd={handlePauseEnd}
    >
      {/* Banners Container */}
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div 
            key={banner.id} 
            className="min-w-full cursor-pointer"
            onClick={() => handleBannerClick(banner)}
          >
            <img 
              src={banner.image_url} 
              alt={banner.title || "Banner"} 
              className="w-full h-auto rounded-xl"
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
            style={{ color: primaryColor }}
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-lg"
            style={{ color: primaryColor }}
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex 
                  ? 'w-6' 
                  : 'w-1.5 hover:bg-white/80'
              }`}
              style={{ 
                backgroundColor: index === currentIndex ? primaryColor : 'rgba(255,255,255,0.5)' 
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
