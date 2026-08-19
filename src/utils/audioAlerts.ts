// Utilitário de Efeitos Sonoros e Notificações em Segundo Plano (Interfone PTT & Portaria)

class AudioAlertService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.ctx && AudioCtx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch (e) {
      console.warn('AudioContext not available:', e);
      return null;
    }
  }

  // 1. Som de Início de Transmissão (PTT Chirp / Walkie-Talkie start beep)
  public playChirpStart() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch (err) {
      console.warn('Error playing chirp start:', err);
    }
  }

  // 2. Som de Fim de Transmissão (Roger Beep / Walkie-Talkie Over beep)
  public playRogerBeep() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Beep 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1200, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.07);

      // Beep 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1800, now + 0.08);
      gain2.gain.setValueAtTime(0.3, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.2);
    } catch (err) {
      console.warn('Error playing roger beep:', err);
    }
  }

  // 3. Chamada de Interfonia (Campainha de Interfone Din-Don Eletrônico Rítmico)
  public playIntercomRingtone() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const playTone = (freq: number, startOffset: number, duration: number) => {
        const now = ctx.currentTime + startOffset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      };

      // Toque 1: Triplo tom de interfone digital
      playTone(880, 0, 0.25);
      playTone(1174, 0.2, 0.3);
      playTone(880, 0.5, 0.25);
      playTone(1174, 0.7, 0.35);
    } catch (err) {
      console.warn('Error playing intercom ringtone:', err);
    }
  }

  // 4. Alerta Alto de Liberação de Visitante na Portaria (Ding-Dong Triplo + Siren Chime)
  public playVisitorAlertSound() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const playChime = (freq: number, startTime: number, len: number) => {
        const now = ctx.currentTime + startTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + len);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + len);
      };

      // Sequência harmônica atraente e bem audível
      playChime(523.25, 0, 0.3);    // C5
      playChime(659.25, 0.18, 0.3); // E5
      playChime(783.99, 0.36, 0.4); // G5
      playChime(1046.5, 0.54, 0.6); // C6
    } catch (err) {
      console.warn('Error playing visitor alert sound:', err);
    }
  }

  // 5. Notificação Nativa do Navegador (Funciona mesmo com o app minimizado / em segundo plano)
  public async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      if (Notification.permission === 'granted') return true;
      if (Notification.permission !== 'denied') {
        const res = await Notification.requestPermission();
        return res === 'granted';
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
    return false;
  }

  public sendNotification(title: string, options?: NotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      }
    } catch (e) {
      console.warn('Could not trigger notification:', e);
    }
  }
}

export const audioAlertService = new AudioAlertService();
