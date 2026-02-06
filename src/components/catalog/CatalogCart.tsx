import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  MessageCircle,
  Package,
  Wrench,
  User,
  Phone,
} from "lucide-react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "product" | "service";
  image_url?: string | null;
  price_type?: string;
}

interface CatalogCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  catalogName: string;
  whatsappNumber: string | null;
  primaryColor: string;
  textColor: string;
  backgroundColor: string;
  showPrices: boolean;
}

export function CatalogCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  catalogName,
  whatsappNumber,
  primaryColor,
  textColor,
  backgroundColor,
  showPrices,
}: CatalogCartProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.price_type === "quote" ? 0 : item.price * item.quantity),
    0
  );
  const hasQuoteItems = items.some((item) => item.price_type === "quote");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const handleWhatsAppCheckout = () => {
    if (!whatsappNumber || items.length === 0) return;

    let message = `🛒 *Novo Pedido - ${catalogName}*\n\n`;

    if (customerName) {
      message += `👤 *Cliente:* ${customerName}\n`;
    }
    if (customerPhone) {
      message += `📞 *Telefone:* ${customerPhone}\n`;
    }
    message += "\n";

    message += `📋 *Itens do Pedido:*\n`;
    message += `─────────────────\n`;

    items.forEach((item, index) => {
      const icon = item.type === "product" ? "📦" : "🔧";
      message += `${icon} ${item.name}\n`;
      message += `   Qtd: ${item.quantity}`;
      if (showPrices) {
        if (item.price_type === "quote") {
          message += ` | Preço: Sob consulta`;
        } else {
          message += ` | ${formatPrice(item.price)} cada`;
          message += ` | Subtotal: ${formatPrice(item.price * item.quantity)}`;
        }
      }
      message += `\n`;
      if (index < items.length - 1) {
        message += `\n`;
      }
    });

    message += `─────────────────\n`;

    if (showPrices) {
      if (hasQuoteItems) {
        message += `\n💰 *Subtotal (itens com preço):* ${formatPrice(totalPrice)}`;
        message += `\n⚠️ _Alguns itens precisam de orçamento_\n`;
      } else {
        message += `\n💰 *Total:* ${formatPrice(totalPrice)}\n`;
      }
    }

    if (customerNotes) {
      message += `\n📝 *Observações:*\n${customerNotes}\n`;
    }

    message += `\n_Pedido enviado via catálogo digital_`;

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");

    // Clear cart and form after sending
    onClearCart();
    setCustomerName("");
    setCustomerPhone("");
    setCustomerNotes("");
    setIsOpen(false);
  };

  if (!whatsappNumber) return null;

  return (
    <>
      {/* Floating Cart Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
        style={{ backgroundColor: primaryColor }}
      >
        <ShoppingCart className="w-6 h-6 text-white" />
        {totalItems > 0 && (
          <Badge
            className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs font-bold bg-red-500 text-white border-2 border-white"
          >
            {totalItems > 99 ? "99+" : totalItems}
          </Badge>
        )}
      </Button>

      {/* Cart Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          className="w-full sm:max-w-lg flex flex-col"
          style={{ backgroundColor, color: textColor }}
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2" style={{ color: textColor }}>
              <ShoppingCart className="w-5 h-5" />
              Seu Carrinho
              {totalItems > 0 && (
                <Badge variant="secondary">{totalItems} {totalItems === 1 ? "item" : "itens"}</Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <ShoppingCart
                className="w-16 h-16 mb-4"
                style={{ color: `${textColor}40` }}
              />
              <h3 className="text-lg font-semibold mb-2" style={{ color: textColor }}>
                Carrinho vazio
              </h3>
              <p style={{ color: `${textColor}70` }}>
                Adicione itens ao carrinho para fazer seu pedido
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-4 py-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 rounded-lg border overflow-hidden"
                      style={{ borderColor: `${textColor}20` }}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${textColor}10` }}
                        >
                          {item.type === "product" ? (
                            <Package className="w-5 h-5" style={{ color: `${textColor}50` }} />
                          ) : (
                            <Wrench className="w-5 h-5" style={{ color: `${textColor}50` }} />
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 overflow-hidden">
                        <h4 className="font-medium text-sm truncate" style={{ color: textColor }}>
                          {item.name}
                        </h4>
                        {showPrices && (
                          <p className="text-xs font-semibold" style={{ color: primaryColor }}>
                            {item.price_type === "quote"
                              ? "Sob consulta"
                              : formatPrice(item.price)}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                            style={{ 
                              borderColor: textColor,
                              backgroundColor: textColor,
                              color: backgroundColor
                            }}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span
                            className="w-8 text-center text-sm font-medium"
                            style={{ color: textColor }}
                          >
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            style={{ 
                              borderColor: textColor,
                              backgroundColor: textColor,
                              color: backgroundColor
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 ml-auto text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Info */}
                <div className="space-y-3 py-4 border-t" style={{ borderColor: `${textColor}20` }}>
                  <h4 className="font-medium text-sm" style={{ color: textColor }}>
                    Seus dados (opcional)
                  </h4>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${textColor}50` }} />
                    <Input
                      placeholder="Seu nome"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="pl-10"
                      style={{ backgroundColor: `${textColor}05`, borderColor: `${textColor}20`, color: textColor }}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: `${textColor}50` }} />
                    <Input
                      placeholder="Seu telefone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="pl-10"
                      style={{ backgroundColor: `${textColor}05`, borderColor: `${textColor}20`, color: textColor }}
                    />
                  </div>
                  <Textarea
                    placeholder="Observações do pedido..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={3}
                    style={{ backgroundColor: `${textColor}05`, borderColor: `${textColor}20`, color: textColor }}
                  />
                </div>
              </ScrollArea>

              <SheetFooter className="flex-col gap-3 border-t pt-4" style={{ borderColor: `${textColor}20` }}>
                {showPrices && (
                  <div className="w-full flex items-center justify-between">
                    <span className="font-medium" style={{ color: textColor }}>
                      {hasQuoteItems ? "Subtotal:" : "Total:"}
                    </span>
                    <span className="text-xl font-bold" style={{ color: primaryColor }}>
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                )}
                {hasQuoteItems && showPrices && (
                  <p className="text-xs w-full text-center" style={{ color: `${textColor}70` }}>
                    *Alguns itens precisam de orçamento
                  </p>
                )}
                <Button
                  onClick={handleWhatsAppCheckout}
                  className="w-full text-white"
                  size="lg"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Enviar Pedido via WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  onClick={onClearCart}
                  className="w-full"
                  style={{ color: `${textColor}70` }}
                >
                  Limpar carrinho
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
