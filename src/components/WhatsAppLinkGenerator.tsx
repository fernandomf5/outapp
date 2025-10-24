import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Link, Code, MessageCircle } from "lucide-react";

export const WhatsAppLinkGenerator = () => {
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [buttonColor, setButtonColor] = useState("#25D366");
  const [buttonPosition, setButtonPosition] = useState("bottom-right");
  const [buttonText, setButtonText] = useState("Fale Conosco");

  const generateLink = () => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}${message ? `?text=${encodedMessage}` : ''}`;
  };

  const generateScript = () => {
    const link = generateLink();
    const positionStyles = {
      'bottom-right': 'bottom: 20px; right: 20px;',
      'bottom-left': 'bottom: 20px; left: 20px;',
      'top-right': 'top: 20px; right: 20px;',
      'top-left': 'top: 20px; left: 20px;'
    };

    return `<!-- WhatsApp Floating Button -->
<style>
  #whatsapp-float-btn {
    position: fixed;
    ${positionStyles[buttonPosition]}
    width: 60px;
    height: 60px;
    min-width: 60px;
    min-height: 60px;
    background-color: ${buttonColor};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    text-decoration: none;
    transition: transform 0.3s ease;
    flex-shrink: 0;
  }
  #whatsapp-float-btn:hover {
    transform: scale(1.1);
  }
  @media (max-width: 768px) {
    #whatsapp-float-btn {
      width: 56px;
      height: 56px;
      min-width: 56px;
      min-height: 56px;
      bottom: ${buttonPosition.includes('bottom') ? '16px' : 'auto'} !important;
      top: ${buttonPosition.includes('top') ? '16px' : 'auto'} !important;
      right: ${buttonPosition.includes('right') ? '16px' : 'auto'} !important;
      left: ${buttonPosition.includes('left') ? '16px' : 'auto'} !important;
    }
  }
</style>
<a id="whatsapp-float-btn" href="${link}" target="_blank" aria-label="WhatsApp">
  <svg width="32" height="32" fill="white" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
</a>`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generateLink());
    toast({
      title: "Link copiado!",
      description: "O link do WhatsApp foi copiado."
    });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(generateScript());
    toast({
      title: "Código copiado!",
      description: "Cole no <head> do seu site."
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-primary" />
        Gerador de Link WhatsApp
      </h2>

      <Tabs defaultValue="link" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="link">Link Direto</TabsTrigger>
          <TabsTrigger value="button">Botão Flutuante</TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="button" className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label>Número do WhatsApp *</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 5511999999999"
                type="tel"
              />
            </div>

            <div>
              <Label>Mensagem Inicial</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Olá! Gostaria de mais informações..."
                rows={2}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Posição do Botão</Label>
                <Select value={buttonPosition} onValueChange={setButtonPosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                    <SelectItem value="bottom-left">Inferior Esquerdo</SelectItem>
                    <SelectItem value="top-right">Superior Direito</SelectItem>
                    <SelectItem value="top-left">Superior Esquerdo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cor do Botão</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    placeholder="#25D366"
                  />
                </div>
              </div>
            </div>

            <div className="bg-accent/50 p-4 rounded-lg">
              <Label className="mb-2 block flex items-center gap-2">
                <Code className="w-4 h-4" />
                Código para o seu site:
              </Label>
              <div className="relative">
                <pre className="bg-card p-4 rounded border overflow-x-auto max-h-[300px] overflow-y-auto text-xs">
                  {generateScript()}
                </pre>
                <Button
                  onClick={handleCopyScript}
                  size="sm"
                  className="absolute top-2 right-2"
                  variant="outline"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar
                </Button>
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
              <h4 className="font-semibold mb-2">📋 Instruções:</h4>
              <ol className="text-sm space-y-1 text-muted-foreground">
                <li>1. Copie o código acima</li>
                <li>2. Cole antes do fechamento da tag {`</body>`} no seu site</li>
                <li>3. O botão aparecerá automaticamente na posição escolhida</li>
                <li>4. Personalize cores e posição conforme necessário</li>
              </ol>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
