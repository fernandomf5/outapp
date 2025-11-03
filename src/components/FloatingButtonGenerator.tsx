import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Code, Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FloatingButtonGenerator() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [buttonText, setButtonText] = useState("Fale Conosco");
  const [buttonLink, setButtonLink] = useState("https://wa.me/5511999999999");
  const [position, setPosition] = useState("bottom-right");
  const [backgroundColor, setBackgroundColor] = useState("#25D366");
  const [textColor, setTextColor] = useState("#ffffff");
  const [icon, setIcon] = useState("whatsapp");
  const [customImage, setCustomImage] = useState<string | null>(null);

  const getPositionStyles = () => {
    switch (position) {
      case "bottom-left":
        return "bottom: 20px; left: 20px;";
      case "bottom-right":
        return "bottom: 20px; right: 20px;";
      case "top-left":
        return "top: 20px; left: 20px;";
      case "top-right":
        return "top: 20px; right: 20px;";
      default:
        return "bottom: 20px; right: 20px;";
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo é 2MB",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomImage(reader.result as string);
        setIcon("custom");
      };
      reader.readAsDataURL(file);
    }
  };

  const getIconSvg = () => {
    if (icon === "custom" && customImage) {
      return `<img src="${customImage}" alt="Icon" style="width: 24px; height: 24px; object-fit: contain; border-radius: 4px;" />`;
    }
    if (icon === "whatsapp") {
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor"/>
      </svg>`;
    } else if (icon === "message") {
      return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/>
      </svg>`;
    }
    return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="currentColor"/>
    </svg>`;
  };

  const generateCode = () => {
    return `<!-- Botão Flutuante - Otimizado para Mobile -->
<a 
  href="${buttonLink}"
  target="_blank"
  rel="noopener noreferrer"
  style="position: fixed; ${getPositionStyles()} z-index: 9999; background: ${backgroundColor}; color: ${textColor}; padding: 15px 20px; border-radius: 50px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); display: flex !important; align-items: center; gap: 10px; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-weight: 500; transition: transform 0.2s ease; will-change: transform; opacity: 1 !important; visibility: visible !important;"
  onmouseover="this.style.transform='scale(1.05)'"
  onmouseout="this.style.transform='scale(1)'"
  ontouchstart="this.style.transform='scale(0.95)'"
  ontouchend="this.style.transform='scale(1)'"
>
  ${getIconSvg()}
  <span style="font-size: 14px;">${buttonText}</span>
</a>`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    toast({
      title: "Código copiado!",
      description: "Cole no seu site antes da tag </body>",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerador de Botão Flutuante</CardTitle>
          <CardDescription>
            Crie botões flutuantes personalizados para seu site
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="config" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="config">Configuração</TabsTrigger>
              <TabsTrigger value="preview">Visualização</TabsTrigger>
            </TabsList>

            <TabsContent value="config" className="space-y-4">
              <div>
                <Label htmlFor="buttonText">Texto do Botão</Label>
                <Input
                  id="buttonText"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Fale Conosco"
                />
              </div>

              <div>
                <Label htmlFor="buttonLink">Link (URL ou WhatsApp)</Label>
                <Input
                  id="buttonLink"
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  placeholder="https://wa.me/5511999999999"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Para WhatsApp use: https://wa.me/SEU_NUMERO
                </p>
              </div>

              <div>
                <Label htmlFor="icon">Ícone ou Logo</Label>
                <Select value={icon} onValueChange={setIcon}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="message">Mensagem</SelectItem>
                    <SelectItem value="custom">Imagem Personalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {icon === "custom" && (
                <div className="space-y-3">
                  <Label>Upload de Logo/Imagem</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {customImage ? (
                    <div className="relative inline-block">
                      <img
                        src={customImage}
                        alt="Preview"
                        className="w-24 h-24 object-contain border-2 border-border rounded-lg p-2"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={() => {
                          setCustomImage(null);
                          setIcon("whatsapp");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Escolher Imagem
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Formatos: PNG, JPG, SVG (máx. 2MB)
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="position">Posição</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom-right">Inferior Direita</SelectItem>
                    <SelectItem value="bottom-left">Inferior Esquerda</SelectItem>
                    <SelectItem value="top-right">Superior Direita</SelectItem>
                    <SelectItem value="top-left">Superior Esquerda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bgColor">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bgColor"
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      placeholder="#25D366"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="textColor">Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button onClick={copyCode} className="w-full gradient-primary">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Código
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <div className="relative bg-muted rounded-lg p-8 min-h-[300px]">
                <p className="text-muted-foreground text-center mb-8">
                  Visualização do botão:
                </p>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    position: "fixed",
                    [position.includes("bottom") ? "bottom" : "top"]: "20px",
                    [position.includes("right") ? "right" : "left"]: "20px",
                    zIndex: 9999,
                    background: backgroundColor,
                    color: textColor,
                    padding: "15px 20px",
                    borderRadius: "50px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    textDecoration: "none",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                    fontWeight: 500,
                    transition: "all 0.3s ease",
                  }}
                  dangerouslySetInnerHTML={{ __html: getIconSvg() + `<span style="font-size: 14px;">${buttonText}</span>` }}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Code className="w-4 h-4" />
                  Código Gerado
                </Label>
                <Textarea
                  value={generateCode()}
                  readOnly
                  className="font-mono text-xs min-h-[200px]"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Cole este código no seu site antes da tag {'</body>'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
