import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Quote, Star, User } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  company?: string;
  text: string;
  avatar_url?: string;
  rating?: number;
}

interface TestimonialsCarouselProps {
  testimonials: Testimonial[];
  title?: string;
  subtitle?: string;
  className?: string;
  autoplayInterval?: number;
}

function TestimonialAvatar({ testimonial }: { testimonial: Testimonial }) {
  if (testimonial.avatar_url) {
    return (
      <img
        src={testimonial.avatar_url}
        alt={`Foto de ${testimonial.name}`}
        className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
        loading="lazy"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
      <User className="h-6 w-6 text-primary" aria-hidden="true" />
    </div>
  );
}

function StarRating({ rating }: { rating?: number }) {
  if (!rating || rating <= 0) return null;

  const safeRating = Math.min(5, Math.max(1, Math.round(rating)));

  return (
    <div className="flex gap-0.5" aria-label={`Avaliação: ${safeRating} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            "h-4 w-4",
            index < safeRating
              ? "fill-primary text-primary"
              : "fill-muted text-muted-foreground/40"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <Card className="h-full border-primary/10 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_-8px_hsl(var(--primary)/0.15)]">
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <Quote className="mb-3 h-6 w-6 text-primary/60" aria-hidden="true" />

        <p className="flex-1 text-sm leading-relaxed text-foreground/90 sm:text-base">
          {testimonial.text}
        </p>

        <div className="mt-4 flex items-center gap-3 border-t border-border/50 pt-4">
          <TestimonialAvatar testimonial={testimonial} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {testimonial.name}
            </p>
            {(testimonial.role || testimonial.company) && (
              <p className="truncate text-xs text-muted-foreground">
                {testimonial.role}
                {testimonial.role && testimonial.company && " · "}
                {testimonial.company}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3">
          <StarRating rating={testimonial.rating} />
        </div>
      </CardContent>
    </Card>
  );
}

export function TestimonialsCarousel({
  testimonials,
  title = "O que dizem nossos clientes",
  subtitle,
  className,
  autoplayInterval = 5000,
}: TestimonialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const totalItems = testimonials.length;

  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setItemsPerView(3);
      } else if (width >= 640) {
        setItemsPerView(2);
      } else {
        setItemsPerView(1);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const maxIndex = Math.max(0, totalItems - itemsPerView);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (totalItems <= itemsPerView || isPaused) return;

    const interval = setInterval(goToNext, autoplayInterval);
    return () => clearInterval(interval);
  }, [totalItems, itemsPerView, isPaused, autoplayInterval, goToNext]);

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [currentIndex, maxIndex]);

  if (!totalItems) return null;

  return (
    <section
      className={cn("py-10 xs:py-12 sm:py-16 md:py-20 lg:py-24 px-2 xs:px-3 sm:px-4 md:px-6 lg:px-8 bg-muted/20", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label={title}
    >
      <div className="container mx-auto max-w-full sm:max-w-6xl lg:max-w-7xl 3xl:max-w-[2000px]">
        <div className="mb-6 xs:mb-8 sm:mb-10 md:mb-12 text-center px-1">
          <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 3xl:text-6xl font-bold mb-2 xs:mb-3 sm:mb-4 md:mb-5 leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl 3xl:text-2xl text-muted-foreground max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-3xl 3xl:max-w-5xl mx-auto leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="relative">
          <div className="overflow-hidden" aria-roledescription="carousel">
            <div
              ref={trackRef}
              className="flex transition-transform duration-700 ease-in-out will-change-transform"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="w-full shrink-0 px-2 xs:px-3 sm:px-4"
                  style={{ flex: `0 0 ${100 / itemsPerView}%` }}
                  aria-roledescription="slide"
                >
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          </div>

          {totalItems > itemsPerView && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 hidden sm:flex h-9 w-9 rounded-full border-primary/30 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/60"
                onClick={goToPrevious}
                aria-label="Depoimento anterior"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 hidden sm:flex h-9 w-9 rounded-full border-primary/30 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:border-primary/60"
                onClick={goToNext}
                aria-label="Próximo depoimento"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </Button>
            </>
          )}
        </div>

        {totalItems > itemsPerView && (
          <div className="mt-5 xs:mt-6 sm:mt-8 flex items-center justify-center gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                aria-label={`Ir para o grupo de depoimentos ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
