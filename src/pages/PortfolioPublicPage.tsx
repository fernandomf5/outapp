import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ExternalLink, Star, Play, ChevronLeft, ChevronRight, Images, ChevronDown, ChevronUp, Menu, X, Filter } from "lucide-react";

// Component for truncated description with "see more" button
const TruncatedDescription = ({ 
  text, 
  maxLength = 150, 
  className = "",
  style = {}
}: { 
  text: string; 
  maxLength?: number; 
  className?: string;
  style?: React.CSSProperties;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (text.length <= maxLength) {
    return <p className={className} style={style}>{text}</p>;
  }
  
  return (
    <div>
      <p className={className} style={style}>
        {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className="flex items-center gap-1 text-xs sm:text-sm font-medium mt-1 hover:underline transition-all"
        style={{ color: style?.color || 'inherit', opacity: 0.9 }}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
            Ver menos
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
            Ver descrição completa
          </>
        )}
      </button>
    </div>
  );
};

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  niche: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  cover_url: string | null;
  is_public: boolean;
  background_color: string | null;
  overlay_color: string | null;
  overlay_opacity: number | null;
  title_color: string | null;
  description_color: string | null;
  card_background_color: string | null;
  card_text_color: string | null;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  video_url: string | null;
  project_url: string | null;
  client_name: string | null;
  is_featured: boolean;
  display_order: number;
  images: string[] | null;
  is_scrollable_screenshot: boolean;
}

