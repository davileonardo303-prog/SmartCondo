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

  // 1. PUSH NOTIFICATIONS (BARRA DE NOTIFICAÇÃO DO CELULAR / COMPUTADOR E FCM)
  public async solicitarPermissaoPush(userId?: string): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('Push notifications não são suportadas neste navegador.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.pushPermission = permission;

      if (permission === 'granted') {
        // Tenta registrar o FCM Push Token em background
        try {
          const { requestFCMToken, saveFCMTokenToFirestore } = await import('./firebase');
          const token = await requestFCMToken();
          if (token && userId) {
            await saveFCMTokenToFirestore(userId, token);
          }
        } catch (fcmErr) {
          console.warn('FCM registration in background info:', fcmErr);
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

  public dispararNotificacaoNativa(
    titulo: string,
    opcoes: {
      body: string;
      icon?: string;
      tag?: string;
      data?: any;
    }
  ): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      try {
        // Se ServiceWorker estiver ativo, prefere o showNotification do ServiceWorker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(titulo, {
              body: opcoes.body,
              icon: opcoes.icon || '/icon-192.svg',
              badge: '/icon-192.svg',
              tag: opcoes.tag || `condo-notif-${Date.now()}`,
              vibrate: [200, 100, 200],
              ...opcoes,
            } as any);
          });
          return true;
        }

        const notif = new Notification(titulo, {
          body: opcoes.body,
          icon: opcoes.icon || '/icon-192.svg',
          badge: '/icon-192.svg',
          tag: opcoes.tag || `condo-notif-${Date.now()}`,
          vibrate: [200, 100, 200],
          ...opcoes,
        } as any);

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


  // 2. DISPARO INTEGRADO PARA CHEGADA DE ENCOMENDA
  public notificarChegadaEncomenda(dados: {
    condominio: Condominio;
    morador: Morador;
    encomenda: Encomenda;
    diasLimite: number;
  }) {
    const { condominio, morador, encomenda, diasLimite } = dados;
    const prazoTexto = diasLimite > 0 ? `${diasLimite} dias corridos` : '5 dias';

    // A. Notificação Nativa no Celular / Computador (Push na barra de status)
    this.dispararNotificacaoNativa(`📦 Encomenda Chegou! - ${condominio.nome}`, {
      body: `Olá ${morador.nome}! Seu pacote da ${encomenda.transportadora} chegou na portaria. Código de Resgate: ${encomenda.codigoResgate}. Retire em até ${prazoTexto}.`,
      tag: `encomenda-${encomenda.id}`,
    });

    // B. Notificação 100% Automática por WhatsApp (Gateway Background sem redirecionar)
    whatsappService.notificarChegadaEncomendaAutomatica({
      condominio,
      morador,
      encomenda,
      diasLimite,
    }).catch((err) => console.warn('Erro no envio automático de WhatsApp:', err));

    // C. Notificação por E-mail
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
              <strong>Regra de Retirada do Condomínio:</strong> Conforme o regulamento interno, você tem até <strong>${prazoTexto}</strong> para retirar esta encomenda na portaria. Após este prazo, o pacote é transferido para a Administração Geral.
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
