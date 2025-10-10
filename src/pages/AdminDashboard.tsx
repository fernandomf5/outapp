import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Plus,
  Edit,
  Trash2,
  Crown,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats] = useState({
    totalUsers: 247,
    activeSubscriptions: 189,
    monthlyRevenue: 24750,
    growthRate: 18,
  });

  const [plans, setPlans] = useState<Plan[]>([
    {
      id: "1",
      name: "Chatbot Automação",
      price: 49.9,
      description: "Automação simples para WhatsApp",
      features: ["Fluxos ilimitados", "2 WhatsApp conectados", "Suporte 24/7"],
    },
    {
      id: "2",
      name: "Agente IA Premium",
      price: 89.9,
      description: "Atendimento inteligente com IA",
      features: ["IA avançada", "5 WhatsApp conectados", "Análise de sentimentos", "Prioridade no suporte"],
    },
    {
      id: "3",
      name: "Teste Grátis",
      price: 0,
      description: "3 dias de teste completo",
      features: ["Todas as funcionalidades", "Sem cartão de crédito", "3 dias de acesso"],
    },
  ]);

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSavePlan = () => {
    if (editingPlan) {
      if (editingPlan.id === "new") {
        setPlans([...plans, { ...editingPlan, id: Date.now().toString() }]);
        toast({
          title: "Plano criado! ✅",
          description: "O novo plano está disponível para os usuários.",
        });
      } else {
        setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
        toast({
          title: "Plano atualizado! ✅",
          description: "As alterações foram salvas.",
        });
      }
    }
    setIsDialogOpen(false);
    setEditingPlan(null);
  };

  const handleDeletePlan = (id: string) => {
    setPlans(plans.filter(p => p.id !== id));
    toast({
      title: "Plano excluído",
      description: "O plano foi removido com sucesso.",
    });
  };

  const createNewPlan = () => {
    setEditingPlan({
      id: "new",
      name: "",
      price: 0,
      description: "",
      features: [],
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/auth")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-warning/10 p-2 rounded-xl">
                <Crown className="w-8 h-8 text-warning" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Painel Master Admin</h1>
                <p className="text-sm text-muted-foreground">Controle total da plataforma</p>
              </div>
            </div>
          </div>

          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-primary/10 p-3 rounded-xl">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">+32 este mês</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.totalUsers}</h3>
            <p className="text-muted-foreground">Usuários Totais</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-success/10 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <span className="text-sm font-medium text-success">Ativo</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.activeSubscriptions}</h3>
            <p className="text-muted-foreground">Assinaturas Ativas</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-warning/10 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-warning" />
              </div>
              <span className="text-sm font-medium text-warning">+{stats.growthRate}%</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">R$ {stats.monthlyRevenue.toLocaleString()}</h3>
            <p className="text-muted-foreground">Receita Mensal</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-info/10 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-info" />
              </div>
              <span className="text-sm font-medium text-info">Crescimento</span>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stats.growthRate}%</h3>
            <p className="text-muted-foreground">Taxa de Crescimento</p>
          </Card>
        </div>

        {/* Plans Management */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Gerenciar Planos</h2>
            <Button onClick={createNewPlan} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Criar Novo Plano
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="p-6 hover:shadow-lg transition-smooth">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                    <p className="text-3xl font-bold text-primary">
                      R$ {plan.price.toFixed(2)}
                      <span className="text-sm text-muted-foreground font-normal">/mês</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingPlan(plan);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">{plan.description}</p>

                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Card>

        {/* Kiwify Integration */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Integração Kiwify</h2>
          <p className="text-muted-foreground mb-6">
            Configure a integração com a Kiwify para gerenciar pagamentos e afiliados
          </p>

          <div className="space-y-4 max-w-2xl">
            <div>
              <Label htmlFor="kiwify-token">Token de API da Kiwify</Label>
              <Input id="kiwify-token" placeholder="Cole seu token aqui" />
            </div>

            <div>
              <Label htmlFor="kiwify-webhook">URL do Webhook</Label>
              <Input
                id="kiwify-webhook"
                value="https://seu-app.com/webhooks/kiwify"
                readOnly
              />
              <p className="text-xs text-muted-foreground mt-1">
                Cole esta URL nas configurações de webhook da Kiwify
              </p>
            </div>

            <Button className="gradient-primary">
              Salvar Configurações
            </Button>
          </div>
        </Card>
      </main>

      {/* Plan Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan?.id === "new" ? "Criar Novo Plano" : "Editar Plano"}
            </DialogTitle>
          </DialogHeader>

          {editingPlan && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="plan-name">Nome do Plano</Label>
                <Input
                  id="plan-name"
                  value={editingPlan.name}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, name: e.target.value })
                  }
                  placeholder="Ex: Plano Premium"
                />
              </div>

              <div>
                <Label htmlFor="plan-price">Preço (R$)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  step="0.01"
                  value={editingPlan.price}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="plan-description">Descrição</Label>
                <Input
                  id="plan-description"
                  value={editingPlan.description}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, description: e.target.value })
                  }
                  placeholder="Breve descrição do plano"
                />
              </div>

              <div>
                <Label>Recursos (um por linha)</Label>
                <textarea
                  className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background"
                  value={editingPlan.features.join("\n")}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      features: e.target.value.split("\n").filter((f) => f.trim()),
                    })
                  }
                  placeholder="Recurso 1&#10;Recurso 2&#10;Recurso 3"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSavePlan} className="gradient-primary">
                  Salvar Plano
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
