// Utilitário de Efeitos Sonoros e Notificações em Segundo Plano (Interfone PTT, Portaria & Moradores)

class AudioAlertService {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    this.initUserInteractionUnlock();
  }

  // Desbloqueia automaticamente o AudioContext na primeira interação do usuário na página
  public initUserInteractionUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      if (!this.isUnlocked) {
        const ctx = this.getContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().then(() => {
            this.isUnlocked = true;
          }).catch(() => {});
        } else if (ctx) {
          this.isUnlocked = true;
        }
      }
    };

    window.addEventListener('click', unlock, { once: false, passive: true });
    window.addEventListener('touchstart', unlock, { once: false, passive: true });
    window.addEventListener('keydown', unlock, { once: false, passive: true });
  }

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.ctx && AudioCtx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
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
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
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
      gain1.gain.setValueAtTime(0.3, now);
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
      gain2.gain.setValueAtTime(0.35, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.2);
    } catch (err) {
      console.warn('Error playing roger beep:', err);
    }
  }

  // 3. Chamada de Interfonia (Campainha de Interfone Din-Don Eletrônico Rítmico Alto)
  public playIntercomRingtone() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const playTone = (freq: number, startOffset: number, duration: number, vol = 0.4) => {
        const now = ctx.currentTime + startOffset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);
      };

      // Toque harmônico duplo de interfone moderno
      playTone(880, 0, 0.28, 0.45);     // La5
      playTone(1174.66, 0.22, 0.35, 0.5); // Re6
      playTone(880, 0.55, 0.28, 0.45);
      playTone(1174.66, 0.77, 0.45, 0.5);
    } catch (err) {
      console.warn('Error playing intercom ringtone:', err);
    }
  }

  // 4. Alerta Alto de Liberação de Visitante na Portaria (Ding-Dong Triplo + Harmonic Chime)
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

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + len);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + len);
      };

      // Sequência harmônica C5-E5-G5-C6
      playChime(523.25, 0, 0.3);
      playChime(659.25, 0.18, 0.3);
      playChime(783.99, 0.36, 0.4);
      playChime(1046.5, 0.54, 0.6);
    } catch (err) {
      console.warn('Error playing visitor alert sound:', err);
    }
  }

  // 5. Notificação Nativa do Navegador (Segundo Plano)
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
