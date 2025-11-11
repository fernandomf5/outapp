import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Eye,
  Search,
  Download,
  Trash2,
  Mail,
  Phone,
  Building2,
  ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BriefingResponse {
  id: string;
  briefing_id: string;
  visitor_name?: string;
  visitor_email?: string;
  visitor_phone?: string;
  visitor_company?: string;
  responses: Record<string, any>;
  created_at: string;
  briefing_title?: string;
}

export function BriefingResponsesPanel() {
  const [responses, setResponses] = useState<BriefingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<BriefingResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadResponses();
  }, []);

  const loadResponses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: briefings } = await supabase
        .from('briefings')
        .select('id, title')
        .eq('user_id', user.id);

      if (!briefings) return;

      const { data, error } = await supabase
        .from('briefing_responses')
        .select('*')
        .in('briefing_id', briefings.map(b => b.id))
        .order('created_at', { ascending: false });

      if (error) throw error;

      const responsesWithTitles = (data || []).map(response => ({
        ...response,
        briefing_title: briefings.find(b => b.id === response.briefing_id)?.title
      })) as BriefingResponse[];

      setResponses(responsesWithTitles);
    } catch (error: any) {
      toast.error("Erro ao carregar respostas");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResponse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('briefing_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Resposta excluída!");
      loadResponses();
    } catch (error: any) {
      toast.error("Erro ao excluir resposta");
    }
  };

  const filteredResponses = responses.filter(response =>
    response.visitor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    response.visitor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    response.briefing_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Respostas de Briefings</h2>
          <p className="text-muted-foreground">Visualize e gerencie as respostas recebidas</p>
        </div>
      </div>

      {/* Search */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou briefing..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Respostas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{responses.length}</div>
            <p className="text-xs text-muted-foreground">respostas recebidas</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {responses.filter(r => {
                const date = new Date(r.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return date > weekAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card className="glass hover:shadow-glow transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {responses.filter(r => {
                const date = new Date(r.created_at);
                const today = new Date();
                return date.toDateString() === today.toDateString();
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">respostas de hoje</p>
          </CardContent>
        </Card>
      </div>

      {/* Responses List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Respostas Recebidas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhuma resposta encontrada" : "Nenhuma resposta recebida ainda"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResponses.map((response) => (
                <Card key={response.id} className="hover:shadow-lg transition-smooth">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{response.briefing_title}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(response.created_at).toLocaleDateString('pt-BR')} às {new Date(response.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        {response.visitor_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <strong>Nome:</strong> {response.visitor_name}
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-4 text-sm">
                          {response.visitor_email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {response.visitor_email}
                            </div>
                          )}
                          {response.visitor_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {response.visitor_phone}
                            </div>
                          )}
                          {response.visitor_company && (
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {response.visitor_company}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setSelectedResponse(response)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteResponse(response.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Response Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Resposta</DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações do Visitante</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedResponse.visitor_name && (
                    <div><strong>Nome:</strong> {selectedResponse.visitor_name}</div>
                  )}
                  {selectedResponse.visitor_email && (
                    <div><strong>Email:</strong> {selectedResponse.visitor_email}</div>
                  )}
                  {selectedResponse.visitor_phone && (
                    <div><strong>Telefone:</strong> {selectedResponse.visitor_phone}</div>
                  )}
                  {selectedResponse.visitor_company && (
                    <div><strong>Empresa:</strong> {selectedResponse.visitor_company}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Respostas do Briefing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(selectedResponse.responses).map(([key, value]) => {
                    const isFileUrl = typeof value === 'string' && 
                      (value.startsWith('http') && value.includes('briefing-files'));
                    
                    return (
                      <div key={key} className="border-b pb-2 last:border-0">
                        <div className="font-semibold text-sm mb-1">{key}</div>
                        <div className="text-sm text-muted-foreground">
                          {isFileUrl ? (
                            <a 
                              href={value as string} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4" />
                              Ver arquivo enviado
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}