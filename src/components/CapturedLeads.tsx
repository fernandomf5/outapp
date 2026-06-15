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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Download } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  source: string;
}

const SOURCE_COLORS: Record<string, string> = {
  "Chat Online": "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "Agente IA": "bg-purple-500/10 text-purple-600 border-purple-500/20",
  "Clonador de Páginas": "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "Quiz": "bg-pink-500/10 text-pink-600 border-pink-500/20",
  "Briefing": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "Catálogo": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  "Checkout": "bg-green-500/10 text-green-600 border-green-500/20",
};

export function CapturedLeads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  useEffect(() => {
    if (user) fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const all: Lead[] = [];

      // 1. Chat Online (chatbot_conversations)
      const { data: chatLeads } = await supabase
        .from("chatbot_conversations")
        .select("id, visitor_name, visitor_email, visitor_phone, started_at, chatbots!inner(user_id)")
        .eq("chatbots.user_id", user.id)
        .or("visitor_name.not.is.null,visitor_email.not.is.null,visitor_phone.not.is.null");
      chatLeads?.forEach((c: any) => all.push({
        id: `chat-${c.id}`,
        name: c.visitor_name, email: c.visitor_email, phone: c.visitor_phone,
        created_at: c.started_at, source: "Chat Online",
      }));

      // 2. Agente IA (agent_customers)
      const { data: agentLeads } = await supabase
        .from("agent_customers")
        .select("id, name, email, phone, created_at, ai_agents!inner(user_id)")
        .eq("ai_agents.user_id", user.id);
      agentLeads?.forEach((c: any) => all.push({
        id: `agent-${c.id}`, name: c.name, email: c.email, phone: c.phone,
        created_at: c.created_at, source: "Agente IA",
      }));

      // 3. Clonador de Páginas (cloned_page_leads)
      const { data: clonedLeads } = await supabase
        .from("cloned_page_leads")
        .select("id, name, email, phone, created_at, cloned_pages!inner(user_id)")
        .eq("cloned_pages.user_id", user.id);
      clonedLeads?.forEach((c: any) => all.push({
        id: `cloned-${c.id}`, name: c.name, email: c.email, phone: c.phone,
        created_at: c.created_at, source: "Clonador de Páginas",
      }));

      // 4. Quiz (quiz_responses)
      const { data: quizLeads } = await supabase
        .from("quiz_responses")
        .select("id, name, email, phone, created_at, quizzes!inner(user_id)")
        .eq("quizzes.user_id", user.id);
      quizLeads?.forEach((c: any) => all.push({
        id: `quiz-${c.id}`, name: c.name, email: c.email, phone: c.phone,
        created_at: c.created_at, source: "Quiz",
      }));

      // 5. Briefing (briefing_responses)
      const { data: briefingLeads } = await supabase
        .from("briefing_responses")
        .select("id, visitor_name, visitor_email, visitor_phone, created_at, briefings!inner(user_id)")
        .eq("briefings.user_id", user.id);
      briefingLeads?.forEach((c: any) => all.push({
        id: `briefing-${c.id}`, name: c.visitor_name, email: c.visitor_email, phone: c.visitor_phone,
        created_at: c.created_at, source: "Briefing",
      }));

      // 6. Catálogo (catalog_customers)
      const { data: catLeads } = await supabase
        .from("catalog_customers")
        .select("id, name, email, phone, created_at, catalogs!inner(user_id)")
        .eq("catalogs.user_id", user.id);
      catLeads?.forEach((c: any) => all.push({
        id: `catalog-${c.id}`, name: c.name, email: c.email, phone: c.phone,
        created_at: c.created_at, source: "Catálogo",
      }));

      // 7. Checkout (checkout_orders)
      const { data: checkoutLeads } = await supabase
        .from("checkout_orders")
        .select("id, customer_name, customer_email, customer_phone, created_at")
        .eq("user_id", user.id);
      checkoutLeads?.forEach((c: any) => all.push({
        id: `checkout-${c.id}`, name: c.customer_name, email: c.customer_email, phone: c.customer_phone,
        created_at: c.created_at, source: "Checkout",
      }));

      all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLeads(all);
    } catch (error) {
      console.error("Erro ao buscar leads:", error);
      toast.error("Erro ao carregar leads capturados");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = sourceFilter === "all"
    ? leads
    : leads.filter((l) => l.source === sourceFilter);

  const sources = Array.from(new Set(leads.map((l) => l.source)));

  const handleExportCSV = () => {
    if (filteredLeads.length === 0) {
      toast.error("Nenhum lead para exportar");
      return;
    }
    const headers = ["Nome", "Email", "Telefone", "Origem", "Data de Captura"];
    const rows = filteredLeads.map((l) => [
      l.name || "", l.email || "", l.phone || "", l.source,
      new Date(l.created_at).toLocaleDateString("pt-BR"),
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success(`${filteredLeads.length} leads exportados!`);
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Leads Capturados ({filteredLeads.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                {sources.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportCSV} disabled={filteredLeads.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLeads.length === 0 ? (
          <p className="text-muted-foreground">Nenhum lead capturado ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Data de Captura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.name || "-"}</TableCell>
                    <TableCell>{lead.email || "-"}</TableCell>
                    <TableCell>{lead.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={SOURCE_COLORS[lead.source] || ""}>
                        {lead.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(lead.created_at).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
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
