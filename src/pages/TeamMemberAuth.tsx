import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useTeamMember } from '@/contexts/TeamMemberContext';
import { Users, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TeamMemberAuth() {
  const location = useLocation();
  const prefillUsername = (location.state as any)?.prefillUsername || '';
  
  const [username, setUsername] = useState(prefillUsername);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login, isTeamMember, loading: contextLoading } = useTeamMember();

  useEffect(() => {
    if (!contextLoading && isTeamMember) {
      navigate('/dashboard');
    }
  }, [isTeamMember, contextLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha usuário e senha.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);

    if (result.success) {
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao painel!"
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Não foi possível realizar o login",
        description: result.error || "Verifique suas credenciais e tente novamente.",
        variant: "destructive"
      });
    }
  };

  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Acesso da Equipe
          </h1>
          <p className="text-muted-foreground mt-2">
            Entre com suas credenciais de membro da equipe
          </p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Entrar como membro da equipe
            </CardTitle>
            <CardDescription>
              Use o usuário e senha fornecidos pelo administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link 
            to="/auth" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para login principal
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Este acesso é exclusivo para membros de equipe.<br />
          Se você é o administrador, use o login principal.
        </p>
      </div>
    </div>
  );
}