// Utility functions for chat sounds using Audio element

class ChatSounds {
  private enabled: boolean = true;
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    // Pre-load sounds for better performance
    this.preloadSounds();
  }

  private async preloadSounds() {
    const sounds = [
      { key: 'notification', urls: this.getNotificationUrls() },
      { key: 'typing', urls: this.getTypingUrls() },
      { key: 'send', urls: this.getSendUrls() },
      { key: 'receive', urls: this.getReceiveUrls() },
    ];

    for (const sound of sounds) {
      for (const url of sound.urls) {
        try {
          const audio = new Audio(url);
          audio.preload = 'auto';
          await new Promise((resolve, reject) => {
            audio.oncanplaythrough = resolve;
            audio.onerror = reject;
            setTimeout(reject, 3000); // timeout
          });
          this.audioCache.set(sound.key, audio);
          break; // Use first working URL
        } catch {
          continue; // Try next URL
        }
      }
    }
  }

  private getNotificationUrls(): string[] {
    return [
      'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Bell notification
      'https://assets.mixkit.co/active_storage/sfx/1531/1531-preview.mp3', // Message pop
      'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3', // Notification
    ];
  }

  private getTypingUrls(): string[] {
    return [
      'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Keyboard click
      'https://cdn.pixabay.com/download/audio/2022/03/15/audio_942694d7de.mp3', // Click
    ];
  }

  private getSendUrls(): string[] {
    return [
      'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Pop send
      'https://assets.mixkit.co/active_storage/sfx/1531/1531-preview.mp3', // Message pop
    ];
  }

  private getReceiveUrls(): string[] {
    return [
      'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3', // Receive pop
      'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // Bell
    ];
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private async playFromUrls(urls: string[], volume: number, cacheKey: string): Promise<void> {
    if (!this.enabled) return;

    // Try cached audio first
    const cached = this.audioCache.get(cacheKey);
    if (cached) {
      try {
        cached.currentTime = 0;
        cached.volume = volume;
        await cached.play();
        return;
      } catch {
        this.audioCache.delete(cacheKey);
      }
    }

    // Try each URL
    for (const url of urls) {
      try {
        const audio = new Audio(url);
        audio.volume = volume;
        await audio.play();
        this.audioCache.set(cacheKey, audio);
        return;
      } catch {
        continue;
      }
    }
    
    console.warn('🔔 Nenhum som disponível');
  }

  async playNotificationSound() {
    await this.playFromUrls(this.getNotificationUrls(), 0.6, 'notification');
  }

  async playTypingSound() {
    await this.playFromUrls(this.getTypingUrls(), 0.15, 'typing');
  }

  async playSendSound() {
    await this.playFromUrls(this.getSendUrls(), 0.4, 'send');
  }

  async playReceiveSound() {
    await this.playFromUrls(this.getReceiveUrls(), 0.5, 'receive');
  }
}

// Singleton instance
export const chatSounds = new ChatSounds();
