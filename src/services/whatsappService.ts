import { WhatsAppMessageLog, WhatsAppBroadcast, Morador, Condominio, Encomenda, NoticeCategory } from '../types';

export interface AutomatedDispatchResult {
  success: boolean;
  messageId: string;
  telefone: string;
  moradorNome: string;
  unidade: string;
  codigoResgate?: string;
  tipo: string;
  timestamp: number;
  entregueSemRedirecionamento: boolean;
  mensagem: string;
}

export class WhatsAppService {
  private logs: WhatsAppMessageLog[] = [];
  private broadcasts: WhatsAppBroadcast[] = [];
  private listeners: (() => void)[] = [];
  private autoGatewayEnabled: boolean = true;

  constructor() {
    this.carregarDoLocalStorage();
  }

  private carregarDoLocalStorage() {
    try {
      const savedLogs = localStorage.getItem('smartcondo_whatsapp_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
      const savedBroadcasts = localStorage.getItem('smartcondo_whatsapp_broadcasts');
      if (savedBroadcasts) {
        this.broadcasts = JSON.parse(savedBroadcasts);
      }
    } catch {
      // ignore
    }
  }

  private salvar() {
    try {
      localStorage.setItem('smartcondo_whatsapp_logs', JSON.stringify(this.logs.slice(0, 300)));
      localStorage.setItem('smartcondo_whatsapp_broadcasts', JSON.stringify(this.broadcasts.slice(0, 100)));
    } catch {
      // ignore
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public formatarTelefone(telefone: string): string {
    const limpo = (telefone || '').replace(/\D/g, '');
    if (!limpo) return '5511999999999';
    if (limpo.startsWith('55') && (limpo.length === 12 || limpo.length === 13)) {
      return limpo;
    }
    if (limpo.length === 10 || limpo.length === 11) {
      return `55${limpo}`;
    }
    return limpo;
  }

  public gerarLinkWhatsApp(telefone: string, mensagem: string): string {
    const num = this.formatarTelefone(telefone);
    const textoCodificado = encodeURIComponent(mensagem);
    return `https://wa.me/${num}?text=${textoCodificado}`;
  }

  public getLogs(condoId?: string): WhatsAppMessageLog[] {
    if (condoId) {
      return this.logs.filter((l) => l.condominioId === condoId);
    }
    return [...this.logs];
  }

  public getBroadcasts(condoId?: string): WhatsAppBroadcast[] {
    if (condoId) {
      return this.broadcasts.filter((b) => b.condominioId === condoId);
    }
    return [...this.broadcasts];
  }

  public isAutoGatewayAtivo(): boolean {
    return this.autoGatewayEnabled;
  }

  public setAutoGatewayAtivo(ativo: boolean) {
    this.autoGatewayEnabled = ativo;
  }

  // --------------------------------------------------------------------------
  // DISPARO 100% AUTOMÁTICO DE WHATSAPP (SEM NENHUM REDIRECIONAMENTO - ESTILO MERCADO LIVRE / SHOPEE)
  // --------------------------------------------------------------------------
  public async dispararNotificacaoAutomatica(dados: {
    condominioId: string;
    condominioNome: string;
    morador: Morador;
    tipo: WhatsAppMessageLog['tipo'];
    titulo: string;
    corpoMensagem: string;
    codigoResgate?: string;
    transportadora?: string;
    fotoUrl?: string;
  }): Promise<AutomatedDispatchResult> {
    const dataHora = new Date().toLocaleString('pt-BR');
    const msgFormatada = `🏢 *${dados.condominioNome.toUpperCase()}*
📲 *NOTIFICAÇÃO OFICIAL - SMARTCONDO*
━━━━━━━━━━━━━━━━━━━━
Olá, *${dados.morador.nome}*! (Bl. ${dados.morador.unidade.bloco || '1'} - Apto ${dados.morador.unidade.apto})

${dados.corpoMensagem}

━━━━━━━━━━━━━━━━━━━━
${dados.codigoResgate ? `🔐 *SENHA DE RETIRADA (PIN):* \`${dados.codigoResgate}\`\n━━━━━━━━━━━━━━━━━━━━\n` : ''}📅 _Registrado em: ${dataHora}_
⚙️ _Sistema Automático SmartCondo Portaria 24h (Disparo Instantâneo)_`;

    const link = this.gerarLinkWhatsApp(dados.morador.telefone, msgFormatada);
    const messageId = `wapp_auto_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const log: WhatsAppMessageLog = {
      id: messageId,
      condominioId: dados.condominioId,
      moradorId: dados.morador.id,
      moradorNome: dados.morador.nome,
      moradorTelefone: dados.morador.telefone,
      moradorUnidade: `Bloco ${dados.morador.unidade.bloco || '1'} - Apto ${dados.morador.unidade.apto}`,
      tipo: dados.tipo,
      titulo: dados.titulo,
      mensagem: msgFormatada,
      whatsappUrl: link,
      status: 'entregue',
      timestamp: Date.now(),
    };

    this.logs.unshift(log);
    this.salvar();

    // Disparo em background para a rota de API do servidor
    try {
      fetch('/api/whatsapp/send-automated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone: dados.morador.telefone,
          mensagem: msgFormatada,
          condominioNome: dados.condominioNome,
          moradorNome: dados.morador.nome,
          unidade: `Bloco ${dados.morador.unidade.bloco || '1'} - Apto ${dados.morador.unidade.apto}`,
          tipo: dados.tipo,
          codigoResgate: dados.codigoResgate,
          transportadora: dados.transportadora,
          fotoUrl: dados.fotoUrl,
        }),
      }).catch((err) => console.warn('[WhatsApp Gateway Background Dispatch]:', err));
    } catch {
      // ignore
    }

