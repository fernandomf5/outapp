import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, KeyRound } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email("Por favor, insira um e-mail válido");

interface AuthFnResult { success?: boolean; error?: string }

/** Recuperação de senha em 2 etapas: e-mail → código (Resend) + nova senha. */
const ForgotPassword = () => {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const callAuth = async (body: Record<string, unknown>): Promise<AuthFnResult> => {
    const { data, error } = await supabase.functions.invoke<AuthFnResult>("user-auth", { body });
    if (error) return { error: "Não foi possível concluir agora. Tente novamente." };
    return data ?? {};
  };

  const requestCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = emailSchema.safeParse(email);
    if (!v.success) {
      toast({ title: "E-mail inválido", description: v.error.issues[0].message, variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const res = await callAuth({ action: "reset-request", email: v.data });
    setIsLoading(false);
    if (res.error) {
      toast({ title: "Erro ao enviar", description: res.error, variant: "destructive" });
      return;
    }
    setStep("code");
    toast({ title: "Código enviado 📧", description: "Se o e-mail estiver cadastrado, você receberá um código de 6 dígitos." });
  };

  const confirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Senha curta", description: "Use pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Senhas diferentes", description: "A senha e a confirmação precisam ser iguais.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    const res = await callAuth({ action: "reset-confirm", email: email.trim(), code, password });
    setIsLoading(false);
    if (res.error) {
      toast({ title: "Não foi possível redefinir", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Senha redefinida ✅", description: "Agora é só entrar com sua nova senha." });
    navigate("/auth");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-accent/10">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-xl">
        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              {step === "email" ? <Mail className="w-8 h-8 text-primary" /> : <KeyRound className="w-8 h-8 text-primary" />}
            </div>
          </div>
          <h1 className="text-3xl font-bold">Recuperar Senha</h1>
          <p className="text-muted-foreground">
            {step === "email"
              ? "Digite seu e-mail cadastrado e enviaremos um código para redefinir sua senha"
              : <>Digite o código enviado para <strong className="text-foreground">{email}</strong> e escolha sua nova senha</>}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={requestCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail cadastrado</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="h-12" />
            </div>
            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar código"}
            </Button>
          </form>
        ) : (
          <form onSubmit={confirmReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de 6 dígitos</Label>
              <Input id="code" inputMode="numeric" placeholder="000000" value={code} maxLength={6}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required className="text-center text-2xl tracking-widest h-14" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                required autoComplete="new-password" className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className="h-12" />
            </div>
            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || code.length !== 6}>
              {isLoading ? "Salvando..." : "Redefinir senha"}
            </Button>
            <Button type="button" variant="link" className="w-full" disabled={isLoading} onClick={() => requestCode()}>
              Reenviar código
            </Button>
          </form>
        )}

        <Button type="button" onClick={() => navigate("/auth")} variant="ghost" className="w-full" disabled={isLoading}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Login
        </Button>

        <p className="text-xs text-muted-foreground text-center">O código expira em 15 minutos.</p>
      </Card>
    </div>
  );
};

export default ForgotPassword;
