import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PaymentThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const status = useMemo(() => {
    const mpStatus = searchParams.get("status") || searchParams.get("collection_status");
    const paymentStatus = searchParams.get("payment");

    if (paymentStatus === "failure" || mpStatus === "rejected" || mpStatus === "cancelled") {
      return "failure" as const;
    }
    if (paymentStatus === "pending" || mpStatus === "pending" || mpStatus === "in_process") {
      return "pending" as const;
    }
    return "success" as const;
  }, [searchParams]);

  const planName = searchParams.get("plan_name");

  useEffect(() => {
    document.title =
      status === "success" ? "Pagamento confirmado | Out App" : "Status do pagamento | Out App";
  }, [status]);

  const goToDashboard = () => navigate("/dashboard?tab=meu-plano", { replace: true });

  const content = {
    success: {
      icon: <CheckCircle2 className="w-16 h-16 text-primary" />,
      title: "Obrigado pela sua assinatura!",
      description: planName
        ? `Seu pagamento do plano ${planName} foi recebido com sucesso. Seu acesso já está sendo liberado.`
        : "Seu pagamento foi recebido com sucesso. Seu acesso já está sendo liberado.",
    },
    pending: {
      icon: <Clock className="w-16 h-16 text-muted-foreground" />,
      title: "Pagamento em processamento",
      description:
        "Recebemos seu pagamento e ele está sendo confirmado. Assim que aprovado, seu plano será ativado automaticamente.",
    },
    failure: {
      icon: <XCircle className="w-16 h-16 text-destructive" />,
      title: "Pagamento não concluído",
      description:
        "Não conseguimos confirmar seu pagamento. Você pode tentar novamente pelo painel, em Meu Plano.",
    },
  }[status];

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 flex flex-col items-center text-center gap-4">
          {content.icon}
          <h1 className="text-2xl font-bold">{content.title}</h1>
          <p className="text-muted-foreground">{content.description}</p>

          <Button size="lg" className="mt-4 w-full" onClick={goToDashboard}>
            Voltar ao painel
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </main>
  );
};

export default PaymentThankYou;
