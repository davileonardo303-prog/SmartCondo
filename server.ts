import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { baileysManager } from './server/baileysManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // API Route: Status / Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // API Route: Disparo 100% Automático de WhatsApp (Gateway Baileys Oficial)
  app.post('/api/whatsapp/send-automated', async (req, res) => {
    try {
      const {
        telefone,
        mensagem,
        condominioNome,
        moradorNome,
        unidade,
        tipo,
        codigoResgate,
        transportadora,
        fotoUrl,
      } = req.body;

      if (!telefone || !mensagem) {
        return res.status(400).json({
          success: false,
          error: 'Telefone e mensagem são obrigatórios para o envio automático.',
        });
      }

      const telefoneLimpo = String(telefone).replace(/\D/g, '');
      const telefoneFormatado =
        telefoneLimpo.length === 10 || telefoneLimpo.length === 11
          ? `55${telefoneLimpo}`
          : telefoneLimpo;

      console.log(`[SmartCondo WhatsApp Gateway] 🚀 Disparo automático para +${telefoneFormatado}`);

      // Tenta envio real via Baileys
      const sendResult = await baileysManager.sendMessage(telefoneFormatado, mensagem);
      const whatsappWebUrl = `https://wa.me/${telefoneFormatado}?text=${encodeURIComponent(mensagem)}`;

      const gatewayResponse = {
        success: true,
        deliveredViaBaileys: sendResult.deliveredViaBaileys ?? false,
        messageId: sendResult.messageId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        status: sendResult.deliveredViaBaileys ? 'entregue' : 'pendente_link',
        gateway: 'SmartCondo Real Baileys WhatsApp Gateway (100% Gratuito)',
        destinatario: `+${telefoneFormatado}`,
        moradorNome,
        unidade,
        tipo: tipo || 'encomenda',
        codigoResgate: codigoResgate || null,
        transportadora: transportadora || null,
        whatsappWebUrl,
        error: sendResult.error || null,
        enviadoEm: new Date().toISOString(),
        timestamp: Date.now(),
        entregueSemRedirecionamento: sendResult.deliveredViaBaileys ?? false,
      };

      return res.json(gatewayResponse);
    } catch (err: any) {
      console.error('[SmartCondo WhatsApp Gateway Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Erro interno no gateway de WhatsApp',
      });
    }
  });

  // API Route: Envio de Mensagem Individual de Chat (DropDesk Atendente -> Morador)
  app.post('/api/whatsapp/send-message', async (req, res) => {
    try {
      const {
        telefone,
        mensagem,
        moradorNome,
        unidade,
        ticketId,
        remetenteNome,
      } = req.body;

      if (!telefone || !mensagem) {
        return res.status(400).json({
          success: false,
          error: 'Telefone e mensagem são obrigatórios.',
        });
      }

      const cleanPhone = String(telefone).replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
      const whatsappWebUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(mensagem)}`;

      console.log(`[SmartCondo WhatsApp Chat] 💬 Envio do atendente (${remetenteNome || 'Portaria'}) para +${formattedPhone}`);

      const sendResult = await baileysManager.sendMessage(formattedPhone, mensagem);

      return res.json({
        success: true,
        deliveredViaBaileys: sendResult.deliveredViaBaileys ?? false,
        messageId: sendResult.messageId || `chat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        status: sendResult.deliveredViaBaileys ? 'entregue' : 'pendente_link',
        whatsappWebUrl,
        destinatario: `+${formattedPhone}`,
        moradorNome,
        ticketId,
        error: sendResult.error || null,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error('[SmartCondo WhatsApp Chat Error]:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Erro interno ao processar mensagem do chat',
      });
    }
  });

  // API Route: Configuração e Diagnóstico do Gateway WhatsApp
  app.get('/api/whatsapp/config', (req, res) => {
    res.json({
      gatewayAtivo: true,
      modo: '100% Gratuito (Baileys / WhatsApp Multi-Device)',
      provedor: 'SmartCondo WhatsApp DropDesk Gateway v3.0',
      suportaWebhooks: true,
      status: 'online',
      webhookUrl: '/api/whatsapp/webhook',
    });
  });

  // API Route: Obter status e QR Code em tempo real do Baileys
  app.get('/api/whatsapp/status', (req, res) => {
    const state = baileysManager.getState();
    res.json({
      ...state,
      timestamp: Date.now(),
      engine: 'Baileys Multi-Device Native Engine (100% Gratuito)',
    });
  });

  // API Route: Iniciar Pareamento / Gerar QR Code Real Oficial do WhatsApp
  app.post('/api/whatsapp/start', async (req, res) => {
    try {
      const { phoneNumber } = req.body || {};
      const state = await baileysManager.startConnection(phoneNumber);
      return res.json({
        success: true,
        ...state,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: Conectar / Buscar QR Code
  app.post('/api/whatsapp/connect', async (req, res) => {
    try {
      const { phoneNumber, serverUrl, apiKey } = req.body || {};

      // Se o usuário passou Evolution API externa
      if (serverUrl && serverUrl.trim().startsWith('http')) {
        try {
          const cleanUrl = serverUrl.replace(/\/+$/, '');
          const response = await fetch(`${cleanUrl}/instance/connect/portaria`, {
            method: 'GET',
            headers: {
              'apikey': apiKey || '',
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();
          return res.json({
            success: true,
            source: 'evolution_api_remote',
            qrcode: data.code || data.base64 || data.qrcode?.base64,
            pairingCode: data.pairingCode || null,
            state: data.state || 'connecting',
          });
        } catch (fetchErr: any) {
          console.warn('[Evolution API Remote Fetch Warning]:', fetchErr.message);
        }
      }

      // Inicia motor Baileys embutido gratuito
      const state = await baileysManager.startConnection(phoneNumber);
      return res.json({
        success: true,
        source: 'baileys_native_free',
        ...state,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: Desconectar Sessão WhatsApp
  app.post('/api/whatsapp/disconnect', async (req, res) => {
    try {
      await baileysManager.disconnect();
      return res.json({ success: true, status: 'desconectado' });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: Mensagens recebidas ao vivo
  app.get('/api/whatsapp/messages', (req, res) => {
    const state = baileysManager.getState();
    return res.json({
      success: true,
      messages: state.incomingMessages,
    });
  });

  // API Route: Webhook Receptor da Evolution API / Baileys
  app.post('/api/whatsapp/webhook', async (req, res) => {
    try {
      const payload = req.body;
      console.log('[WhatsApp Webhook Received]:', JSON.stringify(payload).substring(0, 200));

      const event = payload.event || payload.type || 'messages.upsert';
      const senderJid = payload.data?.key?.remoteJid || payload.sender || payload.from || '';
      const pushName = payload.data?.pushName || payload.name || 'Morador WhatsApp';
      const messageText =
        payload.data?.message?.conversation ||
        payload.data?.message?.extendedTextMessage?.text ||
        payload.message ||
        payload.text ||
        '';

      const telefone = senderJid.replace(/@s\.whatsapp\.net|@c\.us/g, '').replace(/\D/g, '');

      return res.status(200).json({
        success: true,
        status: 'processed',
        event,
        sender: telefone,
        pushName,
        messagePreview: messageText ? messageText.substring(0, 50) : '[Mídia/Áudio]',
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error('[WhatsApp Webhook Error]:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development vs Static files in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SmartCondo Server running on http://0.0.0.0:${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Process Unhandled Rejection]:', reason);
});

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
