import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Cookie } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const CookieNotice = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cookieText, setCookieText] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Don't show cookie notice inside iframes (embedded pages like briefings)
    if (window.self !== window.top) {
      setIsVisible(false);
      return;
    }

    // Check if user already accepted cookies
    const accepted = localStorage.getItem('cookies_accepted');
    if (accepted) {
      setIsVisible(false);
      return;
    }

    // Fetch cookie notice settings
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['cookie_notice_text', 'cookie_notice_enabled']);

      if (data) {
        const textSetting = data.find(s => s.key === 'cookie_notice_text');
        const enabledSetting = data.find(s => s.key === 'cookie_notice_enabled');

        setCookieText(textSetting?.value || "Usamos cookies para melhorar sua experiência em nosso site. Ao continuar navegando, você concorda com nossa Política de Privacidade.");
        setIsEnabled(enabledSetting?.value === 'true');
        
        if (enabledSetting?.value === 'true' && !accepted) {
          setIsVisible(true);
        }
      }
    };

    fetchSettings();
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookies_accepted', 'true');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible || !isEnabled) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 animate-in slide-in-from-bottom duration-500">
      <Card className="relative max-w-4xl mx-auto overflow-hidden border border-primary/30 bg-card/95 backdrop-blur-md shadow-2xl rounded-2xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="pointer-events-none absolute -top-16 -left-10 w-52 h-52 rounded-full bg-primary/15 blur-[70px]" />

        <div className="relative p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 rounded-xl bg-primary/10 border border-primary/30 p-2.5">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-foreground">
                Nós usamos cookies
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {cookieText}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <a href="/poltica-de-privacidade" className="text-primary hover:underline underline-offset-4">
                  Política de Privacidade
                </a>
                <a href="/termos-de-uso" className="text-primary hover:underline underline-offset-4">
                  Termos de Uso
                </a>
                <a href="/lgpd" className="text-primary hover:underline underline-offset-4">
                  LGPD
                </a>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-4">
                <Button onClick={handleAccept} size="sm" className="w-full sm:w-auto font-semibold">
                  Aceitar todos
                </Button>
                <Button onClick={handleReject} variant="outline" size="sm" className="w-full sm:w-auto">
                  Apenas essenciais
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              aria-label="Fechar aviso de cookies"
              className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
