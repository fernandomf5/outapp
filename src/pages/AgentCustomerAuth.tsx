import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Mail } from "lucide-react";

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
  const [queueNext, setQueueNext] = useState(1);

  const [statusColors, setStatusColors] = useState({
    online: '#22c55e',
    busy: '#eab308',
    offline: '#64748b',
  });
  const [formData, setFormData] = useState({ name: "" });
  const { toast } = useToast();
  const [contactEmailMessage, setContactEmailMessage] = useState("Fale conosco por e-mail. Atendimento em até 24h.");
  const [contactEmailButtonText, setContactEmailButtonText] = useState("Fale conosco por e-mail");
  const [contactEmailSuccessMessage, setContactEmailSuccessMessage] = useState("Sua mensagem foi enviada! Vamos te retornar por e-mail em breve.");
  const [showContactForm, setShowContactForm] = useState(false);
  const [sendingContact, setSendingContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  useEffect(() => {
    if (!agentId) return;
    let cancelled = false;

    const loadAgent = async () => {
      try {
        // Edge function pública (service role) — funciona em qualquer navegador,
        // logado ou não, sem depender de RLS/sessão.
        const { data, error } = await supabase.functions.invoke('get-chat-online-config', {
          body: { agentId },
        });

        if (cancelled) return;
        if (error || !data?.agent) {
          console.error('Error loading chat config:', error || data?.error);
          return;
        }

        const agent = data.agent;
        const config = (agent.config || {}) as any;
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
        if (config.contactEmailMessage) setContactEmailMessage(config.contactEmailMessage);
        if (config.contactEmailButtonText) setContactEmailButtonText(config.contactEmailButtonText);
        if (config.contactEmailSuccessMessage) setContactEmailSuccessMessage(config.contactEmailSuccessMessage);
        if (agent.name) setAgentName(agent.name);
        setAttendantStatus(agent.attendant_status || 'offline');
        setAttendantName(agent.attendant_name || null);
      } catch (error) {
        console.error('Error loading agent:', error);
      } finally {
        if (!cancelled) setCheckingAccess(false);
      }
    };

    loadAgent();
    const interval = setInterval(loadAgent, 10000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadAgent();
    };
    document.addEventListener('visibilitychange', onVisible);

    // Status do atendente em tempo real
    const channel = supabase
      .channel(`chat-status-${agentId}`)
      .on('broadcast', { event: 'status' }, ({ payload }) => {
        if (cancelled) return;
        if (payload?.attendant_status) setAttendantStatus(payload.attendant_status);
        setAttendantName(payload?.attendant_name || null);
      })
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  const handleSendContactForm = async () => {
    const name = contactForm.name.trim();
    const email = contactForm.email.trim().toLowerCase();
    const message = contactForm.message.trim();

    if (!name || !email || !message) {
      toast({ title: "Preencha os campos", description: "Nome, e-mail e mensagem são obrigatórios.", variant: "destructive" });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "E-mail inválido", description: "Informe um e-mail válido.", variant: "destructive" });
      return;
    }

    setSendingContact(true);
    try {
      const { error } = await supabase.from('contact_form_submissions').insert({
        name: name.slice(0, 100),
        email: email.slice(0, 255),
        phone: contactForm.phone.trim().slice(0, 30) || null,
        subject: contactForm.subject.trim().slice(0, 150) || null,
        message: message.slice(0, 2000),
        agent_id: agentId,
      });
      if (error) throw error;

      setShowContactForm(false);
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
      toast({ title: "Mensagem enviada", description: contactEmailSuccessMessage });
    } catch (err) {
      console.error('Error sending contact form:', err);
      const msg = (err as any)?.message || 'Não foi possível enviar sua mensagem.';
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setSendingContact(false);
    }
  };


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

          {attendantStatus !== 'online' && (
            <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2 text-center">
              <p className="text-sm text-muted-foreground">{contactEmailMessage}</p>
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  setContactForm((prev) => ({ ...prev, name: prev.name || formData.name }));
                  setShowContactForm(true);
                }}
              >
                <Mail className="w-4 h-4" />
                {contactEmailButtonText}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{contactEmailButtonText}</DialogTitle>
            <DialogDescription>{contactEmailMessage}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Nome</Label>
              <Input
                id="contact-name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                maxLength={100}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">E-mail</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                maxLength={255}
                placeholder="seu@email.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-phone">Telefone (opcional)</Label>
              <Input
                id="contact-phone"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                maxLength={30}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-subject">Assunto</Label>
              <Input
                id="contact-subject"
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                maxLength={150}
                placeholder="Ex: Dúvida sobre planos"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-message">Mensagem</Label>
              <Textarea
                id="contact-message"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                rows={4}
                maxLength={2000}
                placeholder="Como podemos ajudar?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowContactForm(false)} disabled={sendingContact}>
              Cancelar
            </Button>
            <Button onClick={handleSendContactForm} disabled={sendingContact} className="gap-2">
              <Mail className="w-4 h-4" />
              {sendingContact ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