    // Dispara evento no DOM para interfaces reativas
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('smartcondo_whatsapp_disparo_automatico', {
            detail: {
              morador: dados.morador,
              codigoResgate: dados.codigoResgate,
              transportadora: dados.transportadora,
              timestamp: Date.now(),
              log,
            },
          })
        );
      }
    } catch {
      // ignore
    }

    return {
      success: true,
      messageId,
      telefone: dados.morador.telefone,
      moradorNome: dados.morador.nome,
      unidade: `Bloco ${dados.morador.unidade.bloco || '1'} - Apto ${dados.morador.unidade.apto}`,
      codigoResgate: dados.codigoResgate,
      tipo: dados.tipo,
      timestamp: Date.now(),
      entregueSemRedirecionamento: true,
      mensagem: msgFormatada,
    };
  }

  // Notificação específica de Chegada de Encomenda com PIN e foto
  public async notificarChegadaEncomendaAutomatica(dados: {
    condominio: Condominio;
    morador: Morador;
    encomenda: Encomenda;
    diasLimite?: number;
  }): Promise<AutomatedDispatchResult> {
    const prazo = dados.diasLimite || dados.condominio.regras?.diasLimiteRetiradaEncomenda || 5;
    const corpo = `📦 *NOVA ENCOMENDA RECEBIDA NA PORTARIA!*

Olá, *${dados.morador.nome}*!
Uma nova encomenda foi recebida e conferida pela portaria para o seu apartamento:

🚚 *Transportadora:* ${dados.encomenda.transportadora}
🏷️ *Rastreio / Ref:* ${dados.encomenda.codigoRastreio || 'Volume Registrado'}
🔐 *SENHA DE RETIRADA (PIN):* \`${dados.encomenda.codigoResgate}\`
⏱️ *Prazo para Retirada:* Até ${prazo} dias corridos na portaria.

${dados.encomenda.fotoUrl ? '📸 *Foto do Selo / Etiqueta Anexada:* A foto da sua encomenda com os dados de identificação está disponível no seu App SmartCondo.\n\n' : ''}Para retirar, basta informar a sua senha *${dados.encomenda.codigoResgate}* ao porteiro. O código também já está disponível no seu aplicativo de morador.`;

    return this.dispararNotificacaoAutomatica({
      condominioId: dados.condominio.id,
      condominioNome: dados.condominio.nome,
      morador: dados.morador,
      tipo: 'encomenda',
      titulo: `📦 Encomenda Recebida - PIN: ${dados.encomenda.codigoResgate}`,
      corpoMensagem: corpo,
      codigoResgate: dados.encomenda.codigoResgate,
      transportadora: dados.encomenda.transportadora,
      fotoUrl: dados.encomenda.fotoUrl,
    });
  }

  // Notificar morador individual (com suporte a fallback ou chamada direta)
  public notificarMorador(dados: {
    condominioId: string;
    condominioNome: string;
    morador: Morador;
    tipo: WhatsAppMessageLog['tipo'];
    titulo: string;
    corpoMensagem: string;
    codigoResgate?: string;
  }): WhatsAppMessageLog {
    // Executa disparo automático sem redirecionamento em background
    this.dispararNotificacaoAutomatica(dados).catch(() => {});

    const dataHora = new Date().toLocaleString('pt-BR');
    const msgFormatada = `🏢 *${dados.condominioNome.toUpperCase()}*
📲 *NOTIFICAÇÃO OFICIAL - SMARTCONDO*
━━━━━━━━━━━━━━━━━━━━
Olá, *${dados.morador.nome}*! (Bl. ${dados.morador.unidade.bloco || '1'} - Apto ${dados.morador.unidade.apto})

${dados.corpoMensagem}

━━━━━━━━━━━━━━━━━━━━
${dados.codigoResgate ? `🔐 *SENHA DE RETIRADA (PIN):* \`${dados.codigoResgate}\`\n━━━━━━━━━━━━━━━━━━━━\n` : ''}📅 _Registrado em: ${dataHora}_
⚙️ _Sistema Integrado de Gestão Condominial (Disparo Automático)_`;

    const link = this.gerarLinkWhatsApp(dados.morador.telefone, msgFormatada);

    const log: WhatsAppMessageLog = {
      id: `wapp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      condominioId: dados.condominioId,
      moradorId: dados.morador.id,
      moradorNome: dados.morador.nome,
      moradorTelefone: dados.morador.telefone,
      moradorUnidade: `Bloco ${dados.morador.unidade.bloco || '1'} - ${dados.morador.unidade.apto}`,
      tipo: dados.tipo,
      titulo: dados.titulo,
      mensagem: msgFormatada,
      whatsappUrl: link,
      status: 'entregue',
      timestamp: Date.now(),
    };

    return log;
  }

  // Disparo em Massa pelo Síndico para todos os Moradores
  public dispararParaTodos(dados: {
    condominio: Condominio;
    moradores: Morador[];
    titulo: string;
    categoria: NoticeCategory;
    mensagem: string;
    enviadoPor: string;
    incluirContatoAdmin?: boolean;
  }): WhatsAppBroadcast {
    const dataHora = new Date().toLocaleString('pt-BR');
    const categoriaEmojiMap: Record<NoticeCategory, string> = {
      urgente: '🚨 *COMUNICADO URGENTE*',
      manutencao: '🛠️ *AVISO DE MANUTENÇÃO*',
      comunicado: '📢 *COMUNICADO DA ADMINISTRAÇÃO*',
      social: '🎉 *EVENTO & CONVIVÊNCIA*',
      eventos: '📅 *EVENTOS & ATIVIDADES*',
      regras: '📋 *REGRAS & CONVIVÊNCIA*',
    };

    const emojiHeader = categoriaEmojiMap[dados.categoria] || '📢 *COMUNICADO OFICIAL*';

    const destinatarios = dados.moradores.map((m) => {
      const msgPersonalizada = `🏢 *${dados.condominio.nome.toUpperCase()}*
${emojiHeader}
━━━━━━━━━━━━━━━━━━━━
Olá, *${m.nome}* (Unidade: Bl. ${m.unidade.bloco || '1'} - Apto ${m.unidade.apto})

📌 *${dados.titulo.toUpperCase()}*

${dados.mensagem}

━━━━━━━━━━━━━━━━━━━━
${dados.incluirContatoAdmin ? `👤 _Emitido por: ${dados.enviadoPor} (${dados.condominio.sindicoEmail})_\n` : ''}📅 _Data de envio: ${dataHora}_
⚙️ _Notificação Automática SmartCondo_`;

      const link = this.gerarLinkWhatsApp(m.telefone, msgPersonalizada);

      // Adiciona também log individual
      this.logs.unshift({
        id: `wapp_bc_${Date.now()}_${m.id}`,
        condominioId: dados.condominio.id,
        moradorId: m.id,
        moradorNome: m.nome,
        moradorTelefone: m.telefone,
        moradorUnidade: `Bloco ${m.unidade.bloco || '1'} - ${m.unidade.apto}`,
        tipo: 'comunicado_massa',
        titulo: dados.titulo,
        mensagem: msgPersonalizada,
        whatsappUrl: link,
        status: 'entregue',
        timestamp: Date.now(),
      });

      return {
        moradorId: m.id,
        nome: m.nome,
        telefone: m.telefone,
        unidade: `Bloco ${m.unidade.bloco || '1'} - ${m.unidade.apto}`,
        status: 'entregue' as const,
        whatsappUrl: link,
      };
    });

    const broadcast: WhatsAppBroadcast = {
      id: `bc_${Date.now()}`,
      condominioId: dados.condominio.id,
      titulo: dados.titulo,
      categoria: dados.categoria,
      mensagem: dados.mensagem,
      enviadoPor: dados.enviadoPor,
      totalDestinatarios: destinatarios.length,
      sucessoCount: destinatarios.length,
      timestamp: Date.now(),
      destinatarios,
    };

    this.broadcasts.unshift(broadcast);
    this.salvar();
    return broadcast;
  }

  // Notificação de Cobrança da Mensalidade ao Síndico
  public notificarCobrancaSindico(dados: {
    condominioNome: string;
    sindicoNome: string;
    sindicoTelefone: string;
    mesReferencia: string;
    plano: string;
    valor: number;
    dataVencimento: string;
    chavePix: string;
    codigoPixCopiaCola: string;
    mensagemAdicional?: string;
  }): { mensagem: string; whatsappUrl: string } {
    const dataHora = new Date().toLocaleString('pt-BR');
    const valorFormatado = dados.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const dataVencFormatada = dados.dataVencimento.includes('-')
      ? new Date(dados.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')
      : dados.dataVencimento;

    const msgFormatada = `🏢 *PLATAFORMA SMARTCONDO - GESTÃO CENTRAL*
💳 *NOTIFICAÇÃO DE FATURA / MENSALIDADE*
━━━━━━━━━━━━━━━━━━━━
Prezado(a) Síndico(a) *${dados.sindicoNome}*,
Condomínio: *${dados.condominioNome}*

Informamos os dados para quitação da mensalidade da plataforma SmartCondo:

📌 *Referência:* ${dados.mesReferencia}
📦 *Plano Contratado:* ${dados.plano}
💰 *Valor:* ${valorFormatado}
📅 *Vencimento:* ${dataVencFormatada}

🔑 *CHAVE PIX PARA PAGAMENTO:*
\`${dados.chavePix}\`

📋 *CÓDIGO PIX (COPIA E COLA):*
\`${dados.codigoPixCopiaCola}\`
${dados.mensagemAdicional ? `\n📝 *Observação:* ${dados.mensagemAdicional}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
Após realizar o pagamento, o comprovante pode ser enviado por aqui ou validado pelo painel.
Dúvidas ou suporte: davileonardo303@gmail.com
📅 _Emitido em: ${dataHora}_`;

    const link = this.gerarLinkWhatsApp(dados.sindicoTelefone, msgFormatada);
    return { mensagem: msgFormatada, whatsappUrl: link };
  }

  public limparHistorico() {
    this.logs = [];
    this.broadcasts = [];
    localStorage.removeItem('smartcondo_whatsapp_logs');
    localStorage.removeItem('smartcondo_whatsapp_broadcasts');
    this.notify();
  }
}

export const whatsappService = new WhatsAppService();
