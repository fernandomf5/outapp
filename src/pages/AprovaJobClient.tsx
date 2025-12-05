import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, AlertCircle, Clock, MessageSquare, Send, LogOut, FileImage, ChevronLeft, ChevronRight, Loader2, Undo2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  username: string;
  access_token: string;
  primary_color?: string;
  secondary_color?: string;
}

interface Job {
  id: string;
  title: string;
  description: string | null;
  media_urls: string[];
  status: 'pending' | 'approved' | 'revision' | 'rejected';
  revision_notes: string | null;
  rejection_notes: string | null;
  due_date: string | null;
  created_at: string;
}

interface Comment {
  id: string;
  is_from_client: boolean;
  content: string;
  created_at: string;
}

export default function AprovaJobClient() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jobComments, setJobComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [mediaIndex, setMediaIndex] = useState(0);

  // Approval dialog state
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approved' | 'revision' | 'rejected' | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      checkAccess();
    }
  }, [token]);

  useEffect(() => {
    // Check if already logged in
    const savedSession = sessionStorage.getItem(`aprova_job_${token}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setClient(session);
      setIsLoggedIn(true);
      fetchJobs(session.id);
    }
  }, [token]);

  const checkAccess = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('aprova_job_clients')
      .select('id, name, username, access_token, primary_color, secondary_color')
      .eq('access_token', token)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      toast({ title: "Acesso inválido", description: "Link de acesso inválido ou expirado", variant: "destructive" });
      navigate('/');
      return;
    }

    setClient(data as Client);
    setLoading(false);
  };

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleLogin = async () => {
    if (!loginForm.username || !loginForm.password) {
      toast({ title: "Erro", description: "Preencha usuário e senha", variant: "destructive" });
      return;
    }

    setLoginLoading(true);
    const passwordHash = await hashPassword(loginForm.password);

    const { data, error } = await supabase
      .from('aprova_job_clients')
      .select('id, name, username, access_token, primary_color, secondary_color')
      .eq('access_token', token)
      .eq('username', loginForm.username.toLowerCase().trim())
      .eq('password_hash', passwordHash)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      toast({ title: "Erro", description: "Usuário ou senha incorretos", variant: "destructive" });
      setLoginLoading(false);
      return;
    }

    // Update last login
    await supabase
      .from('aprova_job_clients')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.id);

    sessionStorage.setItem(`aprova_job_${token}`, JSON.stringify(data));
    setClient(data as Client);
    setIsLoggedIn(true);
    fetchJobs(data.id);
    setLoginLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(`aprova_job_${token}`);
    setIsLoggedIn(false);
    setJobs([]);
    setSelectedJob(null);
    setLoginForm({ username: '', password: '' });
  };

  const fetchJobs = async (clientId: string) => {
    const { data, error } = await supabase
      .from('aprova_job_jobs')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setJobs(data.map(job => ({ ...job, media_urls: job.media_urls || [] })) as Job[]);
    }
  };

  const fetchJobComments = async (jobId: string) => {
    const { data, error } = await supabase
      .from('aprova_job_comments')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setJobComments(data as Comment[]);
    }
  };

  const openJob = (job: Job) => {
    setSelectedJob(job);
    setMediaIndex(0);
    fetchJobComments(job.id);
  };

  const addComment = async () => {
    if (!selectedJob || !newComment.trim() || !client) return;

    const { error } = await supabase
      .from('aprova_job_comments')
      .insert({
        job_id: selectedJob.id,
        client_id: client.id,
        is_from_client: true,
        content: newComment.trim()
      });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    setNewComment('');
    fetchJobComments(selectedJob.id);
  };

  const openApprovalDialog = (action: 'approved' | 'revision' | 'rejected') => {
    setApprovalAction(action);
    setApprovalNotes('');
    setShowApprovalDialog(true);
  };

  const submitApproval = async () => {
    if (!selectedJob || !approvalAction) return;

    if (approvalAction === 'revision' && !approvalNotes.trim()) {
      toast({ title: "Erro", description: "Descreva as alterações necessárias", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const updateData: any = {
      status: approvalAction
    };

    if (approvalAction === 'approved') {
      updateData.approved_at = new Date().toISOString();
    } else if (approvalAction === 'revision') {
      updateData.revision_notes = approvalNotes;
    } else if (approvalAction === 'rejected') {
      updateData.rejection_notes = approvalNotes || null;
    }

    const { error } = await supabase
      .from('aprova_job_jobs')
      .update(updateData)
      .eq('id', selectedJob.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    toast({ 
      title: "Sucesso!", 
      description: approvalAction === 'approved' 
        ? "Job aprovado com sucesso!" 
        : approvalAction === 'revision'
          ? "Revisão solicitada"
          : "Job rejeitado"
    });

    setShowApprovalDialog(false);
    setSelectedJob(null);
    if (client) fetchJobs(client.id);
    setSubmitting(false);
  };

  const revertApproval = async () => {
    if (!selectedJob) return;

    setSubmitting(true);

    const { error } = await supabase
      .from('aprova_job_jobs')
      .update({
        status: 'pending',
        approved_at: null,
        revision_notes: null,
        rejection_notes: null
      })
      .eq('id', selectedJob.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    toast({ 
      title: "Revertido!", 
      description: "O status do job foi revertido para pendente"
    });

    setSelectedJob(null);
    if (client) fetchJobs(client.id);
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30"><Check className="w-3 h-3 mr-1" /> Aprovado</Badge>;
      case 'revision':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30"><AlertCircle className="w-3 h-3 mr-1" /> Revisão</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/30"><X className="w-3 h-3 mr-1" /> Não Aprovado</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Login screen
  if (!isLoggedIn) {
    const primaryColor = client?.primary_color || '#8B5CF6';
    const secondaryColor = client?.secondary_color || '#6366F1';
    
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <FileImage className="w-8 h-8" style={{ color: primaryColor }} />
            </div>
            <CardTitle>Aprova Job</CardTitle>
            <CardDescription>Entre para visualizar e aprovar seus jobs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Usuário</Label>
              <Input
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Seu nome de usuário"
              />
            </div>
            <div>
              <Label>Senha</Label>
              <Input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button 
              onClick={handleLogin} 
              className="w-full" 
              disabled={loginLoading}
              style={{ backgroundColor: primaryColor }}
            >
              {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Client dashboard
  const primaryColor = client?.primary_color || '#8B5CF6';
  const secondaryColor = client?.secondary_color || '#6366F1';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <FileImage className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 className="font-semibold">Aprova Job</h1>
              <p className="text-sm text-muted-foreground">Olá, {client?.name}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </header>

      {/* Jobs list */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold">Seus Jobs</h2>
          
          {/* Status filter */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Todos' },
              { value: 'pending', label: 'Pendentes' },
              { value: 'approved', label: 'Aprovados' },
              { value: 'revision', label: 'Revisão' },
              { value: 'rejected', label: 'Rejeitados' }
            ].map(filter => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
                style={statusFilter === filter.value ? { backgroundColor: primaryColor } : undefined}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {jobs.filter(job => statusFilter === 'all' || job.status === statusFilter).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileImage className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum job disponível</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.filter(job => statusFilter === 'all' || job.status === statusFilter).map(job => (
              <Card 
                key={job.id} 
                className="cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                onClick={() => openJob(job)}
              >
                {job.media_urls.length > 0 && (
                  <div className="aspect-video bg-muted">
                    {job.media_urls[0].includes('video') ? (
                      <video src={job.media_urls[0]} className="w-full h-full object-cover" />
                    ) : (
                      <img src={job.media_urls[0]} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium line-clamp-1">{job.title}</h3>
                    {getStatusBadge(job.status)}
                  </div>
                  {job.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{job.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(job.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    {job.due_date && ` • Entrega: ${format(new Date(job.due_date), "dd/MM/yyyy", { locale: ptBR })}`}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Job detail dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedJob.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(selectedJob.status)}
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Media carousel */}
                {selectedJob.media_urls.length > 0 && (
                  <div className="relative">
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                      {selectedJob.media_urls[mediaIndex].includes('video') ? (
                        <video 
                          src={selectedJob.media_urls[mediaIndex]} 
                          controls 
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img 
                          src={selectedJob.media_urls[mediaIndex]} 
                          alt="" 
                          className="w-full h-full object-contain cursor-pointer"
                          onClick={() => window.open(selectedJob.media_urls[mediaIndex], '_blank')}
                        />
                      )}
                    </div>
                    
                    {selectedJob.media_urls.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2"
                          onClick={() => setMediaIndex(prev => prev === 0 ? selectedJob.media_urls.length - 1 : prev - 1)}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setMediaIndex(prev => prev === selectedJob.media_urls.length - 1 ? 0 : prev + 1)}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                          {mediaIndex + 1} / {selectedJob.media_urls.length}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {selectedJob.description && (
                  <div>
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p className="mt-1">{selectedJob.description}</p>
                  </div>
                )}

                {selectedJob.due_date && (
                  <div>
                    <Label className="text-muted-foreground">Data de Entrega</Label>
                    <p className="mt-1">{format(new Date(selectedJob.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Comentários
                  </Label>
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                    {jobComments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário</p>
                    ) : (
                      jobComments.map(comment => (
                        <div 
                          key={comment.id} 
                          className={`p-3 rounded ${comment.is_from_client ? 'ml-4' : 'bg-muted mr-4'}`}
                          style={comment.is_from_client ? { backgroundColor: `${primaryColor}20` } : {}}
                        >
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <span className="font-medium">{comment.is_from_client ? 'Você' : 'Equipe'}</span>
                            <span>{format(new Date(comment.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Adicionar comentário..."
                      onKeyDown={(e) => e.key === 'Enter' && addComment()}
                    />
                    <Button onClick={addComment} disabled={!newComment.trim()} style={{ backgroundColor: primaryColor }}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Approval buttons */}
                {selectedJob.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => openApprovalDialog('approved')}
                    >
                      <Check className="w-4 h-4 mr-2" /> Aprovar
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 border-yellow-500 text-yellow-600 hover:bg-yellow-500/10"
                      onClick={() => openApprovalDialog('revision')}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" /> Solicitar Revisão
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1 border-red-500 text-red-600 hover:bg-red-500/10"
                      onClick={() => openApprovalDialog('rejected')}
                    >
                      <X className="w-4 h-4 mr-2" /> Não Aprovar
                    </Button>
                  </div>
                )}

                {/* Revert button for non-pending jobs */}
                {selectedJob.status !== 'pending' && (
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={revertApproval}
                      disabled={submitting}
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Undo2 className="w-4 h-4 mr-2" />}
                      Reverter para Pendente
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Use esta opção caso tenha confirmado por engano
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval confirmation dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approved' && 'Confirmar Aprovação'}
              {approvalAction === 'revision' && 'Solicitar Revisão'}
              {approvalAction === 'rejected' && 'Não Aprovar Job'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approved' && 'Deseja aprovar este job?'}
              {approvalAction === 'revision' && 'Descreva as alterações necessárias'}
              {approvalAction === 'rejected' && 'Tem certeza que não deseja aprovar este job?'}
            </DialogDescription>
          </DialogHeader>

          {(approvalAction === 'revision' || approvalAction === 'rejected') && (
            <div>
              <Label>{approvalAction === 'revision' ? 'O que precisa ser alterado? *' : 'Observação (opcional)'}</Label>
              <Textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder={approvalAction === 'revision' 
                  ? "Descreva detalhadamente as alterações necessárias..."
                  : "Motivo da rejeição (opcional)..."
                }
                rows={4}
              />
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={submitApproval}
              disabled={submitting || (approvalAction === 'revision' && !approvalNotes.trim())}
              className={
                approvalAction === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                approvalAction === 'revision' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-red-600 hover:bg-red-700'
              }
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
