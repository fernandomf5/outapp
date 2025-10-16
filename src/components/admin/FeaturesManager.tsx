import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Settings, Edit } from "lucide-react";

interface Feature {
  id: string;
  name: string;
  description: string | null;
  key: string;
  category: string | null;
  is_active: boolean;
}

export const FeaturesManager = () => {
  const { toast } = useToast();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    key: "",
    category: ""
  });

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .order('category', { ascending: true });

    if (!error && data) {
      setFeatures(data);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.key) {
      toast({
        title: "Erro",
        description: "Nome e chave são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const data = {
      ...formData,
      description: formData.description || null,
      category: formData.category || null
    };

    if (editingFeature) {
      const { error } = await supabase
        .from('features')
        .update(data)
        .eq('id', editingFeature.id);

      if (error) {
        toast({
          title: "Erro ao atualizar",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({ title: "Recurso atualizado!" });
        fetchFeatures();
        handleCloseDialog();
      }
    } else {
      const { error } = await supabase
        .from('features')
        .insert(data);

      if (error) {
        toast({
          title: "Erro ao criar",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({ title: "Recurso criado!" });
        fetchFeatures();
        handleCloseDialog();
      }
    }
  };

  const handleEdit = (feature: Feature) => {
    setEditingFeature(feature);
    setFormData({
      name: feature.name,
      description: feature.description || "",
      key: feature.key,
      category: feature.category || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('features')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({ title: "Recurso excluído" });
      fetchFeatures();
    }
  };

  const handleToggleStatus = async (feature: Feature) => {
    const { error } = await supabase
      .from('features')
      .update({ is_active: !feature.is_active })
      .eq('id', feature.id);

    if (!error) {
      fetchFeatures();
      toast({
        title: feature.is_active ? "Recurso desativado" : "Recurso ativado"
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFeature(null);
    setFormData({ name: "", description: "", key: "", category: "" });
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    const category = feature.category || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Gerenciar Recursos
        </h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary" onClick={() => setEditingFeature(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Recurso
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFeature ? 'Editar Recurso' : 'Criar Novo Recurso'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Chatbot Web"
                />
              </div>

              <div>
                <Label>Chave (key) *</Label>
                <Input
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                  placeholder="Ex: chatbot_web"
                  disabled={!!editingFeature}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Identificador único (não pode ser alterado após criação)
                </p>
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do recurso"
                />
              </div>

              <div>
                <Label>Categoria</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Automação, Marketing, CRM"
                />
              </div>

              <Button onClick={handleSubmit} className="w-full gradient-primary">
                {editingFeature ? 'Atualizar' : 'Criar'} Recurso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-3 text-primary">{category}</h3>
            <div className="space-y-2">
              {categoryFeatures.map((feature) => (
                <Card key={feature.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold">{feature.name}</h4>
                        <Badge variant={feature.is_active ? "default" : "secondary"}>
                          {feature.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {feature.description}
                      </p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {feature.key}
                      </code>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(feature)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(feature)}
                      >
                        {feature.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(feature.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
