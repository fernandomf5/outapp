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
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 text-center space-y-4">
        <div className="mx-auto w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold">Email confirmado com sucesso</h1>
        <p className="text-muted-foreground">
          Sua conta foi verificada. Agora você já pode acessar a plataforma.
        </p>
        <div className="pt-2">
          <Button onClick={() => navigate('/auth')} className="w-full">
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
