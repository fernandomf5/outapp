import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Edit, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Lead {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  created_at: string;
}

export function CapturedLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user]);

  const fetchLeads = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar conversas do usuário com dados de visitantes
      const { data: conversations, error } = await supabase
        .from("chatbot_conversations")
        .select(`
          id,
          visitor_name,
          visitor_email,
          visitor_phone,
          started_at,
          chatbot_id,
          chatbots!inner(user_id)
        `)
        .eq("chatbots.user_id", user.id)
        .or("visitor_name.not.is.null,visitor_email.not.is.null,visitor_phone.not.is.null")
        .order("started_at", { ascending: false });

      if (error) throw error;

      // Remover duplicatas baseado em email ou telefone
      const uniqueLeads = conversations?.reduce((acc: Lead[], current) => {
        const isDuplicate = acc.some(
          (lead) =>
            (current.visitor_email && lead.visitor_email === current.visitor_email) ||
            (current.visitor_phone && lead.visitor_phone === current.visitor_phone)
        );

        if (!isDuplicate) {
          acc.push({
            id: current.id,
            visitor_name: current.visitor_name,
            visitor_email: current.visitor_email,
            visitor_phone: current.visitor_phone,
            created_at: current.started_at,
          });
        }

        return acc;
      }, []) || [];

      setLeads(uniqueLeads);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast.error("Erro ao carregar leads capturados");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLead = async () => {
    if (!editingLead) return;

    const { error } = await supabase
      .from('chatbot_conversations')
      .update({
        visitor_name: editingLead.visitor_name,
        visitor_email: editingLead.visitor_email,
        visitor_phone: editingLead.visitor_phone,
      })
      .eq('id', editingLead.id);

    if (error) {
      toast.error("Erro ao atualizar lead");
    } else {
      toast.success("Lead atualizado com sucesso!");
      fetchLeads();
      setIsEditDialogOpen(false);
      setEditingLead(null);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;

    const { error } = await supabase
      .from('chatbot_conversations')
      .update({
        visitor_name: null,
        visitor_email: null,
        visitor_phone: null,
      })
      .eq('id', leadId);

    if (error) {
      toast.error("Erro ao excluir lead");
    } else {
      toast.success("Lead excluído com sucesso!");
      fetchLeads();
    }
  };

  const handleExportCSV = () => {
    if (leads.length === 0) {
      toast.error("Nenhum lead para exportar");
      return;
    }

    const headers = ["Nome", "Email", "Telefone", "Data de Captura"];
    const rows = leads.map(l => [
      l.visitor_name || "",
      l.visitor_email || "",
      l.visitor_phone || "",
      new Date(l.created_at).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success(`${leads.length} leads exportados com sucesso!`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leads Capturados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leads Capturados ({leads.length})
          </CardTitle>
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={leads.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-muted-foreground">Nenhum lead capturado ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data de Captura</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.visitor_name || "-"}</TableCell>
                    <TableCell>{lead.visitor_email || "-"}</TableCell>
                    <TableCell>{lead.visitor_phone || "-"}</TableCell>
                    <TableCell>
                      {new Date(lead.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingLead(lead);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLead(lead.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nome</Label>
                <Input
                  value={editingLead.visitor_name || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, visitor_name: e.target.value })}
                  placeholder="Nome do lead"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingLead.visitor_email || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, visitor_email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editingLead.visitor_phone || ''}
                  onChange={(e) => setEditingLead({ ...editingLead, visitor_phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleUpdateLead} className="flex-1 gradient-primary">
                  Salvar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
