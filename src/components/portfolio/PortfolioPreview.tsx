import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Play, Images, Monitor, Tablet, Smartphone } from "lucide-react";
import { useState } from "react";

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  niche: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  cover_url: string | null;
  is_active: boolean;
  is_public: boolean;
  slug: string | null;
  created_at: string;
  background_color: string | null;
  overlay_color: string | null;
  overlay_opacity: number | null;
  title_color: string | null;
  description_color: string | null;
  card_background_color: string | null;
  card_text_color: string | null;
  button_text_color: string | null;
  button_bg_color: string | null;
  button1_label: string | null;
  button1_url: string | null;
  button1_bg_color: string | null;
  button1_text_color: string | null;
  button1_shadow: boolean | null;
  button1_enabled: boolean | null;
  button2_label: string | null;
  button2_url: string | null;
  button2_bg_color: string | null;
  button2_text_color: string | null;
  button2_shadow: boolean | null;
  button2_enabled: boolean | null;
}

interface PortfolioItem {
  id: string;
  portfolio_id: string;
  title: string;
  description: string | null;
  category: string;
  image_url: string | null;
  video_url: string | null;
  project_url: string | null;
  client_name: string | null;
  display_order: number;
  is_featured: boolean;
  images: string[] | null;
  is_scrollable_screenshot: boolean;
}

type DeviceType = "desktop" | "tablet" | "mobile";

interface PortfolioPreviewProps {
  portfolio: Portfolio;
  items: PortfolioItem[];
}

