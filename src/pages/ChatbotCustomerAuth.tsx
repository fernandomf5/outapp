import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, MessageSquare } from "lucide-react";

export default function ChatbotCustomerAuth() {
  const { chatbotId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<'choice' | 'login' | 'register' | 'anonymous'>('choice');
  const [loading, setLoading] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessType, setAccessType] = useState<string>('public');
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Verifica o tipo de acesso do chatbot
  useEffect(() => {
    const checkAccessType = async () => {
      try {
        const { data: chatbot } = await supabase
          .from('chatbots')
          .select('access_type')
          .eq('id', chatbotId)
          .single();

        setAccessType(chatbot?.access_type || 'public');

        if (chatbot?.access_type === 'anonymous') {
          // Acesso direto - mostra apenas campo de nome
          setAuthMode('anonymous');
        } else if (chatbot?.access_type === 'restricted') {
          // Acesso privado - mostra apenas cadastro
          setAuthMode('register');
        }

        // Limpa qualquer autenticação antiga ao montar o componente
        const existingAuth = localStorage.getItem(`chatbot_customer_${chatbotId}`);
        if (existingAuth) {
          localStorage.removeItem(`chatbot_customer_${chatbotId}`);
        }
      } catch (error) {
        console.error('Error checking access type:', error);
      } finally {
        setCheckingAccess(false);
      }
    };

    checkAccessType();
  }, [chatbotId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação de senha para acesso privado
      if (accessType === 'restricted' && formData.password !== formData.confirmPassword) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Acesso direto - apenas nome
      if (authMode === 'anonymous') {
        const customer = {
          id: crypto.randomUUID(),
          name: formData.name,
          chatbot_id: chatbotId,
        };
        localStorage.setItem(`chatbot_customer_${chatbotId}`, JSON.stringify(customer));
        navigate(`/chatbot-chat/${chatbotId}`);
        return;
      }

      const { data, error } = await supabase.functions.invoke('chatbot-customer-auth', {
        body: {
          action: authMode === 'login' ? 'login' : 'register',
          chatbotId,
          accessType,
          ...formData,
        }
      });

      if (error) throw error;

      if (data.customer) {
        localStorage.setItem(`chatbot_customer_${chatbotId}`, JSON.stringify(data.customer));
        
        if (accessType === 'restricted') {
          toast({
            title: "Cadastro enviado!",
            description: "Aguarde a aprovação do administrador para acessar o chat.",
          });
        } else {
          toast({
            title: authMode === 'login' ? "Login realizado!" : "Cadastro realizado!",
            description: authMode === 'login' 
              ? "Bem-vindo de volta!" 
              : "Bem-vindo!",
          });
          navigate(`/chatbot-chat/${chatbotId}`);
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Acesso direto - apenas nome
  if (authMode === 'anonymous') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Bem-vindo ao Chat</CardTitle>
            <CardDescription>Digite seu nome para iniciar</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Seu nome"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar no Chat'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Acesso livre - escolha entre login e cadastro
  if (authMode === 'choice' && accessType === 'public') {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Bem-vindo ao Chat</CardTitle>
            <CardDescription>
              Escolha como deseja acessar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full h-auto py-6 flex-col gap-2" 
              onClick={() => setAuthMode('register')}
            >
              <MessageSquare className="w-6 h-6" />
              <span className="font-semibold">Cadastre-se para Iniciar Chat</span>
              <span className="text-xs opacity-80">Novo cadastro</span>
            </Button>

            <Button 
              variant="outline"
              className="w-full h-auto py-6 flex-col gap-2"
              onClick={() => setAuthMode('login')}
            >
              <LogIn className="w-6 h-6" />
              <span className="font-semibold">Entrar com Login e Senha</span>
              <span className="text-xs opacity-80">Já tenho uma conta</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-primary p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {authMode === 'login' ? 'Entrar no Chat' : 
             accessType === 'restricted' ? 'Solicitar Acesso' : 'Iniciar Novo Chat'}
          </CardTitle>
          <CardDescription>
            {authMode === 'login' ? 'Entre com suas credenciais' : 
             accessType === 'restricted' ? 'Preencha seus dados para solicitar acesso' :
             'Preencha seus dados para iniciar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="Seu nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required={accessType === 'restricted'}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>

            {authMode === 'register' && accessType === 'restricted' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                  placeholder="Digite a senha novamente"
                  minLength={6}
                />
              </div>
            )}

            {authMode === 'register' && accessType === 'restricted' && (
              <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-md text-sm text-yellow-900 dark:text-yellow-100">
                ⚠️ Após o cadastro, você precisará aguardar a aprovação do administrador para acessar o chat.
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processando...' : (
                authMode === 'login' ? 'Entrar' : 
                accessType === 'restricted' ? 'Solicitar Acesso' : 
                'Cadastrar e Iniciar Chat'
              )}
            </Button>

            {accessType === 'public' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setAuthMode('choice')}
              >
                ← Voltar
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
