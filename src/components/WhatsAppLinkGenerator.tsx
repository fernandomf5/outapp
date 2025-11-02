import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Link, MessageCircle } from "lucide-react";

export const WhatsAppLinkGenerator = () => {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const generateLink = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}${message ? `?text=${encodedMessage}` : ''}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generateLink());
    toast({
      title: "Link copiado!",
      description: "O link do WhatsApp foi copiado."
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-primary" />
        Gerador de Link para WhatsApp
      </h2>

      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label>Número do WhatsApp *</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ex: 5511999999999"
              type="tel"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formato: código do país + DDD + número (sem espaços ou símbolos)
            </p>
          </div>

          <div>
            <Label>Mensagem Inicial (opcional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Olá! Gostaria de mais informações..."
              rows={3}
            />
          </div>

          <div className="bg-accent/50 p-4 rounded-lg">
            <Label className="mb-2 block">Link Gerado:</Label>
            <div className="flex gap-2">
              <Input
                value={generateLink()}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={handleCopyLink} size="icon" variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Link className="w-4 h-4" />
              Como Usar:
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Cole este link em botões do seu site</li>
              <li>• Compartilhe em redes sociais</li>
              <li>• Use em campanhas de email marketing</li>
              <li>• Adicione em QR Codes</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
};
