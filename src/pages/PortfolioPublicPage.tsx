import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Star, Play, ChevronLeft, ChevronRight, Images } from "lucide-react";

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

  // Get only gallery images for selected item (main image is just for thumbnail/logo)
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

  // Reset image index when selecting a new item
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedItem]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Portfólio não encontrado</h1>
          <p className="text-muted-foreground">Este portfólio não existe ou não está público.</p>
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
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      {/* Hero Section */}
      <div
        className="relative h-[40vh] md:h-[50vh] flex items-center justify-center overflow-hidden"
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
        <div className="relative z-10 text-center p-6">
          {portfolio.logo_url && (
            <div className="mb-6 flex justify-center">
              <img
                src={portfolio.logo_url}
                alt={portfolio.name}
                className="max-w-[200px] md:max-w-[280px] max-h-[120px] md:max-h-[160px] w-auto h-auto object-contain drop-shadow-lg"
              />
            </div>
          )}
          <h1 
            className="text-3xl md:text-5xl font-bold mb-3"
            style={{ color: titleColor }}
          >
            {portfolio.name}
          </h1>
          {portfolio.description && (
            <p 
              className="text-lg md:text-xl max-w-2xl mx-auto"
              style={{ color: descriptionColor }}
            >
              {portfolio.description}
            </p>
          )}
        </div>
      </div>

      {/* Destaques */}
      {featuredItems.length > 0 && (
        <div className="container mx-auto px-4 py-12">
          <h2
            className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2"
            style={{ color: portfolio.primary_color }}
          >
            <Star className="w-6 h-6" /> Destaques
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <Card
                key={item.id}
                className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 border-0"
                style={{ backgroundColor: cardBgColor }}
                onClick={() => setSelectedItem(item)}
              >
                <div className="relative aspect-video overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${portfolio.primary_color}40 0%, ${portfolio.secondary_color}40 100%)`,
                      }}
                    >
                      <span className="text-4xl font-bold" style={{ color: cardTextColor, opacity: 0.5 }}>{item.title[0]}</span>
                    </div>
                  )}
                  {item.video_url && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white rounded-full p-3">
                        <Play className="w-8 h-8" style={{ color: portfolio.primary_color }} />
                      </div>
                    </div>
                  )}
                  {item.images && item.images.length > 0 && (
                    <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                      <Images className="w-3 h-3" />
                      {item.images.length}
                    </div>
                  )}
                  <Badge
                    className="absolute top-3 right-3"
                    style={{ backgroundColor: portfolio.primary_color, color: "#fff" }}
                  >
                    <Star className="w-3 h-3 mr-1" /> Destaque
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1" style={{ color: cardTextColor }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: cardTextColor, opacity: 0.7 }}>{item.category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      {categories.length > 1 && (
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={filter === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(cat)}
                style={filter === cat ? { backgroundColor: portfolio.primary_color, color: "#fff" } : { color: cardTextColor, borderColor: cardTextColor + "40" }}
              >
                {cat === "all" ? "Todos" : cat}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Grid de Trabalhos */}
      <div className="container mx-auto px-4 py-8">
        <h2
          className="text-2xl md:text-3xl font-bold mb-6"
          style={{ color: portfolio.primary_color }}
        >
          Trabalhos
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 border-0"
              style={{ backgroundColor: cardBgColor }}
              onClick={() => setSelectedItem(item)}
            >
              <div className="relative aspect-square overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${portfolio.primary_color}30 0%, ${portfolio.secondary_color}30 100%)`,
                    }}
                  >
                    <span className="text-4xl font-bold" style={{ color: cardTextColor, opacity: 0.5 }}>{item.title[0]}</span>
                  </div>
                )}
                {item.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white rounded-full p-2">
                      <Play className="w-6 h-6" style={{ color: portfolio.primary_color }} />
                    </div>
                  </div>
                )}
                {item.images && item.images.length > 0 && (
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <Images className="w-3 h-3" />
                    {item.images.length}
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate" style={{ color: cardTextColor }}>{item.title}</h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm truncate" style={{ color: cardTextColor, opacity: 0.7 }}>{item.category}</p>
                  {item.is_featured && <Star className="w-4 h-4 text-yellow-500 shrink-0" />}
                </div>
                {item.client_name && (
                  <p className="text-xs mt-1" style={{ color: cardTextColor, opacity: 0.6 }}>Cliente: {item.client_name}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12" style={{ color: cardTextColor, opacity: 0.6 }}>
            <p>Nenhum trabalho encontrado nesta categoria.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        className="py-8 text-center"
        style={{
          background: `linear-gradient(135deg, ${portfolio.primary_color}10 0%, ${portfolio.secondary_color}10 100%)`,
        }}
      >
        <p style={{ color: cardTextColor, opacity: 0.7 }}>
          Portfólio criado com{" "}
          <a href="/" className="font-semibold hover:underline" style={{ color: portfolio.primary_color }}>
            Out App
          </a>
        </p>
      </footer>

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedItem.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
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
                      <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
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
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
                            onClick={handlePrevImage}
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full z-10"
                            onClick={handleNextImage}
                          >
                            <ChevronRight className="w-6 h-6" />
                          </Button>
                          
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                            {selectedItemImages.map((_, idx) => (
                              <button
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  idx === currentImageIndex 
                                    ? "bg-white w-4" 
                                    : "bg-white/50 hover:bg-white/75"
                                }`}
                                onClick={() => setCurrentImageIndex(idx)}
                              />
                            ))}
                          </div>
                          
                          <div className="absolute top-3 right-3 bg-black/60 text-white text-sm px-2 py-1 rounded z-10">
                            {currentImageIndex + 1} / {selectedItemImages.length}
                          </div>
                        </>
                      )}
                      
                      <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 z-10">
                        <span>↕ Role para ver mais</span>
                      </div>
                    </div>
                  ) : (
                    <div className="relative bg-black/5 dark:bg-black/20 rounded-lg">
                      <img
                        src={selectedItemImages[currentImageIndex]}
                        alt={`${selectedItem.title} - ${currentImageIndex + 1}`}
                        className="w-full rounded-lg object-contain max-h-[60vh] mx-auto"
                      />
                      
                      {selectedItemImages.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                            onClick={handlePrevImage}
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                            onClick={handleNextImage}
                          >
                            <ChevronRight className="w-6 h-6" />
                          </Button>
                          
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {selectedItemImages.map((_, idx) => (
                              <button
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  idx === currentImageIndex 
                                    ? "bg-white w-4" 
                                    : "bg-white/50 hover:bg-white/75"
                                }`}
                                onClick={() => setCurrentImageIndex(idx)}
                              />
                            ))}
                          </div>
                          
                          <div className="absolute top-3 right-3 bg-black/60 text-white text-sm px-2 py-1 rounded">
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
                    className="w-full rounded-lg object-contain max-h-[60vh]"
                  />
                ) : null}

                <div className="space-y-3">
                  {selectedItem.category && (
                    <Badge style={{ backgroundColor: portfolio.primary_color, color: "#fff" }}>
                      {selectedItem.category}
                    </Badge>
                  )}
                  {selectedItem.client_name && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Cliente:</strong> {selectedItem.client_name}
                    </p>
                  )}
                  {selectedItem.description && (
                    <p className="text-muted-foreground">{selectedItem.description}</p>
                  )}
                </div>

                {selectedItem.project_url && (
                  <Button asChild className="w-full" style={{ backgroundColor: portfolio.primary_color }}>
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