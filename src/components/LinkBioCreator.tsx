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
  Image as ImageIcon,
  Pencil
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AvatarUpload } from "@/components/AvatarUpload";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SocialLink {
  platform: string;
  url: string;
}

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
  border_animation: string;
  hover_animation: string;
  border_radius: number;
  button_spacing: number;
  is_active: boolean;
  total_clicks: number;
  gradient_color1: string;
  gradient_color2: string;
  custom_domain: string;
  music_url: string;
  music_autoplay: boolean;
  background_overlay_color: string;
  background_overlay_opacity: number;
  social_links: SocialLink[];
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

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const socialPlatforms = [
  { value: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/seuuser' },
  { value: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/suapagina' },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter, placeholder: 'https://twitter.com/seuuser' },
  { value: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@seucanal' },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/seuperfil' },
  { value: 'tiktok', label: 'TikTok', icon: TikTokIcon, placeholder: 'https://tiktok.com/@seuuser' },
  { value: 'whatsapp', label: 'WhatsApp', icon: WhatsAppIcon, placeholder: 'https://wa.me/5511999999999' },
  { value: 'email', label: 'Email', icon: Mail, placeholder: 'mailto:seu@email.com' },
  { value: 'website', label: 'Website', icon: Globe, placeholder: 'https://seusite.com' },
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
  const [bios, setBios] = useState<LinkBio[]>([]);
  const [selectedBioId, setSelectedBioId] = useState<string | null>(null);
  const [links, setLinks] = useState<BioLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const selectedBio = bios.find(b => b.id === selectedBioId) || null;
  
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
  const [borderAnimation, setBorderAnimation] = useState("none");
  const [hoverAnimation, setHoverAnimation] = useState("none");
  const [borderRadius, setBorderRadius] = useState(12);
  const [buttonSpacing, setButtonSpacing] = useState(12);
  const [gradientColor1, setGradientColor1] = useState("#667eea");
  const [gradientColor2, setGradientColor2] = useState("#764ba2");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicAutoplay, setMusicAutoplay] = useState(false);
  const [backgroundOverlayColor, setBackgroundOverlayColor] = useState("#000000");
  const [backgroundOverlayOpacity, setBackgroundOverlayOpacity] = useState(0);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  // New link states
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newLinkIcon, setNewLinkIcon] = useState("link");
  const [newLinkImage, setNewLinkImage] = useState("");
  const [previewDevice, setPreviewDevice] = useState<"mobile" | "tablet" | "desktop">("mobile");
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingLinkImage, setUploadingLinkImage] = useState(false);
  
  // Edit link states
  const [editingLink, setEditingLink] = useState<BioLink | null>(null);
  const [editLinkTitle, setEditLinkTitle] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [editLinkIcon, setEditLinkIcon] = useState("link");
  const [editLinkImage, setEditLinkImage] = useState("");
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [uploadingEditLinkImage, setUploadingEditLinkImage] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBios();
    }
  }, [user]);

  useEffect(() => {
    if (selectedBio) {
      setUsername(selectedBio.username);
      setDisplayName(selectedBio.display_name || '');
      setBioText(selectedBio.bio || '');
      setAvatarUrl(selectedBio.avatar_url || '');
      setTheme(selectedBio.theme);
      setBackgroundColor(selectedBio.background_color);
      setTextColor(selectedBio.text_color);
      setButtonColor(selectedBio.button_color);
      setButtonTextColor(selectedBio.button_text_color);
      setBackgroundImage(selectedBio.background_image || '');
      setBorderStyle(selectedBio.border_style || 'solid');
      setBorderWidth(selectedBio.border_width || 2);
      setBorderColor(selectedBio.border_color || '#000000');
      setBorderAnimation(selectedBio.border_animation || 'none');
      setHoverAnimation(selectedBio.hover_animation || 'none');
      setBorderRadius(selectedBio.border_radius || 12);
      setButtonSpacing(selectedBio.button_spacing || 12);
      setGradientColor1(selectedBio.gradient_color1 || '#667eea');
      setGradientColor2(selectedBio.gradient_color2 || '#764ba2');
      setMusicUrl(selectedBio.music_url || '');
      setMusicAutoplay(selectedBio.music_autoplay || false);
      setBackgroundOverlayColor(selectedBio.background_overlay_color || '#000000');
      setBackgroundOverlayOpacity(selectedBio.background_overlay_opacity || 0);
      setSocialLinks(selectedBio.social_links || []);
      fetchLinks(selectedBio.id);
    }
  }, [selectedBio]);

  const fetchBios = async () => {
    if (!user) return;
    
    const { data: biosData } = await supabase
      .from('link_bios')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (biosData && biosData.length > 0) {
      const parsedBios = biosData.map(bio => ({
        ...bio,
        social_links: Array.isArray(bio.social_links) ? bio.social_links as unknown as SocialLink[] : []
      })) as LinkBio[];
      setBios(parsedBios);
      if (!selectedBioId) {
        setSelectedBioId(biosData[0].id);
      }
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

  const createNewBio = () => {
    setSelectedBioId(null);
    setUsername("");
    setDisplayName("");
    setBioText("");
    setAvatarUrl("");
    setTheme("default");
    setBackgroundColor("#ffffff");
    setTextColor("#000000");
    setButtonColor("#000000");
    setButtonTextColor("#ffffff");
    setBackgroundImage("");
    setBorderStyle("solid");
    setBorderWidth(2);
    setBorderColor("#000000");
    setBorderAnimation("none");
    setHoverAnimation("none");
    setBorderRadius(12);
    setButtonSpacing(12);
    setGradientColor1("#667eea");
    setGradientColor2("#764ba2");
    setMusicUrl("");
    setMusicAutoplay(false);
    setBackgroundOverlayColor("#000000");
    setBackgroundOverlayOpacity(0);
    setSocialLinks([]);
    setLinks([]);
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

    const cleanUsername = username.toLowerCase().replace(/[^a-z0-9-_]/g, '');

    // Verificar se o username já existe (apenas ao criar novo)
    if (!selectedBio) {
      const { data: existingBio } = await supabase
        .from('link_bios')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existingBio) {
        toast({
          title: "Erro",
          description: "Este nome de usuário já está em uso. Escolha outro.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    const bioData = {
      user_id: user.id,
      username: cleanUsername,
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
      border_animation: borderAnimation,
      hover_animation: hoverAnimation,
      border_radius: borderRadius,
      button_spacing: buttonSpacing,
      gradient_color1: gradientColor1,
      gradient_color2: gradientColor2,
      music_url: musicUrl,
      music_autoplay: musicAutoplay,
      background_overlay_color: backgroundOverlayColor,
      background_overlay_opacity: backgroundOverlayOpacity,
      social_links: socialLinks as unknown as any,
      is_active: true,
    };

    if (selectedBio) {
      const { error } = await supabase
        .from('link_bios')
        .update(bioData)
        .eq('id', selectedBio.id);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Bio atualizado com sucesso",
        });
        await fetchBios();
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
          description: "Bio criado com sucesso",
        });
        await fetchBios();
        setSelectedBioId(data.id);
      }
    }

    setLoading(false);
  };

  const deleteBio = async (bioId: string) => {
    if (!confirm('Tem certeza que deseja excluir este bio?')) return;

    const { error } = await supabase
      .from('link_bios')
      .delete()
      .eq('id', bioId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Bio excluído com sucesso",
      });
      
      // Atualizar estado local imediatamente
      const updatedBios = bios.filter(b => b.id !== bioId);
      setBios(updatedBios);
      
      // Se o bio excluído era o selecionado, selecionar o primeiro disponível
      if (selectedBioId === bioId) {
        setSelectedBioId(updatedBios[0]?.id || null);
      }
    }
  };

  const addLink = async () => {
    if (!selectedBio || !newLinkTitle || !newLinkUrl) {
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
        bio_id: selectedBio.id,
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
      fetchLinks(selectedBio.id);
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
      if (selectedBio) fetchLinks(selectedBio.id);
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
      if (selectedBio) fetchLinks(selectedBio.id);
    }
  };

  const startEditLink = (link: BioLink) => {
    setEditingLink(link);
    setEditLinkTitle(link.title);
    setEditLinkUrl(link.url);
    setEditLinkIcon(link.icon);
    setEditLinkImage(link.image_url || "");
    setShowEditDialog(true);
  };

  const updateLink = async () => {
    if (!editingLink || !editLinkTitle || !editLinkUrl) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('link_bio_links')
      .update({
        title: editLinkTitle,
        url: editLinkUrl,
        icon: editLinkIcon,
        image_url: editLinkImage || null,
      })
      .eq('id', editingLink.id);

    if (error) {
      toast({
        title: "Erro ao atualizar link",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Link atualizado!",
      });
      setShowEditDialog(false);
      setEditingLink(null);
      if (selectedBio) fetchLinks(selectedBio.id);
    }
  };

  const uploadEditLinkImage = async (file: File) => {
    if (!user) return;
    
    setUploadingEditLinkImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/link-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chatbot-media')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: "Erro ao enviar imagem",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploadingEditLinkImage(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chatbot-media')
      .getPublicUrl(fileName);

    setEditLinkImage(publicUrl);
    setUploadingEditLinkImage(false);
  };

  const applyTheme = (themeValue: string) => {
    const selectedTheme = themeOptions.find(t => t.value === themeValue);
    if (selectedTheme) {
      setTheme(themeValue);
      setBackgroundColor(selectedTheme.bg);
      setTextColor(selectedTheme.text);
      setButtonColor(selectedTheme.button);
      setButtonTextColor(selectedTheme.buttonText);
      
      if (themeValue === 'gradient') {
        setGradientColor1('#667eea');
        setGradientColor2('#764ba2');
      }
    }
  };

  const copyBioLink = () => {
    if (selectedBio) {
      const link = `${window.location.origin}/bio/${selectedBio.username}`;
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

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((link) => link.id === active.id);
      const newIndex = links.findIndex((link) => link.id === over.id);
      
      const newLinks = arrayMove(links, oldIndex, newIndex);
      setLinks(newLinks);

      // Update positions in database
      const updates = newLinks.map((link, index) => ({
        id: link.id,
        position: index,
      }));

      for (const update of updates) {
        await supabase
          .from('link_bio_links')
          .update({ position: update.position })
          .eq('id', update.id);
      }

      toast({
        title: "Ordem atualizada!",
        description: "A ordem dos links foi salva",
      });
    }
  };

  // Sortable Link Item Component
  const SortableLinkItem = ({ link }: { link: BioLink }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: link.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 1,
    };

    return (
      <Card ref={setNodeRef} style={style} className="p-4">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
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
              onClick={() => startEditLink(link)}
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
            </Button>
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
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Criador de Link na Bio</h2>
            <p className="text-muted-foreground">Crie múltiplas páginas de links personalizadas estilo Linktree</p>
          </div>
          <Button onClick={createNewBio}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Bio
          </Button>
        </div>

        {bios.length > 0 && (
          <div className="mb-6">
            <Label className="mb-2 block">Seus Bios</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bios.map((bio) => (
                <Card
                  key={bio.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedBioId === bio.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedBioId(bio.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{bio.display_name || bio.username}</h3>
                      <p className="text-sm text-muted-foreground">@{bio.username}</p>
                      <p className="text-xs text-muted-foreground mt-1">{bio.total_clicks} cliques</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyBioLink();
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `/bio/${bio.username}`;
                          window.open(url, '_blank');
                        }}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteBio(bio.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Foto de Perfil do Bio</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && user) {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${user.id}/bio-avatar-${Date.now()}.${fileExt}`;
                        
                        const { error: uploadError } = await supabase.storage
                          .from('chatbot-media')
                          .upload(fileName, file);

                        if (uploadError) {
                          toast({
                            title: "Erro ao enviar",
                            description: uploadError.message,
                            variant: "destructive",
                          });
                          return;
                        }

                        const { data: { publicUrl } } = supabase.storage
                          .from('chatbot-media')
                          .getPublicUrl(fileName);

                        setAvatarUrl(publicUrl);
                        toast({
                          title: "Foto enviada!",
                        });
                      }
                    }}
                  />
                  {avatarUrl && (
                    <div className="relative w-24 h-24 rounded-full overflow-hidden border-2">
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Esta foto aparecerá apenas no seu link na bio, separada do seu perfil
                  </p>
                </div>
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
                    disabled={!!selectedBio}
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

              <div>
                <Label htmlFor="musicUpload">Música de Fundo (opcional)</Label>
                <div className="space-y-2">
                  <Input
                    id="musicUpload"
                    type="file"
                    accept="audio/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file && user) {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${user.id}/bio-music-${Date.now()}.${fileExt}`;
                        
                        const { error: uploadError } = await supabase.storage
                          .from('chatbot-media')
                          .upload(fileName, file);

                        if (uploadError) {
                          toast({
                            title: "Erro ao enviar música",
                            description: uploadError.message,
                            variant: "destructive",
                          });
                          return;
                        }

                        const { data: { publicUrl } } = supabase.storage
                          .from('chatbot-media')
                          .getPublicUrl(fileName);

                        setMusicUrl(publicUrl);
                        
                        // Salvar automaticamente se já existe um bio
                        if (selectedBio) {
                          await supabase
                            .from('link_bios')
                            .update({ music_url: publicUrl })
                            .eq('id', selectedBio.id);
                          
                          await fetchBios();
                        }
                        
                        toast({
                          title: "Música atualizada!",
                        });
                      }
                    }}
                  />
                  {musicUrl && (
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-green-600 flex-1">
                        ✓ Música carregada com sucesso
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          setMusicUrl("");
                          setMusicAutoplay(false);
                          
                          // Salvar remoção automaticamente se já existe um bio
                          if (selectedBio) {
                            await supabase
                              .from('link_bios')
                              .update({ music_url: "", music_autoplay: false })
                              .eq('id', selectedBio.id);
                            
                            await fetchBios();
                          }
                          
                          toast({
                            title: "Música removida",
                          });
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Faça upload de um arquivo de áudio (.mp3, .wav, etc)
                  </p>
                </div>
              </div>

              {musicUrl && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={musicAutoplay}
                    onCheckedChange={setMusicAutoplay}
                  />
                  <Label>Tocar música automaticamente ao abrir a página</Label>
                </div>
              )}

              {/* Seção de Redes Sociais */}
              <div className="space-y-3 p-4 border rounded-lg bg-accent/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Instagram className="w-5 h-5" />
                      Redes Sociais
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Adicione links das suas redes sociais que aparecerão abaixo da descrição
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {socialLinks.filter(s => s.url).map((social, index) => {
                    const platform = socialPlatforms.find(p => p.value === social.platform);
                    const Icon = platform?.icon || Globe;
                    const isSvgComponent = typeof Icon === 'function' && Icon.toString().includes('svg');
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          {isSvgComponent ? <Icon /> : <Icon className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{platform?.label || social.platform}</p>
                          <p className="text-xs text-muted-foreground truncate">{social.url}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSocials = socialLinks.filter((_, i) => i !== index);
                            setSocialLinks(newSocials);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Select
                      value=""
                      onValueChange={(value) => {
                        if (value && !socialLinks.find(s => s.platform === value)) {
                          setSocialLinks([...socialLinks, { platform: value, url: '' }]);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecionar rede social..." />
                      </SelectTrigger>
                      <SelectContent>
                        {socialPlatforms
                          .filter(p => !socialLinks.find(s => s.platform === p.value))
                          .map((platform) => {
                            const Icon = platform.icon;
                            return (
                              <SelectItem key={platform.value} value={platform.value}>
                                <div className="flex items-center gap-2">
                                  {typeof Icon === 'function' && Icon.toString().includes('svg') ? (
                                    <Icon />
                                  ) : (
                                    <Icon className="w-4 h-4" />
                                  )}
                                  {platform.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>

                  {socialLinks.map((social, index) => {
                    const platform = socialPlatforms.find(p => p.value === social.platform);
                    if (!social.url && platform) {
                      const Icon = platform.icon;
                      return (
                        <div key={`input-${index}`} className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                            {typeof Icon === 'function' && Icon.toString().includes('svg') ? (
                              <Icon />
                            ) : (
                              <Icon className="w-5 h-5" />
                            )}
                          </div>
                          <Input
                            placeholder={platform.placeholder}
                            defaultValue={social.url}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={(e) => {
                              const input = e.currentTarget.parentElement?.querySelector('input');
                              if (input && input.value) {
                                const newSocials = [...socialLinks];
                                newSocials[index].url = input.value;
                                setSocialLinks(newSocials);
                              }
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">🔗 Seu Link:</p>
                <code className="text-xs bg-background p-2 rounded block">
                  {`${window.location.origin}/bio/${username || 'seuusername'}`}
                </code>
              </div>

              <Button onClick={createOrUpdateBio} disabled={loading} className="w-full">
                {selectedBio ? 'Atualizar Bio' : 'Criar Bio'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            {!selectedBio ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Selecione ou crie um bio primeiro para adicionar links
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
                  <p className="text-xs text-muted-foreground">Arraste para reorganizar a ordem dos links</p>
                  {links.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum link adicionado ainda
                    </p>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={links.map(link => link.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {links.map((link) => (
                            <SortableLinkItem key={link.id} link={link} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>

                {/* Dialog de Edição de Link */}
                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Link</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editLinkTitle">Título do Link</Label>
                        <Input
                          id="editLinkTitle"
                          value={editLinkTitle}
                          onChange={(e) => setEditLinkTitle(e.target.value)}
                          placeholder="Meu Instagram"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editLinkUrl">URL</Label>
                        <Input
                          id="editLinkUrl"
                          value={editLinkUrl}
                          onChange={(e) => setEditLinkUrl(e.target.value)}
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                      <div>
                        <Label htmlFor="editLinkIcon">Ícone</Label>
                        <Select value={editLinkIcon} onValueChange={setEditLinkIcon}>
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
                        <Label htmlFor="editLinkImage">Imagem do Link (opcional)</Label>
                        <div className="flex gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadEditLinkImage(file);
                            }}
                            className="flex-1"
                            disabled={uploadingEditLinkImage}
                          />
                          {editLinkImage && (
                            <div className="relative w-20 h-20 border rounded overflow-hidden">
                              <img 
                                src={editLinkImage} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-0 right-0 h-6 w-6 p-0"
                                onClick={() => setEditLinkImage("")}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {uploadingEditLinkImage ? "Enviando imagem..." : "Se adicionar uma imagem, ela substituirá o botão"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                          Cancelar
                        </Button>
                        <Button onClick={updateLink} className="flex-1">
                          Salvar
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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

              {theme === 'gradient' && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="gradientColor1">Cor do Gradiente 1</Label>
                    <Popover modal={true}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <Pipette className="w-4 h-4" />
                            <div
                              className="h-6 w-6 rounded border flex-shrink-0"
                              style={{ backgroundColor: gradientColor1 }}
                            />
                            <span className="flex-1 truncate text-xs">{gradientColor1}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4" style={{ zIndex: 9999 }}>
                        <div className="space-y-3" style={{ pointerEvents: 'auto' }}>
                          <div style={{ touchAction: 'none' }}>
                            <HexColorPicker color={gradientColor1} onChange={setGradientColor1} />
                          </div>
                          <Input
                            value={gradientColor1}
                            onChange={(e) => setGradientColor1(e.target.value)}
                            placeholder="#667eea"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="gradientColor2">Cor do Gradiente 2</Label>
                    <Popover modal={true}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <Pipette className="w-4 h-4" />
                            <div
                              className="h-6 w-6 rounded border flex-shrink-0"
                              style={{ backgroundColor: gradientColor2 }}
                            />
                            <span className="flex-1 truncate text-xs">{gradientColor2}</span>
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-4" style={{ zIndex: 9999 }}>
                        <div className="space-y-3" style={{ pointerEvents: 'auto' }}>
                          <div style={{ touchAction: 'none' }}>
                            <HexColorPicker color={gradientColor2} onChange={setGradientColor2} />
                          </div>
                          <Input
                            value={gradientColor2}
                            onChange={(e) => setGradientColor2(e.target.value)}
                            placeholder="#764ba2"
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bgColor">Cor de Fundo</Label>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Pipette className="w-4 h-4" />
                          <div
                            className="h-6 w-6 rounded border flex-shrink-0"
                            style={{ backgroundColor }}
                          />
                          <span className="flex-1 truncate text-xs">{backgroundColor}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" style={{ zIndex: 9999 }}>
                      <div className="space-y-3" style={{ pointerEvents: 'auto' }}>
                        <div style={{ touchAction: 'none' }}>
                          <HexColorPicker color={backgroundColor} onChange={setBackgroundColor} />
                        </div>
                        <Input
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          placeholder="#ffffff"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="textColor">Cor do Texto</Label>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Pipette className="w-4 h-4" />
                          <div
                            className="h-6 w-6 rounded border flex-shrink-0"
                            style={{ backgroundColor: textColor }}
                          />
                          <span className="flex-1 truncate text-xs">{textColor}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" style={{ zIndex: 9999 }}>
                      <div className="space-y-3" style={{ pointerEvents: 'auto' }}>
                        <div style={{ touchAction: 'none' }}>
                          <HexColorPicker color={textColor} onChange={setTextColor} />
                        </div>
                        <Input
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="buttonColor">Cor dos Botões</Label>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Pipette className="w-4 h-4" />
                          <div
                            className="h-6 w-6 rounded border flex-shrink-0"
                            style={{ backgroundColor: buttonColor }}
                          />
                          <span className="flex-1 truncate text-xs">{buttonColor}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" style={{ zIndex: 9999 }}>
                      <div className="space-y-3" style={{ pointerEvents: 'auto' }}>
                        <div style={{ touchAction: 'none' }}>
                          <HexColorPicker color={buttonColor} onChange={setButtonColor} />
                        </div>
                        <Input
                          value={buttonColor}
                          onChange={(e) => setButtonColor(e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="buttonTextColor">Texto dos Botões</Label>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Pipette className="w-4 h-4" />
                          <div
                            className="h-6 w-6 rounded border flex-shrink-0"
                            style={{ backgroundColor: buttonTextColor }}
                          />
                          <span className="flex-1 truncate text-xs">{buttonTextColor}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" style={{ zIndex: 9999 }}>
                      <div className="space-y-3" style={{ pointerEvents: 'auto' }}>
                        <div style={{ touchAction: 'none' }}>
                          <HexColorPicker color={buttonTextColor} onChange={setButtonTextColor} />
                        </div>
                        <Input
                          value={buttonTextColor}
                          onChange={(e) => setButtonTextColor(e.target.value)}
                          placeholder="#ffffff"
                        />
                      </div>
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
                  Sobreposição de Fundo
                </h3>
                <p className="text-sm text-muted-foreground">
                  Adicione uma camada de cor sobre a imagem ou cor de fundo
                </p>
                
                <div>
                  <Label htmlFor="overlayColor">Cor da Sobreposição</Label>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Pipette className="w-4 h-4" />
                          <div
                            className="h-6 w-6 rounded border flex-shrink-0"
                            style={{ backgroundColor: backgroundOverlayColor }}
                          />
                          <span className="flex-1 truncate text-xs">{backgroundOverlayColor}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" style={{ zIndex: 9999 }}>
                      <div className="space-y-3" style={{ pointerEvents: 'auto' }}>
                        <div style={{ touchAction: 'none' }}>
                          <HexColorPicker color={backgroundOverlayColor} onChange={setBackgroundOverlayColor} />
                        </div>
                        <Input
                          value={backgroundOverlayColor}
                          onChange={(e) => setBackgroundOverlayColor(e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="overlayOpacity">Opacidade da Sobreposição (%)</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      id="overlayOpacity"
                      min="0"
                      max="100"
                      value={backgroundOverlayOpacity}
                      onChange={(e) => setBackgroundOverlayOpacity(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12">{backgroundOverlayOpacity}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    0% = transparente, 100% = opaco
                  </p>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-accent/20">
                <h3 className="font-semibold flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Bordas dos Botões
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Estilo da Borda</Label>
                    <Select value={borderStyle} onValueChange={setBorderStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma</SelectItem>
                        <SelectItem value="solid">Sólida</SelectItem>
                        <SelectItem value="dashed">Tracejada</SelectItem>
                        <SelectItem value="dotted">Pontilhada</SelectItem>
                        <SelectItem value="double">Dupla</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Largura da Borda</Label>
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

                <div>
                  <Label htmlFor="borderColor">Cor da Borda</Label>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Pipette className="w-4 h-4" />
                          <div
                            className="h-6 w-6 rounded border flex-shrink-0"
                            style={{ backgroundColor: borderColor }}
                          />
                          <span className="flex-1 truncate text-xs">{borderColor}</span>
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" style={{ zIndex: 9999 }}>
                      <div className="space-y-3" style={{ pointerEvents: 'auto' }}>
                        <div style={{ touchAction: 'none' }}>
                          <HexColorPicker color={borderColor} onChange={setBorderColor} />
                        </div>
                        <Input
                          value={borderColor}
                          onChange={(e) => setBorderColor(e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Animação da Borda</Label>
                  <Select value={borderAnimation} onValueChange={setBorderAnimation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem Animação</SelectItem>
                      <SelectItem value="rgb">RGB Arco-Íris 🌈</SelectItem>
                      <SelectItem value="pulse">Pulsar</SelectItem>
                      <SelectItem value="glow">Brilho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Raio da Borda (px)</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      id="borderRadius"
                      min="0"
                      max="50"
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12">{borderRadius}px</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buttonSpacing">Espaçamento dos Botões (px)</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      id="buttonSpacing"
                      min="0"
                      max="48"
                      value={buttonSpacing}
                      onChange={(e) => setButtonSpacing(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12">{buttonSpacing}px</span>
                  </div>
                </div>

                <div>
                  <Label>Animação ao Passar o Mouse</Label>
                  <Select value={hoverAnimation} onValueChange={setHoverAnimation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem Animação</SelectItem>
                      <SelectItem value="scale">Aumentar</SelectItem>
                      <SelectItem value="bounce">Pular</SelectItem>
                      <SelectItem value="shake">Tremer</SelectItem>
                      <SelectItem value="rotate">Girar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={createOrUpdateBio} disabled={loading} className="w-full">
                Salvar Aparência
              </Button>

              {selectedBio && (
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
                        className="p-6 min-h-[400px] relative"
                        style={
                          backgroundImage && backgroundImage.trim() !== ''
                            ? {
                                backgroundImage: `url(${backgroundImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                              }
                            : theme === 'gradient'
                              ? { background: `linear-gradient(135deg, ${gradientColor1} 0%, ${gradientColor2} 100%)` }
                              : { backgroundColor }
                        }
                      >
                        {/* Overlay de cor sobre o fundo */}
                        {backgroundOverlayOpacity > 0 && (
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              backgroundColor: backgroundOverlayColor,
                              opacity: backgroundOverlayOpacity / 100
                            }}
                          />
                        )}
                        
                        <div className="flex flex-col items-center relative z-10">
                          {avatarUrl && (
                            <img 
                              src={avatarUrl} 
                              alt="Avatar" 
                              className="w-24 h-24 mb-4 object-cover shadow-lg"
                              style={{
                                borderRadius: `${borderRadius}px`,
                              }}
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
                              className="text-center mb-3 max-w-md"
                              style={{ color: textColor }}
                            >
                              {bioText}
                            </p>
                          )}
                          
                          {/* Social Links Preview */}
                          {socialLinks.filter(s => s.url).length > 0 && (
                            <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                              {socialLinks.filter(s => s.url).map((social, index) => {
                                const platform = socialPlatforms.find(p => p.value === social.platform);
                                const Icon = platform?.icon || Globe;
                                const isSvgComponent = typeof Icon === 'function' && Icon.toString().includes('svg');
                                return (
                                  <div
                                    key={index}
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{ 
                                      backgroundColor: buttonColor,
                                      color: buttonTextColor
                                    }}
                                  >
                                    {isSvgComponent ? <Icon /> : <Icon className="w-4 h-4" />}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          <div className="w-full max-w-md" style={{ display: 'flex', flexDirection: 'column', gap: `${buttonSpacing}px` }}>
                            {links.filter(l => l.is_active).slice(0, 3).map((link) => (
                              link.image_url ? (
                                <div
                                  key={link.id}
                                  className={`shadow-md transition-all duration-300
                                    ${borderAnimation !== 'rgb' ? 'overflow-hidden' : ''}
                                    ${borderAnimation === 'rgb' ? 'bio-border-rgb' : ''} 
                                    ${borderAnimation === 'pulse' ? 'bio-border-pulse' : ''}
                                    ${borderAnimation === 'glow' ? 'bio-border-glow' : ''}
                                    ${hoverAnimation === 'scale' ? 'bio-hover-scale' : ''}
                                    ${hoverAnimation === 'bounce' ? 'bio-hover-bounce' : ''}
                                    ${hoverAnimation === 'shake' ? 'bio-hover-shake' : ''}
                                    ${hoverAnimation === 'rotate' ? 'bio-hover-rotate' : ''}
                                  `}
                                  style={{ 
                                    borderRadius: borderStyle === 'none' ? '0px' : `${borderRadius}px`,
                                    ...(borderAnimation === 'rgb' && borderStyle !== 'none' && {
                                      '--border-width': `${borderWidth}px`
                                    }),
                                    ...(borderAnimation !== 'rgb' && borderStyle !== 'none' && {
                                      border: `${borderWidth}px ${borderStyle} ${borderColor}`
                                    })
                                  } as React.CSSProperties}
                                >
                                  <img 
                                    src={link.image_url} 
                                    alt={link.title}
                                    className="max-w-full h-auto object-contain"
                                    style={{
                                      borderRadius: borderStyle === 'none' ? '0px' : `${borderRadius}px`,
                                      width: 'auto',
                                      maxWidth: '100%',
                                    }}
                                  />
                                </div>
                              ) : (
                                <div
                                  key={link.id}
                                  className={`px-4 py-3 text-center font-medium shadow-md transition-all duration-300 
                                    ${borderAnimation === 'rgb' ? 'bio-border-rgb' : ''} 
                                    ${borderAnimation === 'pulse' ? 'bio-border-pulse' : ''}
                                    ${borderAnimation === 'glow' ? 'bio-border-glow' : ''}
                                    ${hoverAnimation === 'scale' ? 'bio-hover-scale' : ''}
                                    ${hoverAnimation === 'bounce' ? 'bio-hover-bounce' : ''}
                                    ${hoverAnimation === 'shake' ? 'bio-hover-shake' : ''}
                                    ${hoverAnimation === 'rotate' ? 'bio-hover-rotate' : ''}
                                  `}
                                  style={{ 
                                    borderRadius: `${borderRadius}px`,
                                    backgroundColor: buttonColor,
                                    color: buttonTextColor,
                                    ...(borderAnimation === 'rgb' && borderStyle !== 'none' && {
                                      '--border-width': `${borderWidth}px`
                                    }),
                                    ...(borderAnimation !== 'rgb' && borderStyle !== 'none' && {
                                      border: `${borderWidth}px ${borderStyle} ${borderColor}`
                                    })
                                  } as React.CSSProperties}
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

      {selectedBio && (
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
              <p className="text-2xl font-bold">{selectedBio.total_clicks}</p>
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