export function PortfolioPreview({ portfolio, items }: PortfolioPreviewProps) {
  const [device, setDevice] = useState<DeviceType>("desktop");

  const bgColor = portfolio.background_color || "#ffffff";
  const overlayColor = portfolio.overlay_color || "#000000";
  const overlayOpacity = portfolio.overlay_opacity ?? 0.4;
  const titleColor = portfolio.title_color || "#ffffff";
  const descriptionColor = portfolio.description_color || "#f0f0f0";
  const cardBgColor = portfolio.card_background_color || "#ffffff";
  const cardTextColor = portfolio.card_text_color || "#1a1a2e";

  const featuredItems = items.filter((item) => item.is_featured);

  const getDeviceWidth = () => {
    switch (device) {
      case "mobile":
        return "max-w-[375px]";
      case "tablet":
        return "max-w-[768px]";
      default:
        return "max-w-full";
    }
  };

  const getScaleClass = () => {
    switch (device) {
      case "mobile":
        return "scale-100";
      case "tablet":
        return "scale-95";
      default:
        return "scale-90";
    }
  };

  return (
    <div className="space-y-4">
      {/* Device Selector */}
      <div className="flex items-center justify-center gap-2 p-2 bg-muted/50 rounded-lg">
        <Button
          variant={device === "desktop" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDevice("desktop")}
          className="gap-2"
        >
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">Desktop</span>
        </Button>
        <Button
          variant={device === "tablet" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDevice("tablet")}
          className="gap-2"
        >
          <Tablet className="w-4 h-4" />
          <span className="hidden sm:inline">Tablet</span>
        </Button>
        <Button
          variant={device === "mobile" ? "default" : "ghost"}
          size="sm"
          onClick={() => setDevice("mobile")}
          className="gap-2"
        >
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">Mobile</span>
        </Button>
      </div>

      {/* Preview Container */}
      <div className="border rounded-lg overflow-hidden bg-muted/30 p-4">
        <div 
          className={`mx-auto ${getDeviceWidth()} ${getScaleClass()} origin-top transition-all duration-300`}
        >
          <div 
            className="rounded-lg overflow-hidden shadow-xl border"
            style={{ backgroundColor: bgColor }}
          >
            {/* Hero Section */}
            <div
              className="relative min-h-[180px] flex items-center justify-center overflow-hidden"
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
              <div className="relative z-10 text-center px-4 py-6 w-full">
                {portfolio.logo_url && (
                  <div className="mb-3 flex justify-center">
                    <img
                      src={portfolio.logo_url}
                      alt={portfolio.name}
                      className="max-w-[100px] max-h-[50px] object-contain drop-shadow-lg"
                    />
                  </div>
                )}
                <h1 
                  className="text-lg sm:text-xl font-bold mb-1 leading-tight"
                  style={{ color: titleColor }}
                >
                  {portfolio.name}
                </h1>
                {portfolio.description && (
                  <p 
                    className="text-xs sm:text-sm max-w-xs mx-auto leading-relaxed line-clamp-2"
                    style={{ color: descriptionColor }}
                  >
                    {portfolio.description}
                  </p>
                )}

                {/* Custom Buttons */}
                {(portfolio.button1_enabled || portfolio.button2_enabled) && (
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {portfolio.button1_enabled && portfolio.button1_label && (
                      <span
                        className="px-3 py-1.5 rounded-lg font-medium text-xs"
                        style={{
                          backgroundColor: portfolio.button1_bg_color || "#3b82f6",
                          color: portfolio.button1_text_color || "#ffffff",
                          boxShadow: portfolio.button1_shadow ? "0 4px 14px rgba(0, 0, 0, 0.25)" : "none",
                        }}
                      >
                        {portfolio.button1_label}
                      </span>
                    )}
                    {portfolio.button2_enabled && portfolio.button2_label && (
                      <span
                        className="px-3 py-1.5 rounded-lg font-medium text-xs"
                        style={{
                          backgroundColor: portfolio.button2_bg_color || "#10b981",
                          color: portfolio.button2_text_color || "#ffffff",
                          boxShadow: portfolio.button2_shadow ? "0 4px 14px rgba(0, 0, 0, 0.25)" : "none",
                        }}
                      >
                        {portfolio.button2_label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Featured Items */}
            {featuredItems.length > 0 && (
              <div className="p-3 sm:p-4">
                <h2
                  className="text-sm sm:text-base font-bold mb-2 sm:mb-3 flex items-center gap-1"
                  style={{ color: portfolio.primary_color }}
                >
                  <Star className="w-3 h-3 sm:w-4 sm:h-4" /> Destaques
                </h2>
                <div className={`grid gap-2 sm:gap-3 ${device === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                  {featuredItems.slice(0, device === "mobile" ? 2 : 4).map((item) => (
                    <PreviewCard 
                      key={item.id} 
                      item={item} 
                      cardBgColor={cardBgColor}
                      cardTextColor={cardTextColor}
                      primaryColor={portfolio.primary_color}
                      secondaryColor={portfolio.secondary_color}
                      isFeatured
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Items */}
            {items.length > 0 && (
              <div className="p-3 sm:p-4">
                <h2
                  className="text-sm sm:text-base font-bold mb-2 sm:mb-3"
                  style={{ color: portfolio.primary_color }}
                >
                  Trabalhos
                </h2>
                <div className={`grid gap-2 sm:gap-3 ${device === "mobile" ? "grid-cols-1" : device === "tablet" ? "grid-cols-2" : "grid-cols-3"}`}>
                  {items.slice(0, device === "mobile" ? 3 : device === "tablet" ? 4 : 6).map((item) => (
                    <PreviewCard 
                      key={item.id} 
                      item={item} 
                      cardBgColor={cardBgColor}
                      cardTextColor={cardTextColor}
                      primaryColor={portfolio.primary_color}
                      secondaryColor={portfolio.secondary_color}
                    />
                  ))}
                </div>
                {items.length > (device === "mobile" ? 3 : device === "tablet" ? 4 : 6) && (
                  <p className="text-center text-xs text-muted-foreground mt-3">
                    + {items.length - (device === "mobile" ? 3 : device === "tablet" ? 4 : 6)} trabalhos
                  </p>
                )}
              </div>
            )}

            {/* Empty State */}
            {items.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Adicione trabalhos ao seu portfólio para visualizá-los aqui
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PreviewCardProps {
  item: PortfolioItem;
  cardBgColor: string;
  cardTextColor: string;
  primaryColor: string;
  secondaryColor: string;
  isFeatured?: boolean;
}

function PreviewCard({ item, cardBgColor, cardTextColor, primaryColor, secondaryColor, isFeatured }: PreviewCardProps) {
  return (
    <Card
      className="group overflow-hidden border-0 rounded-lg"
      style={{ backgroundColor: cardBgColor }}
    >
      <div className="relative aspect-video overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}40 0%, ${secondaryColor}40 100%)`,
            }}
          >
            <span 
              className="text-xl font-bold" 
              style={{ color: cardTextColor, opacity: 0.5 }}
            >
              {item.title[0]}
            </span>
          </div>
        )}
        {item.video_url && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-full p-1.5">
              <Play className="w-3 h-3" style={{ color: primaryColor }} />
            </div>
          </div>
        )}
        {item.images && item.images.length > 0 && (
          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded flex items-center gap-0.5">
            <Images className="w-2 h-2" />
            {item.images.length}
          </div>
        )}
        {isFeatured && (
          <Badge
            className="absolute top-1 right-1 text-[8px] px-1 py-0"
            style={{ backgroundColor: primaryColor, color: "#fff" }}
          >
            <Star className="w-2 h-2 mr-0.5" /> Destaque
          </Badge>
        )}
      </div>
      <CardContent className="p-2">
        <h3 
          className="font-semibold text-xs line-clamp-1" 
          style={{ color: cardTextColor }}
        >
          {item.title}
        </h3>
        <p 
          className="text-[10px] line-clamp-1" 
          style={{ color: cardTextColor, opacity: 0.7 }}
        >
          {item.category}
        </p>
      </CardContent>
    </Card>
  );
}
