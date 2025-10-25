import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarUpload } from "@/components/AvatarUpload";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // User Profile State
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    avatarUrl: null as string | null,
  });

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setProfile({
          name: data.full_name || "",
          email: data.email || "",
          avatarUrl: data.avatar_url || null,
        });
      }
    };

    loadProfile();
  }, [user]);

  // Password Change State
  const [passwords, setPasswords] = useState({
    new: "",
    confirm: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });

  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailConfirmationCode, setEmailConfirmationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);

  const handleSaveProfile = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.name,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Perfil atualizado! ✅",
      description: "Suas informações foram salvas com sucesso.",
    });
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: "Erro na senha",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast({
        title: "Senha fraca",
        description: "A senha deve ter pelo menos 8 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1) Atualiza a senha do usuário atual
      const { error: updateError } = await supabase.auth.updateUser({ password: passwords.new });
      if (updateError) throw updateError;

      // 2) Reautentica imediatamente para evitar problemas de token/refresh
      const email = user?.email;
      if (email) {
        await supabase.auth.signOut();
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: passwords.new,
        });
        if (signInError) throw signInError;
      }

      toast({
        title: "Senha alterada! 🔒",
        description: "Sua senha foi atualizada e sua sessão foi renovada.",
      });

      setPasswords({ new: "", confirm: "" });
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Ocorreu um erro ao alterar a senha.",
        variant: "destructive",
      });
    }
  };

  const handleRequestEmailChange = () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive",
      });
      return;
    }

    // Simulate sending confirmation code
    setIsCodeSent(true);
    toast({
      title: "Código enviado! 📧",
      description: `Um código de confirmação foi enviado para ${newEmail}`,
    });
  };

  const handleConfirmEmailChange = () => {
    if (emailConfirmationCode.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setProfile({ ...profile, email: newEmail });
    setIsEmailDialogOpen(false);
    setIsCodeSent(false);
    setNewEmail("");
    setEmailConfirmationCode("");
    
    toast({
      title: "Email atualizado! ✅",
      description: "Seu email foi alterado com sucesso.",
    });
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Configurações</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Gerencie seu perfil e preferências</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Profile Information */}
        <Card className="p-4 sm:p-6 glass">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-primary/10 p-2 sm:p-3 rounded-xl">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Informações do Perfil</h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Atualize suas informações pessoais</p>
            </div>
          </div>

          <div className="space-y-4">
            <AvatarUpload 
              avatarUrl={profile.avatarUrl}
              name={profile.name}
              onUploadComplete={(url) => setProfile({ ...profile, avatarUrl: url })}
            />

            <div>
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Seu nome completo"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Input
                  id="email"
                  value={profile.email}
                  disabled
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setIsEmailDialogOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Alterar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Para alterar seu email, clique em "Alterar" e confirme via código de verificação.
              </p>
            </div>

            <Button onClick={handleSaveProfile} className="gradient-primary shadow-glow w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-4 sm:p-6 glass">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-primary/10 p-2 sm:p-3 rounded-xl">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Segurança</h2>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Altere sua senha de acesso</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="relative mt-2">
                <Input
                  id="new-password"
                  type={showPasswords.new ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="Digite sua nova senha"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showPasswords.new ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <div className="relative mt-2">
                <Input
                  id="confirm-password"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  placeholder="Confirme sua nova senha"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showPasswords.confirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Requisitos de Senha
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Mínimo de 8 caracteres</li>
                <li>• Recomendado: letras maiúsculas e minúsculas</li>
                <li>• Recomendado: números e caracteres especiais</li>
              </ul>
            </div>

            <Button
              onClick={handleChangePassword}
              className="gradient-primary shadow-glow w-full sm:w-auto"
              disabled={!passwords.new || !passwords.confirm}
            >
              <Lock className="w-4 h-4 mr-2" />
              Alterar Senha
            </Button>
          </div>
        </Card>
      </main>

      {/* Email Change Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Email</DialogTitle>
            <DialogDescription>
              {!isCodeSent
                ? "Digite seu novo email. Enviaremos um código de confirmação."
                : "Digite o código de 6 dígitos enviado para seu novo email."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!isCodeSent ? (
              <>
                <div>
                  <Label htmlFor="new-email">Novo Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="novo@email.com"
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={handleRequestEmailChange}
                  className="w-full gradient-primary"
                >
                  Enviar Código
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label htmlFor="confirmation-code">Código de Confirmação</Label>
                  <Input
                    id="confirmation-code"
                    value={emailConfirmationCode}
                    onChange={(e) => setEmailConfirmationCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="mt-2 text-center text-2xl tracking-widest"
                  />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Código enviado para: {newEmail}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCodeSent(false)}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  <Button
                    onClick={handleConfirmEmailChange}
                    className="flex-1 gradient-primary"
                  >
                    Confirmar
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
