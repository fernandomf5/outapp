import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Building2, User, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, Download, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Proposal {
  id: string;
  company_name: string;
  company_logo_url: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_cnpj: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  client_cnpj: string;
  client_address: string;
  title: string;
  introduction: string;
  services: { id: string; name: string; description: string }[];
  timeline: { id: string; phase: string; duration: string; deliverables: string }[];
  pricing: { items: { id: string; description: string; quantity: number; unit_price: number }[]; discount: number; total: number };
  conditions: string;
  valid_until: string;
  primary_color: string;
  status: string;
  client_accepted_name: string | null;
  client_accepted_at: string | null;
  client_signature_url: string | null;
}

export default function ProposalPublicView() {
  const { slug } = useParams<{ slug: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [acceptName, setAcceptName] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProposal();
    }
  }, [slug]);

  const fetchProposal = async () => {
    try {
      const { data, error } = await supabase
        .from('commercial_proposals')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      setProposal({
        ...data,
        services: (data.services || []) as any[],
        timeline: (data.timeline || []) as any[],
        pricing: (data.pricing || { items: [], discount: 0, total: 0 }) as any,
      });

      // Mark as viewed
      if (data.status === 'sent') {
        await supabase
          .from('commercial_proposals')
          .update({ status: 'viewed', viewed_at: new Date().toISOString() })
          .eq('id', data.id);
      }
    } catch (error) {
      console.error('Error fetching proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  useEffect(() => {
    if (showAcceptDialog) {
      setTimeout(initCanvas, 100);
    }
  }, [showAcceptDialog]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    initCanvas();
  };

  const handleAccept = async () => {
    if (!proposal || !acceptName.trim()) {
      toast.error('Por favor, digite seu nome');
      return;
    }

    try {
      setSubmitting(true);
      
      // Get signature as base64
      let signatureUrl = null;
      const canvas = canvasRef.current;
      if (canvas) {
        signatureUrl = canvas.toDataURL('image/png');
      }

      const { error } = await supabase
        .from('commercial_proposals')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          client_accepted_name: acceptName,
          client_accepted_at: new Date().toISOString(),
          client_signature_url: signatureUrl,
        })
        .eq('id', proposal.id);

      if (error) throw error;
      
      toast.success('Proposta aceita com sucesso!');
      setShowAcceptDialog(false);
      fetchProposal();
    } catch (error) {
      toast.error('Erro ao aceitar proposta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!proposal) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('commercial_proposals')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectReason,
        })
        .eq('id', proposal.id);

      if (error) throw error;
      
      toast.success('Proposta recusada');
      setShowRejectDialog(false);
      fetchProposal();
    } catch (error) {
      toast.error('Erro ao recusar proposta');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Proposta não encontrada</h2>
            <p className="text-muted-foreground">O link pode estar incorreto ou a proposta foi removida.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryColor = proposal.primary_color || '#6366f1';
  const isExpired = proposal.valid_until && new Date(proposal.valid_until) < new Date();
  const canRespond = proposal.status === 'sent' || proposal.status === 'viewed';

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Header */}
      <header className="border-b py-6 px-4" style={{ borderColor: primaryColor }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {proposal.company_logo_url && (
              <img src={proposal.company_logo_url} alt="Logo" className="h-16 w-auto object-contain" />
            )}
            <div>
              <h1 className="text-xl font-bold">{proposal.company_name}</h1>
              {proposal.company_email && <p className="text-sm text-muted-foreground">{proposal.company_email}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 no-print">
            <Button variant="outline" onClick={handlePrint}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Status Banner */}
        {(proposal.status === 'accepted' || proposal.status === 'rejected' || isExpired) && (
          <Card className={`${proposal.status === 'accepted' ? 'bg-green-50 border-green-200' : proposal.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <CardContent className="py-4 flex items-center gap-3">
              {proposal.status === 'accepted' ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Proposta Aceita</p>
                    <p className="text-sm text-green-600">
                      Aceita por {proposal.client_accepted_name} em {proposal.client_accepted_at && format(new Date(proposal.client_accepted_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </>
              ) : proposal.status === 'rejected' ? (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Proposta Recusada</p>
                  </div>
                </>
              ) : (
                <>
                  <Calendar className="h-6 w-6 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Proposta Expirada</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{proposal.title}</h1>
          {proposal.valid_until && (
            <Badge variant="outline" className="text-sm">
              Válida até {format(new Date(proposal.valid_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Badge>
          )}
        </div>

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" style={{ color: primaryColor }} />
              Para
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-lg">{proposal.client_name}</p>
                {proposal.client_company && <p className="text-muted-foreground">{proposal.client_company}</p>}
              </div>
              <div className="space-y-1 text-sm">
                {proposal.client_email && (
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {proposal.client_email}</p>
                )}
                {proposal.client_phone && (
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {proposal.client_phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Introduction */}
        {proposal.introduction && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: primaryColor }}>Apresentação</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{proposal.introduction}</p>
            </CardContent>
          </Card>
        )}

        {/* Services */}
        {proposal.services?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: primaryColor }}>Serviços</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {proposal.services.map((service, index) => (
                <div key={service.id} className="border-l-4 pl-4" style={{ borderColor: primaryColor }}>
                  <h4 className="font-semibold">{index + 1}. {service.name}</h4>
                  <p className="text-muted-foreground text-sm mt-1">{service.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {proposal.timeline?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: primaryColor }}>Cronograma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proposal.timeline.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: primaryColor }}>
                        {index + 1}
                      </div>
                      {index < proposal.timeline.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <h4 className="font-semibold">{item.phase}</h4>
                      <p className="text-sm text-muted-foreground">{item.duration}</p>
                      {item.deliverables && <p className="text-sm mt-1">Entregáveis: {item.deliverables}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg" style={{ color: primaryColor }}>Investimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {proposal.pricing?.items?.map(item => (
                <div key={item.id} className="flex justify-between py-2 border-b">
                  <div>
                    <p>{item.description}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity} x {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.quantity * item.unit_price)}</p>
                </div>
              ))}
              {proposal.pricing?.discount > 0 && (
                <div className="flex justify-between py-2 text-green-600">
                  <p>Desconto</p>
                  <p>-{formatCurrency(proposal.pricing.discount)}</p>
                </div>
              )}
              <Separator />
              <div className="flex justify-between py-2 text-xl font-bold">
                <p>Total</p>
                <p style={{ color: primaryColor }}>{formatCurrency(proposal.pricing?.total || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        {proposal.conditions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: primaryColor }}>Termos e Condições</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{proposal.conditions}</p>
            </CardContent>
          </Card>
        )}

        {/* Signature Area */}
        {proposal.client_signature_url && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assinatura do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <img src={proposal.client_signature_url} alt="Assinatura" className="max-w-xs mx-auto border rounded" />
              <p className="mt-2 font-medium">{proposal.client_accepted_name}</p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {canRespond && !isExpired && (
          <Card className="no-print">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => setShowAcceptDialog(true)} className="gap-2" style={{ backgroundColor: primaryColor }}>
                  <CheckCircle className="h-5 w-5" />
                  Aceitar Proposta
                </Button>
                <Button size="lg" variant="outline" onClick={() => setShowRejectDialog(true)} className="gap-2">
                  <XCircle className="h-5 w-5" />
                  Recusar Proposta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-8 border-t">
          <p>{proposal.company_name}</p>
          {proposal.company_address && <p>{proposal.company_address}</p>}
          {proposal.company_phone && <p>{proposal.company_phone}</p>}
        </footer>
      </main>

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aceitar Proposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Seu nome completo *</Label>
              <Input
                value={acceptName}
                onChange={(e) => setAcceptName(e.target.value)}
                placeholder="Digite seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label>Assinatura (opcional)</Label>
              <canvas
                ref={canvasRef}
                width={350}
                height={150}
                className="border rounded cursor-crosshair w-full"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
              <Button variant="ghost" size="sm" onClick={clearSignature}>
                Limpar assinatura
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>Cancelar</Button>
            <Button onClick={handleAccept} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Aceite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar Proposta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Informe o motivo da recusa..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Recusa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
