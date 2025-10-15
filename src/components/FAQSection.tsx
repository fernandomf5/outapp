import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export const FAQSection = () => {
  const faqs = [
    {
      question: "Como criar minha conta?",
      answer: "É muito simples! Clique em 'Começar Grátis', preencha seus dados (nome, e-mail e senha) e pronto! Você receberá um e-mail de confirmação. Após confirmar, já pode começar a usar a plataforma com 3 dias de teste grátis, sem precisar de cartão de crédito."
    },
    {
      question: "Posso testar o sistema gratuitamente?",
      answer: "Sim! Oferecemos 3 dias de teste grátis com acesso completo a todas as funcionalidades da plataforma. Não é necessário cadastrar cartão de crédito. Após o período de teste, você pode escolher o plano que melhor se adequa às suas necessidades."
    },
    {
      question: "Como funciona a criação de chatbot?",
      answer: "Temos um construtor visual drag-and-drop estilo Manychat. Você arrasta blocos (mensagens, perguntas, botões, condições) para o canvas e conecta eles criando fluxos de conversação. É totalmente visual, sem precisar programar nada! Você também pode criar agentes IA personalizados com seus próprios dados."
    },
    {
      question: "Como ativar a IA nos meus chatbots?",
      answer: "Vá até a seção 'Agentes IA' no dashboard, clique em 'Criar Novo Agente', escolha o nicho do seu negócio e treine o agente com suas informações. Depois é só conectar o agente ao seu chatbot ou WhatsApp. A IA responderá automaticamente com base no treinamento que você forneceu."
    },
    {
      question: "É possível personalizar o link do meu bot?",
      answer: "Sim! Cada chatbot que você cria recebe um link único e personalizado. Você pode compartilhar esse link em redes sociais, site, e-mail ou onde quiser. Os usuários clicam no link e começam a conversar imediatamente com seu bot."
    },
    {
      question: "O sistema tem suporte?",
      answer: "Com certeza! Temos um sistema de tickets integrado onde você pode abrir chamados por prioridade (baixa, média, alta). Nossa equipe responde rapidamente e acompanha seu caso até a resolução. Além disso, temos uma biblioteca completa de vídeos tutoriais para ajudar você."
    },
    {
      question: "Como atualizar meu plano?",
      answer: "No dashboard, vá em 'Meu Plano' e você verá todos os planos disponíveis. Clique em 'Fazer Upgrade' no plano desejado e siga as instruções de pagamento. Você pode usar vouchers ou cupons de desconto se tiver algum. A mudança é instantânea após a confirmação do pagamento."
    },
    {
      question: "Como funciona o CRM e o sistema de afiliados?",
      answer: "O CRM permite gerenciar todos os seus contatos, leads e clientes em um só lugar. Você pode adicionar tags, status, notas e acompanhar todas as interações. O sistema de afiliados permite criar programas de indicação, rastrear cliques, conversões e gerenciar comissões automaticamente. Você pode até clonar páginas com links de afiliados personalizados."
    },
    {
      question: "Posso integrar com outras ferramentas?",
      answer: "Sim! A plataforma suporta integrações com pixels de conversão (Meta Pixel, Google Analytics), gateways de pagamento (Stripe, PagSeguro), WhatsApp, e você pode criar páginas customizadas. Também oferecemos gerador de links do WhatsApp com mensagens pré-definidas para facilitar o contato."
    },
    {
      question: "Como funciona o construtor visual de automações?",
      answer: "É um editor visual completo onde você cria fluxos de automação arrastando e conectando blocos. Você pode adicionar mensagens automáticas, fazer perguntas, criar botões de resposta rápida, adicionar condições (se/então), executar ações e muito mais. Tudo de forma visual e intuitiva, sem precisar escrever código."
    },
  ];

  return (
    <section id="faq" className="py-10 sm:py-16 md:py-20 px-6 sm:px-8 bg-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            Tire suas dúvidas sobre a plataforma e comece a automatizar seu negócio
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border border-border rounded-lg px-6 py-2 hover:shadow-md transition-all"
            >
              <AccordionTrigger className="text-left hover:no-underline">
                <span className="font-semibold text-sm sm:text-base md:text-lg pr-4">
                  {faq.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed pt-2">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-10 sm:mt-12 text-center bg-muted/50 p-6 sm:p-8 rounded-xl">
          <h3 className="font-bold text-lg sm:text-xl mb-2">
            Ainda tem dúvidas?
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-4">
            Nossa equipe de suporte está pronta para ajudar você
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Entre em contato através do sistema de tickets dentro da plataforma
          </p>
        </div>
      </div>
    </section>
  );
};
