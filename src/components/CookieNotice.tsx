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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom">
      <Card className="max-w-4xl mx-auto p-6 bg-card border-2 shadow-2xl">
        <div className="flex items-start gap-4">
          <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div className="flex-1">
            <p className="text-sm text-foreground leading-relaxed">
              {cookieText}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Button onClick={handleAccept} size="sm">
                Aceitar Cookies
              </Button>
              <Button onClick={handleDismiss} variant="ghost" size="sm">
                Não aceitar
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};
