import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function MembersAreaAuth() {
  const [searchParams] = useSearchParams();
  const { areaId: areaIdFromUrl } = useParams();
  const navigate = useNavigate();
  const areaId = areaIdFromUrl || searchParams.get("area");
  
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", accessCode: "" });
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: "", email: "" });
  const [area, setArea] = useState<any>(null);
  const [loadingArea, setLoadingArea] = useState(true);

  useEffect(() => {
    if (!areaId) {
      toast.error("ID da área não fornecido");
      return;
    }

    const loadArea = async () => {
      try {
        const { data, error } = await supabase
          .from('members_areas' as any)
          .select('*')
          .eq('id', areaId)
          .maybeSingle();
        
        if (data && !error) {
          setArea(data as any);
          
          // Se a área é liberada (não requer aprovação), redireciona direto
          if (!(data as any).require_approval) {
            navigate(`/members-area/${areaId}`);
            return;
          }
        }
      } catch (error) {
        console.error('Error loading area:', error);
      } finally {
        setLoadingArea(false);
      }
    };

    loadArea();
  }, [areaId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.accessCode) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      // Verificar se o código de acesso é válido e está aprovado
      const { data: request, error: requestError } = await supabase
        .from('members_area_access_requests' as any)
        .select('*')
        .eq('email', loginForm.email)
        .eq('access_code', loginForm.accessCode.toUpperCase())
        .eq('area_id', areaId)
        .eq('status', 'approved')
        .maybeSingle();

      if (requestError || !request) {
        toast.error("Código de acesso inválido ou não aprovado");
        return;
      }

      // Verificar ou criar enrollment
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('members_area_enrollments' as any)
        .select('*')
        .eq('user_email', loginForm.email)
        .eq('area_id', areaId)
        .maybeSingle();

      if (!existingEnrollment && !checkError) {
        const { error: enrollError } = await supabase
          .from('members_area_enrollments' as any)
          .insert({
            area_id: areaId,
            user_email: loginForm.email,
            access_request_id: (request as any).id,
            status: 'active'
          });

        if (enrollError) throw enrollError;
      }

      // Salvar sessão no localStorage
      localStorage.setItem(`member_session_${areaId}`, JSON.stringify({
        email: loginForm.email,
        accessCode: loginForm.accessCode.toUpperCase(),
        requestId: (request as any).id,
        loginAt: new Date().toISOString()
      }));

      toast.success("Login realizado com sucesso!");
      navigate(`/members-area/${areaId}`);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error("Erro ao fazer login: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.email || !requestForm.name) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('members_area_access_requests' as any)
        .insert({
          area_id: areaId,
          email: requestForm.email,
          notes: requestForm.name,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Solicitação enviada! Você receberá um código de acesso por email quando for aprovado.");
      setRequestForm({ name: "", email: "" });
    } catch (error: any) {
      console.error('Request error:', error);
      toast.error("Erro ao solicitar acesso: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingArea) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!area) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Área não encontrada</CardTitle>
            <CardDescription>A área de membros solicitada não existe.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {area.logo_url && (
            <img 
              src={area.logo_url} 
              alt={area.name || area.title} 
              className="h-16 w-auto mx-auto mb-4 object-contain"
            />
          )}
          <CardTitle className="text-2xl">{area.name || area.title}</CardTitle>
          {area.description && (
            <CardDescription>{area.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="request">Solicitar Acesso</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="access-code">Código de Acesso</Label>
                  <div className="relative">
                    <Input
                      id="access-code"
                      type={showAccessCode ? "text" : "password"}
                      value={loginForm.accessCode}
                      onChange={(e) => setLoginForm({...loginForm, accessCode: e.target.value})}
                      placeholder="XXXXXXXX"
                      maxLength={8}
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowAccessCode(!showAccessCode)}
                    >
                      {showAccessCode ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Você receberá este código por email após aprovação
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="request" className="space-y-4">
              <form onSubmit={handleRequestAccess} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="request-name">Nome</Label>
                  <Input
                    id="request-name"
                    value={requestForm.name}
                    onChange={(e) => setRequestForm({...requestForm, name: e.target.value})}
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="request-email">Email</Label>
                  <Input
                    id="request-email"
                    type="email"
                    value={requestForm.email}
                    onChange={(e) => setRequestForm({...requestForm, email: e.target.value})}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Solicitar Acesso"
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Após aprovação, você receberá um código de acesso por email
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
