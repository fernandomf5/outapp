import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Copy, Check, Save, Trash2, Edit2 } from 'lucide-react';
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

interface SavedQRCode {
  id: string;
  name: string;
  content: string;
  size: number;
  fg_color: string;
  bg_color: string;
  created_at: string;
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
