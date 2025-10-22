import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const FAQSection = ({ hideSupportCTA = false }: { hideSupportCTA?: boolean }) => {
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);

  useEffect(() => {
    const fetchFAQs = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'faqs')
        .maybeSingle();

      if (data?.value) {
        try {
          setFaqs(JSON.parse(data.value));
        } catch (e) {
          console.error('Error parsing FAQs:', e);
        }
      }
    };

    fetchFAQs();
  }, []);

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

        { !hideSupportCTA && (
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
        )}

      </div>
    </section>
  );
};
