import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const downloadQRCode = (format: 'svg' | 'png') => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    if (format === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qrcode.svg';
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = size;
        canvas.height = size;
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = 'qrcode.png';
            link.click();
            URL.revokeObjectURL(pngUrl);
          }
        });
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    }

    toast({
      title: 'QR Code baixado',
      description: `Arquivo ${format.toUpperCase()} salvo com sucesso`,
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Copiado!',
        description: 'Texto copiado para a área de transferência',
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o texto',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Gerador de QR Code</CardTitle>
          <CardDescription>
            Crie QR codes personalizados para URLs, textos, WhatsApp e muito mais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text">Texto</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-input">Digite seu texto</Label>
                <Input
                  id="text-input"
                  placeholder="Insira qualquer texto..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url-input">Digite a URL</Label>
                <Input
                  id="url-input"
                  type="url"
                  placeholder="https://exemplo.com"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp-input">Número do WhatsApp</Label>
                <Input
                  id="whatsapp-input"
                  placeholder="+5511999999999"
                  value={text.replace('https://wa.me/', '')}
                  onChange={(e) => setText(`https://wa.me/${e.target.value.replace(/\D/g, '')}`)}
                />
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-input">Endereço de Email</Label>
                <Input
                  id="email-input"
                  type="email"
                  placeholder="exemplo@email.com"
                  value={text.replace('mailto:', '')}
                  onChange={(e) => setText(`mailto:${e.target.value}`)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Personalização</h3>
              
              <div className="space-y-2">
                <Label htmlFor="size-input">Tamanho (px)</Label>
                <Input
                  id="size-input"
                  type="number"
                  min="128"
                  max="512"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fg-color">Cor do QR Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="fg-color"
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bg-color">Cor de Fundo</Label>
                <div className="flex gap-2">
                  <Input
                    id="bg-color"
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => downloadQRCode('png')}
                  disabled={!text}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PNG
                </Button>
                <Button
                  onClick={() => downloadQRCode('svg')}
                  disabled={!text}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar SVG
                </Button>
              </div>

              <Button
                onClick={copyToClipboard}
                disabled={!text}
                variant="secondary"
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Texto
                  </>
                )}
              </Button>
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <h3 className="font-semibold text-lg">Visualização</h3>
              <div className="p-6 bg-muted rounded-lg">
                {text ? (
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={text}
                    size={Math.min(size, 300)}
                    fgColor={fgColor}
                    bgColor={bgColor}
                    level="H"
                    includeMargin
                  />
                ) : (
                  <div
                    className="flex items-center justify-center bg-muted-foreground/10 rounded"
                    style={{ width: 256, height: 256 }}
                  >
                    <p className="text-muted-foreground text-center px-4">
                      Digite um texto para gerar o QR Code
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
