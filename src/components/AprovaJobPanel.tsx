import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Users, FileImage, Bell, Copy, Send, Trash2, Eye, ExternalLink, Image, Video, X, Check, Clock, AlertCircle, MessageSquare, Pencil, Play } from "lucide-react";
import { VideoThumbnail } from "@/components/VideoThumbnail";
import { isVideoUrl } from "@/lib/media";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Client {
  id: string;
  name: string;
  username: string;
  access_token: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  primary_color?: string;
  secondary_color?: string;
}

interface Job {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  media_urls: string[];
  status: 'pending' | 'approved' | 'revision' | 'rejected';
  revision_notes: string | null;
  rejection_notes: string | null;
  due_date: string | null;
  approved_at: string | null;
  created_at: string;
  client?: Client;
}

interface Notification {
  id: string;
  job_id: string | null;
  client_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Comment {
  id: string;
  job_id: string;
  client_id: string | null;
  is_from_client: boolean;
  content: string;
  created_at: string;
}

export const AprovaJobPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Client form state
  const [showClientDialog, setShowClientDialog] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientForm, setClientForm] = useState({ name: '', username: '', password: '', primary_color: '#8B5CF6', secondary_color: '#6366F1' });
  
  // Job form state
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [jobForm, setJobForm] = useState({ client_id: '', title: '', description: '', due_date: '', media_urls: [] as string[] });
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // Job detail state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobComments, setJobComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Job filter state
  const [clientFilter, setClientFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchData();
      setupRealtimeSubscription();
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('aprova-job-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aprova_job_notifications' }, () => {
        fetchNotifications();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aprova_job_jobs' }, () => {
        fetchJobs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchClients(), fetchJobs(), fetchNotifications()]);
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('aprova_job_clients')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setClients(data as Client[]);
    }
  };

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('aprova_job_jobs')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch client info for each job
      const jobsWithClients = await Promise.all(
        data.map(async (job) => {
          const { data: clientData } = await supabase
            .from('aprova_job_clients')
            .select('*')
            .eq('id', job.client_id)
            .single();
          return { ...job, client: clientData, media_urls: job.media_urls || [] } as Job;
        })
      );
      setJobs(jobsWithClients);
    }
  };

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from('aprova_job_notifications')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data as Notification[]);
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

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const openNewClient = () => {
    setEditingClient(null);
    setClientForm({ name: '', username: '', password: '', primary_color: '#8B5CF6', secondary_color: '#6366F1' });
    setShowClientDialog(true);
  };

  const openEditClient = (client: Client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name,
      username: client.username,
      password: '',
      primary_color: client.primary_color || '#8B5CF6',
      secondary_color: client.secondary_color || '#6366F1'
    });
    setShowClientDialog(true);
  };

  const createClient = async () => {
    if (!clientForm.name || !clientForm.username || !clientForm.password) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    const passwordHash = await hashPassword(clientForm.password);

    const { error } = await supabase
      .from('aprova_job_clients')
      .insert({
        user_id: user?.id,
        name: clientForm.name,
        username: clientForm.username.toLowerCase().trim(),
        password_hash: passwordHash,
        primary_color: clientForm.primary_color,
        secondary_color: clientForm.secondary_color
      });

    if (error) {
      if (error.code === '23505') {
        toast({ title: "Erro", description: "Usuário já existe", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
      return;
    }

    toast({ title: "Sucesso", description: "Cliente criado com sucesso!" });
    setShowClientDialog(false);
    setEditingClient(null);
    setClientForm({ name: '', username: '', password: '', primary_color: '#8B5CF6', secondary_color: '#6366F1' });
    fetchClients();
  };

  const updateClient = async () => {
    if (!editingClient || !clientForm.name || !clientForm.username) {
      toast({ title: "Erro", description: "Preencha nome e usuário", variant: "destructive" });
      return;
    }

    const updateData: any = {
      name: clientForm.name,
      username: clientForm.username.toLowerCase().trim(),
      primary_color: clientForm.primary_color,
      secondary_color: clientForm.secondary_color
    };

    // Only update password if provided
    if (clientForm.password) {
      updateData.password_hash = await hashPassword(clientForm.password);
    }

    const { error } = await supabase
      .from('aprova_job_clients')
      .update(updateData)
      .eq('id', editingClient.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Sucesso", description: "Cliente atualizado!" });
    setShowClientDialog(false);
    setEditingClient(null);
    setClientForm({ name: '', username: '', password: '', primary_color: '#8B5CF6', secondary_color: '#6366F1' });
    fetchClients();
  };

  const deleteClient = async (clientId: string) => {
    const { error } = await supabase
      .from('aprova_job_clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Sucesso", description: "Cliente removido" });
    fetchClients();
    fetchJobs();
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingMedia(true);
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-media')
        .upload(fileName, file);

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('chat-media')
          .getPublicUrl(fileName);
        newUrls.push(urlData.publicUrl);
      }
    }

    setJobForm(prev => ({ ...prev, media_urls: [...prev.media_urls, ...newUrls] }));
    setUploadingMedia(false);
  };

  const removeMedia = (index: number) => {
    setJobForm(prev => ({
      ...prev,
      media_urls: prev.media_urls.filter((_, i) => i !== index)
    }));
  };

  const createJob = async () => {
    if (!jobForm.client_id || !jobForm.title) {
      toast({ title: "Erro", description: "Selecione um cliente e informe o título", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('aprova_job_jobs')
      .insert({
        user_id: user?.id,
        client_id: jobForm.client_id,
        title: jobForm.title,
        description: jobForm.description || null,
        media_urls: jobForm.media_urls,
        due_date: jobForm.due_date || null
      });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Sucesso", description: "Job criado com sucesso!" });
    setShowJobDialog(false);
    setJobForm({ client_id: '', title: '', description: '', due_date: '', media_urls: [] });
    fetchJobs();
  };

  const updateJob = async () => {
    if (!editingJob || !jobForm.title) {
      toast({ title: "Erro", description: "Informe o título", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('aprova_job_jobs')
      .update({
        title: jobForm.title,
        description: jobForm.description || null,
        media_urls: jobForm.media_urls,
        due_date: jobForm.due_date || null,
        status: 'pending' // Reset status to pending when edited
      })
      .eq('id', editingJob.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Sucesso", description: "Job atualizado com sucesso!" });
    setShowJobDialog(false);
    setEditingJob(null);
    setJobForm({ client_id: '', title: '', description: '', due_date: '', media_urls: [] });
    fetchJobs();
  };

  const openEditJob = (job: Job) => {
    setEditingJob(job);
    setJobForm({
      client_id: job.client_id,
      title: job.title,
      description: job.description || '',
      due_date: job.due_date || '',
      media_urls: job.media_urls || []
    });
    setShowJobDialog(true);
  };

  const openNewJob = () => {
    setEditingJob(null);
    setJobForm({ client_id: '', title: '', description: '', due_date: '', media_urls: [] });
    setShowJobDialog(true);
  };

  const deleteJob = async (jobId: string) => {
    const { error } = await supabase
      .from('aprova_job_jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Sucesso", description: "Job removido" });
    fetchJobs();
  };

  const addComment = async () => {
    if (!selectedJob || !newComment.trim()) return;

    const { error } = await supabase
      .from('aprova_job_comments')
      .insert({
        job_id: selectedJob.id,
        is_from_client: false,
        content: newComment.trim()
      });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    setNewComment('');
    fetchJobComments(selectedJob.id);
  };

  const markNotificationRead = async (notificationId: string) => {
    await supabase
      .from('aprova_job_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    fetchNotifications();
  };

  const markAllNotificationsRead = async () => {
    await supabase
      .from('aprova_job_notifications')
      .update({ is_read: true })
      .eq('user_id', user?.id)
      .eq('is_read', false);
    
    fetchNotifications();
  };

  const copyClientCredentials = (client: Client) => {
    const accessUrl = `${window.location.origin}/aprova-job/${client.access_token}`;
    const text = `🔗 Acesso Aprova Job\n\nLink: ${accessUrl}\nUsuário: ${client.username}\nSenha: (a senha que você definiu)\n\nAcesse pelo navegador para aprovar seus jobs!`;
    
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Credenciais copiadas para a área de transferência" });
  };

  const copyClientLink = (client: Client) => {
    const accessUrl = `${window.location.origin}/aprova-job/${client.access_token}`;
    navigator.clipboard.writeText(accessUrl);
    toast({ title: "Link copiado!", description: "Link de acesso copiado para a área de transferência" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500 text-white border-green-600 shadow-md shadow-green-500/30 px-3 py-1"><Check className="w-4 h-4 mr-1" /> Aprovado</Badge>;
      case 'revision':
        return <Badge className="bg-yellow-500 text-white border-yellow-600 shadow-md shadow-yellow-500/30 px-3 py-1"><AlertCircle className="w-4 h-4 mr-1" /> Revisão</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500 text-white border-red-600 shadow-md shadow-red-500/30 px-3 py-1"><X className="w-4 h-4 mr-1" /> Não Aprovado</Badge>;
      default:
        return <Badge className="bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-500/30 px-3 py-1"><Clock className="w-4 h-4 mr-1" /> Pendente</Badge>;
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Aprova Job</h2>
          <p className="text-muted-foreground">Sistema de aprovação de criativos</p>
        </div>
      </div>

      <Tabs defaultValue="jobs" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs" className="gap-2">
            <FileImage className="w-4 h-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="clients" className="gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 relative">
            <Bell className="w-4 h-4" />
            Notificações
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="w-full sm:w-64">
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clientes</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
            <Dialog open={showJobDialog} onOpenChange={(open) => {
              setShowJobDialog(open);
              if (!open) {
                setEditingJob(null);
                setJobForm({ client_id: '', title: '', description: '', due_date: '', media_urls: [] });
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={openNewJob}><Plus className="w-4 h-4 mr-2" /> Novo Job</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingJob ? 'Editar Job' : 'Criar Novo Job'}</DialogTitle>
                  <DialogDescription>
                    {editingJob ? 'Atualize o criativo e envie novamente para aprovação' : 'Envie um criativo para aprovação do cliente'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Cliente *</Label>
                    <Select 
                      value={jobForm.client_id} 
                      onValueChange={(v) => setJobForm(prev => ({ ...prev, client_id: v }))}
                      disabled={!!editingJob}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.filter(c => c.is_active).map(client => (
                          <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Título *</Label>
                    <Input
                      value={jobForm.title}
                      onChange={(e) => setJobForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ex: Post Instagram - Black Friday"
                    />
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={jobForm.description}
                      onChange={(e) => setJobForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Informações adicionais sobre o job..."
                    />
                  </div>
                  <div>
                    <Label>Data de Entrega</Label>
                    <Input
                      type="date"
                      value={jobForm.due_date}
                      onChange={(e) => setJobForm(prev => ({ ...prev, due_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Mídia (Imagens/Vídeos)</Label>
                    <div className="mt-2 space-y-2">
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleMediaUpload}
                        disabled={uploadingMedia}
                      />
                      {uploadingMedia && <p className="text-sm text-muted-foreground">Enviando...</p>}
                      {jobForm.media_urls.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {jobForm.media_urls.map((url, i) => (
                            <div key={i} className="relative group">
                              {isVideoUrl(url) ? (
                                <VideoThumbnail videoUrl={url} className="w-full h-20 rounded" />
                              ) : (
                                <img src={url} alt="" className="w-full h-20 object-cover rounded" />
                              )}
                              <button
                                onClick={() => removeMedia(i)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button onClick={editingJob ? updateJob : createJob} className="w-full">
                    <Send className="w-4 h-4 mr-2" /> {editingJob ? 'Atualizar e Reenviar' : 'Enviar para Aprovação'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>

          {jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileImage className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum job criado ainda</p>
                <Button variant="outline" className="mt-4" onClick={() => setShowJobDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Criar primeiro job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {jobs
                .filter(job => clientFilter === 'all' || job.client_id === clientFilter)
                .map(job => (
                <Card key={job.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Media preview */}
                      {job.media_urls.length > 0 && (
                        <div className="w-full sm:w-32 h-32 flex-shrink-0">
                          {isVideoUrl(job.media_urls[0]) ? (
                            <VideoThumbnail 
                              videoUrl={job.media_urls[0]} 
                              className="w-full h-full rounded"
                            />
                          ) : (
                            <img src={job.media_urls[0]} alt="" className="w-full h-full object-cover rounded" />
                          )}
                        </div>
                      )}
                      
                      {/* Job info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold truncate">{job.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              Cliente: {job.client?.name || 'N/A'}
                            </p>
                          </div>
                          {getStatusBadge(job.status)}
                        </div>
                        
                        {job.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                        )}
                        
                        {job.revision_notes && (
                          <div className="mt-2 p-2 bg-yellow-500/10 rounded text-sm">
                            <strong>Notas de revisão:</strong> {job.revision_notes}
                          </div>
                        )}
                        
                        {job.rejection_notes && (
                          <div className="mt-2 p-2 bg-red-500/10 rounded text-sm">
                            <strong>Motivo da rejeição:</strong> {job.rejection_notes}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>Criado: {format(new Date(job.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                          {job.due_date && <span>Entrega: {format(new Date(job.due_date), "dd/MM/yyyy", { locale: ptBR })}</span>}
                          {job.approved_at && <span>Aprovado: {format(new Date(job.approved_at), "dd/MM/yyyy", { locale: ptBR })}</span>}
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedJob(job);
                              fetchJobComments(job.id);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" /> Ver Detalhes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditJob(job)}
                          >
                            <Pencil className="w-4 h-4 mr-1" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteJob(job.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showClientDialog} onOpenChange={(open) => {
              setShowClientDialog(open);
              if (!open) {
                setEditingClient(null);
                setClientForm({ name: '', username: '', password: '', primary_color: '#8B5CF6', secondary_color: '#6366F1' });
              }
            }}>
              <DialogTrigger asChild>
                <Button onClick={openNewClient}><Plus className="w-4 h-4 mr-2" /> Novo Cliente</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingClient ? 'Editar Cliente' : 'Criar Cliente'}</DialogTitle>
                  <DialogDescription>
                    {editingClient ? 'Atualize os dados do cliente' : 'Crie um acesso para seu cliente aprovar jobs'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Cliente *</Label>
                    <Input
                      value={clientForm.name}
                      onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Empresa ABC"
                    />
                  </div>
                  <div>
                    <Label>Nome de Usuário *</Label>
                    <Input
                      value={clientForm.username}
                      onChange={(e) => setClientForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Ex: empresaabc"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Sem espaços ou caracteres especiais</p>
                  </div>
                  <div>
                    <Label>{editingClient ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}</Label>
                    <Input
                      type="password"
                      value={clientForm.password}
                      onChange={(e) => setClientForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cor Primária</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={clientForm.primary_color}
                          onChange={(e) => setClientForm(prev => ({ ...prev, primary_color: e.target.value }))}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={clientForm.primary_color}
                          onChange={(e) => setClientForm(prev => ({ ...prev, primary_color: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Cor Secundária</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={clientForm.secondary_color}
                          onChange={(e) => setClientForm(prev => ({ ...prev, secondary_color: e.target.value }))}
                          className="w-10 h-10 rounded cursor-pointer border-0"
                        />
                        <Input
                          value={clientForm.secondary_color}
                          onChange={(e) => setClientForm(prev => ({ ...prev, secondary_color: e.target.value }))}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={editingClient ? updateClient : createClient} className="w-full">
                    {editingClient ? 'Atualizar Cliente' : 'Criar Cliente'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {clients.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
                <Button variant="outline" className="mt-4" onClick={openNewClient}>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar primeiro cliente
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.username}</TableCell>
                      <TableCell>
                        <Badge variant={client.is_active ? "default" : "secondary"}>
                          {client.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.last_login_at 
                          ? format(new Date(client.last_login_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : "Nunca"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyClientLink(client)}
                            title="Copiar Link"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" /> Copiar Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyClientCredentials(client)}
                            title="Copiar credenciais completas"
                          >
                            <Copy className="w-4 h-4 mr-1" /> Copiar Acesso
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/aprova-job/${client.access_token}`, '_blank')}
                            title="Abrir página do cliente"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditClient(client)}
                            title="Editar cliente"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => deleteClient(client.id)}
                            title="Excluir cliente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          {notifications.length > 0 && (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
                <Check className="w-4 h-4 mr-2" /> Marcar todas como lidas
              </Button>
            </div>
          )}

          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma notificação</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {notifications.map(notification => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-colors ${!notification.is_read ? 'bg-primary/5 border-primary/20' : ''}`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${!notification.is_read ? 'bg-primary/20' : 'bg-muted'}`}>
                        <Bell className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedJob.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getStatusBadge(selectedJob.status)}
                  <span className="text-sm text-muted-foreground">
                    Cliente: {selectedJob.client?.name}
                  </span>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {selectedJob.description && (
                  <div>
                    <Label className="text-muted-foreground">Descrição</Label>
                    <p>{selectedJob.description}</p>
                  </div>
                )}

                {selectedJob.media_urls.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Mídia</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {selectedJob.media_urls.map((url, i) => (
                        <div key={i} className="relative">
                          {isVideoUrl(url) ? (
                            <video src={url} controls className="w-full rounded" />
                          ) : (
                            <img src={url} alt="" className="w-full rounded cursor-pointer" onClick={() => window.open(url, '_blank')} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedJob.revision_notes && (
                  <div className="p-3 bg-yellow-500/10 rounded">
                    <Label className="text-yellow-600">Notas de Revisão</Label>
                    <p className="mt-1">{selectedJob.revision_notes}</p>
                  </div>
                )}

                {selectedJob.rejection_notes && (
                  <div className="p-3 bg-red-500/10 rounded">
                    <Label className="text-red-600">Motivo da Rejeição</Label>
                    <p className="mt-1">{selectedJob.rejection_notes}</p>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Comentários
                  </Label>
                  <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                    {jobComments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum comentário ainda</p>
                    ) : (
                      jobComments.map(comment => (
                        <div 
                          key={comment.id} 
                          className={`p-3 rounded ${comment.is_from_client ? 'bg-blue-500/10 ml-4' : 'bg-muted mr-4'}`}
                        >
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <span className="font-medium">{comment.is_from_client ? 'Cliente' : 'Você'}</span>
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
                    <Button onClick={addComment} disabled={!newComment.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
