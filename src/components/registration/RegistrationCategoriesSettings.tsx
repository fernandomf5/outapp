import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, Building2, Users, UserCog, Truck, Database, Palette } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  system_type: string | null;
}

const AVAILABLE_ICONS = [
  { name: "Building2", icon: Building2 },
  { name: "Users", icon: Users },
  { name: "UserCog", icon: UserCog },
  { name: "Truck", icon: Truck },
  { name: "Database", icon: Database },
];

export function RegistrationCategoriesSettings() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    icon: "Database",
    color: "#3b82f6",
    system_type: "client",
  });

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('registration_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('registration_categories')
        .insert({
          user_id: user.id,
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
        });

      if (error) throw error;
      toast.success('Categoria criada com sucesso!');
      setIsDialogOpen(false);
      setFormData({ name: "", icon: "Database", color: "#3b82f6", system_type: "client" });
      fetchCategories();
      
      // Force reload sidebar categories (dispatch custom event or use a state manager)
      window.dispatchEvent(new CustomEvent('registration-categories-updated'));
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Erro ao criar categoria');
    }
  };

  const handleDelete = async (id: string, systemType: string | null) => {
    if (systemType) {
      toast.error('Categorias do sistema não podem ser excluídas.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta categoria? Contatos vinculados perderão a categoria.')) return;

    try {
      const { error } = await supabase
        .from('registration_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Categoria excluída!');
      fetchCategories();
      window.dispatchEvent(new CustomEvent('registration-categories-updated'));
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Categorias de Cadastro</h2>
          <p className="text-muted-foreground">Personalize suas categorias de fornecedores, clientes, equipe, etc.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = AVAILABLE_ICONS.find(i => i.name === cat.icon)?.icon || Database;
          return (
            <Card key={cat.id} className="glass">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${cat.color}20` }}>
                    <Icon className="h-6 w-6" style={{ color: cat.color }} />
                  </div>
                  {!cat.system_type && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(cat.id, cat.system_type)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="mt-4">{cat.name}</CardTitle>
                <CardDescription>
                  {cat.system_type ? `Categoria do Sistema (${cat.system_type})` : 'Categoria Personalizada'}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
            <DialogDescription>
              Crie uma nova categoria para organizar seus cadastros.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Categoria</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Fornecedores, Parceiros..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex gap-2">
                {AVAILABLE_ICONS.map((item) => (
                  <Button
                    key={item.name}
                    type="button"
                    variant={formData.icon === item.name ? "default" : "outline"}
                    className="p-2 h-10 w-10"
                    onClick={() => setFormData({ ...formData, icon: item.name })}
                  >
                    <item.icon className="h-5 w-5" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex items-center gap-3">
                <Input 
                  id="color" 
                  type="color" 
                  value={formData.color} 
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 p-1"
                />
                <span className="text-sm font-mono">{formData.color}</span>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary">
                Criar Categoria
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
