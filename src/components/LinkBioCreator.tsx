import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  ExternalLink, 
  Eye, 
  BarChart3, 
  Copy,
  Palette,
  Link2,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Phone,
  Globe,
  Pipette,
  Upload,
  Image as ImageIcon
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AvatarUpload } from "@/components/AvatarUpload";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface LinkBio {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  theme: string;
  background_color: string;
  text_color: string;
  button_color: string;
  button_text_color: string;
  background_image: string;
  border_style: string;
  border_width: number;
  border_color: string;
  is_active: boolean;
  total_clicks: number;
}

interface BioLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  image_url: string;
  position: number;
  is_active: boolean;
  clicks: number;
}

const iconOptions = [
  { value: 'link', label: 'Link', icon: Link2 },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Telefone', icon: Phone },
  { value: 'website', label: 'Website', icon: Globe },
];

const themeOptions = [
  { value: 'default', label: 'Padrão', bg: '#ffffff', text: '#000000', button: '#000000', buttonText: '#ffffff' },
  { value: 'dark', label: 'Escuro', bg: '#1a1a1a', text: '#ffffff', button: '#ffffff', buttonText: '#000000' },
  { value: 'gradient', label: 'Gradiente', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#ffffff', button: '#ffffff', buttonText: '#667eea' },
  { value: 'pastel', label: 'Pastel', bg: '#fef9ef', text: '#2d3748', button: '#f687b3', buttonText: '#ffffff' },
];

export function LinkBioCreator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bio, setBio] = useState<LinkBio | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Form states
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bioText, setBioText] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [theme, setTheme] = useState("default");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#000000");
  const [buttonColor, setButtonColor] = useState("#000000");
  const [buttonTextColor, setButtonTextColor] = useState("#ffffff");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [borderStyle, setBorderStyle] = useState("solid");
  const [borderWidth, setBorderWidth] = useState(2);
  const [borderColor, setBorderColor] = useState("#000000");
  
  // New link states
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkIcon, setNewLinkIcon] = useState("link");
  const [newLinkImage, setNewLinkImage] = useState("");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingLinkImage, setUploadingLinkImage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBio();
    }
  }, [user]);

  const fetchBio = async () => {
    if (!user) return;
    
    const { data: bioData } = await supabase
      .from('link_bios')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (bioData) {
      setBio(bioData);
      setUsername(bioData.username);
      setDisplayName(bioData.display_name || '');
      setBioText(bioData.bio || '');
      setAvatarUrl(bioData.avatar_url || '');
      setTheme(bioData.theme);
      setBackgroundColor(bioData.background_color);
      setTextColor(bioData.text_color);
      setButtonColor(bioData.button_color);
      setButtonTextColor(bioData.button_text_color);
      setBackgroundImage(bioData.background_image || '');
      setBorderStyle(bioData.border_style || 'solid');
      setBorderWidth(bioData.border_width || 2);
      setBorderColor(bioData.border_color || '#000000');
      
      fetchLinks(bioData.id);
    }
  };

  const fetchLinks = async (bioId: string) => {
    const { data } = await supabase
      .from('link_bio_links')
      .select('*')
      .eq('bio_id', bioId)
      .order('position', { ascending: true });

    if (data) {
      setLinks(data);
    }
  };

  const createOrUpdateBio = async () => {
    if (!user || !username) {
      toast({
        title: "Erro",
        description: "Nome de usuário é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const bioData = {
      user_id: user.id,
      username: username.toLowerCase().replace(/[^a-z0-9-_]/g, ''),
      display_name: displayName,
      bio: bioText,
      avatar_url: avatarUrl,
      theme,
      background_color: backgroundColor,
      text_color: textColor,
      button_color: buttonColor,
      button_text_color: buttonTextColor,
      background_image: backgroundImage,
      border_style: borderStyle,
      border_width: borderWidth,
      border_color: borderColor,
      is_active: true,
    };

    if (bio) {
      const { error } = await supabase
        .from('link_bios')
        .update(bioData)
        .eq('id', bio.id);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Perfil atualizado com sucesso",
        });
        fetchBio();
      }
    } else {
      const { data, error } = await supabase
        .from('link_bios')
        .insert([bioData])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Perfil criado com sucesso",
        });
        setBio(data);
      }
    }

    setLoading(false);
  };

  const addLink = async () => {
    if (!bio || !newLinkTitle || !newLinkUrl) {
      toast({
        title: "Erro",
        description: "Título e URL são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('link_bio_links')
      .insert([{
        bio_id: bio.id,
        title: newLinkTitle,
        url: newLinkUrl,
        icon: newLinkIcon,
        image_url: newLinkImage,
        position: links.length,
        is_active: true,
      }]);

    if (error) {
      toast({
        title: "Erro ao adicionar link",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso!",
        description: "Link adicionado",
      });
      setNewLinkTitle("");
      setNewLinkUrl("");
      setNewLinkIcon("link");
      setNewLinkImage("");
      fetchLinks(bio.id);
    }
  };

  const deleteLink = async (linkId: string) => {
    const { error } = await supabase
      .from('link_bio_links')
      .delete()
      .eq('id', linkId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Link removido",
      });
      if (bio) fetchLinks(bio.id);
    }
  };

  const toggleLinkActive = async (linkId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('link_bio_links')
      .update({ is_active: !currentStatus })
      .eq('id', linkId);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      if (bio) fetchLinks(bio.id);
    }
  };

  const applyTheme = (themeValue: string) => {
    const selectedTheme = themeOptions.find(t => t.value === themeValue);
    if (selectedTheme) {
      setTheme(themeValue);
      setBackgroundColor(selectedTheme.bg);
      setTextColor(selectedTheme.text);
      setButtonColor(selectedTheme.button);
      setButtonTextColor(selectedTheme.buttonText);
    }
  };

  const copyBioLink = () => {
    if (bio) {
      const link = `${window.location.origin}/bio/${bio.username}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "Link copiado! 🔗",
        description: "Link do seu bio foi copiado",
      });
    }
  };

  const uploadBackgroundImage = async (file: File) => {
    if (!user) return;
    
    setUploadingBackground(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/background-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('chatbot-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chatbot-media')
        .getPublicUrl(fileName);

      setBackgroundImage(publicUrl);
      
      toast({
        title: "Sucesso!",
        description: "Imagem de fundo enviada",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingBackground(false);
    }
  };

  const uploadLinkImage = async (file: File) => {
    if (!user) return;
    
    setUploadingLinkImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/link-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('chatbot-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chatbot-media')
        .getPublicUrl(fileName);

      setNewLinkImage(publicUrl);
      
      toast({
        title: "Sucesso!",
        description: "Imagem do link enviada",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingLinkImage(false);
    }
  };

  const IconComponent = ({ iconName }: { iconName: string }) => {
    const Icon = iconOptions.find(opt => opt.value === iconName)?.icon || Link2;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Criador de Link na Bio</h2>
            <p className="text-muted-foreground">Crie sua página de links personalizada estilo Linktree</p>
          </div>
          {bio && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={copyBioLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copiar Link
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open(`/bio/${bio.username}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
            </div>
          )}
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Foto de Perfil</Label>
                <AvatarUpload
                  avatarUrl={avatarUrl}
                  name={displayName || username}
                  onUploadComplete={(url) => setAvatarUrl(url)}
                />
              </div>

              <div>
                <Label htmlFor="username">Nome de Usuário *</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 py-2 bg-muted rounded-l-md text-muted-foreground">
                    /bio/
                  </span>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="seuusername"
                    disabled={!!bio}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Apenas letras, números, - e _
                </p>
              </div>

              <div>
                <Label htmlFor="displayName">Nome de Exibição</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu Nome"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder="Conte um pouco sobre você..."
                  rows={4}
                />
              </div>

              <Button onClick={createOrUpdateBio} disabled={loading} className="w-full">
                {bio ? 'Atualizar Perfil' : 'Criar Perfil'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            {!bio ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Crie seu perfil primeiro para adicionar links
                </p>
              </div>
            ) : (
              <>
                <Card className="p-4 bg-accent/50">
                  <h3 className="font-semibold mb-3">Adicionar Novo Link</h3>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="linkTitle">Título do Link</Label>
                      <Input
                        id="linkTitle"
                        value={newLinkTitle}
                        onChange={(e) => setNewLinkTitle(e.target.value)}
                        placeholder="Meu Instagram"
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkUrl">URL</Label>
                      <Input
                        id="linkUrl"
                        value={newLinkUrl}
                        onChange={(e) => setNewLinkUrl(e.target.value)}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="linkIcon">Ícone</Label>
                      <Select value={newLinkIcon} onValueChange={setNewLinkIcon}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {iconOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <div className="flex items-center gap-2">
                                <opt.icon className="w-4 h-4" />
                                {opt.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="linkImage">Imagem do Link (opcional)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadLinkImage(file);
                          }}
                          className="flex-1"
                          disabled={uploadingLinkImage}
                        />
                        {newLinkImage && (
                          <div className="relative w-20 h-20 border rounded overflow-hidden">
                            <img 
                              src={newLinkImage} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadingLinkImage ? "Enviando imagem..." : "Se adicionar uma imagem, ela substituirá o botão"}
                      </p>
                    </div>
                    <Button onClick={addLink} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Link
                    </Button>
                  </div>
                </Card>

                <div className="space-y-2">
                  <h3 className="font-semibold">Seus Links</h3>
                  {links.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum link adicionado ainda
                    </p>
                  ) : (
                    links.map((link) => (
                      <Card key={link.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                          {link.image_url ? (
                            <img src={link.image_url} alt={link.title} className="w-10 h-10 object-cover rounded" />
                          ) : (
                            <IconComponent iconName={link.icon} />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{link.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{link.url}</p>
                            {link.image_url && (
                              <p className="text-xs text-muted-foreground">Com imagem</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {link.clicks} cliques
                            </span>
                            <Switch
                              checked={link.is_active}
                              onCheckedChange={() => toggleLinkActive(link.id, link.is_active)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLink(link.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Tema Predefinido</Label>
                <Select value={theme} onValueChange={applyTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bgColor">Cor de Fundo</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Pipette className="w-4 h-4" />
                          <div
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor }}
                          />
                          <span className="flex-1">{backgroundColor}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <HexColorPicker color={backgroundColor} onChange={setBackgroundColor} />
                      <Input
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="mt-2"
                        placeholder="#ffffff"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="textColor">Cor do Texto</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Pipette className="w-4 h-4" />
                          <div
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: textColor }}
                          />
                          <span className="flex-1">{textColor}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <HexColorPicker color={textColor} onChange={setTextColor} />
                      <Input
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="mt-2"
                        placeholder="#000000"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="buttonColor">Cor dos Botões</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Pipette className="w-4 h-4" />
                          <div
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: buttonColor }}
                          />
                          <span className="flex-1">{buttonColor}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <HexColorPicker color={buttonColor} onChange={setButtonColor} />
                      <Input
                        value={buttonColor}
                        onChange={(e) => setButtonColor(e.target.value)}
                        className="mt-2"
                        placeholder="#000000"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="buttonTextColor">Texto dos Botões</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Pipette className="w-4 h-4" />
                          <div
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: buttonTextColor }}
                          />
                          <span className="flex-1">{buttonTextColor}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3">
                      <HexColorPicker color={buttonTextColor} onChange={setButtonTextColor} />
                      <Input
                        value={buttonTextColor}
                        onChange={(e) => setButtonTextColor(e.target.value)}
                        className="mt-2"
                        placeholder="#ffffff"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="backgroundImage">Imagem de Fundo</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      disabled={uploadingBackground}
                      onClick={() => document.getElementById('bg-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingBackground ? "Enviando..." : "Fazer Upload"}
                    </Button>
                    <input
                      id="bg-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadBackgroundImage(file);
                      }}
                    />
                  </div>
                  {backgroundImage && (
                    <div className="relative w-full h-32 border rounded overflow-hidden">
                      <img 
                        src={backgroundImage} 
                        alt="Background Preview" 
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setBackgroundImage("")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  A imagem de fundo sobrepõe a cor de fundo
                </p>
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
                <h3 className="font-semibold flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Bordas dos Botões
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="borderStyle">Estilo da Borda</Label>
                    <Select value={borderStyle} onValueChange={setBorderStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Sólida</SelectItem>
                        <SelectItem value="dashed">Tracejada</SelectItem>
                        <SelectItem value="dotted">Pontilhada</SelectItem>
                        <SelectItem value="double">Dupla</SelectItem>
                        <SelectItem value="rgb">RGB Animado 🌈</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="borderWidth">Largura da Borda</Label>
                    <Select value={borderWidth.toString()} onValueChange={(v) => setBorderWidth(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1px</SelectItem>
                        <SelectItem value="2">2px</SelectItem>
                        <SelectItem value="3">3px</SelectItem>
                        <SelectItem value="4">4px</SelectItem>
                        <SelectItem value="5">5px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {borderStyle !== 'rgb' && (
                  <div>
                    <Label htmlFor="borderColor">Cor da Borda</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <Pipette className="w-4 h-4" />
                            <div
                              className="h-6 w-6 rounded border"
                              style={{ backgroundColor: borderColor }}
                            />
                            <span className="flex-1">{borderColor}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3">
                        <HexColorPicker color={borderColor} onChange={setBorderColor} />
                        <Input
                          value={borderColor}
                          onChange={(e) => setBorderColor(e.target.value)}
                          className="mt-2"
                          placeholder="#000000"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>

              <Button onClick={createOrUpdateBio} disabled={loading} className="w-full">
                Salvar Aparência
              </Button>

              {bio && (
                <Card className="p-4 mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Preview</h3>
                    <div className="flex gap-1 bg-muted p-1 rounded-lg">
                      <Button
                        variant={previewDevice === "mobile" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("mobile")}
                        className="h-8 px-3"
                      >
                        📱 Mobile
                      </Button>
                      <Button
                        variant={previewDevice === "tablet" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("tablet")}
                        className="h-8 px-3"
                      >
                        📱 Tablet
                      </Button>
                      <Button
                        variant={previewDevice === "desktop" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setPreviewDevice("desktop")}
                        className="h-8 px-3"
                      >
                        💻 Desktop
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-center bg-muted/30 p-4 rounded-lg">
                    <div 
                      className="rounded-lg overflow-hidden transition-all duration-300 shadow-xl"
                      style={{ 
                        width: previewDevice === "mobile" ? "375px" : previewDevice === "tablet" ? "768px" : "100%",
                        maxWidth: "100%"
                      }}
                    >
                      <div 
                        className="p-6 min-h-[400px]"
                        style={
                          backgroundImage && backgroundImage.trim() !== ''
                            ? {
                                backgroundImage: `url(${backgroundImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                              }
                            : backgroundColor.includes('gradient')
                              ? { background: backgroundColor }
                              : { backgroundColor }
                        }
                      >
                        <div className="flex flex-col items-center">
                          {avatarUrl && (
                            <img 
                              src={avatarUrl} 
                              alt="Avatar" 
                              className="w-24 h-24 rounded-full mb-4 object-cover shadow-lg"
                            />
                          )}
                          <h2 
                            className="text-xl font-bold mb-2 text-center"
                            style={{ color: textColor }}
                          >
                            {displayName || username}
                          </h2>
                          {bioText && (
                            <p 
                              className="text-center mb-6 max-w-md"
                              style={{ color: textColor }}
                            >
                              {bioText}
                            </p>
                          )}
                          <div className="w-full max-w-md space-y-3">
                            {links.filter(l => l.is_active).slice(0, 3).map((link) => (
                              link.image_url ? (
                                <div
                                  key={link.id}
                                  className="rounded-lg overflow-hidden shadow-md"
                                >
                                  <img 
                                    src={link.image_url} 
                                    alt={link.title}
                                    className="w-full h-auto object-cover"
                                  />
                                </div>
                              ) : (
                                <div
                                  key={link.id}
                                  className="px-4 py-3 rounded-full text-center font-medium shadow-md"
                                  style={{ 
                                    backgroundColor: buttonColor,
                                    color: buttonTextColor 
                                  }}
                                >
                                  {link.title}
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {bio && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Estatísticas</h3>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Detalhes
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-accent/50 rounded-lg">
              <p className="text-2xl font-bold">{bio.total_clicks}</p>
              <p className="text-sm text-muted-foreground">Total de Cliques</p>
            </div>
            <div className="p-4 bg-accent/50 rounded-lg">
              <p className="text-2xl font-bold">{links.filter(l => l.is_active).length}</p>
              <p className="text-sm text-muted-foreground">Links Ativos</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
