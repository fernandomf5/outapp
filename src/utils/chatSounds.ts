// Utility functions for chat sounds using Audio element

class ChatSounds {
  private enabled: boolean = true;

  constructor() {}

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Som de notificação usando URL de áudio real
  async playNotificationSound() {
    if (!this.enabled) {
      console.log('🔔 Som desabilitado');
      return;
    }

    try {
      // Usar som de notificação do Notification Sound API (arquivo confiável)
      const audio = new Audio('https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3');
      audio.volume = 0.6;
      await audio.play();
      console.log('🔔 Som de notificação tocado!');
    } catch (error) {
      console.warn('🔔 Erro ao tocar som:', error);
      
      // Fallback: tentar com outro som
      try {
        const fallbackAudio = new Audio('https://cdn.freesound.org/previews/536/536420_4921277-lq.mp3');
        fallbackAudio.volume = 0.6;
        await fallbackAudio.play();
      } catch (e) {
        console.warn('🔔 Fallback também falhou:', e);
      }
    }
  }

  // Métodos legados mantidos para compatibilidade
  playTypingSound() {}
  playSendSound() {}
  playReceiveSound() {}
}

// Singleton instance
export const chatSounds = new ChatSounds();
