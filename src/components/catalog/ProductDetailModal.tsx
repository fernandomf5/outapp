import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Wrench,
  Clock,
  Box,
  Plus,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
} from "lucide-react";

interface ProductDetailModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: any) => void;
  catalog: {
    primary_color: string;
    background_color: string | null;
    text_color: string | null;
    show_prices: boolean;
    show_stock: boolean;
    show_description: boolean;
    whatsapp_number: string | null;
    name: string;
  };
  formatPrice: (price: number) => string;
}

const priceTypeLabels: { [key: string]: string } = {
  fixed: "",
  hourly: "/hora",
  daily: "/dia",
  monthly: "/mês",
  quote: "Sob consulta",
};

export function ProductDetailModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
  catalog,
  formatPrice,
}: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!item) return null;

  const backgroundColor = catalog.background_color || "#ffffff";
  const textColor = catalog.text_color || "#1f2937";
  const isProduct = item.product_type !== undefined;

  // Build image gallery
  const images: string[] = [];
  if (item.image_url) {
    images.push(item.image_url);
  }
  if (item.gallery_urls && Array.isArray(item.gallery_urls)) {
    images.push(...item.gallery_urls.filter((url: string) => url && url !== item.image_url));
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handleWhatsAppContact = () => {
    if (!catalog.whatsapp_number) return;
    const message = `Olá! Vi seu catálogo "${catalog.name}" e gostaria de saber mais sobre: ${item.name}`;
    const url = `https://wa.me/${catalog.whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleAddToCart = () => {
    onAddToCart({ ...item, type: isProduct ? "product" : "service" });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-0"
        style={{ backgroundColor, color: textColor }}
      >
        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="relative w-full aspect-video overflow-hidden">
            <img
              src={images[currentImageIndex]}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            
            {images.length > 1 && (
              <>
                {/* Navigation Arrows */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex
                          ? "bg-white"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-8">
                <div className="flex gap-2 justify-center overflow-x-auto">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-white scale-110"
                          : "border-transparent opacity-70"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${item.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <DialogHeader className="mb-4">
            <div className="flex items-start justify-between gap-2">
              <DialogTitle
                className="text-2xl font-bold"
                style={{ color: textColor }}
              >
                {item.name}
              </DialogTitle>
              <Badge
                variant="outline"
                className="flex-shrink-0"
                style={{
                  borderColor: catalog.primary_color,
                  color: catalog.primary_color,
                }}
              >
                {isProduct ? (
                  <>
                    <Package className="w-3 h-3 mr-1" />
                    Produto
                  </>
                ) : (
                  <>
                    <Wrench className="w-3 h-3 mr-1" />
                    Serviço
                  </>
                )}
              </Badge>
            </div>
          </DialogHeader>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 mb-4">
            {!isProduct && item.duration_minutes && (
              <span
                className="text-sm flex items-center gap-1"
                style={{ color: `${textColor}80` }}
              >
                <Clock className="w-4 h-4" />
                {item.duration_minutes} min
              </span>
            )}
            {isProduct && catalog.show_stock && item.stock_quantity !== null && (
              <span
                className="text-sm flex items-center gap-1"
                style={{ color: `${textColor}80` }}
              >
                <Box className="w-4 h-4" />
                {item.stock_quantity} unidades em estoque
              </span>
            )}
          </div>

          {/* Price */}
          {catalog.show_prices && (
            <div className="mb-6">
              <span
                className="text-3xl font-bold"
                style={{ color: catalog.primary_color }}
              >
                {item.price_type === "quote"
                  ? "Sob consulta"
                  : formatPrice(item.price)}
                {!isProduct && item.price_type && priceTypeLabels[item.price_type]}
              </span>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div className="mb-6">
              <h3
                className="font-semibold mb-2"
                style={{ color: textColor }}
              >
                Descrição
              </h3>
            {item.description_html ? (
              <div
                className="prose prose-sm max-w-none [&_*]:!bg-transparent [&_*]:!text-inherit"
                style={{ color: `${textColor}90` }}
                dangerouslySetInnerHTML={{ 
                  __html: item.description_html.replace(/color:\s*[^;]+;?/gi, "") 
                }}
              />
            ) : (
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: `${textColor}90` }}
              >
                {item.description}
              </p>
            )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              className="flex-1 text-white"
              style={{ backgroundColor: catalog.primary_color }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar ao Carrinho
            </Button>
            {catalog.whatsapp_number && (
              <Button
                variant="outline"
                onClick={handleWhatsAppContact}
                style={{
                  borderColor: catalog.primary_color,
                  color: catalog.primary_color,
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Perguntar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
