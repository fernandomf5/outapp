import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare } from "lucide-react";

export default function AgentCustomerAuth() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string>('');
  const [attendantStatus, setAttendantStatus] = useState<string>('offline');
  const [attendantName, setAttendantName] = useState<string | null>(null);
  const [queueEnabled, setQueueEnabled] = useState(false);
  const [statusColors, setStatusColors] = useState({
    online: '#22c55e',
    busy: '#eab308',
    offline: '#64748b',
  });
  const [formData, setFormData] = useState({ name: "" });

  useEffect(() => {
    const loadAgent = async () => {
      try {
        const { data: agent } = await supabase
          .from('ai_agents')
          .select('config, name, attendant_status, attendant_name')
          .eq('id', agentId)
          .single();

        if (agent?.config) {
          const config = agent.config as any;
          if (config.primaryColor) setPrimaryColor(config.primaryColor);
          if (config.logoUrl) setLogoUrl(config.logoUrl);
          setQueueEnabled(config.queueEnabled === true);
          if (config.statusColors) {
            setStatusColors({
              online: config.statusColors.online || '#22c55e',
              busy: config.statusColors.busy || '#eab308',
              offline: config.statusColors.offline || '#64748b',
            });
          }
        }
        if (agent?.name) setAgentName(agent.name);
        setAttendantStatus(agent?.attendant_status || 'offline');
        setAttendantName(agent?.attendant_name || null);
      } catch (error) {
        console.error('Error loading agent:', error);
      } finally {
        setCheckingAccess(false);
      }
    };

    loadAgent();
  }, [agentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const customer = {
      id: crypto.randomUUID(),
      name: formData.name.trim(),
      agent_id: agentId,
    };

    localStorage.setItem(`agent_customer_${agentId}`, JSON.stringify(customer));
    navigate(`/chat-online/${agentId}/atendimento`);
  };

  const buttonStyle = { backgroundColor: primaryColor };
  const currentStatusColor =
    attendantStatus === 'online'
      ? statusColors.online
      : attendantStatus === 'busy'
      ? statusColors.busy
      : statusColors.offline;

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  const statusLabel =
    attendantStatus === 'online'
      ? `Atendente online${attendantName ? ` • ${attendantName}` : ''}`
      : attendantStatus === 'busy'
      ? 'Atendente ocupado no momento'
      : 'Atendente offline';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {logoUrl && (
            <div className="flex justify-center mb-4">
              <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
            </div>
          )}
          <CardTitle>{agentName || 'Chat Online'}</CardTitle>
          <CardDescription>Informe seu nome para iniciar o atendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentStatusColor }}
            />
            {statusLabel}
          </div>

          {queueEnabled && attendantStatus !== 'online' && (
            <div className="rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground text-center">
              Seu atendimento entrará na fila de espera e será respondido assim que possível.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                maxLength={100}
                placeholder="Seu nome"
              />
            </div>




            <Button type="submit" className="w-full text-white gap-2" style={buttonStyle} disabled={loading}>
              <MessageSquare className="w-4 h-4" />
              {loading ? 'Iniciando...' : 'Iniciar Chat Online'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
