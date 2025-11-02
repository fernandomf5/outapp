// Utility functions for chat sounds using Web Audio API

class ChatSounds {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.audioContext || !this.enabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Som de digitação (tecla)
  playTypingSound() {
    this.playTone(800, 0.05, 0.1);
  }

  // Som de enviar mensagem (satisfatório)
  playSendSound() {
    if (!this.audioContext || !this.enabled) return;

    const now = this.audioContext.currentTime;
    
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
    if (!this.audioContext || !this.enabled) return;

    // Tom duplo descendente
    this.playTone(659.25, 0.1, 0.2); // E5
    setTimeout(() => {
      this.playTone(523.25, 0.15, 0.25); // C5
    }, 80);
  }

  // Som de notificação
  playNotificationSound() {
    if (!this.audioContext || !this.enabled) return;

    // Sequência de tons para notificação
    this.playTone(800, 0.1, 0.3);
    setTimeout(() => {
      this.playTone(1000, 0.1, 0.3);
    }, 100);
  }
}

// Singleton instance
export const chatSounds = new ChatSounds();
