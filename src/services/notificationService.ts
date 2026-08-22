import { Encomenda, Morador, Condominio } from '../types';
import { whatsappService } from './whatsappService';

export interface EmailNotificationLog {
  id: string;
  destinatarioEmail: string;
  destinatarioNome: string;
  assunto: string;
  corpoHtml: string;
  enviadoEm: number;
  status: 'enviado' | 'falha';
  tipo: 'encomenda_chegada' | 'encomenda_prazo_critico' | 'encomenda_encaminhada_admin' | 'geral';
}

/**
 * Toca um som harmônico de notificação agradável (campainha suave / chime)
 * utilizando a Web Audio API nativa sem depender de arquivos externos.
 */
export function playNotificationSound(tipo: 'encomenda' | 'aviso' | 'sucesso' | 'mensagem' | 'sucesso_acao' = 'encomenda') {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    if (tipo === 'encomenda') {
      // Duplo tom harmônico estilo campainha moderna (D5 -> A5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now); // A4
      osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.18); // E5

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.35, now + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc1.connect(gainNode);
      osc2.connect(gainNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);
    } else if (tipo === 'mensagem') {
      // Ping suave de mensagem (E5 -> E6)
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.12);

      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      // Tom suave de confirmação
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.25, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (err) {
    // AudioContext pode ser bloqueado antes da primeira interação do usuário
  }
}

