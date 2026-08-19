// src/utils/nextelAudio.ts
// Sintetizador dos Sons Clássicos do Nextel (Chirp & Roger Beep) via Web Audio API

class NextelSoundEffects {
  private ctx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    this.initUnlockListeners();
  }

  private initUnlockListeners() {
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

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Bipe característico e autêntico do Nextel ao iniciar a transmissão (Chirp clássico)
  public playChirp() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Sequência rápida de frequências clássicas do alerta Nextel
      osc.frequency.setValueAtTime(1800, now);
      osc.frequency.setValueAtTime(2400, now + 0.04);
      osc.frequency.setValueAtTime(1200, now + 0.08);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.error('Erro ao tocar som Chirp:', e);
    }
  }

  // Bipe de encerramento ao soltar o botão (Roger Beep autêntico)
  public playRogerBeep() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {
      console.error('Erro ao tocar Roger Beep:', e);
    }
  }

  // Toque de alerta de chamada recebida (Ring / PTT alert)
  public playIncomingAlert() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Primeiro chirp
      this.playChirp();

      // Segundo chirp curto após 120ms
      setTimeout(() => {
        try {
          const c = this.getContext();
          const t = c.currentTime;
          const osc = c.createOscillator();
          const gain = c.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(2200, t);
          osc.frequency.setValueAtTime(1600, t + 0.04);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
          osc.connect(gain);
          gain.connect(c.destination);
          osc.start(t);
          osc.stop(t + 0.11);
        } catch (_) {}
      }, 120);
    } catch (e) {
      console.error('Erro ao tocar som Incoming Alert:', e);
    }
  }
}

export const nextelAudio = new NextelSoundEffects();
