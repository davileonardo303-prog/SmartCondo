import * as BaileysModule from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

// Extrai as funções e objetos de forma segura compatível com ESM e CJS
const baileysPkg: any = BaileysModule;
const makeWASocket = baileysPkg.default?.default || baileysPkg.default || baileysPkg.makeWASocket || baileysPkg;
const DisconnectReason = baileysPkg.DisconnectReason || baileysPkg.default?.DisconnectReason || {
  loggedOut: 401,
  connectionClosed: 428,
  connectionLost: 408,
  connectionReplaced: 440,
  timedOut: 408,
  badSession: 500,
  restartRequired: 515,
};
const useMultiFileAuthState = baileysPkg.useMultiFileAuthState || baileysPkg.default?.useMultiFileAuthState;
const fetchLatestBaileysVersion = baileysPkg.fetchLatestBaileysVersion || baileysPkg.default?.fetchLatestBaileysVersion;
const makeCacheableSignalKeyStore = baileysPkg.makeCacheableSignalKeyStore || baileysPkg.default?.makeCacheableSignalKeyStore;

export interface WhatsAppSessionState {
  status: 'desconectado' | 'gerando_qr' | 'aguardando_leitura' | 'conectando' | 'conectado' | 'erro';
  qrCodeDataUrl: string | null;
  rawQr: string | null;
  phoneNumber: string | null;
  profileName: string | null;
  battery: number | null;
  lastConnectedAt: string | null;
  error: string | null;
  pairingCode: string | null;
  incomingMessages: Array<{
    id: string;
    from: string;
    pushName: string;
    text: string;
    timestamp: number;
  }>;
}

class BaileysManager {
  private sock: any = null;
  private authFolder: string = path.join(process.cwd(), '.baileys_auth');
  private logger = pino({ level: 'silent' });
  private isConnecting: boolean = false;

  private state: WhatsAppSessionState = {
    status: 'desconectado',
    qrCodeDataUrl: null,
    rawQr: null,
    phoneNumber: null,
    profileName: null,
    battery: 100,
    lastConnectedAt: null,
    error: null,
    pairingCode: null,
    incomingMessages: [],
  };

  constructor() {
    // Garante que o diretório de credenciais existe
    if (!fs.existsSync(this.authFolder)) {
      try {
        fs.mkdirSync(this.authFolder, { recursive: true });
      } catch (err) {
        console.error('[Baileys] Erro ao criar pasta de auth:', err);
      }
    }
    this.checkSavedSession();
  }

  public getState(): WhatsAppSessionState {
    return { ...this.state };
  }

  private checkSavedSession() {
    // Se já existem credenciais salvas prévias, inicia automaticamente
    const credsPath = path.join(this.authFolder, 'creds.json');
    if (fs.existsSync(credsPath)) {
      console.log('[Baileys] 📱 Credenciais existentes encontradas. Conectando...');
      this.startConnection().catch((err) => {
        console.error('[Baileys] Erro ao inicializar conexão salva:', err);
      });
    }
  }

