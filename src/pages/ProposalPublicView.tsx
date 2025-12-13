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
import { 
  Building2, User, Mail, Phone, MapPin, Calendar, CheckCircle, XCircle, 
  Download, Loader2, FileText, Clock, Target, DollarSign, FileCheck,
  ChevronLeft, ChevronRight, Sparkles, Image
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface Service {
  id: string;
  name: string;
  description: string;
  image_url?: string;
}

interface Proposal {
  id: string;
  company_name: string;
  company_logo_url: string;
  company_email: string;
  company_phone: string;
  company_address: string;
  company_cnpj: string;
  company_description: string | null;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_company: string;
  client_cnpj: string;
  client_address: string;
  title: string;
  introduction: string;
  introduction_image_url: string | null;
  services: Service[];
  timeline: { id: string; phase: string; duration: string; deliverables: string }[];
  pricing: { items: { id: string; description: string; quantity: number; unit_price: number }[]; discount: number; total: number };
  conditions: string;
  valid_until: string;
  primary_color: string;
  auto_carousel: boolean;
  status: string;
  client_accepted_name: string | null;
  client_accepted_at: string | null;
  client_signature_url: string | null;
  created_at: string;
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
  const [activeServiceImage, setActiveServiceImage] = useState(0);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const proposalRef = useRef<HTMLDivElement>(null);
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
        auto_carousel: (data as any).auto_carousel ?? false,
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

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  };

  const handleTouchEnd = () => {
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

  const handleDownloadPng = async () => {
    if (!proposalRef.current) return;
    
    try {
      setDownloadingPng(true);
      
      const canvas = await html2canvas(proposalRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
        windowHeight: document.documentElement.scrollHeight,
      });
      
      const link = document.createElement('a');
      link.download = `proposta-${proposal?.title?.replace(/\s+/g, '-').toLowerCase() || 'comercial'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Proposta baixada com sucesso!');
    } catch (error) {
      console.error('Error generating PNG:', error);
      toast.error('Erro ao gerar imagem da proposta');
    } finally {
      setDownloadingPng(false);
    }
  };

  // Get services with images for carousel
  const servicesWithImages = proposal?.services?.filter(s => s.image_url) || [];

  // Auto-carousel effect
  useEffect(() => {
    if (!proposal?.auto_carousel || servicesWithImages.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveServiceImage(prev => 
        prev === servicesWithImages.length - 1 ? 0 : prev + 1
      );
    }, 4000);
    
    return () => clearInterval(interval);
  }, [proposal?.auto_carousel, servicesWithImages.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted">
        <Card className="max-w-md shadow-2xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Proposta não encontrada</h2>
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
    <div ref={proposalRef} className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-background dark:to-slate-900 print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, transparent 70%)` }}
        />
        <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {proposal.company_logo_url ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl bg-white p-2 flex items-center justify-center">
                  <img src={proposal.company_logo_url} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Building2 className="h-10 w-10 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{proposal.company_name}</h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  {proposal.company_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {proposal.company_email}
                    </span>
                  )}
                  {proposal.company_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {proposal.company_phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 no-print">
              <Button variant="outline" onClick={handleDownloadPng} disabled={downloadingPng} className="shadow-sm">
                {downloadingPng ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Image className="h-4 w-4 mr-2" />
                )}
                Baixar PNG
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-16 space-y-8">
        {/* Status Banner */}
        {(proposal.status === 'accepted' || proposal.status === 'rejected' || isExpired) && (
          <div 
            className={`rounded-2xl p-5 flex items-center gap-4 shadow-lg ${
              proposal.status === 'accepted' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                : proposal.status === 'rejected' 
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' 
                  : 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white'
            }`}
          >
            {proposal.status === 'accepted' ? (
              <>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">Proposta Aceita</p>
                  <p className="text-sm opacity-90">
                    Aceita por {proposal.client_accepted_name} em {proposal.client_accepted_at && format(new Date(proposal.client_accepted_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </>
            ) : proposal.status === 'rejected' ? (
              <>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <XCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">Proposta Recusada</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-lg">Proposta Expirada</p>
                  <p className="text-sm opacity-90">Esta proposta não está mais válida</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Title Card */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div 
            className="h-2"
            style={{ backgroundColor: primaryColor }}
          />
          <CardContent className="p-8 text-center">
            <Badge 
              variant="secondary" 
              className="mb-4 px-4 py-1 text-xs font-medium"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              PROPOSTA COMERCIAL
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{proposal.title}</h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              {proposal.valid_until && (
                <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
                  <Calendar className="h-4 w-4" />
                  <span>Válida até {format(new Date(proposal.valid_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full">
                <Clock className="h-4 w-4" />
                <span>Criada em {format(new Date(proposal.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client & Company Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* From Company */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                <Building2 className="h-4 w-4" style={{ color: primaryColor }} />
                DE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-xl mb-1">{proposal.company_name}</p>
              {proposal.company_cnpj && <p className="text-sm text-muted-foreground mb-3">CNPJ: {proposal.company_cnpj}</p>}
              <div className="space-y-2 text-sm">
                {proposal.company_address && (
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span>{proposal.company_address}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* To Client */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
                <User className="h-4 w-4" style={{ color: primaryColor }} />
                PARA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-bold text-xl mb-1">{proposal.client_name}</p>
              {proposal.client_company && <p className="text-muted-foreground mb-1">{proposal.client_company}</p>}
              {proposal.client_cnpj && <p className="text-sm text-muted-foreground mb-3">CNPJ: {proposal.client_cnpj}</p>}
              <div className="space-y-2 text-sm">
                {proposal.client_email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{proposal.client_email}</span>
                  </p>
                )}
                {proposal.client_phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{proposal.client_phone}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Introduction */}
        {proposal.introduction && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Sparkles className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
                Apresentação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className={`grid gap-6 ${proposal.introduction_image_url ? 'md:grid-cols-2' : ''}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-base leading-relaxed">{proposal.introduction}</p>
                </div>
                {proposal.introduction_image_url && (
                  <div className="relative">
                    <img 
                      src={proposal.introduction_image_url} 
                      alt="Apresentação" 
                      className="w-full h-64 md:h-full object-cover rounded-xl shadow-md"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services */}
        {proposal.services?.length > 0 && (
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Target className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
                Serviços Incluídos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Services Image Carousel */}
              {servicesWithImages.length > 0 && (
                <div className="relative mb-8 rounded-2xl overflow-hidden shadow-lg">
                  <div className="relative h-64 md:h-80 bg-muted">
                    <img 
                      src={servicesWithImages[activeServiceImage]?.image_url} 
                      alt={servicesWithImages[activeServiceImage]?.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="font-bold text-lg">{servicesWithImages[activeServiceImage]?.name}</p>
                    </div>
                  </div>
                  
                  {servicesWithImages.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 shadow-lg text-white hover:text-white"
                        style={{ backgroundColor: primaryColor, opacity: 0.9 }}
                        onClick={() => setActiveServiceImage(prev => prev === 0 ? servicesWithImages.length - 1 : prev - 1)}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 shadow-lg text-white hover:text-white"
                        style={{ backgroundColor: primaryColor, opacity: 0.9 }}
                        onClick={() => setActiveServiceImage(prev => prev === servicesWithImages.length - 1 ? 0 : prev + 1)}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                      <div className="absolute bottom-4 right-4 flex gap-1.5">
                        {servicesWithImages.map((_, idx) => (
                          <button
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${idx === activeServiceImage ? 'w-6' : ''}`}
                            style={{ backgroundColor: idx === activeServiceImage ? primaryColor : 'rgba(255,255,255,0.5)' }}
                            onClick={() => setActiveServiceImage(idx)}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Services List */}
              <div className="grid gap-4">
                {proposal.services.map((service, index) => (
                  <div 
                    key={service.id} 
                    className="group relative p-5 rounded-xl border bg-card hover:shadow-md transition-all"
                  >
                    <div className="flex gap-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg mb-1">{service.name}</h4>
                        <div 
                          className="text-muted-foreground text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert"
                          dangerouslySetInnerHTML={{ __html: service.description }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        {proposal.timeline?.length > 0 && (
          <Card className="border-0 shadow-lg overflow-hidden print-break">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <Clock className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
                Cronograma de Execução
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative">
                {proposal.timeline.map((item, index) => (
                  <div key={item.id} className="flex gap-4 pb-8 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {index + 1}
                      </div>
                      {index < proposal.timeline.length - 1 && (
                        <div 
                          className="w-0.5 flex-1 mt-3"
                          style={{ backgroundColor: `${primaryColor}30` }}
                        />
                      )}
                    </div>
                    <div className="flex-1 pt-1.5">
                      <div className="bg-muted/50 rounded-xl p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-lg">{item.phase}</h4>
                          <Badge variant="outline" className="font-medium">
                            {item.duration}
                          </Badge>
                        </div>
                        {item.deliverables && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Entregáveis:</span> {item.deliverables}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardHeader className="border-b" style={{ backgroundColor: `${primaryColor}10` }}>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              Investimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {proposal.pricing?.items?.map((item, idx) => (
                <div key={item.id} className={`flex justify-between items-center p-5 ${idx % 2 === 0 ? 'bg-muted/20' : ''}`}>
                  <div>
                    <p className="font-medium">{item.description}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity} x {formatCurrency(item.unit_price)}</p>
                  </div>
                  <p className="font-semibold text-lg">{formatCurrency(item.quantity * item.unit_price)}</p>
                </div>
              ))}
              {proposal.pricing?.discount > 0 && (
                <div className="flex justify-between items-center p-5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
                  <p className="font-medium">Desconto Aplicado</p>
                  <p className="font-semibold text-lg">-{formatCurrency(proposal.pricing.discount)}</p>
                </div>
              )}
            </div>
            <div 
              className="p-6 flex justify-between items-center"
              style={{ backgroundColor: primaryColor }}
            >
              <p className="text-white font-bold text-xl">TOTAL</p>
              <p className="text-white font-bold text-3xl">{formatCurrency(proposal.pricing?.total || 0)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        {proposal.conditions && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <FileCheck className="h-5 w-5" style={{ color: primaryColor }} />
                </div>
                Termos e Condições
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{proposal.conditions}</p>
            </CardContent>
          </Card>
        )}

        {/* Signature Area */}
        {proposal.client_signature_url && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="flex items-center gap-3 text-xl">
                <CheckCircle className="h-5 w-5" style={{ color: primaryColor }} />
                Assinatura do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 text-center">
              <div className="inline-block p-4 bg-white rounded-xl border shadow-sm">
                <img src={proposal.client_signature_url} alt="Assinatura" className="max-w-xs mx-auto" />
              </div>
              <p className="mt-4 font-bold text-lg">{proposal.client_accepted_name}</p>
              {proposal.client_accepted_at && (
                <p className="text-sm text-muted-foreground">
                  {format(new Date(proposal.client_accepted_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {canRespond && !isExpired && (
          <Card className="border-0 shadow-xl no-print overflow-hidden">
            <div 
              className="h-1"
              style={{ backgroundColor: primaryColor }}
            />
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Pronto para fechar negócio?</h3>
                <p className="text-muted-foreground">Aceite ou recuse esta proposta comercial</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => setShowAcceptDialog(true)} 
                  className="gap-3 px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all" 
                  style={{ backgroundColor: primaryColor }}
                >
                  <CheckCircle className="h-5 w-5" />
                  Aceitar Proposta
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => setShowRejectDialog(true)} 
                  className="gap-3 px-8 py-6 text-lg"
                >
                  <XCircle className="h-5 w-5" />
                  Recusar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <footer className="text-center py-8 border-t">
          <div className="flex items-center justify-center gap-3 mb-3">
            {proposal.company_logo_url && (
              <img src={proposal.company_logo_url} alt="Logo" className="h-8 object-contain" />
            )}
            <span className="font-bold text-lg">{proposal.company_name}</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            {proposal.company_address && <p>{proposal.company_address}</p>}
            <p>{[proposal.company_email, proposal.company_phone].filter(Boolean).join(' • ')}</p>
          </div>
        </footer>
      </main>

      {/* Accept Dialog */}
      <Dialog open={showAcceptDialog} onOpenChange={setShowAcceptDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Aceitar Proposta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="acceptName">Nome Completo *</Label>
              <Input
                id="acceptName"
                value={acceptName}
                onChange={(e) => setAcceptName(e.target.value)}
                placeholder="Digite seu nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Assinatura Digital</Label>
              <p className="text-xs text-muted-foreground mb-2">Desenhe sua assinatura abaixo usando o mouse ou dedo</p>
              <div className="border rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full touch-none cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              </div>
              <Button variant="ghost" size="sm" onClick={clearSignature} className="text-xs">
                Limpar assinatura
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAcceptDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAccept} 
              disabled={submitting} 
              className="gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Aceite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <XCircle className="h-5 w-5 text-red-600" />
              Recusar Proposta
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectReason">Motivo da Recusa (opcional)</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Conte-nos o motivo da recusa para podermos melhorar..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReject} disabled={submitting} variant="destructive" className="gap-2">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
