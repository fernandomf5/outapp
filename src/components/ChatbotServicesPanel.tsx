import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash, Loader2, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ChatbotServicesPanelProps {
  chatbotId: string;
}

export const ChatbotServicesPanel = ({ chatbotId }: ChatbotServicesPanelProps) => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "60",
    is_active: true,
    image_url: "",
  });

  useEffect(() => {
    loadServices();
  }, [chatbotId]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('chatbot_services')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServices(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: "Erro ao carregar serviços",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const serviceData = {
        ...formData,
        price: parseFloat(formData.price),
        duration_minutes: parseInt(formData.duration_minutes),
        chatbot_id: chatbotId,
      };

      if (editingService) {
        const { error } = await supabase
          .from('chatbot_services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
        toast({ title: "Serviço atualizado com sucesso" });
      } else {
        const { error } = await supabase
          .from('chatbot_services')
          .insert(serviceData);

        if (error) throw error;
        toast({ title: "Serviço criado com sucesso" });
      }

      setIsDialogOpen(false);
      setEditingService(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        duration_minutes: "60",
        is_active: true,
        image_url: "",
      });
      loadServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({ title: "Erro ao salvar serviço", variant: "destructive" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma imagem válida",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${chatbotId}/services/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chatbot-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chatbot-media')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: "Imagem enviada com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chatbot_services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Serviço excluído com sucesso" });
      loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({ title: "Erro ao excluir serviço", variant: "destructive" });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('chatbot_services')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      toast({ title: isActive ? "Serviço ativado" : "Serviço desativado" });
      loadServices();
    } catch (error) {
      console.error('Error toggling service:', error);
      toast({ title: "Erro ao atualizar serviço", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Serviços</h3>
          <p className="text-muted-foreground">Gerencie os serviços do seu chatbot</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingService(null);
                setFormData({
                  name: "",
                  description: "",
                  price: "",
                  duration_minutes: "60",
                  is_active: true,
                  image_url: "",
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar" : "Novo"} Serviço
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Corte de cabelo, Massagem relaxante"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o serviço oferecido"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="60"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="image">Imagem do Serviço</Label>
                {formData.image_url && (
                  <div className="mb-3 relative">
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                    >
                      Remover
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="cursor-pointer"
                  />
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG ou WEBP (máx. 5MB)
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Serviço ativo</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                Salvar Serviço
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Nenhum serviço cadastrado ainda
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Serviço
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              {service.image_url && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-primary">
                        R$ {service.price.toFixed(2)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{service.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={(checked) => toggleActive(service.id, checked)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingService(service);
                        setFormData({
                          name: service.name,
                          description: service.description || "",
                          price: service.price.toString(),
                          duration_minutes: service.duration_minutes.toString(),
                          is_active: service.is_active,
                          image_url: service.image_url || "",
                        });
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};