class NotificationService {
  private pushPermission: NotificationPermission = 'default';
  private emailLogs: EmailNotificationLog[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.pushPermission = Notification.permission;
    }
    this.carregarEmailLogs();
  }

  private carregarEmailLogs() {
    try {
      const saved = localStorage.getItem('smartcondo_email_logs');
      if (saved) {
        this.emailLogs = JSON.parse(saved);
      }
    } catch {
      // ignore
    }
  }

  private salvarEmailLogs() {
    try {
      localStorage.setItem('smartcondo_email_logs', JSON.stringify(this.emailLogs.slice(0, 100)));
    } catch {
      // ignore
    }
  }

  // 1. PUSH NOTIFICATIONS (BARRA DO CELULAR, TELA DE BLOQUEIO E FCM)
  public async solicitarPermissaoPush(userId?: string): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Push notifications não são suportadas neste dispositivo/navegador.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.pushPermission = permission;

      if (permission === 'granted') {
        // Tenta registrar o ServiceWorker se disponível
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          } catch (swErr) {
            console.warn('Service Worker register note:', swErr);
          }
        }

        // Tenta registrar o FCM Push Token em background
        try {
          const { requestFCMToken, saveFCMTokenToFirestore } = await import('./firebase');
          const token = await requestFCMToken();
          if (token && userId) {
            await saveFCMTokenToFirestore(userId, token);
          }
        } catch (fcmErr) {
          console.warn('FCM registration background note:', fcmErr);
        }
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Erro ao solicitar permissão de notificação:', err);
      return false;
    }
  }

  public getPushPermissionStatus(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }

  /**
   * Dispara notificação nativa na barra de status do celular e na tela de bloqueio
   */
  public dispararNotificacaoNativa(
    titulo: string,
    opcoes: {
      body: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      requireInteraction?: boolean;
      vibrate?: number[];
      actions?: Array<{ action: string; title: string }>;
    }
  ): boolean {
    // Toca o som do dispositivo
    playNotificationSound('encomenda');

    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      try {
        const notifOptions: any = {
          body: opcoes.body,
          icon: opcoes.icon || '/icon-192.svg',
          badge: opcoes.badge || '/icon-192.svg',
          tag: opcoes.tag || `smartcondo-notif-${Date.now()}`,
          vibrate: opcoes.vibrate || [300, 100, 300, 100, 300],
          requireInteraction: opcoes.requireInteraction ?? true,
          data: opcoes.data || { url: '/' },
          ...opcoes,
        };

        // 1. Tenta disparar via Service Worker (ideal para segundo plano e tela bloqueada)
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((registration) => {
              if (registration && registration.showNotification) {
                registration.showNotification(titulo, notifOptions);
              }
            })
            .catch(() => {
              // Fallback para new Notification direto
              try {
                const notif = new Notification(titulo, notifOptions);
                notif.onclick = () => {
                  window.focus();
                  notif.close();
                };
              } catch (e) {
                // ignore
              }
            });

          // Envia também mensagem para o ServiceWorker ativo
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SHOW_NOTIFICATION',
              title: titulo,
              options: notifOptions,
            });
          }

          return true;
        }

        // 2. Fallback direto se não houver serviceWorker
        const notif = new Notification(titulo, notifOptions);
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        return true;
      } catch (err) {
        console.warn('Erro ao criar Notification nativa:', err);
      }
    }
    return false;
  }

  /**
   * Agenda um disparo com contagem regressiva para permitir que o usuário
   * bloqueie a tela do celular e veja a notificação chegar na barra e na tela de bloqueio.
   */
  public agendarNotificacaoParaTelaBloqueada(
    segundos: number = 5,
    dados: {
      titulo?: string;
      transportadora?: string;
      codigoResgate?: string;
      unidade?: string;
    } = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const titulo = dados.titulo || '📦 Encomenda Chegou na Portaria!';
      const transportadora = dados.transportadora || 'Mercado Livre';
      const codigoResgate = dados.codigoResgate || '482910';
      const unidade = dados.unidade ? ` (${dados.unidade})` : '';

      setTimeout(() => {
        this.dispararNotificacaoNativa(titulo, {
          body: `Seu pacote da ${transportadora}${unidade} está pronto para retirada. Código PIN: ${codigoResgate}.`,
          tag: `encomenda-teste-${Date.now()}`,
          requireInteraction: true,
          vibrate: [400, 150, 400, 150, 400],
          data: { url: '/', tab: 'encomendas', codigoResgate },
        });
        resolve();
      }, segundos * 1000);
    });
  }

  // 2. DISPARO INTEGRADO PARA CHEGADA DE ENCOMENDA
  public notificarChegadaEncomenda(dados: {
    condominio: Condominio;
    morador: Morador;
    encomenda: Encomenda;
    diasLimite: number;
  }) {
    const { condominio, morador, encomenda, diasLimite } = dados;
    const prazoTexto = diasLimite > 0 ? `${diasLimite} dias corridos` : '5 dias';

    // A. Notificação Nativa na Barra de Notificação do Celular & Tela de Bloqueio
    this.dispararNotificacaoNativa(`📦 Encomenda Chegou! — ${condominio.nome}`, {
      body: `Olá ${morador.nome}! Seu pacote da ${encomenda.transportadora} chegou na portaria. Código de Resgate: ${encomenda.codigoResgate}. Retire em até ${prazoTexto}.`,
      tag: `encomenda-${encomenda.id}`,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      data: {
        url: '/',
        tab: 'encomendas',
        encomendaId: encomenda.id,
        codigoResgate: encomenda.codigoResgate,
      },
    });

    // B. Emite evento CustomEvent para a tela do celular (In-App Alert Pop-up)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('smartcondo:nova_encomenda', {
          detail: {
            encomenda,
            morador,
            condominio,
          },
        })
      );
    }

    // C. Notificação Automática por WhatsApp
    whatsappService
      .notificarChegadaEncomendaAutomatica({
        condominio,
        morador,
        encomenda,
        diasLimite,
      })
      .catch((err) => console.warn('Erro no envio automático de WhatsApp:', err));

    // D. Notificação por E-mail
    const emailLog: EmailNotificationLog = {
      id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      destinatarioEmail: morador.email,
      destinatarioNome: morador.nome,
      assunto: `[${condominio.nome}] 📦 Sua encomenda da ${encomenda.transportadora} chegou na portaria (Código: ${encomenda.codigoResgate})`,
      corpoHtml: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #059669; padding-bottom: 8px;">📦 Chegou Encomenda para Você!</h2>
          <p>Olá, <strong>${morador.nome}</strong> (Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}),</p>
          <p>Informamos que um pacote foi recebido na portaria do condomínio <strong>${condominio.nome}</strong>.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 4px 0;"><strong>Transportadora:</strong> ${encomenda.transportadora}</p>
            <p style="margin: 4px 0;"><strong>Código de Rastreio:</strong> ${encomenda.codigoRastreio || 'N/A'}</p>
            <p style="margin: 4px 0;"><strong>Recebido por:</strong> ${encomenda.recebidoPor}</p>
            <div style="margin-top: 12px; padding: 10px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; text-align: center;">
              <span style="font-size: 12px; color: #047857; text-transform: uppercase; font-weight: bold; display: block;">Seu Código de Resgate</span>
              <strong style="font-size: 24px; letter-spacing: 4px; color: #065f46;">${encomenda.codigoResgate}</strong>
            </div>
          </div>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #92400e;">
              <strong>Regra de Retirada do Condomínio:</strong> Conforme o regulamento interno, você tem até <strong>${prazoTexto}</strong> para retirar esta encomenda na portaria.
            </p>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center;">
            Este é um comunicado automático gerado pelo sistema SmartCondo do condomínio ${condominio.nome}.
          </p>
        </div>
      `,
      enviadoEm: Date.now(),
      status: 'enviado',
      tipo: 'encomenda_chegada',
    };

    this.emailLogs.unshift(emailLog);
    this.salvarEmailLogs();
  }

  // 3. DISPARO QUANDO A ENCOMENDA É ENCAMINHADA À ADMINISTRAÇÃO POR ESTOURO DO PRAZO
  public notificarEncaminhamentoAdministracao(dados: {
    condominio: Condominio;
    morador: Morador;
    encomenda: Encomenda;
    diasLimite: number;
  }) {
    const { condominio, morador, encomenda, diasLimite } = dados;

    this.dispararNotificacaoNativa(`⚠️ Encomenda Transferida para Administração`, {
      body: `O prazo de ${diasLimite} dias para retirada da sua encomenda expirou. O pacote está agora na Administração do condomínio.`,
      tag: `encomenda-admin-${encomenda.id}`,
    });

    const msgWhatsApp = `⚠️ *AVISO: ENCOMENDA TRANSFERIDA PARA A ADMINISTRAÇÃO*\n\nOlá, *${morador.nome}*!\nO prazo de *${diasLimite} dias* para retirada da encomenda da *${encomenda.transportadora}* na portaria expirou.\n\n🏛️ *Local Atual:* Administração do Condomínio\n🔐 *Código de Resgate:* \`${encomenda.codigoResgate}\`\n\nPor favor, dirija-se à administração em horário comercial para retirar seu volume.`;

    whatsappService.notificarMorador({
      condominioId: condominio.id,
      condominioNome: condominio.nome,
      morador,
      tipo: 'comunicado_massa',
      titulo: '⚠️ Encomenda Encaminhada para a Administração',
      corpoMensagem: msgWhatsApp,
    });
  }

  // 4. MÉTODOS DE APOIO PARA ENVIO MANUAL E AUTOMÁTICO
  public gerarMensagemWhatsApp(morador: Morador, encomenda: Encomenda, condominio: Condominio): string {
    const prazoTexto = encomenda.diasLimiteRetirada ? `${encomenda.diasLimiteRetirada} dias corridos` : '5 dias';
    return `📦 *NOVA ENCOMENDA NA PORTARIA*\n\nOlá, *${morador.nome}*!\nChegou uma encomenda para a sua unidade (*Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}*).\n\n🚚 *Transportadora:* ${encomenda.transportadora}\n🏷️ *Rastreio:* ${encomenda.codigoRastreio || 'Volume Registrado'}\n🔐 *CÓDIGO DE RESGATE:* *${encomenda.codigoResgate}*\n⏱️ *Prazo de Retirada:* Retire em até ${prazoTexto} na portaria do ${condominio.nome}.\n\n_Apresente este código de 6 dígitos ao porteiro para retirar seu pacote._`;
  }

  public gerarLinkWhatsApp(morador: Morador, encomenda: Encomenda, condominio: Condominio): string {
    const texto = this.gerarMensagemWhatsApp(morador, encomenda, condominio);
    const cleanPhone = (morador.telefone || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(texto)}`;
  }

  public gerarTextoInstagramDirect(morador: Morador, encomenda: Encomenda, condominio: Condominio): string {
    return `📦 Olá ${morador.nome} (Apto ${morador.unidade.apto})! Chegou uma encomenda da ${encomenda.transportadora} para você na portaria do ${condominio.nome}. Código de Resgate: ${encomenda.codigoResgate}. Por favor, retire na portaria.`;
  }

  public getEmailLogs(): EmailNotificationLog[] {
    return [...this.emailLogs];
  }
}

export const notificationService = new NotificationService();
