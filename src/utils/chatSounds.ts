// Utility functions for chat sounds using Web Audio API

class ChatSounds {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private initialized: boolean = false;

  constructor() {
    // Defer AudioContext creation until first use
  }

  private async ensureAudioContext() {
    if (!this.audioContext && typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume AudioContext if suspended (browser autoplay policy)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (e) {
        console.warn('Could not resume AudioContext:', e);
      }
    }
    
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private async playTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.enabled) return;
    
    const ctx = await this.ensureAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Could not play tone:', e);
    }
  }

  // Som de digitação (tecla)
  playTypingSound() {
    this.playTone(800, 0.05, 0.1);
  }

  // Som de enviar mensagem (satisfatório)
  playSendSound() {
    if (!this.enabled) return;
    
    // Primeiro tom (mais grave)
    this.playTone(523.25, 0.1, 0.2); // C5
    
    // Segundo tom (mais agudo) - começa um pouco depois
    setTimeout(() => {
      this.playTone(659.25, 0.15, 0.25); // E5
    }, 50);
    
    // Terceiro tom (ainda mais agudo) - finaliza o som
    setTimeout(() => {
      this.playTone(783.99, 0.2, 0.2); // G5
    }, 100);
  }

  // Som de mensagem recebida
  playReceiveSound() {
    if (!this.enabled) return;

    // Tom duplo descendente
    this.playTone(659.25, 0.1, 0.2); // E5
    setTimeout(() => {
      this.playTone(523.25, 0.15, 0.25); // C5
    }, 80);
  }

  // Som de notificação - mais alto e perceptível
  playNotificationSound() {
    if (!this.enabled) return;

    // Sequência de tons mais audíveis
    this.playTone(880, 0.15, 0.5); // A5
    setTimeout(() => {
      this.playTone(1100, 0.15, 0.5);
    }, 150);
    setTimeout(() => {
      this.playTone(880, 0.2, 0.4);
    }, 300);
  }
}

// Singleton instance
export const chatSounds = new ChatSounds();
