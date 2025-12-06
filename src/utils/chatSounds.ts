// Utility functions for chat sounds using Audio element (more reliable than Web Audio API)

class ChatSounds {
  private enabled: boolean = true;
  private notificationAudio: HTMLAudioElement | null = null;

  constructor() {
    // Criar elemento de áudio com som de notificação em base64
    if (typeof window !== 'undefined') {
      this.initAudio();
    }
  }

  private initAudio() {
    // Som de notificação em base64 (beep duplo)
    const notificationBase64 = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleOp9H6OUJC0C5hQsDwxXEY0KJyXmB9qPAAEHN+gLqjQ8BAEy8wQQ9wMO1QIJ8gMfJP8E6vv7APsIAQUAAO//8f/3//X/9f/1//X/9f/1//X/9f/1//X/+P/+/wMA9f/r/+3/9f/+/wQAAgD9//j/9v/2//f/+P/5//n/+f/6//v/+//8//z//P/8//z//P/8//3//f/9//3//v/+//7//v/+//7//v/+//7//////wAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleOp9H6OUJC0C5hQsDwxXEY0KJyXmB9qPAAEHN+gLqjQ8BAEy8wQQ9wMO1QIJ8gMfJP8E6vv7APsIAQUAAO//8f/3//X/9f/1//X/9f/1//X/9f/1//X/+P/+/wMA9f/r/+3/9f/+/wQAAgD9//j/9v/2//f/+P/5//n/+f/6//v/+//8//z//P/8//z//P/8//3//f/9//3//v/+//7//v/+//7//v/+//7//////wAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
    
    this.notificationAudio = new Audio(notificationBase64);
    this.notificationAudio.volume = 0.7;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Som de notificação - mais confiável com Audio element
  async playNotificationSound() {
    if (!this.enabled || !this.notificationAudio) {
      console.log('🔔 Som desabilitado ou não inicializado');
      return;
    }

    try {
      // Resetar para o início
      this.notificationAudio.currentTime = 0;
      await this.notificationAudio.play();
      console.log('🔔 Som de notificação tocado com sucesso!');
    } catch (error) {
      console.warn('🔔 Erro ao tocar som (pode precisar de interação do usuário):', error);
      
      // Tentar novamente após pequeno delay
      setTimeout(async () => {
        try {
          if (this.notificationAudio) {
            this.notificationAudio.currentTime = 0;
            await this.notificationAudio.play();
          }
        } catch (e) {
          console.warn('🔔 Segunda tentativa falhou:', e);
        }
      }, 100);
    }
  }

  // Métodos legados mantidos para compatibilidade
  playTypingSound() {}
  playSendSound() {}
  playReceiveSound() {}
}

// Singleton instance
export const chatSounds = new ChatSounds();
