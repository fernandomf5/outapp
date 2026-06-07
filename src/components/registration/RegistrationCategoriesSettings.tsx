import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Trash2, Plus, Building2, Users, UserCog, Truck, Database, Palette, Briefcase, Handshake, Wrench, Target, DollarSign, Globe, LayoutList, Smartphone, Package, ShieldCheck, HardHat, HeartPulse, GraduationCap, Gavel, Edit, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ImageUpload } from "../ImageUpload";

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
  { name: "Handshake", icon: Handshake },
  { name: "Wrench", icon: Wrench },
  { name: "Target", icon: Target },
  { name: "DollarSign", icon: DollarSign },
  { name: "Globe", icon: Globe },
  { name: "Package", icon: Package },
  { name: "Briefcase", icon: Briefcase },
  { name: "HardHat", icon: HardHat },
  { name: "HeartPulse", icon: HeartPulse },
  { name: "GraduationCap", icon: GraduationCap },
  { name: "Gavel", icon: Gavel },
];

export function RegistrationCategoriesSettings() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    icon: "Database",
    color: "#3b82f6",
    system_type: "client",
    logo_url: "",
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
      if (editingId) {
        const { error } = await supabase
          .from('registration_categories')
          .update({
            name: formData.name,
            icon: formData.icon,
            color: formData.color,
            system_type: formData.system_type,
            logo_url: formData.logo_url,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Categoria atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('registration_categories')
          .insert({
            user_id: user.id,
            name: formData.name,
            icon: formData.icon,
            color: formData.color,
            system_type: formData.system_type,
            logo_url: formData.logo_url,
          });

        if (error) throw error;
        toast.success('Categoria criada com sucesso!');
      }
      
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData({ name: "", icon: "Database", color: "#3b82f6", system_type: "client", logo_url: "" });
      fetchCategories();
      
      window.dispatchEvent(new CustomEvent('registration-categories-updated'));
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      icon: category.icon || "Database",
      color: category.color,
      system_type: category.system_type || "client",
      logo_url: (category as any).logo_url || "",
    });
    setIsDialogOpen(true);
  };

  const confirmDelete = (category: Category) => {
    if (category.system_type && false) { // Logic to keep system categories if needed, but user said remove them
      toast.error('Categorias do sistema não podem ser excluídas.');
      return;
    }
    setCategoryToDelete(category);
    setDeleteConfirmText("");
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    if (deleteConfirmText.toLowerCase() !== "excluir") {
      toast.error('Você deve digitar "excluir" para confirmar.');
      return;
    }

    try {
      const { error } = await supabase
        .from('registration_categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;
      toast.success('Categoria excluída!');
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
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
        <Button onClick={() => {
          setEditingId(null);
          setFormData({ name: "", icon: "Database", color: "#3b82f6", system_type: "client", logo_url: "" });
          setIsDialogOpen(true);
        }} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = AVAILABLE_ICONS.find(i => i.name === cat.icon)?.icon || Database;
          const logoUrl = (cat as any).logo_url;
          return (
            <Card key={cat.id} className="glass overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${cat.color}20` }}>
                      {logoUrl ? (
                        <img src={logoUrl} alt={cat.name} className="h-6 w-6 object-cover rounded" />
                      ) : (
                        <Icon className="h-6 w-6" style={{ color: cat.color }} />
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEdit(cat)}
                      className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => confirmDelete(cat)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingId(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Atualize as informações da categoria." : "Crie uma nova categoria para organizar seus cadastros."}
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
              <ImageUpload 
                label="Logo da Categoria (opcional)"
                currentImage={formData.logo_url}
                onImageSelect={(url) => setFormData({ ...formData, logo_url: url })}
                bucketName="avatars"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="system_type">Tipo de Cadastro</Label>
              <Select 
                value={formData.system_type} 
                onValueChange={(value) => setFormData({ ...formData, system_type: value })}
              >
                <SelectTrigger id="system_type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem value="client">Clientes</SelectItem>
                  <SelectItem value="supplier">Fornecedores</SelectItem>
                  <SelectItem value="team">Equipe / Funcionários</SelectItem>
                  <SelectItem value="business">Negócios / B2B</SelectItem>
                  <SelectItem value="logistics">Logística / Transportes</SelectItem>
                  <SelectItem value="partners">Parceiros</SelectItem>
                  <SelectItem value="maintenance">Manutenção / Serviços Técnicos</SelectItem>
                  <SelectItem value="leads">Leads / Prospectos</SelectItem>
                  <SelectItem value="investors">Investidores</SelectItem>
                  <SelectItem value="services">Prestadores de Serviços</SelectItem>
                  <SelectItem value="infrastructure">Infraestrutura / Ativos</SelectItem>
                  <SelectItem value="health">Saúde / Pacientes</SelectItem>
                  <SelectItem value="education">Educação / Alunos</SelectItem>
                  <SelectItem value="legal">Jurídico / Processos</SelectItem>
                  <SelectItem value="security">Segurança / Monitoramento</SelectItem>
                  <SelectItem value="marketing">Marketing / Agências</SelectItem>
                  <SelectItem value="consultancy">Consultoria / Assessoria</SelectItem>
                  <SelectItem value="hr">Recursos Humanos / Talentos</SelectItem>
                  <SelectItem value="finance">Financeiro / Bancos</SelectItem>
                  <SelectItem value="retail">Varejo / Comércio</SelectItem>
                  <SelectItem value="other">Outros</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">O tipo define os campos que aparecerão no formulário.</p>
            </div>
            
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2">
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
              <Button type="button" variant="outline" onClick={() => {
                setIsDialogOpen(false);
                setEditingId(null);
              }}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary">
                {editingId ? "Salvar Alterações" : "Criar Categoria"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Esta ação não pode ser desfeita. Todos os cadastros vinculados a esta categoria 
                (<strong>{categoryToDelete?.name}</strong>) perderão o vínculo.
              </p>
              <div className="space-y-2">
                <Label htmlFor="delete-confirm">Para confirmar, digite <strong>excluir</strong> abaixo:</Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="excluir"
                  className="border-destructive focus-visible:ring-destructive"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsDeleteDialogOpen(false);
              setCategoryToDelete(null);
              setDeleteConfirmText("");
            }}>
              Cancelar
            </AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteConfirmText.toLowerCase() !== "excluir"}
            >
              Excluir Permanentemente
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
