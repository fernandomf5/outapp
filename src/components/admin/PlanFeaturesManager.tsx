import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

interface Feature {
  id: string;
  name: string;
  key: string;
  category: string | null;
}

interface Plan {
  id: string;
  name: string;
}

export const PlanFeaturesManager = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [planFeatures, setPlanFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchFeatures();
  }, []);

  useEffect(() => {
    if (selectedPlan) {
      fetchPlanFeatures();
    }
  }, [selectedPlan]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setPlans(data);
    }
  };

  const fetchFeatures = async () => {
    const { data, error } = await supabase
      .from('features')
      .select('id, name, key, category')
      .eq('is_active', true)
      .order('category', { ascending: true });

    if (!error && data) {
      setFeatures(data);
    }
  };

  const fetchPlanFeatures = async () => {
    if (!selectedPlan) return;

    const { data, error } = await supabase
      .from('plan_features')
      .select('feature_id')
      .eq('plan_id', selectedPlan);

    if (!error && data) {
      setPlanFeatures(data.map(pf => pf.feature_id));
    }
  };

  const handleToggleFeature = async (featureId: string, checked: boolean) => {
    if (!selectedPlan) return;

    setLoading(true);

    if (checked) {
      const { error } = await supabase
        .from('plan_features')
        .insert({ plan_id: selectedPlan, feature_id: featureId });

      if (error) {
        toast({
          title: "Erro ao adicionar recurso",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setPlanFeatures([...planFeatures, featureId]);
        toast({ title: "Recurso adicionado ao plano" });
      }
    } else {
      const { error } = await supabase
        .from('plan_features')
        .delete()
        .eq('plan_id', selectedPlan)
        .eq('feature_id', featureId);

      if (error) {
        toast({
          title: "Erro ao remover recurso",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setPlanFeatures(planFeatures.filter(id => id !== featureId));
        toast({ title: "Recurso removido do plano" });
      }
    }

    setLoading(false);
  };

  const groupedFeatures = features.reduce((acc, feature) => {
    const category = feature.category || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, Feature[]>);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-primary" />
          Recursos por Plano
        </h2>
        <p className="text-muted-foreground mb-4">
          Selecione um plano e marque os recursos que deseja liberar
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {plans.map((plan) => (
            <Button
              key={plan.id}
              variant={selectedPlan === plan.id ? "default" : "outline"}
              onClick={() => setSelectedPlan(plan.id)}
              className="w-full"
            >
              {plan.name}
            </Button>
          ))}
        </div>
      </div>

      {selectedPlan && (
        <div className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 text-primary">{category}</h3>
              <div className="space-y-3">
                {categoryFeatures.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                    <Checkbox
                      id={feature.id}
                      checked={planFeatures.includes(feature.id)}
                      onCheckedChange={(checked) => handleToggleFeature(feature.id, checked as boolean)}
                      disabled={loading}
                    />
                    <Label
                      htmlFor={feature.id}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-xs text-muted-foreground">{feature.key}</div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!selectedPlan && (
        <div className="text-center py-12 text-muted-foreground">
          Selecione um plano para configurar seus recursos
        </div>
      )}
    </Card>
  );
};
