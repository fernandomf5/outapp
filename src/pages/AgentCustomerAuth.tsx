import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LogIn, MessageSquare } from "lucide-react";

export default function AgentCustomerAuth() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authMode, setAuthMode] = useState<'choice' | 'login' | 'register'>('choice');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('agent-customer-auth', {
        body: {
          action: authMode === 'login' ? 'login' : 'register',
          agentId,
          ...formData,
        }
      });

      if (error) throw error;

      if (data.customer) {
        localStorage.setItem(`agent_customer_${agentId}`, JSON.stringify(data.customer));
        
        toast({
          title: authMode === 'login' ? "Login realizado!" : "Cadastro realizado!",
          description: authMode === 'login' 
            ? "Bem-vindo de volta!" 
            : "Sua conta foi criada! Por favor, confirme seu email.",
        });

        navigate(`/agent-chat/${agentId}`);
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

  if (authMode === 'choice') {
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
              <span className="font-semibold">Iniciar Chat</span>
              <span className="text-xs opacity-80">Novo cadastro com nome, email e telefone</span>
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
          <CardTitle>{authMode === 'login' ? 'Entrar no Chat' : 'Iniciar Novo Chat'}</CardTitle>
          <CardDescription>
            {authMode === 'login' ? 'Entre com suas credenciais' : 'Preencha seus dados para iniciar'}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
              />
            </div>

            {authMode === 'register' && (
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md text-sm text-blue-900 dark:text-blue-100">
                ⚠️ Você receberá um email de confirmação. Por favor, verifique sua caixa de entrada.
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processando...' : (authMode === 'login' ? 'Entrar' : 'Cadastrar e Iniciar Chat')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setAuthMode('choice')}
            >
              ← Voltar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
