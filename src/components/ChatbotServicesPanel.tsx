import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  image_url?: string;
}

interface ChatbotServicesPanelProps {
  chatbotId: string;
}

export const ChatbotServicesPanel = ({ chatbotId }: ChatbotServicesPanelProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration_minutes: "60",
    is_active: true,
  });

  useEffect(() => {
    fetchServices();
  }, [chatbotId]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('chatbot_services')
      .select('*')
      .eq('chatbot_id', chatbotId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setServices(data);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Erro",
        description: "Nome e preço são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const serviceData = {
      chatbot_id: chatbotId,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      duration_minutes: parseInt(formData.duration_minutes),
      is_active: formData.is_active,
    };

    if (editingService) {
      const { error } = await supabase
        .from('chatbot_services')
        .update(serviceData)
        .eq('id', editingService.id);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Serviço atualizado!",
        });
        resetForm();
        fetchServices();
      }
    } else {
      const { error } = await supabase
        .from('chatbot_services')
        .insert([serviceData]);

      if (error) {
        toast({
          title: "Erro ao criar",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Serviço criado!",
        });
        resetForm();
        fetchServices();
      }
    }

    setLoading(false);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      is_active: service.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    const { error } = await supabase
      .from('chatbot_services')
      .delete()
      .eq('id', serviceId);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Serviço excluído!",
      });
      fetchServices();
    }
  };

  const toggleActive = async (service: Service) => {
    const { error } = await supabase
      .from('chatbot_services')
      .update({ is_active: !service.is_active })
      .eq('id', service.id);

    if (!error) {
      fetchServices();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      duration_minutes: "60",
      is_active: true,
    });
    setEditingService(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Serviços</h3>
          <p className="text-muted-foreground">Gerencie os serviços do seu chatbot</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingService ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome do Serviço</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Consultoria"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o serviço..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Duração (min)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    placeholder="60"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Ativo</Label>
              </div>
              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {editingService ? 'Atualizar' : 'Criar'} Serviço
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold">{service.name}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">R$ {service.price.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{service.duration_minutes} min</p>
              </div>
              <Switch
                checked={service.is_active}
                onCheckedChange={() => toggleActive(service)}
              />
            </div>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum serviço cadastrado ainda</p>
        </Card>
      )}
    </div>
  );
};