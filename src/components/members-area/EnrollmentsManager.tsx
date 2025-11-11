import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Users, Plus, Mail, Calendar, ShoppingBag, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Enrollment {
  id: string;
  user_email: string;
  user_name: string;
  enrolled_at: string;
  status: string;
  purchased_products: string[];
}

interface EnrollmentsManagerProps {
  areaId: string;
}

export function EnrollmentsManager({ areaId }: EnrollmentsManagerProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_email: '',
    user_name: ''
  });

  useEffect(() => {
    loadEnrollments();
  }, [areaId]);

  const loadEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('members_area_enrollments')
        .select('*')
        .eq('area_id', areaId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      setEnrollments((data || []).map(e => ({
        ...e,
        purchased_products: Array.isArray(e.purchased_products) ? e.purchased_products.map(String) : []
      })));
    } catch (error) {
      console.error("Erro ao carregar matrículas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEnrollment = async () => {
    try {
      if (!formData.user_email) {
        toast.error("Preencha o email do aluno");
        return;
      }

      const { error } = await supabase
        .from('members_area_enrollments')
        .insert([{
          area_id: areaId,
          user_email: formData.user_email,
          user_name: formData.user_name,
          status: 'active'
        }]);

      if (error) throw error;

      toast.success("Aluno matriculado com sucesso!");
      setIsDialogOpen(false);
      setFormData({ user_email: '', user_name: '' });
      loadEnrollments();
    } catch (error) {
      toast.error("Erro ao matricular aluno");
    }
  };

  const handleDeleteEnrollment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('members_area_enrollments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Matrícula removida!");
      loadEnrollments();
    } catch (error) {
      toast.error("Erro ao remover matrícula");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Alunos Matriculados
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {enrollments.length} {enrollments.length === 1 ? 'aluno' : 'alunos'}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Matricular Aluno
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Matricular Novo Aluno</DialogTitle>
                <DialogDescription>
                  Adicione um aluno manualmente à área de membros
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="aluno@exemplo.com"
                    value={formData.user_email}
                    onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome (Opcional)</Label>
                  <Input
                    placeholder="Nome do aluno"
                    value={formData.user_name}
                    onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddEnrollment}>
                  Matricular
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : enrollments.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">Nenhum aluno matriculado ainda</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Matricular Primeiro Aluno
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">
                      {enrollment.user_name || enrollment.user_email}
                    </p>
                    <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                      {enrollment.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {enrollment.user_email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(enrollment.enrolled_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {enrollment.purchased_products && enrollment.purchased_products.length > 0 && (
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        {enrollment.purchased_products.length} {enrollment.purchased_products.length === 1 ? 'produto' : 'produtos'}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteEnrollment(enrollment.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}