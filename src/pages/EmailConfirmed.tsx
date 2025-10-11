import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, LogIn } from "lucide-react";

const EmailConfirmed = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Email confirmado | Bot Reals Zapp";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Confirmação de email concluída. Você já pode fazer login na sua conta.');
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md p-6 sm:p-8 text-center space-y-4 sm:space-y-6">
        <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-success" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold">Email confirmado com sucesso</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Sua conta foi verificada. Agora você já pode acessar a plataforma.
        </p>
        <div className="pt-2">
          <Button onClick={() => navigate('/auth')} className="w-full gradient-primary shadow-glow">
            <LogIn className="w-4 h-4 mr-2" />
            Pode fazer login na sua conta
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Preferir link? <Link to="/auth" className="text-primary hover:underline">Ir para login</Link>
        </p>
      </Card>
    </main>
  );
};

export default EmailConfirmed;