export default function PortfolioPublicPage() {
  const { portfolioId } = useParams();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (portfolioId) {
      fetchPortfolio();
    }
  }, [portfolioId]);

  const fetchPortfolio = async () => {
    setLoading(true);

    const { data: portfolioData, error: portfolioError } = await supabase
      .from("portfolios")
      .select("*")
      .eq("id", portfolioId)
      .eq("is_public", true)
      .single();

    if (!portfolioError && portfolioData) {
      setPortfolio(portfolioData);

      const { data: itemsData } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("portfolio_id", portfolioId)
        .order("display_order", { ascending: true });

      if (itemsData) {
        setItems(itemsData);
      }
    }

    setLoading(false);
  };

  const categories = ["all", ...new Set(items.map((item) => item.category).filter(Boolean))];
  const filteredItems = filter === "all" ? items : items.filter((item) => item.category === filter);
  const featuredItems = items.filter((item) => item.is_featured);

  const getItemImages = (item: PortfolioItem | null): string[] => {
    if (!item) return [];
    if (item.images && item.images.length > 0) {
      return item.images;
    }
    return [];
  };

  const selectedItemImages = getItemImages(selectedItem);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? selectedItemImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === selectedItemImages.length - 1 ? 0 : prev + 1
    );
  };

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedItem]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Portfólio não encontrado</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Este portfólio não existe ou não está público.</p>
        </div>
      </div>
    );
  }

  // Custom colors with fallbacks
  const bgColor = portfolio.background_color || "#ffffff";
  const overlayColor = portfolio.overlay_color || "#000000";
  const overlayOpacity = portfolio.overlay_opacity ?? 0.4;
  const titleColor = portfolio.title_color || "#ffffff";
  const descriptionColor = portfolio.description_color || "#f0f0f0";
  const cardBgColor = portfolio.card_background_color || "#ffffff";
  const cardTextColor = portfolio.card_text_color || "#1a1a2e";

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: bgColor }}>
      {/* Hero Section - Responsive heights for all devices */}
      <div
        className="relative min-h-[50vh] sm:min-h-[45vh] md:min-h-[50vh] lg:min-h-[55vh] xl:min-h-[60vh] 2xl:min-h-[50vh] flex items-center justify-center overflow-hidden"
        style={{
          background: portfolio.cover_url
            ? `url(${portfolio.cover_url}) center/cover no-repeat`
            : `linear-gradient(135deg, ${portfolio.primary_color} 0%, ${portfolio.secondary_color} 100%)`,
        }}
      >
        <div 
          className="absolute inset-0" 
          style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
        />
        <div className="relative z-10 text-center px-4 sm:px-6 md:px-8 lg:px-12 py-8 sm:py-10 md:py-12 w-full max-w-7xl mx-auto">
          {portfolio.logo_url && (
            <div className="mb-4 sm:mb-6 md:mb-8 flex justify-center">
              <img
                src={portfolio.logo_url}
                alt={portfolio.name}
                className="max-w-[150px] sm:max-w-[200px] md:max-w-[280px] lg:max-w-[350px] xl:max-w-[400px] 2xl:max-w-[450px] max-h-[80px] sm:max-h-[100px] md:max-h-[140px] lg:max-h-[180px] xl:max-h-[200px] 2xl:max-h-[220px] w-auto h-auto object-contain drop-shadow-lg"
              />
            </div>
          )}
          <h1 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight"
            style={{ color: titleColor }}
          >
            {portfolio.name}
          </h1>
          {portfolio.description && (
            <p 
              className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto leading-relaxed"
              style={{ color: descriptionColor }}
            >
              {portfolio.description}
            </p>
          )}
        </div>
      </div>

      {/* Destaques - Fully responsive grid */}
      {featuredItems.length > 0 && (
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8 sm:py-10 md:py-12 lg:py-16 max-w-[2000px] mx-auto">
          <h2
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 flex items-center gap-2"
            style={{ color: portfolio.primary_color }}
          >
            <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" /> Destaques
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
            {featuredItems.map((item) => (
              <Card
                key={item.id}
                className="group cursor-pointer overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 rounded-lg sm:rounded-xl"
                style={{ backgroundColor: cardBgColor }}
                onClick={() => setSelectedItem(item)}
              >
                <div className="relative aspect-video overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${portfolio.primary_color}40 0%, ${portfolio.secondary_color}40 100%)`,
                      }}
                    >
                      <span className="text-3xl sm:text-4xl md:text-5xl font-bold" style={{ color: cardTextColor, opacity: 0.5 }}>{item.title[0]}</span>
                    </div>
                  )}
                  {item.video_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white rounded-full p-2 sm:p-3 md:p-4">
                        <Play className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" style={{ color: portfolio.primary_color }} />
                      </div>
                    </div>
                  )}
                  {item.images && item.images.length > 0 && (
                    <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black/60 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center gap-1">
                      <Images className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      {item.images.length}
                    </div>
                  )}
                  <Badge
                    className="absolute top-2 sm:top-3 right-2 sm:right-3 text-[10px] sm:text-xs"
                    style={{ backgroundColor: portfolio.primary_color, color: "#fff" }}
                  >
                    <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" /> Destaque
                  </Badge>
                </div>
                <CardContent className="p-3 sm:p-4 md:p-5">
                  <h3 className="font-semibold text-base sm:text-lg md:text-xl mb-1 line-clamp-1" style={{ color: cardTextColor }}>{item.title}</h3>
                  <p className="text-xs sm:text-sm md:text-base line-clamp-1" style={{ color: cardTextColor, opacity: 0.7 }}>{item.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Grid de Trabalhos - Responsive for all screen sizes */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 md:py-10 lg:py-12 max-w-[2000px] mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
          <h2
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold"
            style={{ color: portfolio.primary_color }}
          >
            Trabalhos
          </h2>
          
          {/* Off-canvas category menu */}
          {categories.length > 1 && (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-xs sm:text-sm md:text-base px-3 sm:px-4 py-2"
                  style={{ 
                    borderColor: portfolio.primary_color + "60",
                    color: cardTextColor
                  }}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">Categorias</span>
                  {filter !== "all" && (
                    <Badge 
                      className="ml-1 text-[10px] sm:text-xs"
                      style={{ backgroundColor: portfolio.primary_color, color: "#fff" }}
                    >
                      {filter}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-[280px] sm:w-[350px] p-0"
                style={{ backgroundColor: cardBgColor }}
              >
                <SheetHeader className="p-4 sm:p-6 border-b" style={{ borderColor: cardTextColor + "20" }}>
                  <SheetTitle 
                    className="text-lg sm:text-xl font-bold flex items-center gap-2"
                    style={{ color: cardTextColor }}
                  >
                    <Filter className="w-5 h-5" style={{ color: portfolio.primary_color }} />
                    Categorias
                  </SheetTitle>
                </SheetHeader>
                
                <div className="p-4 sm:p-6 space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilter(cat)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between group ${
                        filter === cat ? "font-semibold" : "hover:translate-x-1"
                      }`}
                      style={{ 
                        backgroundColor: filter === cat ? portfolio.primary_color + "20" : "transparent",
                        color: cardTextColor,
                        borderLeft: filter === cat ? `3px solid ${portfolio.primary_color}` : "3px solid transparent"
                      }}
                    >
                      <span className="text-sm sm:text-base">
                        {cat === "all" ? "Todos os trabalhos" : cat}
                      </span>
                      {filter === cat && (
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: portfolio.primary_color }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                
                {filter !== "all" && (
                  <div className="p-4 sm:p-6 border-t" style={{ borderColor: cardTextColor + "20" }}>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setFilter("all")}
                      style={{ 
                        borderColor: portfolio.primary_color,
                        color: portfolio.primary_color
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Limpar filtro
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 border-0 rounded-lg"
              style={{ backgroundColor: cardBgColor }}
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative aspect-square overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${portfolio.primary_color}30 0%, ${portfolio.secondary_color}30 100%)`,
                    }}
                  >
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: cardTextColor, opacity: 0.5 }}>{item.title[0]}</span>
                  </div>
                )}
                {item.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-1.5 sm:p-2">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: portfolio.primary_color }} />
                    </div>
                  </div>
                )}
                {item.images && item.images.length > 0 && (
                  <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 bg-black/60 text-white text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-0.5 sm:gap-1">
                    <Images className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" />
                    {item.images.length}
                  </div>
                )}
              </div>
              <CardContent className="p-2 sm:p-3 md:p-4">
                <h3 className="font-semibold text-xs sm:text-sm md:text-base truncate" style={{ color: cardTextColor }}>{item.title}</h3>
                <div className="flex items-center justify-between mt-0.5 sm:mt-1">
                  <p className="text-[10px] sm:text-xs md:text-sm truncate flex-1" style={{ color: cardTextColor, opacity: 0.7 }}>{item.category}</p>
                  {item.is_featured && <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 shrink-0 ml-1" />}
                </div>
                {item.client_name && (
                  <p className="text-[9px] sm:text-[10px] md:text-xs mt-0.5 sm:mt-1 truncate" style={{ color: cardTextColor, opacity: 0.6 }}>Cliente: {item.client_name}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 sm:py-12 md:py-16" style={{ color: cardTextColor, opacity: 0.6 }}>
            <p className="text-sm sm:text-base md:text-lg">Nenhum trabalho encontrado nesta categoria.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="py-6 sm:py-8 md:py-10 text-center px-4"
        style={{
          background: `linear-gradient(135deg, ${portfolio.primary_color}10 0%, ${portfolio.secondary_color}10 100%)`,
        }}
      >
        <p className="text-xs sm:text-sm md:text-base" style={{ color: cardTextColor, opacity: 0.7 }}>
          Portfólio criado com{" "}
          <a href="/" className="font-semibold hover:underline" style={{ color: portfolio.primary_color }}>
            Out App
          </a>
        </p>
      </footer>

      {/* Modal de Detalhes - Responsive */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl pr-8">{selectedItem.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
                {selectedItem.video_url ? (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={selectedItem.video_url.replace("watch?v=", "embed/")}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                ) : selectedItemImages.length > 0 ? (
                  selectedItem.is_scrollable_screenshot ? (
                    <div className="relative bg-black/5 dark:bg-black/20 rounded-lg overflow-hidden">
                      <div className="max-h-[40vh] sm:max-h-[50vh] md:max-h-[60vh] overflow-y-auto scrollbar-thin">
                        <img
                          src={selectedItemImages[currentImageIndex]}
                          alt={`${selectedItem.title} - ${currentImageIndex + 1}`}
                          className="w-full object-contain"
                        />
                      </div>
                      
                      {selectedItemImages.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10 h-8 w-8 sm:h-10 sm:w-10"
                            onClick={handlePrevImage}
                          >
                            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10 h-8 w-8 sm:h-10 sm:w-10"
                            onClick={handleNextImage}
                          >
                            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                          </Button>
                          
                          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5 z-10">
                            {selectedItemImages.map((_, idx) => (
                              <button
                                key={idx}
                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                                  idx === currentImageIndex 
                                    ? "bg-white w-3 sm:w-4" 
                                    : "bg-white/50 hover:bg-white/75"
                                }`}
                                onClick={() => setCurrentImageIndex(idx)}
                              />
                            ))}
                          </div>
                          
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black/60 text-white text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded z-10">
                            {currentImageIndex + 1} / {selectedItemImages.length}
                          </div>
                        </>
                      )}
                      
                      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black/60 text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded flex items-center gap-1 z-10">
                        <span>↕ Role para ver mais</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative bg-black/5 dark:bg-black/20 rounded-lg">
                      <img
                        src={selectedItemImages[currentImageIndex]}
                        alt={`${selectedItem.title} - ${currentImageIndex + 1}`}
                        className="w-full rounded-lg object-contain max-h-[40vh] sm:max-h-[50vh] md:max-h-[60vh] mx-auto"
                      />
                      
                      {selectedItemImages.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
                            onClick={handlePrevImage}
                          >
                            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
                            onClick={handleNextImage}
                          >
                            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
                          </Button>
                          
                          <div className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5">
                            {selectedItemImages.map((_, idx) => (
                              <button
                                key={idx}
                                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                                  idx === currentImageIndex 
                                    ? "bg-white w-3 sm:w-4" 
                                    : "bg-white/50 hover:bg-white/75"
                                }`}
                                onClick={() => setCurrentImageIndex(idx)}
                              />
                            ))}
                          </div>
                          
                          <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black/60 text-white text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                            {currentImageIndex + 1} / {selectedItemImages.length}
                          </div>
                        </>
                      )}
                    </div>
                  )
                ) : selectedItem.image_url ? (
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.title}
                    className="w-full rounded-lg object-contain max-h-[40vh] sm:max-h-[50vh] md:max-h-[60vh]"
                  />
                ) : null}

                <div className="space-y-2 sm:space-y-3">
                  {selectedItem.category && (
                    <Badge className="text-xs sm:text-sm" style={{ backgroundColor: portfolio.primary_color, color: "#fff" }}>
                      {selectedItem.category}
                    </Badge>
                  )}
                  {selectedItem.client_name && (
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <strong>Cliente:</strong> {selectedItem.client_name}
                    </p>
                  )}
                  {selectedItem.description && (
                    <TruncatedDescription 
                      text={selectedItem.description} 
                      maxLength={200}
                      className="text-sm sm:text-base text-muted-foreground"
                    />
                  )}
                </div>

                {selectedItem.project_url && (
                  <Button asChild className="w-full text-sm sm:text-base py-2 sm:py-3" style={{ backgroundColor: portfolio.primary_color }}>
                    <a href={selectedItem.project_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" /> Ver Projeto
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}