import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Plus, Edit, Trash2, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as LucideIcons from "lucide-react";

interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
  order_index: number;
}

export const LandingFeaturesEditor = () => {
  const { toast } = useToast();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [loading, setLoading] = useState(false);

  const iconOptions = [
    "Workflow", "Brain", "Users", "UserPlus", "BarChart3", "Link2",
    "Gift", "Ticket", "Video", "DollarSign", "Shield", "TrendingUp",
    "Bot", "Zap", "MessageSquare", "Clock", "CheckCircle2", "Sparkles"
  ];

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'landing_features')
      .maybeSingle();

    if (!error && data && data.value) {
      try {
        const parsedFeatures = JSON.parse(data.value);
        setFeatures(parsedFeatures);
      } catch (e) {
        console.error('Error parsing features:', e);
      }
    }
  };

  const handleSave = async () => {
    if (!editingFeature?.title || !editingFeature?.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e descrição.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    let updatedFeatures = [...features];
    if (editingFeature.id === "new") {
      updatedFeatures.push({
        ...editingFeature,
        id: Date.now().toString(),
        order_index: features.length,
      });
    } else {
      updatedFeatures = features.map(f => f.id === editingFeature.id ? editingFeature : f);
    }

    await saveFeatures(updatedFeatures);
    setIsDialogOpen(false);
    setEditingFeature(null);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const updatedFeatures = features.filter(f => f.id !== id);
    await saveFeatures(updatedFeatures);
  };

  const saveFeatures = async (updatedFeatures: Feature[]) => {
    const { data: existing } = await supabase
      .from('site_settings')
      .select('key')
      .eq('key', 'landing_features')
      .maybeSingle();

    const featuresJson = JSON.stringify(updatedFeatures);

    if (existing) {
      await supabase
        .from('site_settings')
        .update({ value: featuresJson })
        .eq('key', 'landing_features');
    } else {
      await supabase
        .from('site_settings')
        .insert({ 
          key: 'landing_features', 
          value: featuresJson, 
          description: 'Recursos da landing page' 
        });
    }

    setFeatures(updatedFeatures);
    toast({ title: "Recursos atualizados com sucesso!" });
  };

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  const createNew = () => {
    setEditingFeature({
      id: "new",
      icon: "Sparkles",
      title: "",
      description: "",
      order_index: features.length,
    });
    setIsDialogOpen(true);
  };

  const handleBulkAdd = async () => {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    setLoading(true);
    const newFeatures = lines.map((line, i) => {
      // Remove emoji prefix if present
      const cleaned = line.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Component}\uFE0F\u200D]+\s*/u, "").trim();
      return {
        id: (Date.now() + i).toString(),
        icon: "Sparkles",
        title: cleaned || line,
        description: "",
        order_index: features.length + i,
      };
    });

    await saveFeatures([...features, ...newFeatures]);
    setBulkText("");
    setIsBulkOpen(false);
    setLoading(false);
  };

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon ? <Icon className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <CardTitle>Editor de Recursos da Landing Page</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsBulkOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar em Lote
            </Button>
            <Button onClick={createNew}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Recurso
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-muted/50 p-4 rounded-lg border border-border"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    {getIcon(feature.icon)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditingFeature(feature);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(feature.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {features.length === 0 && (
            <div className="col-span-2">
              <p className="text-center text-muted-foreground py-8">
                Nenhum recurso cadastrado. Clique em "Adicionar Recurso" para começar.
              </p>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFeature?.id === "new" ? "Novo Recurso" : "Editar Recurso"}
            </DialogTitle>
          </DialogHeader>

          {editingFeature && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="icon">Ícone</Label>
                <Select
                  value={editingFeature.icon}
                  onValueChange={(value) =>
                    setEditingFeature({ ...editingFeature, icon: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          {getIcon(icon)}
                          <span>{icon}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={editingFeature.title}
                  onChange={(e) =>
                    setEditingFeature({ ...editingFeature, title: e.target.value })
                  }
                  placeholder="Construtor Visual de Automações"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={editingFeature.description}
                  onChange={(e) =>
                    setEditingFeature({ ...editingFeature, description: e.target.value })
                  }
                  placeholder="Crie fluxos de conversação sem código..."
                  rows={4}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingFeature(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Recursos em Lote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Cole a lista de recursos (um por linha). Emojis no início serão removidos automaticamente.
            </p>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"📅 Agenda / Agendamento\n💬 Criação de Chat Online\n💰 Gestão Financeira"}
              rows={12}
            />
            <p className="text-xs text-muted-foreground">
              {bulkText.split("\n").filter(l => l.trim()).length} recurso(s) detectado(s)
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsBulkOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleBulkAdd} disabled={loading || !bulkText.trim()}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Salvando..." : "Adicionar Todos"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