  public async startConnection(customPhoneNumber?: string): Promise<WhatsAppSessionState> {
    if (this.isConnecting && this.state.status === 'aguardando_leitura' && this.state.qrCodeDataUrl) {
      return this.state;
    }

    this.isConnecting = true;
    this.state.status = 'gerando_qr';
    this.state.error = null;

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
      const { version, isLatest } = await fetchLatestBaileysVersion().catch(() => ({
        version: [2, 3000, 1015901307] as [number, number, number],
        isLatest: true,
      }));

      console.log(`[Baileys] 🚀 Iniciando WhatsApp Web Socket (v${version.join('.')}, latest: ${isLatest})...`);

      this.sock = makeWASocket({
        version,
        logger: this.logger,
        printQRInTerminal: false,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, this.logger),
        },
        browser: ['SmartCondo Portaria', 'Chrome', '124.0.0.0'],
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
      });

      this.sock.ev.on('creds.update', saveCreds);

      // Se solicitado pareamento por número (Pairing Code)
      if (customPhoneNumber && !this.sock.authState.creds.registered) {
        try {
          const cleanPhone = customPhoneNumber.replace(/\D/g, '');
          const code = await this.sock.requestPairingCode(cleanPhone);
          this.state.pairingCode = code;
          console.log(`[Baileys] 🔑 Código de Pareamento gerado para +${cleanPhone}: ${code}`);
        } catch (pairErr: any) {
          console.warn('[Baileys] Aviso ao solicitar Pairing Code:', pairErr?.message);
        }
      }

      this.sock.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('[Baileys] 📸 NOVO QR CODE OFICIAL DO WHATSAPP GERADO!');
          this.state.rawQr = qr;
          this.state.status = 'aguardando_leitura';

          try {
            const dataUrl = await QRCode.toDataURL(qr, {
              width: 400,
              margin: 1,
              errorCorrectionLevel: 'M',
              color: {
                dark: '#020617',
                light: '#ffffff',
              },
            });
            this.state.qrCodeDataUrl = dataUrl;
          } catch (qrErr: any) {
            console.error('[Baileys] Erro ao converter QR para DataURL:', qrErr);
          }
        }

        if (connection === 'connecting') {
          this.state.status = 'conectando';
        }

        if (connection === 'open') {
          console.log('[Baileys] ✅ CONEXÃO ESTABELECIDA COM SUCESSO!');
          this.isConnecting = false;
          this.state.status = 'conectado';
          this.state.qrCodeDataUrl = null;
          this.state.rawQr = null;
          this.state.pairingCode = null;
          this.state.lastConnectedAt = new Date().toISOString();

          // Extrai informações do usuário conectado
          const userJid = this.sock.user?.id || '';
          const cleanNumber = userJid.split(':')[0].split('@')[0];
          this.state.phoneNumber = cleanNumber ? `+${cleanNumber}` : '+55 (11) 98765-4321';
          this.state.profileName = this.sock.user?.name || 'Portaria WhatsApp Oficial';
        }

        if (connection === 'close') {
          this.isConnecting = false;
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.log(
            `[Baileys] 🔌 Conexão encerrada. Motivo: ${statusCode} (Reconectar: ${shouldReconnect})`
          );

          if (shouldReconnect) {
            this.state.status = 'conectando';
            setTimeout(() => {
              this.startConnection().catch(() => {});
            }, 3000);
          } else {
            this.state.status = 'desconectado';
            this.state.phoneNumber = null;
            this.state.profileName = null;
            this.state.qrCodeDataUrl = null;
            this.state.rawQr = null;
            this.clearAuthFolder();
          }
        }
      });

      // Escuta mensagens recebidas dos moradores
      this.sock.ev.on('messages.upsert', async (m: any) => {
        if (m.type === 'notify') {
          for (const msg of m.messages) {
            if (!msg.key.fromMe && msg.message) {
              const from = msg.key.remoteJid?.split('@')[0] || '';
              const pushName = msg.pushName || 'Morador';
              const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                '[Mídia/Anexo WhatsApp]';

              console.log(`[Baileys Message Inbound] 📩 ${pushName} (${from}): ${text}`);

              this.state.incomingMessages.unshift({
                id: msg.key.id || `msg_${Date.now()}`,
                from,
                pushName,
                text,
                timestamp: Date.now(),
              });

              // Mantém até 50 mensagens em memória
              if (this.state.incomingMessages.length > 50) {
                this.state.incomingMessages.pop();
              }
            }
          }
        }
      });

      return this.state;
    } catch (err: any) {
      this.isConnecting = false;
      this.state.status = 'erro';
      this.state.error = err.message || 'Erro ao inicializar Baileys';
      console.error('[Baileys Start Error]:', err);
      return this.state;
    }
  }

  public async sendMessage(to: string, text: string): Promise<{ success: boolean; deliveredViaBaileys?: boolean; messageId?: string; error?: string; targetJid?: string }> {
    const cleanTo = to.replace(/\D/g, '');
    const formattedTo = cleanTo.length === 10 || cleanTo.length === 11 ? `55${cleanTo}` : cleanTo;

    if (!this.sock || this.state.status !== 'conectado') {
      console.log(`[Baileys Offline/Unpaired] Mensagem para ${formattedTo} aguardando pareamento: ${text.substring(0, 40)}...`);
      return {
        success: false,
        deliveredViaBaileys: false,
        error: 'WhatsApp da portaria não está conectado. Escaneie o QR Code oficial em Aparelhos Conectados ou utilize o envio direto pelo WhatsApp Web.',
      };
    }

    try {
      let targetJid = `${formattedTo}@s.whatsapp.net`;

      // Verifica se o número existe na rede do WhatsApp para obter JID preciso
      try {
        if (this.sock && typeof this.sock.onWhatsApp === 'function') {
          const results = await this.sock.onWhatsApp(formattedTo);
          if (results && results.length > 0 && results[0]?.exists) {
            targetJid = results[0].jid;
          } else if (formattedTo.startsWith('55') && formattedTo.length === 13) {
            // Tenta formato sem 9º dígito (padrão legado WhatsApp no Brasil)
            const ddd = formattedTo.substring(2, 4);
            const bodySemNove = formattedTo.substring(5);
            const altNumber = `55${ddd}${bodySemNove}`;
            const altResults = await this.sock.onWhatsApp(altNumber);
            if (altResults && altResults.length > 0 && altResults[0]?.exists) {
              targetJid = altResults[0].jid;
            }
          }
        }
      } catch (checkErr) {
        console.warn('[Baileys onWhatsApp check info]:', checkErr);
      }

      console.log(`[Baileys Real Sending] 📤 Enviando para ${targetJid}: "${text.substring(0, 50)}..."`);
      const result = await this.sock.sendMessage(targetJid, { text });

      return {
        success: true,
        deliveredViaBaileys: true,
        messageId: result?.key?.id || `baileys_${Date.now()}`,
        targetJid,
      };
    } catch (err: any) {
      console.error('[Baileys Send Error]:', err);
      return {
        success: false,
        deliveredViaBaileys: false,
        error: err.message || 'Falha no envio pelo socket do WhatsApp',
      };
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.sock) {
        await this.sock.logout().catch(() => {});
        this.sock.end(undefined);
      }
    } catch (err) {
      console.error('[Baileys Disconnect Error]:', err);
    } finally {
      this.sock = null;
      this.isConnecting = false;
      this.state = {
        status: 'desconectado',
        qrCodeDataUrl: null,
        rawQr: null,
        phoneNumber: null,
        profileName: null,
        battery: 100,
        lastConnectedAt: null,
        error: null,
        pairingCode: null,
        incomingMessages: [],
      };
      this.clearAuthFolder();
    }
  }

  private clearAuthFolder() {
    try {
      if (fs.existsSync(this.authFolder)) {
        const files = fs.readdirSync(this.authFolder);
        for (const file of files) {
          fs.unlinkSync(path.join(this.authFolder, file));
        }
      }
    } catch (err) {
      console.error('[Baileys Clear Auth Error]:', err);
    }
  }
}

export const baileysManager = new BaileysManager();
