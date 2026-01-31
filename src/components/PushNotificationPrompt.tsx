import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';

export function PushNotificationPrompt() {
  const { user } = useAuth();
  const { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has dismissed this before
    const dismissedKey = `push-prompt-dismissed-${user?.id}`;
    const wasDismissed = localStorage.getItem(dismissedKey);
    
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Show prompt after 5 seconds if not subscribed
    if (isSupported && !isSubscribed && permission !== 'denied' && user) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, isSubscribed, permission, user]);

  const handleDismiss = () => {
    const dismissedKey = `push-prompt-dismissed-${user?.id}`;
    localStorage.setItem(dismissedKey, 'true');
    setDismissed(true);
    setShowPrompt(false);
  };

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      setShowPrompt(false);
    }
  };

  if (!showPrompt || dismissed || isSubscribed || !user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-card border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Ativar Notificações</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2 -mt-2"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-1">
              Receba lembretes de eventos da agenda diretamente no seu dispositivo, mesmo com o navegador fechado!
            </p>
            
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleSubscribe}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Ativando...' : 'Ativar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDismiss}
              >
                Agora não
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PushNotificationToggle() {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="w-4 h-4" />
        <span>Notificações push não suportadas neste navegador</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isSubscribed ? (
          <Bell className="w-4 h-4 text-primary" />
        ) : (
          <BellOff className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-sm">
          Notificações Push
        </span>
      </div>
      
      <Button
        variant={isSubscribed ? "outline" : "default"}
        size="sm"
        onClick={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
      >
        {isLoading ? 'Carregando...' : isSubscribed ? 'Desativar' : 'Ativar'}
      </Button>
    </div>
  );
}
