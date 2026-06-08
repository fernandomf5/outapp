import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, Check, Save, Trash2, Edit2, ImagePlus, X, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { FaInstagram, FaFacebook, FaTiktok, FaYoutube, FaTwitter, FaLinkedin } from 'react-icons/fa';

interface SavedQRCode {
  id: string;
  name: string;
  content: string;
  size: number;
  fg_color: string;
  bg_color: string;
  created_at: string;
}

interface SocialMedia {
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  twitter: string;
  linkedin: string;
}

export function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [copied, setCopied] = useState(false);
  const [savedQRCodes, setSavedQRCodes] = useState<SavedQRCode[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [qrName, setQrName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string | null>(null);
  
  // Advanced customization states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoSize, setLogoSize] = useState(50);
  const [showLogo, setShowLogo] = useState(false);
  const [borderColor, setBorderColor] = useState('#000000');
  const [showBorder, setShowBorder] = useState(false);
  const [borderWidth, setBorderWidth] = useState(8);
  const [cornerRadius, setCornerRadius] = useState(0);
  const [padding, setPadding] = useState(16);
  const [showSocialMedia, setShowSocialMedia] = useState(false);
  const [socialMedia, setSocialMedia] = useState<SocialMedia>({
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
    twitter: '',
    linkedin: '',
  });
  const [businessName, setBusinessName] = useState('');
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchSavedQRCodes();
    }
  }, [user]);

  const fetchSavedQRCodes = async () => {
    const { data, error } = await supabase
      .from('saved_qr_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSavedQRCodes(data);
    }
  };

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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Erro',
          description: 'A imagem deve ter no máximo 2MB',
          variant: 'destructive',
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
        setShowLogo(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoUrl('');
    setShowLogo(false);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir a janela de impressão. Verifique se popups estão habilitados.',
        variant: 'destructive',
      });
      return;
    }

    const activeSocials = Object.entries(socialMedia).filter(([_, value]) => value.trim() !== '');
    
    const socialIconsHtml = activeSocials.map(([platform, handle]) => {
      const colors: Record<string, string> = {
        instagram: '#E4405F',
        facebook: '#1877F2',
        tiktok: '#000000',
        youtube: '#FF0000',
        twitter: '#1DA1F2',
        linkedin: '#0A66C2',
      };
      return `<div style="display: flex; align-items: center; gap: 6px; font-size: 14px;">
        <span style="color: ${colors[platform]}; font-weight: bold;">@${handle}</span>
      </div>`;
    }).join('');

    const qrSvg = document.getElementById('qr-code-svg');
    const svgData = qrSvg ? new XMLSerializer().serializeToString(qrSvg) : '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${businessName || 'Imprimir'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .container {
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: ${padding}px;
              ${showBorder ? `border: ${borderWidth}px solid ${borderColor}; border-radius: ${cornerRadius}px;` : ''}
              background-color: ${bgColor};
            }
            .business-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 16px;
              color: ${fgColor};
            }
            .qr-wrapper {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .logo-top {
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .logo-top img {
              width: ${logoSize}px;
              height: ${logoSize}px;
              object-fit: contain;
            }
            .socials {
              display: flex;
              flex-wrap: wrap;
              gap: 12px;
              margin-top: 16px;
              justify-content: center;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${businessName ? `<div class="business-name">${businessName}</div>` : ''}
            <div class="qr-wrapper">
              ${showLogo && logoUrl ? `
                <div class="logo-top">
                  <img src="${logoUrl}" alt="Logo" />
                </div>
              ` : ''}
              ${svgData}
            </div>
            ${showSocialMedia && activeSocials.length > 0 ? `
              <div class="socials">
                ${socialIconsHtml}
              </div>
            ` : ''}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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

  const handleSaveClick = () => {
    if (!text) {
      toast({
        title: 'Erro',
        description: 'Digite um conteúdo para o QR Code',
        variant: 'destructive',
      });
      return;
    }
    
    // If already editing an existing QR code, save directly
    if (editingId) {
      saveExistingQRCode();
    } else {
      // New QR code - show dialog to enter name
      setQrName('');
      setShowSaveDialog(true);
    }
  };

  const saveExistingQRCode = async () => {
    if (!user || !editingId) return;

    const { error } = await supabase
      .from('saved_qr_codes')
      .update({
        content: text,
        size,
        fg_color: fgColor,
        bg_color: bgColor,
      })
      .eq('id', editingId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o QR Code',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sucesso',
      description: 'QR Code atualizado com sucesso',
    });
    fetchSavedQRCodes();
  };

  const clearEditing = () => {
    setText('');
    setSize(256);
    setFgColor('#000000');
    setBgColor('#ffffff');
    setEditingId(null);
    setEditingName(null);
    // Reset advanced options
    setLogoUrl('');
    setShowLogo(false);
    setLogoSize(50);
    setBorderColor('#000000');
    setShowBorder(false);
    setBorderWidth(8);
    setCornerRadius(0);
    setPadding(16);
    setShowSocialMedia(false);
    setSocialMedia({
      instagram: '',
      facebook: '',
      tiktok: '',
      youtube: '',
      twitter: '',
      linkedin: '',
    });
    setBusinessName('');
  };

  const saveQRCode = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para salvar QR Codes',
        variant: 'destructive',
      });
      return;
    }

    if (!qrName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite um nome para o QR Code',
        variant: 'destructive',
      });
      return;
    }

    // Save new QR code
    const { data, error } = await supabase
      .from('saved_qr_codes')
      .insert({
        user_id: user.id,
        name: qrName,
        content: text,
        size,
        fg_color: fgColor,
        bg_color: bgColor,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o QR Code',
        variant: 'destructive',
      });
      return;
    }

    // Keep editing the newly saved QR code
    setEditingId(data.id);
    setEditingName(qrName);
    
    toast({
      title: 'Sucesso',
      description: 'QR Code salvo com sucesso',
    });

    setShowSaveDialog(false);
    setQrName('');
    fetchSavedQRCodes();
  };

  const loadQRCode = (qr: SavedQRCode) => {
    setText(qr.content);
    setSize(qr.size);
    setFgColor(qr.fg_color);
    setBgColor(qr.bg_color);
    setEditingId(qr.id);
    setEditingName(qr.name);
    toast({
      title: 'QR Code carregado',
      description: `"${qr.name}" foi carregado para edição`,
    });
  };

  const deleteQRCode = async (id: string) => {
    const { error } = await supabase
      .from('saved_qr_codes')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o QR Code',
        variant: 'destructive',
      });
      return;
    }

    // If deleting the currently editing QR code, clear editing state
    if (editingId === id) {
      clearEditing();
    }

    toast({
      title: 'Sucesso',
      description: 'QR Code excluído com sucesso',
    });
    fetchSavedQRCodes();
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Personalização Básica</h3>
              
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

              {/* Advanced Customization Toggle */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    Personalização Avançada
                    <span className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▼</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  {/* Business Name */}
                  <div className="space-y-2">
                    <Label>Nome do Negócio</Label>
                    <Input
                      placeholder="Minha Empresa"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Aparece acima do QR Code na impressão
                    </p>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Logo da Marca</Label>
                      <Switch
                        checked={showLogo}
                        onCheckedChange={(checked) => {
                          setShowLogo(checked);
                          if (!checked) removeLogo();
                        }}
                        disabled={!logoUrl}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <ImagePlus className="w-4 h-4 mr-2" />
                        {logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
                      </Button>
                      {logoUrl && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={removeLogo}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {logoUrl && (
                      <div className="space-y-2">
                        <Label>Tamanho do Logo: {logoSize}px</Label>
                        <Slider
                          value={[logoSize]}
                          onValueChange={(value) => setLogoSize(value[0])}
                          min={30}
                          max={100}
                          step={5}
                        />
                      </div>
                    )}
                  </div>

                  {/* Border Settings */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Borda ao Redor</Label>
                      <Switch
                        checked={showBorder}
                        onCheckedChange={setShowBorder}
                      />
                    </div>
                    {showBorder && (
                      <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                        <div className="space-y-2">
                          <Label>Cor da Borda</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={borderColor}
                              onChange={(e) => setBorderColor(e.target.value)}
                              className="w-20 h-10 cursor-pointer"
                            />
                            <Input
                              type="text"
                              value={borderColor}
                              onChange={(e) => setBorderColor(e.target.value)}
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Espessura: {borderWidth}px</Label>
                          <Slider
                            value={[borderWidth]}
                            onValueChange={(value) => setBorderWidth(value[0])}
                            min={2}
                            max={20}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Arredondamento: {cornerRadius}px</Label>
                          <Slider
                            value={[cornerRadius]}
                            onValueChange={(value) => setCornerRadius(value[0])}
                            min={0}
                            max={30}
                            step={2}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Padding */}
                  <div className="space-y-2">
                    <Label>Espaçamento Interno: {padding}px</Label>
                    <Slider
                      value={[padding]}
                      onValueChange={(value) => setPadding(value[0])}
                      min={0}
                      max={40}
                      step={4}
                    />
                  </div>

                  {/* Social Media */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Redes Sociais</Label>
                      <Switch
                        checked={showSocialMedia}
                        onCheckedChange={setShowSocialMedia}
                      />
                    </div>
                    {showSocialMedia && (
                      <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                        <div className="flex items-center gap-2">
                          <FaInstagram className="w-5 h-5 text-pink-500" />
                          <Input
                            placeholder="seu_instagram"
                            value={socialMedia.instagram}
                            onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <FaFacebook className="w-5 h-5 text-blue-600" />
                          <Input
                            placeholder="seu_facebook"
                            value={socialMedia.facebook}
                            onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <FaTiktok className="w-5 h-5" />
                          <Input
                            placeholder="seu_tiktok"
                            value={socialMedia.tiktok}
                            onChange={(e) => setSocialMedia({ ...socialMedia, tiktok: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <FaYoutube className="w-5 h-5 text-red-600" />
                          <Input
                            placeholder="seu_canal"
                            value={socialMedia.youtube}
                            onChange={(e) => setSocialMedia({ ...socialMedia, youtube: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <FaTwitter className="w-5 h-5 text-sky-500" />
                          <Input
                            placeholder="seu_twitter"
                            value={socialMedia.twitter}
                            onChange={(e) => setSocialMedia({ ...socialMedia, twitter: e.target.value })}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <FaLinkedin className="w-5 h-5 text-blue-700" />
                          <Input
                            placeholder="seu_linkedin"
                            value={socialMedia.linkedin}
                            onChange={(e) => setSocialMedia({ ...socialMedia, linkedin: e.target.value })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => downloadQRCode('png')}
                  disabled={!text}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PNG
                </Button>
                <Button
                  onClick={() => downloadQRCode('svg')}
                  disabled={!text}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  SVG
                </Button>
                <Button
                  onClick={handlePrint}
                  disabled={!text}
                  variant="secondary"
                  className="flex-1"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
              </div>

              {/* Editing indicator */}
              {editingId && editingName && (
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="text-sm">
                    Editando: <strong>{editingName}</strong>
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearEditing}
                  >
                    Novo QR Code
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={copyToClipboard}
                  disabled={!text}
                  variant="secondary"
                  className="flex-1"
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
                <Button
                  onClick={handleSaveClick}
                  disabled={!text || !user}
                  variant="default"
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center">
              <div className="fixed top-24 right-8 lg:sticky lg:top-24 z-50 flex flex-col items-center space-y-4 bg-background/95 backdrop-blur-sm p-6 rounded-2xl border-2 border-primary/20 shadow-2xl">
                <h3 className="font-semibold text-lg">Visualização para Impressão</h3>
                <div 
                  ref={printRef}
                  className="flex flex-col items-center shadow-xl transition-all duration-300 ring-1 ring-primary/20"
                  style={{
                    padding: `${padding}px`,
                    backgroundColor: bgColor,
                    border: showBorder ? `${borderWidth}px solid ${borderColor}` : 'none',
                    borderRadius: `${cornerRadius}px`,
                    maxWidth: '100%',
                    width: 'fit-content'
                  }}
                >
                  {businessName && (
                    <p 
                      className="font-bold text-lg mb-3"
                      style={{ color: fgColor }}
                    >
                      {businessName}
                    </p>
                  )}
                  
                  <div className="flex flex-col items-center">
                    {showLogo && logoUrl && (
                      <div className="mb-3">
                        <img 
                          src={logoUrl} 
                          alt="Logo" 
                          style={{ 
                            width: logoSize, 
                            height: logoSize, 
                            objectFit: 'contain' 
                          }} 
                        />
                      </div>
                    )}
                    {text ? (
                      <QRCodeSVG
                        id="qr-code-svg"
                        value={text}
                        size={Math.min(size, 280)}
                        fgColor={fgColor}
                        bgColor={bgColor}
                        level="H"
                        includeMargin={false}
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

                  {showSocialMedia && Object.entries(socialMedia).some(([_, v]) => v.trim()) && (
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      {socialMedia.instagram && (
                        <div className="flex items-center gap-1 text-xs">
                          <FaInstagram className="w-3 h-3 text-pink-500" />
                          <span>@{socialMedia.instagram}</span>
                        </div>
                      )}
                      {socialMedia.facebook && (
                        <div className="flex items-center gap-1 text-xs">
                          <FaFacebook className="w-3 h-3 text-blue-600" />
                          <span>@{socialMedia.facebook}</span>
                        </div>
                      )}
                      {socialMedia.tiktok && (
                        <div className="flex items-center gap-1 text-xs">
                          <FaTiktok className="w-3 h-3" />
                          <span>@{socialMedia.tiktok}</span>
                        </div>
                      )}
                      {socialMedia.youtube && (
                        <div className="flex items-center gap-1 text-xs">
                          <FaYoutube className="w-3 h-3 text-red-600" />
                          <span>@{socialMedia.youtube}</span>
                        </div>
                      )}
                      {socialMedia.twitter && (
                        <div className="flex items-center gap-1 text-xs">
                          <FaTwitter className="w-3 h-3 text-sky-500" />
                          <span>@{socialMedia.twitter}</span>
                        </div>
                      )}
                      {socialMedia.linkedin && (
                        <div className="flex items-center gap-1 text-xs">
                          <FaLinkedin className="w-3 h-3 text-blue-700" />
                          <span>@{socialMedia.linkedin}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Esta é a visualização de como ficará na impressão
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved QR Codes */}
      {user && savedQRCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>QR Codes Salvos</CardTitle>
            <CardDescription>
              Clique em um QR Code para carregar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {savedQRCodes.map((qr) => (
                <div
                  key={qr.id}
                  className="border rounded-lg p-4 space-y-3 hover:border-primary transition-colors"
                >
                  <div
                    className="cursor-pointer flex justify-center"
                    onClick={() => loadQRCode(qr)}
                  >
                    <QRCodeSVG
                      value={qr.content}
                      size={100}
                      fgColor={qr.fg_color}
                      bgColor={qr.bg_color}
                      level="H"
                    />
                  </div>
                  <p className="text-sm font-medium text-center truncate">{qr.name}</p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadQRCode(qr)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteQRCode(qr.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Editar QR Code' : 'Salvar QR Code'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="qr-name">Nome do QR Code</Label>
              <Input
                id="qr-name"
                placeholder="Ex: Link do meu site"
                value={qrName}
                onChange={(e) => setQrName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={saveQRCode}>
              {editingId ? 'Atualizar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
