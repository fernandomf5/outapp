import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Trash2, 
  Wifi, 
  WifiOff, 
  QrCode, 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Smartphone,
  Phone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppInstance {
  id: string;
  user_id: string;
  agent_id: string | null;
  instance_name: string;
  instance_key: string | null;
  phone_number: string | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'qr_code' | 'demo';
  qr_code: string | null;
  qr_code_expires_at: string | null;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

interface WhatsAppInstancesManagerProps {
  instances: WhatsAppInstance[];
  onRefresh: () => void;
  onSelectInstance?: (instance: WhatsAppInstance) => void;
  selectedInstanceId?: string;
}

export function WhatsAppInstancesManager({ 
  instances, 
  onRefresh, 
  onSelectInstance,
  selectedInstanceId 
}: WhatsAppInstancesManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [qrCodeDialogOpen, setQrCodeDialogOpen] = useState(false);
  const [currentQrCode, setCurrentQrCode] = useState<string | null>(null);
  const [currentInstance, setCurrentInstance] = useState<WhatsAppInstance | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  const handleCreateInstance = async () => {
    if (!user?.id || !newInstanceName.trim()) return;
    
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ai-agent', {
        body: {
          action: 'create_instance',
          userId: user.id,
          agentId: null, // Instance without agent initially
          instanceName: newInstanceName.trim(),
        }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "WhatsApp Criado! 📱",
        description: data.demoMode 
          ? "Instância criada em modo demo. Configure a Z-API para conectar ao WhatsApp real."
          : "Escaneie o QR Code para conectar.",
      });

      setNewInstanceName('');
      setShowNewDialog(false);
      onRefresh();
      
      // Open QR code dialog if not demo mode
      if (!data.demoMode && data.instance) {
        setCurrentInstance(data.instance);
        handleGetQrCode(data.instance.instance_key);
      }
    } catch (error) {
      console.error('Error creating instance:', error);
      toast({
        title: "Erro ao Criar",
        description: "Não foi possível criar a instância.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleGetQrCode = async (instanceKey: string) => {
    setIsLoadingQr(true);
    setQrCodeDialogOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-ai-agent', {
        body: {
          action: 'get_qrcode',
          instanceKey,
        }
      });

      if (error) throw error;

      if (data.qrcode?.base64) {
        setCurrentQrCode(data.qrcode.base64);
      }
    } catch (error) {
      console.error('Error getting QR code:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleDisconnect = async (instance: WhatsAppInstance) => {
    try {
      await supabase.functions.invoke('whatsapp-ai-agent', {
        body: {
          action: 'disconnect',
          instanceKey: instance.instance_key,
        }
      });

      toast({
        title: "Desconectado",
        description: "WhatsApp desconectado com sucesso.",
      });

      onRefresh();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const handleDeleteInstance = async (instance: WhatsAppInstance) => {
    try {
      // Disconnect first if connected
      if (instance.status === 'connected') {
        await handleDisconnect(instance);
      }

      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instance.id);

      if (error) throw error;

      toast({
        title: "Removido",
        description: "WhatsApp removido com sucesso.",
      });

      onRefresh();
    } catch (error) {
      console.error('Error deleting instance:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" /> Conectado</Badge>;
      case 'connecting':
      case 'qr_code':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Aguardando</Badge>;
      case 'demo':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Smartphone className="w-3 h-3 mr-1" /> Demo</Badge>;
      default:
        return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" /> Desconectado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Seus WhatsApp</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie múltiplas conexões WhatsApp
          </p>
        </div>
        
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Adicionar WhatsApp
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-500" />
                Adicionar Novo WhatsApp
              </DialogTitle>
              <DialogDescription>
                Adicione um novo número WhatsApp para gerenciar
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome para Identificação</Label>
                <Input
                  placeholder="Ex: WhatsApp Vendas, Suporte, Loja..."
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Um nome para você identificar facilmente este WhatsApp
                </p>
              </div>
              <Button 
                onClick={handleCreateInstance} 
                disabled={isCreating || !newInstanceName.trim()}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Criar e Conectar
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrCodeDialogOpen} onOpenChange={setQrCodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no seu celular → Menu → Aparelhos Conectados → Conectar
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {isLoadingQr ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            ) : currentQrCode ? (
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={`data:image/png;base64,${currentQrCode}`} 
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>QR Code não disponível</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => currentInstance && handleGetQrCode(currentInstance.instance_key!)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Instances List */}
      {instances.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Smartphone className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum WhatsApp conectado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Adicione seu primeiro WhatsApp para começar a usar agentes IA
            </p>
            <Button onClick={() => setShowNewDialog(true)}>
              <Plus className="w-4 h-4 mr-2" /> Adicionar Primeiro WhatsApp
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="grid gap-4">
            {instances.map((instance) => (
              <Card 
                key={instance.id} 
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedInstanceId === instance.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => onSelectInstance?.(instance)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        instance.status === 'connected' 
                          ? 'bg-green-500/20' 
                          : instance.status === 'demo' 
                            ? 'bg-blue-500/20' 
                            : 'bg-muted'
                      }`}>
                        {instance.status === 'connected' ? (
                          <Wifi className="w-6 h-6 text-green-500" />
                        ) : instance.status === 'demo' ? (
                          <Smartphone className="w-6 h-6 text-blue-500" />
                        ) : (
                          <WifiOff className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{instance.instance_name}</h4>
                        {instance.phone_number ? (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {instance.phone_number}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {instance.agent_id ? 'Agente vinculado' : 'Sem agente vinculado'}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusBadge(instance.status)}
                      
                      {instance.status !== 'connected' && instance.status !== 'demo' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentInstance(instance);
                            handleGetQrCode(instance.instance_key!);
                          }}
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          QR Code
                        </Button>
                      )}
                      
                      {instance.status === 'connected' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisconnect(instance);
                          }}
                        >
                          <WifiOff className="w-4 h-4 mr-1" />
                          Desconectar
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover WhatsApp?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Isso irá desconectar e remover "{instance.instance_name}". 
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteInstance(instance)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
