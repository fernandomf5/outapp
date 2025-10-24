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
import { Users } from "lucide-react";
import { toast } from "sonner";

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
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Leads Capturados ({leads.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-muted-foreground">Nenhum lead capturado ainda.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Data de Captura</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
