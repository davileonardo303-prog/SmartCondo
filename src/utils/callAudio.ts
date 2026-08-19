// Sintetizador de Áudio em Tempo Real para Chamadas de Voz & Vídeo (Estilo WhatsApp / Instagram)
// Utiliza a Web Audio API nativa para reprodução sem latência e sem dependência de MP3 externos

class CallAudioService {
  private ctx: AudioContext | null = null;
  private ringInterval: any = null;
  private dialInterval: any = null;
  private isUnlocked = false;

  constructor() {
    this.initUnlockListeners();
  }

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private initUnlockListeners() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      if (this.isUnlocked) return;
      try {
        const ctx = this.getAudioContext();
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => {
            this.isUnlocked = true;
          });
        } else {
          this.isUnlocked = true;
        }
      } catch {
        // Ignora
      }
    };

    window.addEventListener('click', unlock, { once: false, passive: true });
    window.addEventListener('touchstart', unlock, { once: false, passive: true });
    window.addEventListener('keydown', unlock, { once: false, passive: true });
  }

  /**
   * Toca o Ringtone de Chamada Recebida em Loop (Estilo WhatsApp / Instagram / iPhone)
   * Vibra o celular se disponível
   */
  public startIncomingRingtone() {
    this.stopAll();

    // Vibração no celular
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800]);
      } catch {
        // Ignora
      }
    }

    const playChimePattern = () => {
      try {
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;

        // Notas musicais estilo Marimba / Bell (Dó, Mi, Sol, Lá, Dó alto, Mi alto)
        const notes = [
          { freq: 523.25, time: 0.0, dur: 0.18 }, // C5
          { freq: 659.25, time: 0.12, dur: 0.18 }, // E5
          { freq: 783.99, time: 0.24, dur: 0.22 }, // G5
          { freq: 880.0, time: 0.36, dur: 0.24 }, // A5
          { freq: 1046.5, time: 0.52, dur: 0.35 }, // C6
          { freq: 1318.51, time: 0.72, dur: 0.45 }, // E6
        ];

        notes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + time);

          // Envelope suave com release percussivo
          gain.gain.setValueAtTime(0.001, now + time);
          gain.gain.linearRampToValueAtTime(0.28, now + time + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + dur + 0.05);
        });

        // Padrão de harmônico complementar
        const subNotes = [
          { freq: 261.63, time: 0.0, dur: 0.25 }, // C4
          { freq: 392.0, time: 0.24, dur: 0.3 }, // G4
          { freq: 523.25, time: 0.52, dur: 0.4 }, // C5
        ];

        subNotes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + time);

          gain.gain.setValueAtTime(0.001, now + time);
          gain.gain.linearRampToValueAtTime(0.15, now + time + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + dur + 0.05);
        });
      } catch (err) {
        console.warn('Erro no sintetizador de ringtone:', err);
      }
    };

    // Toca imediatamente e repete a cada 2.4 segundos
    playChimePattern();
    this.ringInterval = setInterval(() => {
      playChimePattern();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([400, 200, 400, 200, 800]);
        } catch {
          // Ignora
        }
      }
    }, 2400);
  }

  /**
   * Toca o Tom de Chamada Discando (Outgoing Ringback: Tuuuut... Tuuuut...)
   */
  public startOutgoingDialTone() {
    this.stopAll();

    const playDialBeep = () => {
      try {
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;

        // Frequências clássicas de chamada telefônica (440Hz + 480Hz)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + 1.2);
        gain.gain.linearRampToValueAtTime(0.001, now + 1.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.35);
        osc2.stop(now + 1.35);
      } catch (err) {
        console.warn('Erro ao tocar dial tone:', err);
      }
    };

    playDialBeep();
    this.dialInterval = setInterval(playDialBeep, 3000);
  }

  /**
   * Som de Chamada Atendida (Conexão estabelecida com sucesso)
   */
  public playCallConnected() {
    this.stopAll();
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Dois beeps ascendentes alegres
      [
        { freq: 587.33, time: 0.0, dur: 0.12 }, // D5
        { freq: 880.0, time: 0.12, dur: 0.22 }, // A5
      ].forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.linearRampToValueAtTime(0.2, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } catch {
      // Ignora
    }
  }

  /**
   * Som de Chamada Encerrada / Recusada / Ocupado
   */
  public playCallEnded() {
    this.stopAll();
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Três beeps descendentes ou tom de desligamento
      [
        { freq: 480, time: 0.0, dur: 0.15 },
        { freq: 380, time: 0.16, dur: 0.15 },
        { freq: 280, time: 0.32, dur: 0.25 },
      ].forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.linearRampToValueAtTime(0.18, now + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur + 0.05);
      });
    } catch {
      // Ignora
    }
  }

  /**
   * Para todos os ringtones e sons ativos
   */
  public stopAll() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    if (this.dialInterval) {
      clearInterval(this.dialInterval);
      this.dialInterval = null;
    }
  }
}

export const callAudioService = new CallAudioService();
