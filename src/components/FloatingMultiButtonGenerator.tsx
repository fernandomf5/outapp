import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Copy, Plus, Trash2, Zap, Save, Edit2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SubButton {
  id: string;
  text: string;
  link: string;
  icon: string;
  imageUrl?: string;
}

interface SavedButton {
  id: string;
  name: string;
  main_button_text: string;
  main_button_icon: string;
  main_button_color: string;
  position: string;
  sub_buttons: SubButton[];
  generated_code: string;
  created_at: string;
}

export const FloatingMultiButtonGenerator = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [configName, setConfigName] = useState("");
  const [mainButtonText, setMainButtonText] = useState("Contato");
  const [mainButtonIcon, setMainButtonIcon] = useState("whatsapp");
  const [mainButtonColor, setMainButtonColor] = useState("#25d366");
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');
  const [subButtons, setSubButtons] = useState<SubButton[]>([
    { id: '1', text: 'WhatsApp', link: '', icon: 'whatsapp', imageUrl: undefined }
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [savedButtons, setSavedButtons] = useState<SavedButton[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedButtons();
    }
  }, [user]);

  const fetchSavedButtons = async () => {
    const { data, error } = await supabase
      .from("floating_buttons")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching buttons:", error);
      return;
    }

    setSavedButtons(data?.map(item => ({
      ...item,
      sub_buttons: (item.sub_buttons as unknown) as SubButton[],
      generated_code: item.generated_code || ''
    })) || []);
  };

  const resetForm = () => {
    setConfigName("");
    setMainButtonText("Contato");
    setMainButtonIcon("whatsapp");
    setMainButtonColor("#25d366");
    setPosition("bottom-right");
    setSubButtons([{ id: '1', text: 'WhatsApp', link: '', icon: 'whatsapp', imageUrl: undefined }]);
    setEditingId(null);
    setShowForm(false);
  };

  const loadConfig = (config: SavedButton) => {
    setConfigName(config.name);
    setMainButtonText(config.main_button_text);
    setMainButtonIcon(config.main_button_icon);
    setMainButtonColor(config.main_button_color);
    setPosition(config.position as any);
    setSubButtons(config.sub_buttons);
    setEditingId(config.id);
    setShowForm(true);
  };

  const saveConfig = async () => {
    if (!configName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Por favor, dê um nome para esta configuração.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const generatedCode = generateCode();
    const configData = {
      user_id: user?.id,
      name: configName,
      main_button_text: mainButtonText,
      main_button_icon: mainButtonIcon,
      main_button_color: mainButtonColor,
      position,
      sub_buttons: JSON.parse(JSON.stringify(subButtons)),
      generated_code: generatedCode,
    };

    if (editingId) {
      const { error } = await supabase
        .from("floating_buttons")
        .update({ ...configData, updated_at: new Date().toISOString() })
        .eq("id", editingId);

      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Atualizado!", description: "Configuração atualizada com sucesso." });
        resetForm();
        fetchSavedButtons();
      }
    } else {
      const { error } = await supabase
        .from("floating_buttons")
        .insert(configData);

      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Salvo!", description: "Configuração salva com sucesso." });
        resetForm();
        fetchSavedButtons();
      }
    }

    setIsLoading(false);
  };

  const deleteConfig = async (id: string) => {
    const { error } = await supabase
      .from("floating_buttons")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Excluído!", description: "Configuração removida com sucesso." });
      if (editingId === id) resetForm();
      fetchSavedButtons();
    }
  };
  
  const addSubButton = () => {
    setSubButtons([...subButtons, {
      id: Date.now().toString(),
      text: '',
      link: '',
      icon: 'link',
      imageUrl: undefined
    }]);
  };

  const removeSubButton = (id: string) => {
    setSubButtons(subButtons.filter(btn => btn.id !== id));
  };

  const updateSubButton = (id: string, field: keyof SubButton, value: string) => {
    setSubButtons(subButtons.map(btn => 
      btn.id === id ? { ...btn, [field]: value } : btn
    ));
  };

  const handleImageUpload = async (id: string, file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chatbot-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chatbot-media')
        .getPublicUrl(fileName);

      updateSubButton(id, 'imageUrl', publicUrl);
      toast({ title: "Imagem carregada!", description: "A imagem foi enviada com sucesso." });
    } catch (error) {
      toast({ 
        title: "Erro ao fazer upload", 
        description: "Não foi possível carregar a imagem.",
        variant: "destructive" 
      });
    }
  };

  const getPositionStylesFromConfig = (pos: string) => {
    switch (pos) {
      case 'bottom-right':
        return { bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { bottom: '20px', left: '20px' };
      case 'top-right':
        return { top: '20px', right: '20px' };
      case 'top-left':
        return { top: '20px', left: '20px' };
      default:
        return { bottom: '20px', right: '20px' };
    }
  };

  const getPositionStyles = () => {
    return getPositionStylesFromConfig(position);
  };

  const getIconSvg = (iconType: string, imageUrl?: string) => {
    if (imageUrl) {
      return `<img src="${imageUrl}" style="width: 24px; height: 24px; object-fit: cover; border-radius: 50%;" />`;
    }

    switch (iconType) {
      case 'whatsapp':
        return `<svg fill="white" width="24" height="24" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`;
      case 'messenger':
        return `<svg fill="white" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/></svg>`;
      case 'message':
        return `<svg fill="white" width="24" height="24" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>`;
      case 'phone':
        return `<svg fill="white" width="24" height="24" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`;
      default:
        return `<svg fill="white" width="24" height="24" viewBox="0 0 24 24"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>`;
    }
  };

  const generateCodeFromConfig = (config: SavedButton) => {
    const posStyles = getPositionStylesFromConfig(config.position);
    const subButtonsHtml = config.sub_buttons.map((btn, idx) => `
      <a href="${btn.link}" target="_blank" style="
        display: none;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        background: ${config.main_button_color};
        border-radius: 50%;
        color: white;
        text-decoration: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin-bottom: 10px;
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s ease;
        transition-delay: ${idx * 0.05}s;
      " class="floating-sub-btn">
        ${getIconSvg(btn.icon, btn.imageUrl)}
      </a>
    `).join('');

    return `<!-- Botão Flutuante Multi-Links -->
<div id="floating-multi-btn-container" style="position: fixed; ${Object.entries(posStyles).map(([k,v]) => k+':'+v).join('; ')}; z-index: 9999; display: flex; flex-direction: column; align-items: center;">
  ${subButtonsHtml}
  
  <button id="floating-main-btn" onclick="toggleFloatingButtons()" style="
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: ${config.main_button_color};
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
  " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
    ${getIconSvg(config.main_button_icon)}
  </button>
</div>

<script>
let isOpen = false;

function toggleFloatingButtons() {
  isOpen = !isOpen;
  const subButtons = document.querySelectorAll('.floating-sub-btn');
  const mainBtn = document.getElementById('floating-main-btn');
  
  subButtons.forEach((btn, idx) => {
    setTimeout(() => {
      btn.style.display = isOpen ? 'flex' : 'none';
      btn.style.opacity = isOpen ? '1' : '0';
      btn.style.transform = isOpen ? 'scale(1)' : 'scale(0)';
    }, idx * 50);
  });
  
  mainBtn.style.transform = isOpen ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1)';
}
</script>`;
  };

  const generateCode = () => {
    const posStyles = getPositionStyles();
    const subButtonsHtml = subButtons.map((btn, idx) => `
      <a href="${btn.link}" target="_blank" style="
        display: none;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        background: ${mainButtonColor};
        border-radius: 50%;
        color: white;
        text-decoration: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        margin-bottom: 10px;
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s ease;
        transition-delay: ${idx * 0.05}s;
      " class="floating-sub-btn">
        ${getIconSvg(btn.icon, btn.imageUrl)}
      </a>
    `).join('');

    return `<!-- Botão Flutuante Multi-Links -->
<div id="floating-multi-btn-container" style="position: fixed; ${Object.entries(posStyles).map(([k,v]) => k+':'+v).join('; ')}; z-index: 9999; display: flex; flex-direction: column; align-items: center;">
  ${subButtonsHtml}
  
  <button id="floating-main-btn" onclick="toggleFloatingButtons()" style="
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: ${mainButtonColor};
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;
  " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
    ${getIconSvg(mainButtonIcon)}
  </button>
</div>

<script>
let isOpen = false;

function toggleFloatingButtons() {
  isOpen = !isOpen;
  const subButtons = document.querySelectorAll('.floating-sub-btn');
  const mainBtn = document.getElementById('floating-main-btn');
  
  subButtons.forEach((btn, idx) => {
    setTimeout(() => {
      btn.style.display = isOpen ? 'flex' : 'none';
      btn.style.opacity = isOpen ? '1' : '0';
      btn.style.transform = isOpen ? 'scale(1)' : 'scale(0)';
    }, idx * 50);
  });
  
  mainBtn.style.transform = isOpen ? 'rotate(45deg) scale(1.1)' : 'rotate(0deg) scale(1)';
}
</script>`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    toast({
      title: "Código copiado!",
      description: "Cole no HTML do seu site, antes do </body>"
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Zap className="w-6 h-6 text-primary" />
        Gerador de Botão Flutuante Multi-Links
      </h2>

      {/* Configurações Salvas */}
      {savedButtons.length > 0 && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-3">Configurações Salvas</h3>
          <div className="grid gap-2">
            {savedButtons.map((config) => (
              <div
                key={config.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  editingId === config.id ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-accent/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: config.main_button_color }}
                    dangerouslySetInnerHTML={{ __html: getIconSvg(config.main_button_icon) }}
                  />
                  <div>
                    <p className="font-medium">{config.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {config.sub_buttons.length} botões • {config.position}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(config.generated_code || generateCodeFromConfig(config));
                      toast({
                        title: "Código copiado!",
                        description: "Cole no HTML do seu site, antes do </body>"
                      });
                    }}
                    className="h-8 w-8"
                    title="Copiar código"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => loadConfig(config)}
                    className="h-8 w-8"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteConfig(config.id)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/20"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão para criar novo */}
      {!showForm && (
        <Button 
          onClick={() => setShowForm(true)} 
          className="mb-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Criar novo botão flutuante
        </Button>
      )}

      {showForm && <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuração */}
        <div className="space-y-4">
          {/* Nome da configuração */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-semibold">Nome da Configuração *</Label>
              {editingId && (
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <X className="w-4 h-4 mr-1" />
                  Cancelar Edição
                </Button>
              )}
            </div>
            <Input
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="Ex: Botões do meu site"
            />
          </div>

          <div>
            <Label>Texto do Botão Principal</Label>
            <Input
              value={mainButtonText}
              onChange={(e) => setMainButtonText(e.target.value)}
              placeholder="Contato"
            />
          </div>

          <div>
            <Label>Cor do Botão Principal</Label>
            <Input
              type="color"
              value={mainButtonColor}
              onChange={(e) => setMainButtonColor(e.target.value)}
            />
          </div>

          <div>
            <Label>Ícone do Botão Principal</Label>
            <Select value={mainButtonIcon} onValueChange={setMainButtonIcon}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="messenger">Messenger</SelectItem>
                <SelectItem value="message">Mensagem</SelectItem>
                <SelectItem value="phone">Telefone</SelectItem>
                <SelectItem value="link">Link Genérico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Posição</Label>
            <Select value={position} onValueChange={(val: any) => setPosition(val)}>
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

          {/* Sub-botões */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-lg">Botões Secundários</Label>
              <Button onClick={addSubButton} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {subButtons.map((btn) => (
                <div key={btn.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Botão #{btn.id}</Label>
                    {subButtons.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSubButton(btn.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Texto do botão"
                    value={btn.text}
                    onChange={(e) => updateSubButton(btn.id, 'text', e.target.value)}
                  />

                  <Input
                    placeholder="Link (URL completa)"
                    value={btn.link}
                    onChange={(e) => updateSubButton(btn.id, 'link', e.target.value)}
                  />

                  <Select
                    value={btn.icon}
                    onValueChange={(val) => updateSubButton(btn.id, 'icon', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ícone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="messenger">Messenger</SelectItem>
                      <SelectItem value="message">Mensagem</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="link">Link Genérico</SelectItem>
                    </SelectContent>
                  </Select>

                  <div>
                    <Label className="text-xs">Ou use uma imagem customizada:</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(btn.id, file);
                      }}
                      className="mt-1"
                    />
                    {btn.imageUrl && (
                      <img src={btn.imageUrl} alt="Preview" className="mt-2 w-10 h-10 rounded-full object-cover" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão Salvar */}
          <Button
            onClick={saveConfig}
            disabled={isLoading}
            className="w-full"
            variant="default"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Salvando..." : editingId ? "Atualizar Configuração" : "Salvar Configuração"}
          </Button>
        </div>

        {/* Preview */}
        <div>
          <Label className="mb-2 block">Prévia</Label>
          <div className="relative bg-muted/50 rounded-lg p-4 h-[500px] border-2 border-dashed">
            <div 
              style={{ 
                position: 'absolute',
                ...getPositionStyles(),
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              {isOpen && subButtons.map((btn, idx) => (
                <div
                  key={btn.id}
                  style={{
                    width: '50px',
                    height: '50px',
                    background: mainButtonColor,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    animation: `fadeInUp 0.3s ease ${idx * 0.05}s both`,
                    cursor: 'pointer'
                  }}
                  dangerouslySetInnerHTML={{ __html: getIconSvg(btn.icon, btn.imageUrl) }}
                />
              ))}

              <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: mainButtonColor,
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
                dangerouslySetInnerHTML={{ __html: getIconSvg(mainButtonIcon) }}
              />
            </div>
          </div>

          <style>{`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(10px) scale(0.8);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>

          <div className="mt-4">
            <Label>Código Gerado</Label>
            <Textarea
              value={generateCode()}
              readOnly
              rows={6}
              className="font-mono text-xs mt-2"
            />
            <Button onClick={copyCode} className="w-full mt-2">
              <Copy className="w-4 h-4 mr-2" />
              Copiar Código
            </Button>
          </div>
        </div>
      </div>}
    </Card>
  );
};
