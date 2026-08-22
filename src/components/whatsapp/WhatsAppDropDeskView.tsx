import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  MessageSquare,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Send,
  Mic,
  MicOff,
  Image as ImageIcon,
  Paperclip,
  User,
  Users,
  Shield,
  Tag,
  Share2,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  Sparkles,
  Zap,
  Filter,
  BarChart2,
  QrCode,
  Radio,
  FileText,
  Building,
  Check,
  X,
  Volume2,
  Play,
  Pause,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sliders,
  MoreVertical,
  HelpCircle,
  Smile,
  PhoneCall,
  Package,
  Copy,
  Smartphone,
  Key,
  Globe,
  Download,
  Car,
  Bike,
  Bell,
  SendHorizontal,
  MessageCircle,
  CheckCheck,
  Truck,
  UserCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Condominio,
  Morador,
  UserRole,
  WhatsAppTicket,
  WhatsAppTicketMessage,
  WhatsAppTicketStatus,
  WhatsAppTicketSetor,
  WhatsAppTicketPrioridade,
  WhatsAppQuickReply,
  WhatsAppDropDeskConfig,
} from '../../types';
import { condoStore } from '../../services/mockStorage';
import { whatsappService } from '../../services/whatsappService';
import { audioAlertService } from '../../utils/audioAlerts';
import { WhatsAppBroadcastPanel } from '../sindico/WhatsAppBroadcastPanel';

interface WhatsAppDropDeskViewProps {
  condominio: Condominio;
  moradores: Morador[];
  currentUserRole: UserRole;
  currentUserName: string;
  currentUserId: string;
}

export const WhatsAppDropDeskView: React.FC<WhatsAppDropDeskViewProps> = ({
  condominio,
  moradores,
  currentUserRole,
  currentUserName,
  currentUserId,
}) => {
  // Aba principal do DropDesk
  const [activeDropDeskTab, setActiveDropDeskTab] = useState<
    'atendimentos' | 'contatos' | 'indicadores' | 'respostas_rapidas' | 'conexao_qr' | 'broadcast'
  >('atendimentos');

  // Estado dos tickets
  const [tickets, setTickets] = useState<WhatsAppTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todas' | WhatsAppTicketStatus>('todas');
  const [setorFilter, setSetorFilter] = useState<'todos' | WhatsAppTicketSetor>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('todas');

  // Conexão & Configuração
  const [config, setConfig] = useState<WhatsAppDropDeskConfig>(condoStore.getWhatsAppConfig(condominio.id));
  const [quickReplies, setQuickReplies] = useState<WhatsAppQuickReply[]>([]);

  // Input de Mensagem
  const [messageInput, setMessageInput] = useState('');
  const [isNotaInterna, setIsNotaInterna] = useState(false);
  const [showQuickReplyMenu, setShowQuickReplyMenu] = useState(false);

  // Gravação de Áudio
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  // Audio player simulado
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Modais de Ação
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishReason, setFinishReason] = useState('Atendimento concluído com sucesso');
  const [showOcorrenciaModal, setShowOcorrenciaModal] = useState(false);
  const [ocorrenciaTitulo, setOcorrenciaTitulo] = useState('');
  const [ocorrenciaCategoria, setOcorrenciaCategoria] = useState('barulho');

  // Nova Resposta Rápida Modal
  const [showAddQuickReplyModal, setShowAddQuickReplyModal] = useState(false);
  const [newQrAtalho, setNewQrAtalho] = useState('');
  const [newQrTitulo, setNewQrTitulo] = useState('');
  const [newQrConteudo, setNewQrConteudo] = useState('');
  const [newQrCategoria, setNewQrCategoria] = useState<WhatsAppQuickReply['categoria']>('portaria');

  // Adicionar Tag Modal
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Estados da Aba de Contatos de Moradores (Agenda WhatsApp)
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactBlocoFilter, setContactBlocoFilter] = useState('todos');

  // Estados do Modal Central de Disparo de Notificações Rápidas WhatsApp
  const [showQuickNotificationModal, setShowQuickNotificationModal] = useState(false);
  const [notifTargetMorador, setNotifTargetMorador] = useState<Morador | null>(null);
  const [notifCategory, setNotifCategory] = useState<'encomenda' | 'bicicleta' | 'veiculo' | 'visitante' | 'aviso' | 'interfone'>('encomenda');
  const [notifPin, setNotifPin] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [notifTransportadora, setNotifTransportadora] = useState('Mercado Livre');
  const [notifRastreio, setNotifRastreio] = useState('');
  const [notifPrazoDias, setNotifPrazoDias] = useState(5);
  const [notifBikeAcao, setNotifBikeAcao] = useState<'retirada' | 'devolucao' | 'reserva_5min' | 'alerta_vaga'>('retirada');
  const [notifBikeNumero, setNotifBikeNumero] = useState('01');
  const [notifBikeModelo, setNotifBikeModelo] = useState('Caloi Urbana aro 29');
  const [notifBikeObs, setNotifBikeObs] = useState('');
  const [notifBikePinReserva, setNotifBikePinReserva] = useState(() => `BIKE-${Math.floor(100 + Math.random() * 900)}`);
  const [notifVeiculoTipo, setNotifVeiculoTipo] = useState<'farol' | 'vidro' | 'vaga_presa' | 'alarme' | 'outro'>('farol');
  const [notifVeiculoPlaca, setNotifVeiculoPlaca] = useState('');
  const [notifVeiculoModelo, setNotifVeiculoModelo] = useState('');
  const [notifVeiculoDetalhe, setNotifVeiculoDetalhe] = useState('O farol do seu veículo está aceso na garagem.');
  const [notifVisitanteNome, setNotifVisitanteNome] = useState('');
  const [notifVisitanteTipo, setNotifVisitanteTipo] = useState<'visitante' | 'delivery' | 'prestador' | 'corretor'>('delivery');
  const [notifVisitanteEmpresa, setNotifVisitanteEmpresa] = useState('iFood');
  const [notifVisitanteDoc, setNotifVisitanteDoc] = useState('');
  const [notifAvisoTitulo, setNotifAvisoTitulo] = useState('');
  const [notifAvisoMensagem, setNotifAvisoMensagem] = useState('');
  const [isSendingQuickNotif, setIsSendingQuickNotif] = useState(false);
  const [quickNotifSuccessResult, setQuickNotifSuccessResult] = useState<any>(null);

  // Notificação de Envio e Fallback WhatsApp
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const [chatDeliveryStatus, setChatDeliveryStatus] = useState<{
    text: string;
    deliveredViaBaileys: boolean;
    whatsappWebUrl: string;
    moradorNome: string;
    telefone: string;
  } | null>(null);

  // Simulador de Mensagem de Morador
  const [showSimuladorModal, setShowSimuladorModal] = useState(false);
  const [simuladorNome, setSimuladorNome] = useState('Mariana Silva');
  const [simuladorTelefone, setSimuladorTelefone] = useState('55 (11) 9 8452-1920');
  const [simuladorBloco, setSimuladorBloco] = useState('A');
  const [simuladorApto, setSimuladorApto] = useState('204');
  const [simuladorMensagem, setSimuladorMensagem] = useState('Boa tarde portaria! Chegou alguma encomenda da Amazon para o apto 204?');
  const [simuladorTipo, setSimuladorTipo] = useState<'texto' | 'audio'>('texto');

  // Estados de Conexão WhatsApp Real & QR Code
  const [qrCodeTimeLeft, setQrCodeTimeLeft] = useState<number>(60);
  const [qrCodeSeed, setQrCodeSeed] = useState<number>(Date.now());
  const [pairingPhoneInput, setPairingPhoneInput] = useState<string>('');
  const [pairingProfileName, setPairingProfileName] = useState<string>('');
  const [pairingAccountType, setPairingAccountType] = useState<string>('WhatsApp Business');
  const [customServerUrl, setCustomServerUrl] = useState<string>('');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [pairingMethod, setPairingMethod] = useState<'qrcode' | 'pairing_code' | 'api_evolution'>('qrcode');
  const [isSubmittingPairing, setIsSubmittingPairing] = useState<boolean>(false);
  const [showPairingFormModal, setShowPairingFormModal] = useState<boolean>(false);

  // Estados do Gerador de QR Code Autêntico (Baileys / Evolution API)
  const [realQrCodeDataUrl, setRealQrCodeDataUrl] = useState<string>('');
  const [pairingCodeString, setPairingCodeString] = useState<string>('');
  const [rawSessionString, setRawSessionString] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(false);
  const [isFetchingEvolutionQr, setIsFetchingEvolutionQr] = useState<boolean>(false);
  const [evolutionApiStatus, setEvolutionApiStatus] = useState<'idle' | 'testing' | 'online' | 'error'>('idle');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [backendEngineStatus, setBackendEngineStatus] = useState<string>('iniciando');

  // Função para chamar o motor Baileys no backend e obter QR Code ativo
  const fetchLiveBackendQrCode = async () => {
    setIsGeneratingQr(true);
    try {
      // 1. Dispara o start no backend Baileys
      const res = await fetch('/api/whatsapp/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: pairingPhoneInput ? pairingPhoneInput.replace(/\D/g, '') : undefined,
        }),
      });
      const data = await res.json();

      if (data.qrCodeDataUrl) {
        setRealQrCodeDataUrl(data.qrCodeDataUrl);
      }
      if (data.pairingCode) {
        setPairingCodeString(data.pairingCode);
      }
      if (data.rawQr) {
        setRawSessionString(data.rawQr);
      }
      if (data.status === 'conectado' && data.phoneNumber) {
        const cfg = condoStore.conectarWhatsApp(condominio.id, {
          numero: data.phoneNumber,
          nomePerfil: data.profileName || `Portaria ${condominio.nome}`,
          plataforma: 'WhatsApp Business',
        });
        setConfig(cfg);
        confetti({ particleCount: 100, spread: 80 });
      }
      setBackendEngineStatus(data.status || 'pronto');
    } catch (err) {
      console.warn('[Baileys Live Fetch]: Usando gerador de contingência', err);
      // Fallback: Gera QR Code com QRCode library
      const fallbackSeed = Date.now();
      const rawPayload = `2@${fallbackSeed}_smartcondo,${btoa('key_' + fallbackSeed)},${btoa('client_' + fallbackSeed)},${Date.now()}`;
      setRawSessionString(rawPayload);
      const dataUrl = await QRCode.toDataURL(rawPayload, {
        width: 380,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#020617', light: '#ffffff' },
      });
      setRealQrCodeDataUrl(dataUrl);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // Polling de status do WhatsApp a cada 3.5 segundos e ingestão de mensagens recebidas
  useEffect(() => {
    let pollInterval: any;
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/whatsapp/status');
        const data = await res.json();
        if (data.qrCodeDataUrl && !realQrCodeDataUrl) {
          setRealQrCodeDataUrl(data.qrCodeDataUrl);
        }
        if (data.pairingCode) {
          setPairingCodeString(data.pairingCode);
        }
        if (data.status === 'conectado' && data.phoneNumber) {
          if (config.status !== 'conectado') {
            const cfg = condoStore.conectarWhatsApp(condominio.id, {
              numero: data.phoneNumber,
              nomePerfil: data.profileName || `Portaria ${condominio.nome}`,
              plataforma: 'WhatsApp Business',
            });
            setConfig(cfg);
            audioAlertService.playActionSuccessSound();
            confetti({ particleCount: 120, spread: 90 });
          }
        }

        // Ingestão de mensagens recebidas via WhatsApp
        if (data.incomingMessages && Array.isArray(data.incomingMessages) && data.incomingMessages.length > 0) {
          data.incomingMessages.forEach((incMsg: any) => {
            if (incMsg.text && incMsg.from) {
              const fromClean = incMsg.from.replace(/\D/g, '');
              const moradorRef = moradores.find((m) => {
                const telClean = m.telefone.replace(/\D/g, '');
                return telClean && (telClean === fromClean || fromClean.endsWith(telClean) || telClean.endsWith(fromClean));
              });

              condoStore.obterOuCriarTicketParaMorador(
                condominio.id,
                moradorRef || {
                  id: `morador_wa_${fromClean}`,
                  condominioId: condominio.id,
                  nome: incMsg.pushName || `Morador WhatsApp (+${fromClean})`,
                  telefone: incMsg.from,
                  email: '',
                  unidade: { bloco: '1', apto: '101' },
                  statusAdimplencia: 'em_dia' as const,
                  statusCadastro: 'ativo' as const,
                  tipoMorador: 'proprietario' as const,
                },
                'Mensagem recebida via WhatsApp Oficial',
                incMsg.text
              );
            }
          });
        }
      } catch {
        // silent
      }
    };

    if (activeDropDeskTab === 'conexao_qr' && config.status !== 'conectado') {
      fetchLiveBackendQrCode();
    }

    checkStatus();
    pollInterval = setInterval(checkStatus, 3500);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [activeDropDeskTab, config.status, condominio.id, moradores]);

  // Função para copiar textos com feedback sonoro
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    audioAlertService.playActionSuccessSound();
    setTimeout(() => setCopiedItem(null), 2500);
  };

  // Testar Servidor Evolution API Externo
  const handleTestEvolutionApi = async () => {
    if (!customServerUrl || !customServerUrl.trim().startsWith('http')) {
      alert('⚠️ Por favor, informe a URL completa do seu servidor Evolution API (ex: http://localhost:8080 ou https://api.meucondominio.com).');
      return;
    }
    setIsFetchingEvolutionQr(true);
    setEvolutionApiStatus('testing');
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceName: `portaria_${condominio.id.substring(0, 8)}`,
          serverUrl: customServerUrl,
          apiKey: customApiKey,
        }),
      });
      const data = await res.json();
      if (data.qrcode) {
        if (data.qrcode.startsWith('data:image')) {
          setRealQrCodeDataUrl(data.qrcode);
        } else if (data.qrcode.startsWith('2@') || data.qrcode.length > 20) {
          const generatedUrl = await QRCode.toDataURL(data.qrcode, { width: 380, margin: 1, errorCorrectionLevel: 'M' });
          setRealQrCodeDataUrl(generatedUrl);
        }
        setEvolutionApiStatus('online');
        audioAlertService.playActionSuccessSound();
      } else {
        setEvolutionApiStatus('online');
      }
    } catch {
      setEvolutionApiStatus('error');
    } finally {
      setIsFetchingEvolutionQr(false);
    }
  };

  // Scroll automático no chat
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Temporizador para renovação de QR Code a cada 60s
  useEffect(() => {
    let interval: any;
    if (activeDropDeskTab === 'conexao_qr' && config.status !== 'conectado') {
      interval = setInterval(() => {
        setQrCodeTimeLeft((prev) => {
          if (prev <= 1) {
            setQrCodeSeed(Date.now());
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeDropDeskTab, config.status]);

  // Carregar dados e escutar mudanças
  useEffect(() => {
    const refresh = () => {
      const list = condoStore.getWhatsAppTickets(condominio.id);
      setTickets(list);
      setConfig(condoStore.getWhatsAppConfig(condominio.id));
      setQuickReplies(condoStore.getWhatsAppQuickReplies(condominio.id));

      // Se nenhum ticket selecionado, seleciona o primeiro disponível
      if (!selectedTicketId && list.length > 0) {
        setSelectedTicketId(list[0].id);
      }
    };

    refresh();
    const unsub = condoStore.subscribe(refresh);
    return () => unsub();
  }, [condominio.id]);

  // Rolar para a última mensagem sempre que o ticket ou mensagens mudarem
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicketId, tickets]);

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;

  // Filtragem de tickets
  const filteredTickets = tickets.filter((ticket) => {
    // Filtro por status
    if (statusFilter !== 'todas' && ticket.status !== statusFilter) {
      return false;
    }
    // Filtro por setor
    if (setorFilter !== 'todos' && ticket.setor !== setorFilter) {
      return false;
    }
    // Filtro por tag
    if (selectedTagFilter !== 'todas' && !ticket.tags.includes(selectedTagFilter)) {
      return false;
    }
    // Filtro por busca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ticket.clienteNome.toLowerCase().includes(q);
      const matchPhone = ticket.clienteTelefone.includes(q);
      const matchId = ticket.id.toLowerCase().includes(q) || ticket.protocolo.toLowerCase().includes(q);
      const matchApto = ticket.clienteUnidade
        ? `${ticket.clienteUnidade.bloco || ''} ${ticket.clienteUnidade.apto}`.toLowerCase().includes(q)
        : false;
      const matchMsg = ticket.mensagens.some((m) => m.conteudo.toLowerCase().includes(q));
      if (!matchName && !matchPhone && !matchId && !matchApto && !matchMsg) {
        return false;
      }
    }
    return true;
  });

  // Contadores
  const countAguardando = tickets.filter((t) => t.status === 'aguardando').length;
  const countAtendendo = tickets.filter((t) => t.status === 'atendendo').length;
  const countFinalizado = tickets.filter((t) => t.status === 'finalizado').length;
  const countCancelado = tickets.filter((t) => t.status === 'cancelado').length;

  // Todas as tags únicas
  const allUniqueTags = Array.from(new Set(tickets.flatMap((t) => t.tags)));

  // Enviar Mensagem Real para o Morador
  const handleSendMessage = async (e?: React.FormEvent, forceDirectOpenWa: boolean = false) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !selectedTicket) return;

    const texto = messageInput.trim();
    const isNota = isNotaInterna;
    const destPhone = selectedTicket.clienteTelefone;
    const destNome = selectedTicket.clienteNome;

    // 1. Grava no estado local e store
    condoStore.enviarMensagemTicket(condominio.id, selectedTicket.id, {
      remetente: 'atendente',
      remetenteNome: `${currentUserName} (${currentUserRole === 'sindico' ? 'Síndico' : 'Portaria'})`,
      tipo: 'texto',
      conteudo: texto,
      isNotaInterna: isNota,
    });

    setMessageInput('');
    setIsNotaInterna(false);
    setShowQuickReplyMenu(false);
    audioAlertService.playActionSuccessSound();

    // 2. Se for mensagem externa para o morador (não é nota interna)
    if (!isNota && destPhone) {
      setIsSendingChatMessage(true);
      try {
        const cleanPhone = destPhone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.length === 10 || cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
        const defaultWaUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(texto)}`;

        if (forceDirectOpenWa) {
          window.open(defaultWaUrl, '_blank');
        }

        const res = await fetch('/api/whatsapp/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefone: destPhone,
            mensagem: texto,
            ticketId: selectedTicket.id,
            moradorNome: destNome,
            condominioNome: condominio.nome,
            remetenteNome: currentUserName,
          }),
        });

        const resData = await res.json();
        const delivered = resData.deliveredViaBaileys === true;

        setChatDeliveryStatus({
          text: texto,
          deliveredViaBaileys: delivered,
          whatsappWebUrl: resData.whatsappWebUrl || defaultWaUrl,
          moradorNome: destNome,
          telefone: destPhone,
        });

        if (delivered) {
          audioAlertService.playActionSuccessSound();
        }
      } catch (err) {
        console.warn('[Chat WhatsApp Send Error]:', err);
      } finally {
        setIsSendingChatMessage(false);
      }
    }
  };

  // Iniciar chamada de Interfone diretamente para a unidade do morador
  const handleLigarInterfone = () => {
    if (!selectedTicket) return;

    // Busca morador correspondente no condomínio
    let moradorAlvo = moradores.find((m) => {
      if (selectedTicket.clienteId && m.id === selectedTicket.clienteId) return true;
      const telCleanTicket = selectedTicket.clienteTelefone.replace(/\D/g, '');
      const telCleanM = m.telefone.replace(/\D/g, '');
      if (telCleanTicket && telCleanM.includes(telCleanTicket)) return true;
      if (selectedTicket.clienteUnidade) {
        const a1 = String(m.unidade.apto).trim().toLowerCase();
        const a2 = String(selectedTicket.clienteUnidade.apto).trim().toLowerCase();
        const b1 = String(m.unidade.bloco || '1').trim().toLowerCase();
        const b2 = String(selectedTicket.clienteUnidade.bloco || '1').trim().toLowerCase();
        return a1 === a2 && b1 === b2;
      }
      return false;
    });

    const apto = selectedTicket.clienteUnidade?.apto || (moradorAlvo ? moradorAlvo.unidade.apto : '101');
    const bloco = selectedTicket.clienteUnidade?.bloco || (moradorAlvo ? moradorAlvo.unidade.bloco : '1');

    condoStore.iniciarChamada({
      condominioId: condominio.id,
      callerId: currentUserId || 'portaria',
      callerName: `${currentUserName} (${currentUserRole === 'sindico' ? 'Síndico' : 'Portaria'})`,
      callerRole: currentUserRole,
      callerUnidade: { bloco: 'Portaria', apto: 'Guarita' },
      receiverId: moradorAlvo ? moradorAlvo.id : `apto_${bloco}_${apto}`,
      receiverName: moradorAlvo ? moradorAlvo.nome : `${selectedTicket.clienteNome} (Apto ${apto})`,
      receiverRole: 'morador',
      receiverUnidade: { bloco, apto },
      tipo: 'audio',
    });

    audioAlertService.playActionSuccessSound();
  };

  // Gravação de Áudio com MediaRecorder nativo
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleStartRecording = async () => {
    setIsRecordingAudio(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start();
        setMediaRecorder(recorder);
      }
    } catch (err) {
      console.log('MediaRecorder fallback to simulated audio recording:', err);
    }
  };

  const handleStopAndSendAudio = () => {
    if (!selectedTicket) return;
    clearInterval(recordingTimerRef.current);
    setIsRecordingAudio(false);

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        // ignore
      }
    }

    const dur = recordingSeconds || 3;
    condoStore.enviarMensagemTicket(condominio.id, selectedTicket.id, {
      remetente: 'atendente',
      remetenteNome: `${currentUserName} (${currentUserRole === 'sindico' ? 'Síndico' : 'Portaria'})`,
      tipo: 'audio',
      conteudo: `🎙️ Nota de Voz WhatsApp (${dur}s)`,
      audioDuracao: dur,
      isNotaInterna,
    });

    setRecordingSeconds(0);
    setIsNotaInterna(false);
    audioAlertService.playActionSuccessSound();
  };

  const handleCancelAudio = () => {
    clearInterval(recordingTimerRef.current);
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      try {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      } catch (e) {}
    }
  };

  // Inserir Resposta Rápida
  const handleSelectQuickReply = (reply: WhatsAppQuickReply) => {
    if (!selectedTicket) return;
    let texto = reply.conteudo;
    texto = texto.replace('{nome}', selectedTicket.clienteNome);
    texto = texto.replace('{apto}', selectedTicket.clienteUnidade?.apto || '');
    texto = texto.replace('{bloco}', selectedTicket.clienteUnidade?.bloco || '1');
    texto = texto.replace('{condominio}', condominio.nome);
    texto = texto.replace('{visitante}', 'Visitante');

    setMessageInput(texto);
    setShowQuickReplyMenu(false);
  };

  // Ações de Chamado
  const handleAssumir = () => {
    if (!selectedTicket) return;
    condoStore.assumirTicket(condominio.id, selectedTicket.id, {
      id: currentUserId,
      nome: currentUserName,
      role: currentUserRole,
    });
    confetti({ particleCount: 30, spread: 45 });
  };

  const handleTransferir = (setor: WhatsAppTicketSetor, atendenteNome?: string) => {
    if (!selectedTicket) return;
    condoStore.transferirTicket(condominio.id, selectedTicket.id, setor, atendenteNome);
    setShowTransferModal(false);
    confetti({ particleCount: 40, spread: 50 });
  };

  const handleFinalizar = (status: 'finalizado' | 'cancelado') => {
    if (!selectedTicket) return;
    condoStore.atualizarStatusTicket(condominio.id, selectedTicket.id, status, finishReason);
    setShowFinishModal(false);
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleGerarOcorrencia = () => {
    if (!selectedTicket) return;
    condoStore.transformarTicketEmOcorrencia(
      condominio.id,
      selectedTicket.id,
      ocorrenciaTitulo || selectedTicket.assunto,
      ocorrenciaCategoria
    );
    setShowOcorrenciaModal(false);
    setOcorrenciaTitulo('');
    confetti({ particleCount: 60, spread: 70 });
  };

  const handleAddTag = () => {
    if (!selectedTicket || !newTagInput.trim()) return;
    condoStore.adicionarTagTicket(condominio.id, selectedTicket.id, newTagInput.trim());
    setNewTagInput('');
    setShowAddTagModal(false);
  };

  // Abrir Chat no DropDesk com morador
  const handleAbrirChatMorador = (morador: Morador, mensagemInicial?: string) => {
    const ticket = condoStore.obterOuCriarTicketParaMorador(
      condominio.id,
      morador,
      `Atendimento direto Apto ${morador.unidade?.apto || ''}`,
      mensagemInicial
    );
    setSelectedTicketId(ticket.id);
    setActiveDropDeskTab('atendimentos');
    confetti({ particleCount: 35, spread: 50 });
  };

  // Abrir link direto do WhatsApp Web/App (wa.me)
  const handleOpenDirectWhatsAppLink = (
    telefone: string,
    nomeMorador: string,
    msgPersonalizada?: string
  ) => {
    const cleanPhone = (telefone || '').replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    const defaultText =
      msgPersonalizada ||
      `Olá ${nomeMorador}! Aqui é da Portaria do ${condominio.nome}. Estamos entrando em contato a respeito da sua unidade.`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(defaultText)}`;
    window.open(url, '_blank');
  };

  // Abrir modal de Notificação rápida pré-carregando o morador
  const handleAbrirModalNotificacao = (
    morador?: Morador | null,
    categoria: 'encomenda' | 'bicicleta' | 'veiculo' | 'visitante' | 'aviso' | 'interfone' = 'encomenda'
  ) => {
    if (morador) {
      setNotifTargetMorador(morador);
    } else if (moradores.length > 0) {
      setNotifTargetMorador(moradores[0]);
    }
    setNotifCategory(categoria);
    setNotifPin(Math.floor(100000 + Math.random() * 900000).toString());
    setNotifBikePinReserva(`BIKE-${Math.floor(100 + Math.random() * 900)}`);
    setQuickNotifSuccessResult(null);
    setShowQuickNotificationModal(true);
  };

  // Disparar Notificação Rápida
  const handleEnviarNotificacaoRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTargetMorador) {
      alert('Selecione um morador destinatário.');
      return;
    }

    setIsSendingQuickNotif(true);
    try {
      let result: any = null;

      if (notifCategory === 'encomenda') {
        const encomendaSimulada = {
          id: `enc_quick_${Date.now()}`,
          condominioId: condominio.id,
          moradorId: notifTargetMorador.id,
          destinatarioNome: notifTargetMorador.nome,
          unidade: notifTargetMorador.unidade,
          transportadora: notifTransportadora,
          codigoRastreio: notifRastreio || 'Volume Balcão',
          codigoResgate: notifPin,
          status: 'disponivel_retirada' as const,
          recebidoEm: Date.now(),
          recebidoPorNome: currentUserName,
          recebidoPorRole: currentUserRole,
        };

        result = await whatsappService.notificarChegadaEncomendaAutomatica({
          condominio,
          morador: notifTargetMorador,
          encomenda: encomendaSimulada as any,
          diasLimite: notifPrazoDias,
        });

        // Registra mensagem no DropDesk
        condoStore.obterOuCriarTicketParaMorador(
          condominio.id,
          notifTargetMorador,
          `📦 Encomenda Recebida - PIN: ${notifPin}`,
          `📦 *NOVA ENCOMENDA NA PORTARIA!*\n\nOlá, *${notifTargetMorador.nome}*!\nRecebemos uma encomenda da *${notifTransportadora}* para sua unidade.\n\n🔐 *PIN de Retirada:* ${notifPin}\n⏱️ Prazo: ${notifPrazoDias} dias corridos.`
        );
      } else if (notifCategory === 'bicicleta') {
        result = await whatsappService.notificarBicicletarioAutomatica({
          condominio,
          morador: notifTargetMorador,
          tipoAcao: notifBikeAcao,
          bikeNumero: notifBikeNumero,
          bikeModelo: notifBikeModelo,
          observacao: notifBikeObs,
          codigoReserva: notifBikePinReserva,
        });

        condoStore.obterOuCriarTicketParaMorador(
          condominio.id,
          notifTargetMorador,
          `🚲 Notificação Bicicletário #${notifBikeNumero}`,
          `🚲 *BICICLETÁRIO - ATUALIZAÇÃO*\n\nOlá, *${notifTargetMorador.nome}*!\nNotificação sobre a bicicleta #${notifBikeNumero} (${notifBikeModelo}).\nStatus: ${notifBikeAcao.toUpperCase()}.\n${notifBikeObs ? `Obs: ${notifBikeObs}` : ''}`
        );
      } else if (notifCategory === 'veiculo') {
        const tit = `🚗 Alerta de Veículo / Garagem - ${notifVeiculoTipo.toUpperCase()}`;
        const desc = `Placa: ${notifVeiculoPlaca || 'Identificada'} | Modelo: ${notifVeiculoModelo || 'Veículo Cadastrado'}\nDetalhe: ${notifVeiculoDetalhe}`;
        result = await whatsappService.notificarAlertaPortariaAutomatica({
          condominio,
          morador: notifTargetMorador,
          assunto: tit,
          detalhes: desc,
          categoria: 'veiculo',
        });

        condoStore.obterOuCriarTicketParaMorador(
          condominio.id,
          notifTargetMorador,
          tit,
          `🚗 *ALERTA DE VEÍCULO NA GARAGEM*\n\nOlá, *${notifTargetMorador.nome}*!\n${desc}\nPor favor, verifique assim que possível.`
        );
      } else if (notifCategory === 'visitante') {
        result = await whatsappService.notificarVisitanteAutomatica({
          condominio,
          morador: notifTargetMorador,
          visitanteNome: notifVisitanteNome || 'Visitante na Guarita',
          tipoVisitante: notifVisitanteTipo,
          empresa: notifVisitanteEmpresa,
          documento: notifVisitanteDoc,
        });

        condoStore.obterOuCriarTicketParaMorador(
          condominio.id,
          notifTargetMorador,
          `🚪 Autorização de Acesso - ${notifVisitanteNome}`,
          `🚪 *CHEGADA NA PORTARIA*\n\nOlá, *${notifTargetMorador.nome}*!\n${notifVisitanteTipo.toUpperCase()}: *${notifVisitanteNome}* (${notifVisitanteEmpresa || 'Particular'}) está na portaria aguardando liberação.`
        );
      } else if (notifCategory === 'interfone') {
        const tit = '🔔 Interfone Portaria sem Resposta';
        const desc = 'Tentamos contato via interfone da guarita e não obtivemos resposta. Por favor, entre em contato ou responda esta mensagem.';
        result = await whatsappService.notificarAlertaPortariaAutomatica({
          condominio,
          morador: notifTargetMorador,
          assunto: tit,
          detalhes: desc,
          categoria: 'interfone',
        });

        condoStore.obterOuCriarTicketParaMorador(
          condominio.id,
          notifTargetMorador,
          tit,
          `🔔 *CHAMADO DA PORTARIA*\n\nOlá, *${notifTargetMorador.nome}*!\nTentamos interfonar para sua unidade e não foi atendido. Caso esteja aguardando alguma entrega ou visitante, nos avise!`
        );
      } else {
        const tit = notifAvisoTitulo || '📢 Comunicado da Portaria';
        const desc = notifAvisoMensagem || 'Aviso informativo da portaria do condomínio.';
        result = await whatsappService.notificarAlertaPortariaAutomatica({
          condominio,
          morador: notifTargetMorador,
          assunto: tit,
          detalhes: desc,
          categoria: 'geral',
        });

        condoStore.obterOuCriarTicketParaMorador(
          condominio.id,
          notifTargetMorador,
          tit,
          `📢 *${tit}*\n\nOlá, *${notifTargetMorador.nome}*!\n${desc}\n_Portaria do ${condominio.nome}_`
        );
      }

      setQuickNotifSuccessResult(result);
      audioAlertService.playActionSuccessSound();
      confetti({ particleCount: 70, spread: 70 });
    } catch (err: any) {
      console.error('Erro ao enviar notificação rápida:', err);
      alert('Erro ao processar notificação.');
    } finally {
      setIsSendingQuickNotif(false);
    }
  };

  // Reproduzir Áudio de Nota de Voz
  const handleTogglePlayAudio = (msg: WhatsAppTicketMessage) => {
    if (playingAudioId === msg.id) {
      setPlayingAudioId(null);
      return;
    }
    setPlayingAudioId(msg.id);

    if (msg.mediaUrl) {
      const audio = new Audio(msg.mediaUrl);
      audio.onended = () => setPlayingAudioId(null);
      audio.onerror = () => playSyntheticVoiceTone(msg.audioDuracao || 3);
      audio.play().catch(() => playSyntheticVoiceTone(msg.audioDuracao || 3));
    } else {
      playSyntheticVoiceTone(msg.audioDuracao || 3);
    }
  };

  const playSyntheticVoiceTone = (duracaoSec: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(460, ctx.currentTime + Math.min(duracaoSec, 1.5));
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + Math.min(duracaoSec, 2.5));
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + Math.min(duracaoSec, 2.5));
      }
    } catch (e) {}

    setTimeout(() => {
      setPlayingAudioId(null);
    }, (duracaoSec || 3) * 1000);
  };

  const handleSimularMensagem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simuladorNome || !simuladorMensagem) return;

    const t = condoStore.simularMensagemEntradaWhatsApp(condominio.id, {
      clienteNome: simuladorNome,
      telefone: simuladorTelefone,
      unidade: { bloco: simuladorBloco, apto: simuladorApto },
      texto: simuladorMensagem,
      tipoMidia: simuladorTipo,
    });

    setSelectedTicketId(t.id);
    setShowSimuladorModal(false);
    confetti({ particleCount: 40, spread: 60 });
  };

  // Pareamento Real do Aparelho
  const handleConfirmarPareamento = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const limpo = pairingPhoneInput.replace(/\D/g, '');
    if (!limpo || limpo.length < 10) {
      alert('⚠️ Por favor, informe o número de WhatsApp válido do aparelho conectado com DDD (ex: 11987654321).');
      return;
    }

    setIsSubmittingPairing(true);
    setTimeout(() => {
      const cfg = condoStore.conectarWhatsApp(condominio.id, {
        numero: pairingPhoneInput,
        nomePerfil: pairingProfileName || `Portaria ${condominio.nome}`,
        plataforma: pairingAccountType,
        servidorApiUrl: customServerUrl,
        apiKey: customApiKey,
      });
      setConfig(cfg);
      setIsSubmittingPairing(false);
      setShowPairingFormModal(false);
      audioAlertService.playActionSuccessSound();
      confetti({ particleCount: 80, spread: 80 });
    }, 600);
  };

  // Simular Leitura Instantânea de QR Code pelo Celular do Porteiro
  const handleSimularLeituraCelular = () => {
    setIsSubmittingPairing(true);
    audioAlertService.playRogerBeep();

    setTimeout(() => {
      const numFinal = pairingPhoneInput.trim() || '55 (11) 9 9876-5432';
      const nomeFinal = pairingProfileName.trim() || `Portaria ${condominio.nome}`;

      const cfg = condoStore.conectarWhatsApp(condominio.id, {
        numero: numFinal,
        nomePerfil: nomeFinal,
        plataforma: pairingAccountType || 'WhatsApp Business',
        servidorApiUrl: customServerUrl,
        apiKey: customApiKey,
      });
      setConfig(cfg);
      setIsSubmittingPairing(false);
      audioAlertService.playActionSuccessSound();
      confetti({ particleCount: 100, spread: 80 });
    }, 1000);
  };

  // Baixar imagem do QR Code em PNG
  const handleDownloadQrCode = () => {
    if (!realQrCodeDataUrl) return;
    const link = document.createElement('a');
    link.href = realQrCodeDataUrl;
    link.download = `qrcode_whatsapp_${condominio.nome.toLowerCase().replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    audioAlertService.playActionSuccessSound();
  };

  // Desconectar Sessão do WhatsApp
  const handleDesconectarWhatsApp = () => {
    if (window.confirm('❓ Deseja realmente desconectar o WhatsApp da portaria? O número e o pareamento serão desvinculados.')) {
      const cfg = condoStore.desconectarWhatsApp(condominio.id);
      setConfig(cfg);
      audioAlertService.playRogerBeep();
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER PRINCIPAL DROPDESK */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Logo DropDesk */}
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <span className="text-2xl tracking-tighter">D</span>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-slate-900">
              <Phone className="w-2.5 h-2.5 fill-current" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                DropDesk WhatsApp Atendimento
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                {condominio.nome}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 flex items-center gap-2">
              Central WhatsApp Multiatendente
            </h1>
            <p className="text-xs text-slate-300">
              Gerenciamento profissional de tickets, fila de espera da portaria e conversas em tempo real com os moradores.
            </p>
          </div>
        </div>

        {/* Status de Conexão WhatsApp & Ações Rápidas */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          {/* Chip de Status Conexão REAL */}
          {config.status === 'conectado' && config.numeroConectado ? (
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="text-[10px] text-emerald-400/80 uppercase leading-none">{config.nomePerfil || 'WhatsApp Portaria'}</div>
                <div className="font-mono text-white text-xs">{config.numeroConectado}</div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded-md text-emerald-300 font-mono ml-1">
                🔋 {config.bateria || 98}%
              </span>
            </div>
          ) : (
            <button
              onClick={() => setActiveDropDeskTab('conexao_qr')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-950/90 hover:bg-rose-900 border border-rose-500/60 text-rose-200 text-xs font-bold transition cursor-pointer shadow-lg shadow-rose-950/30"
              title="Clique para escanear o QR Code e conectar seu WhatsApp"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-white font-black">🔴 WhatsApp Desconectado</span>
              <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black ml-1">
                Parear QR Code
              </span>
            </button>
          )}

          {/* Botão de Disparo Rápido de Notificação WhatsApp */}
          <button
            id="btn-dropdesk-notificacao-rapida"
            onClick={() => handleAbrirModalNotificacao(null, 'encomenda')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-95 cursor-pointer"
            title="Disparar aviso ou notificação estruturada via WhatsApp (Encomenda, Bicicleta, Veículo, Visitante)"
          >
            <Zap className="w-4 h-4 text-slate-950" />
            <span>Notificação Rápida</span>
          </button>

          {/* Botão de Simulação de Mensagem WhatsApp */}
          <button
            id="btn-dropdesk-simulador"
            onClick={() => setShowSimuladorModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simular Mensagem WhatsApp</span>
          </button>
        </div>
      </div>

      {/* SUB-NAVEGAÇÃO DROPDESK */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 scrollbar-thin">
        <button
          id="tab-dropdesk-atendimentos"
          onClick={() => setActiveDropDeskTab('atendimentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeDropDeskTab === 'atendimentos'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Atendimentos & Fila</span>
          {countAguardando > 0 && (
            <span className="text-[10px] bg-rose-500 text-white font-black px-2 py-0.5 rounded-full animate-pulse ml-1">
              {countAguardando} em espera
            </span>
          )}
        </button>

        <button
          id="tab-dropdesk-contatos"
          onClick={() => setActiveDropDeskTab('contatos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeDropDeskTab === 'contatos'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Moradores & Agenda WhatsApp ({moradores.length})</span>
        </button>

        <button
          id="tab-dropdesk-indicadores"
          onClick={() => setActiveDropDeskTab('indicadores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeDropDeskTab === 'indicadores'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Indicadores & Métricas</span>
        </button>

        <button
          id="tab-dropdesk-respostas-rapidas"
          onClick={() => setActiveDropDeskTab('respostas_rapidas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeDropDeskTab === 'respostas_rapidas'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Respostas Rápidas / Macros ({quickReplies.length})</span>
        </button>

        <button
          id="tab-dropdesk-conexao"
          onClick={() => setActiveDropDeskTab('conexao_qr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeDropDeskTab === 'conexao_qr'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Conexão WhatsApp & QR Code</span>
        </button>

        {currentUserRole === 'sindico' && (
          <button
            id="tab-dropdesk-broadcast"
            onClick={() => setActiveDropDeskTab('broadcast')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeDropDeskTab === 'broadcast'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Disparo em Massa (Broadcast)</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: ATENDIMENTOS & CHAT EM TEMPO REAL (INTERFACE DROPDESK) */}
      {/* ========================================================================= */}
      {activeDropDeskTab === 'atendimentos' && (
        <div className="space-y-4">
          {/* Banner de Aviso quando Desconectado */}
          {(!config.status || config.status !== 'conectado' || !config.numeroConectado) && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-200/70 text-amber-800 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950">WhatsApp da Portaria Não Pareado</h4>
                  <p className="text-xs text-amber-800">
                    Conecte o aparelho oficial lendo o QR Code para sincronizar com sua linha real e receber mensagens dos moradores.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveDropDeskTab('conexao_qr')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition shadow-md shadow-amber-600/20 shrink-0 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Parear WhatsApp Agora</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-sm min-h-[750px]">
          {/* PAINEL ESQUERDO: FILA DE ATENDIMENTOS & TICKETS (4 COLUNAS) */}
          <div className="lg:col-span-4 flex flex-col space-y-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            {/* Barra de Pesquisa */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="input-dropdesk-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisa por nome, #780, apto ou mensagem..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chips de Filtro por Status (Layout DropDesk) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setStatusFilter('atendendo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'atendendo'
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Atendendo ({countAtendendo})
              </button>
              <button
                onClick={() => setStatusFilter('aguardando')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'aguardando'
                    ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400/40'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Em Espera ({countAguardando})
              </button>
              <button
                onClick={() => setStatusFilter('finalizado')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'finalizado'
                    ? 'bg-slate-800 text-white shadow-sm ring-2 ring-slate-400/40'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                Fechados ({countFinalizado})
              </button>
              <button
                onClick={() => setStatusFilter('todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  statusFilter === 'todas'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({tickets.length})
              </button>
            </div>

            {/* Filtro por Setor & Tags */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <select
                value={setorFilter}
                onChange={(e) => setSetorFilter(e.target.value as any)}
                className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none"
              >
                <option value="todos">Todos os Setores</option>
                <option value="portaria">Guarita / Portaria</option>
                <option value="sindico">Administração / Síndico</option>
                <option value="zeladoria">Zeladoria & Manutenção</option>
              </select>

              {allUniqueTags.length > 0 && (
                <select
                  value={selectedTagFilter}
                  onChange={(e) => setSelectedTagFilter(e.target.value)}
                  className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 focus:outline-none max-w-[140px] truncate"
                >
                  <option value="todas">🏷️ Todas Tags</option>
                  {allUniqueTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Lista de Chamados / Tickets */}
            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[560px] pr-1">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">Nenhum atendimento nesta categoria</p>
                  <p className="text-[10px] text-slate-400">
                    Clique em "Simular Mensagem WhatsApp" para testar a entrada de novos chamados.
                  </p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = ticket.id === selectedTicket?.id;
                  const statusColors = {
                    aguardando: 'bg-amber-100 text-amber-900 border-amber-300',
                    atendendo: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                    finalizado: 'bg-slate-100 text-slate-700 border-slate-300',
                    cancelado: 'bg-rose-100 text-rose-800 border-rose-300',
                  };

                  const statusLabels = {
                    aguardando: 'Em Espera',
                    atendendo: 'Atendendo',
                    finalizado: 'Fechado',
                    cancelado: 'Cancelado',
                  };

                  const prioridadeColors = {
                    urgente: 'bg-rose-100 text-rose-800 border-rose-300 font-black',
                    alta: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
                    normal: 'bg-slate-100 text-slate-700 border-slate-200 font-semibold',
                  };

                  const timeStr = new Date(ticket.ultimaMensagemTimestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={ticket.id}
                      id={`ticket-card-${ticket.id}`}
                      onClick={() => {
                        setSelectedTicketId(ticket.id);
                        condoStore.marcarTicketComoLido(condominio.id, ticket.id);
                      }}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer relative ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200/80'
                      }`}
                    >
                      {/* Topo do Card: Protocolo + Tag de Status + Prioridade + Horário */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black font-mono text-slate-900">{ticket.id}</span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColors[ticket.status]}`}
                          >
                            {statusLabels[ticket.status]}
                          </span>
                          <span
                            className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md border ${prioridadeColors[ticket.prioridade || 'normal']}`}
                          >
                            {ticket.prioridade === 'urgente' ? '🚨 Urgente' : ticket.prioridade === 'alta' ? '⚡ Alta' : 'Normal'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{timeStr}</span>
                      </div>

                      {/* Nome do Contato & Foto/Avatar & Unidade */}
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="relative w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
                          {ticket.clienteAvatar ? (
                            <img
                              src={ticket.clienteAvatar}
                              alt={ticket.clienteNome}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            ticket.clienteNome.charAt(0)
                          )}
                          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-black text-slate-900 truncate">{ticket.clienteNome}</h4>
                          <p className="text-[10px] font-semibold text-emerald-800 truncate flex items-center gap-1">
                            <span>🏢 {ticket.clienteUnidade ? `Bloco ${ticket.clienteUnidade.bloco || '1'} - Apto ${ticket.clienteUnidade.apto}` : 'Residencial'}</span>
                          </p>
                        </div>
                        {ticket.mensagensNaoLidas > 0 && (
                          <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 animate-bounce">
                            {ticket.mensagensNaoLidas}
                          </span>
                        )}
                      </div>

                      {/* Preview da Última Mensagem */}
                      <p className="text-[11px] text-slate-600 line-clamp-1 italic mb-2">
                        {ticket.ultimaMensagem}
                      </p>

                      {/* Tags & Atendente */}
                      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100">
                        <div className="flex items-center gap-1 flex-wrap">
                          {ticket.tags.slice(0, 2).map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200"
                            >
                              {tag}
                            </span>
                          ))}
                          {ticket.tags.length > 2 && (
                            <span className="text-[9px] font-bold text-slate-400">+{ticket.tags.length - 2}</span>
                          )}
                        </div>

                        {ticket.atendenteNome ? (
                          <span className="text-[9px] text-slate-500 font-semibold truncate max-w-[100px]">
                            👤 {ticket.atendenteNome.split(' ')[0]}
                          </span>
                        ) : (
                          <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                            Sem atendente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* PAINEL DIREITO: CONVERSA / CHAT DO ATENDIMENTO (8 COLUNAS) */}
          <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-full min-h-[600px]">
            {selectedTicket ? (
              <>
                {/* HEADER DA CONVERSA SELECIONADA */}
                <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm overflow-hidden border border-emerald-400 shrink-0">
                      {selectedTicket.clienteAvatar ? (
                        <img
                          src={selectedTicket.clienteAvatar}
                          alt={selectedTicket.clienteNome}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        selectedTicket.clienteNome.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white">{selectedTicket.clienteNome}</h3>
                        <span className="text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-emerald-300 font-bold">
                          {selectedTicket.id}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Setor: {selectedTicket.setor.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 flex items-center gap-2 flex-wrap">
                        <span>📞 {selectedTicket.clienteTelefone}</span>
                        {selectedTicket.clienteUnidade && (
                          <span>• 🏢 Bloco {selectedTicket.clienteUnidade.bloco || '1'} - Apto {selectedTicket.clienteUnidade.apto}</span>
                        )}
                        {selectedTicket.atendenteNome && (
                          <span className="text-emerald-400 font-semibold">• Atendente: {selectedTicket.atendenteNome}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Ações do Chamado DropDesk */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Botão Assumir */}
                    {selectedTicket.status === 'aguardando' && (
                      <button
                        id="btn-dropdesk-assumir"
                        onClick={handleAssumir}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-sm"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Assumir</span>
                      </button>
                    )}

                    {/* Botão Abrir Direto no WhatsApp Web */}
                    <button
                      id="btn-dropdesk-open-wa"
                      onClick={() => handleOpenDirectWhatsAppLink(selectedTicket.clienteTelefone, selectedTicket.clienteNome, messageInput.trim() || undefined)}
                      title="Abrir esta conversa diretamente no WhatsApp Web / App Oficial"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer shadow-sm active:scale-95 border border-emerald-400/40"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Abrir no WhatsApp</span>
                    </button>

                    {/* Botão Notificar Morador */}
                    <button
                      id="btn-dropdesk-quick-notif-morador"
                      onClick={() => {
                        const moradorRef = moradores.find((m) => m.id === selectedTicket.clienteId) || {
                          id: selectedTicket.clienteId,
                          nome: selectedTicket.clienteNome,
                          telefone: selectedTicket.clienteTelefone,
                          unidade: selectedTicket.clienteUnidade || { bloco: '1', apto: '101' },
                          email: '',
                          cpf: '',
                          status: 'ativo' as const,
                          role: 'morador' as const,
                        };
                        handleAbrirModalNotificacao(moradorRef as Morador);
                      }}
                      title="Disparar notificação rápida estruturada (Encomenda, Bicicleta, Veículo, Visitante)"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Notificar Morador</span>
                    </button>

                    {/* Botão 1: Ligar via Interfone */}
                    <button
                      id="btn-dropdesk-ligar-interfone"
                      onClick={handleLigarInterfone}
                      title="Chamar morador instantaneamente via Interfone WebRTC"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition cursor-pointer shadow-sm active:scale-95"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-indigo-200" />
                      <span>Ligar Interfone</span>
                    </button>

                    {/* Botão 2: Transferir Atendimento */}
                    <button
                      id="btn-dropdesk-transferir"
                      onClick={() => setShowTransferModal(true)}
                      title="Transferir para outro atendente ou setor (Síndico, Guarita, Zeladoria)"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition cursor-pointer shadow-sm active:scale-95"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Transferir</span>
                    </button>

                    {/* Botão 3: Fechar Atendimento */}
                    {selectedTicket.status !== 'finalizado' && (
                      <button
                        id="btn-dropdesk-finalizar"
                        onClick={() => setShowFinishModal(true)}
                        title="Encerrar chamado e arquivar com protocolo"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black transition cursor-pointer shadow-sm active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fechar</span>
                      </button>
                    )}

                    {/* Botão Gerar Ocorrência */}
                    <button
                      id="btn-dropdesk-ocorrencia"
                      onClick={() => setShowOcorrenciaModal(true)}
                      title="Transformar este atendimento em Ocorrência Oficial do condomínio"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Ocorrência</span>
                    </button>

                    {/* Botão Adicionar Tag */}
                    <button
                      id="btn-dropdesk-tags"
                      onClick={() => setShowAddTagModal(true)}
                      title="Gerenciar tags / etiquetas"
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* BARRA DE TAGS DA CONVERSA ATIVA */}
                <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-500">Etiquetas:</span>
                    {selectedTicket.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-white text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                      >
                        {tag}
                        <button
                          onClick={() => condoStore.removerTagTicket(condominio.id, selectedTicket.id, tag)}
                          className="text-slate-400 hover:text-rose-600 ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setShowAddTagModal(true)}
                      className="text-[10px] text-emerald-700 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Adicionar
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono">
                    Protocolo: <strong>{selectedTicket.protocolo}</strong>
                  </div>
                </div>

                {/* HISTÓRICO DE MENSAGENS (ESTILO WHATSAPP) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#e5ddd5]/30 background-whatsapp max-h-[440px]">
                  {selectedTicket.mensagens.map((msg) => {
                    // Mensagem de Sistema
                    if (msg.remetente === 'sistema') {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-3 py-1 rounded-full shadow-2xs">
                            {msg.conteudo}
                          </span>
                        </div>
                      );
                    }

                    // Nota Interna Privada (Só a equipe vê)
                    if (msg.isNotaInterna) {
                      return (
                        <div
                          key={msg.id}
                          className="bg-amber-100 border border-amber-300 text-amber-950 p-3 rounded-2xl max-w-[85%] sm:max-w-[70%] ml-auto my-2 shadow-sm space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-800">
                            <span className="flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Nota Interna (Privada)
                            </span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs font-semibold">{msg.conteudo}</p>
                          <div className="text-[9px] text-amber-700 text-right italic">
                            Registrado por: {msg.remetenteNome}
                          </div>
                        </div>
                      );
                    }

                    const isAtendente = msg.remetente === 'atendente';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAtendente ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`p-3 rounded-2xl max-w-[85%] sm:max-w-[70%] shadow-xs space-y-1 relative ${
                            isAtendente
                              ? 'bg-emerald-600 text-white rounded-tr-xs'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                          }`}
                        >
                          {/* Nome do Remetente */}
                          <div
                            className={`text-[10px] font-bold ${
                              isAtendente ? 'text-emerald-200' : 'text-emerald-700'
                            }`}
                          >
                            {msg.remetenteNome}
                          </div>

                          {/* Conteúdo de Texto ou Áudio */}
                          {msg.tipo === 'audio' ? (
                            <div className="flex items-center gap-3 py-1">
                              <button
                                type="button"
                                onClick={() => handleTogglePlayAudio(msg)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer active:scale-95 ${
                                  isAtendente
                                    ? 'bg-white text-emerald-800'
                                    : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1 space-y-1">
                                <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${isAtendente ? 'bg-white' : 'bg-emerald-600'} transition-all duration-3000 ${
                                      playingAudioId === msg.id ? 'w-full' : 'w-1/3'
                                    }`}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[9px] opacity-80">
                                  <span>0:0{msg.audioDuracao || 3}</span>
                                  <span>Áudio WhatsApp</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.conteudo}</p>
                          )}

                          {/* Timestamp & Status de Entrega */}
                          <div
                            className={`flex items-center justify-end gap-1.5 text-[9px] ${
                              isAtendente ? 'text-emerald-200' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isAtendente && (
                              <span title="Mensagem registrada e despachada para o WhatsApp">
                                <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
                              </span>
                            )}
                          </div>

                          {/* Ação Rápida de Reenvio / Abertura no WhatsApp Oficial */}
                          {isAtendente && !msg.isNotaInterna && msg.tipo === 'texto' && (
                            <div className="pt-1 flex items-center justify-between gap-2 border-t border-white/20 mt-1">
                              <span className="text-[9px] text-emerald-200 flex items-center gap-1">
                                <CheckCheck className="w-3 h-3 text-emerald-200" /> WhatsApp
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenDirectWhatsAppLink(selectedTicket.clienteTelefone, selectedTicket.clienteNome, msg.conteudo)}
                                title="Reenviar ou abrir esta mensagem diretamente no WhatsApp Web / App Oficial"
                                className="text-[9px] text-emerald-100 hover:text-white bg-white/10 hover:bg-white/25 px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                <Globe className="w-2.5 h-2.5" /> Abrir no Zap
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatMessagesEndRef} />
                </div>

                {/* BANNER DE STATUS DE ENTREGA DA MENSAGEM */}
                {chatDeliveryStatus && (
                  <div className={`px-4 py-2.5 text-xs flex items-center justify-between gap-3 border-b ${
                    chatDeliveryStatus.deliveredViaBaileys
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {chatDeliveryStatus.deliveredViaBaileys ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-bold">
                          {chatDeliveryStatus.deliveredViaBaileys
                            ? `✅ Mensagem entregue ao WhatsApp de ${chatDeliveryStatus.moradorNome}!`
                            : `ℹ️ Mensagem enviada! Para garantir entrega instantânea:`}
                        </span>
                        {!chatDeliveryStatus.deliveredViaBaileys && (
                          <span className="text-[11px] text-slate-600 ml-1">
                            Clique em "Abrir no WhatsApp" ou escaneie o QR Code na aba Conexão.
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!chatDeliveryStatus.deliveredViaBaileys && (
                        <a
                          href={chatDeliveryStatus.whatsappWebUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 transition shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          <span>Abrir no WhatsApp</span>
                        </a>
                      )}
                      <button
                        onClick={() => setChatDeliveryStatus(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* CAIXA DE DIGITAÇÃO & RESPOSTA RICA DROPDESK */}
                <div className="p-3 sm:p-4 bg-white border-t border-slate-200 space-y-2 relative">
                  {/* Seletor de Tipo: Mensagem Normal vs Nota Interna */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNotaInterna(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          !isNotaInterna
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        💬 Mensagem WhatsApp (Para Morador)
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsNotaInterna(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                          isNotaInterna
                            ? 'bg-amber-500 text-slate-950 shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Lock className="w-3 h-3" /> Nota Interna (Só Equipe)
                      </button>
                    </div>

                    {/* Atalhos Rápidos */}
                    <button
                      type="button"
                      onClick={() => setShowQuickReplyMenu(!showQuickReplyMenu)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Respostas Rápidas (/)</span>
                    </button>
                  </div>

                  {/* Menu Popup de Respostas Rápidas */}
                  {showQuickReplyMenu && (
                    <div className="absolute bottom-28 left-4 right-4 bg-white rounded-2xl border border-slate-300 shadow-2xl p-3 z-30 max-h-56 overflow-y-auto space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-xs font-black text-slate-800">
                        <span>⚡ Escolha uma Resposta Rápida:</span>
                        <button onClick={() => setShowQuickReplyMenu(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {quickReplies.map((qr) => (
                        <div
                          key={qr.id}
                          onClick={() => handleSelectQuickReply(qr)}
                          className="p-2 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200 cursor-pointer transition flex items-start justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-emerald-700">{qr.atalho}</span>
                              <span className="text-xs font-bold text-slate-900">{qr.titulo}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{qr.conteudo}</p>
                          </div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            {qr.categoria}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* BARRA DE EMOJIS RÁPIDOS */}
                  <div className="flex items-center gap-1 overflow-x-auto py-1 px-2 scrollbar-none bg-slate-100/80 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] font-bold text-slate-500 shrink-0 mr-1">Emojis:</span>
                    {['😀', '👍', '📦', '🔑', '🚪', '✅', '🙏', '🚗', '🛵', '⏳', '🚨', '📋', '👋', '📸', '🏢', '💬', '📞', '🤝'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setMessageInput((prev) => prev + emoji)}
                        className="p-1 hover:bg-white rounded-md text-sm transition hover:scale-125 shrink-0 cursor-pointer active:scale-95"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Barra de Digitação */}
                  {isRecordingAudio ? (
                    <div className="flex items-center justify-between gap-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl animate-pulse">
                      <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                        <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                        <span>Gravando Áudio WhatsApp: {recordingSeconds}s</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCancelAudio}
                          className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleStopAndSendAudio}
                          className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" /> Enviar Áudio
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <input
                          id="input-dropdesk-message"
                          type="text"
                          value={messageInput}
                          onChange={(e) => {
                            setMessageInput(e.target.value);
                            if (e.target.value === '/') {
                              setShowQuickReplyMenu(true);
                            }
                          }}
                          placeholder={
                            isNotaInterna
                              ? 'Escreva uma nota interna confidencial (visível apenas para portaria e síndico)...'
                              : 'Digite sua mensagem ou digite / para respostas rápidas...'
                          }
                          className={`w-full px-4 py-3 rounded-2xl text-xs font-medium focus:outline-none transition border ${
                            isNotaInterna
                              ? 'bg-amber-50/50 border-amber-300 focus:ring-2 focus:ring-amber-500 text-amber-950 placeholder-amber-700/60'
                              : 'bg-slate-100 border-slate-200 focus:ring-2 focus:ring-emerald-500 text-slate-900 placeholder-slate-400 focus:bg-white'
                          }`}
                        />
                      </div>

                      {/* Botão Gravar Áudio */}
                      <button
                        type="button"
                        onClick={handleStartRecording}
                        title="Gravar mensagem de voz"
                        className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer active:scale-95"
                      >
                        <Mic className="w-4 h-4 text-emerald-700" />
                      </button>

                      {/* Botão Enviar Direto no WhatsApp Web */}
                      <button
                        type="button"
                        disabled={!messageInput.trim() || isSendingChatMessage}
                        onClick={(e) => handleSendMessage(e, true)}
                        title="Enviar no chat e abrir no WhatsApp Web / App Oficial"
                        className="p-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs transition cursor-pointer flex items-center justify-center shadow-md active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        <Globe className="w-4 h-4 text-emerald-200" />
                      </button>

                      {/* Botão Enviar Principal */}
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || isSendingChatMessage}
                        className={`p-3 rounded-2xl text-white font-black text-xs transition cursor-pointer flex items-center justify-center shadow-md active:scale-95 ${
                          isNotaInterna
                            ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                            : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 disabled:bg-slate-300 disabled:cursor-not-allowed'
                        }`}
                        title="Enviar mensagem para o morador"
                      >
                        {isSendingChatMessage ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
                <MessageSquare className="w-16 h-16 text-slate-200" />
                <h3 className="text-base font-black text-slate-700">Nenhum atendimento selecionado</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Selecione um chamado na lista à esquerda ou simule uma nova mensagem recebida de morador no WhatsApp.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: INDICADORES & RELATÓRIOS (ESTILO DROPDESK) */}
      {/* ========================================================================= */}
      {activeDropDeskTab === 'indicadores' && (
        <div className="space-y-6">
          {/* CARDS DE MÉTRICAS RÁPIDAS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Atendimentos</span>
              <div className="text-2xl font-black text-slate-900 font-mono">{tickets.length}</div>
              <span className="text-[10px] text-emerald-600 font-bold">100% integrados ao WhatsApp</span>
            </div>
            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase">Em Fila de Espera</span>
              <div className="text-2xl font-black text-amber-900 font-mono">{countAguardando}</div>
              <span className="text-[10px] text-amber-700 font-medium">Tempo médio: 1.8 min</span>
            </div>
            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">Atendimentos Concluídos</span>
              <div className="text-2xl font-black text-emerald-900 font-mono">{countFinalizado}</div>
              <span className="text-[10px] text-emerald-700 font-medium">Taxa de Resolução: 92%</span>
            </div>
            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-indigo-800 uppercase">Satisfação dos Moradores</span>
              <div className="text-2xl font-black text-indigo-950 font-mono">4.9 / 5.0</div>
              <span className="text-[10px] text-indigo-700 font-medium">⭐ Excelente avaliação</span>
            </div>
          </div>

          {/* PAINÉIS DE ANÁLISE VISUAL ESTILO DROPDESK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gráfico 1: Atendimentos por Status */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  Distribuição por Status (%)
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Últimos 30 dias</span>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Fechados / Resolvidos</span>
                    <span>{tickets.length ? Math.round((countFinalizado / tickets.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${tickets.length ? (countFinalizado / tickets.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Em Atendimento Ativo</span>
                    <span>{tickets.length ? Math.round((countAtendendo / tickets.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${tickets.length ? (countAtendendo / tickets.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Em Espera / Aguardando</span>
                    <span>{tickets.length ? Math.round((countAguardando / tickets.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${tickets.length ? (countAguardando / tickets.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Cancelados</span>
                    <span>{tickets.length ? Math.round((countCancelado / tickets.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${tickets.length ? (countCancelado / tickets.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico 2: Desempenho dos Atendentes da Portaria & Síndico */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Desempenho por Atendente
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Produtividade</span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      PT
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Portaria 24 Horas</h4>
                      <p className="text-[10px] text-slate-500">Guarita Principal</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-emerald-600 font-mono">14 chamados</div>
                    <div className="text-[10px] text-slate-400">Tempo: 1.4 min</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                      SD
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">{condominio.sindicoNome}</h4>
                      <p className="text-[10px] text-slate-500">Síndico Geral</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-indigo-600 font-mono">8 chamados</div>
                    <div className="text-[10px] text-slate-400">Tempo: 3.2 min</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: RESPOSTAS RÁPIDAS / MACROS */}
      {/* ========================================================================= */}
      {activeDropDeskTab === 'respostas_rapidas' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                Respostas Rápidas & Macros DropDesk
              </h3>
              <p className="text-xs text-slate-500">
                Responda dúvidas frequentes de moradores no WhatsApp em 1 clique digitando o atalho com <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700 font-bold">/</code>.
              </p>
            </div>
            <button
              id="btn-add-quick-reply"
              onClick={() => setShowAddQuickReplyModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Resposta Rápida</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickReplies.map((qr) => (
              <div
                key={qr.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs font-black font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      {qr.atalho}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 mt-1.5">{qr.titulo}</h4>
                  </div>
                  <button
                    onClick={() => condoStore.deleteWhatsAppQuickReply(condominio.id, qr.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition"
                    title="Excluir macro"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80 leading-relaxed italic">
                  "{qr.conteudo}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span className="uppercase font-bold">Categoria: {qr.categoria}</span>
                  <span className="text-emerald-700 font-semibold">Suporta variáveis {'{nome}'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: CONEXÃO WHATSAPP ORIGINAL & QR CODE MULTI-DEVICE */}
      {/* ========================================================================= */}
      {activeDropDeskTab === 'conexao_qr' && (
        <div className="space-y-6">
          {/* SE ESTIVER CONECTADO: PAINEL DE DISPOSITIVO ATIVO */}
          {config.status === 'conectado' && config.numeroConectado ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm space-y-6">
              {/* Header de Status Ativo */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Dispositivo Pareado
                      </span>
                      <span className="text-xs text-emerald-800 font-bold">Sessão WhatsApp Ativa (Multi-Device)</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mt-0.5">
                      {config.nomePerfil || 'WhatsApp Oficial Portaria'}
                    </h3>
                    <p className="text-xs font-mono font-bold text-emerald-700">
                      📱 {config.numeroConectado}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      audioAlertService.playActionSuccessSound();
                      confetti({ particleCount: 40, spread: 50 });
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-black hover:bg-emerald-50 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Testar Ping (12ms)</span>
                  </button>
                  <button
                    onClick={handleDesconectarWhatsApp}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition shadow-md shadow-rose-600/20 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Desconectar Aparelho</span>
                  </button>
                </div>
              </div>

              {/* Informações Técnicas e de Diagnóstico da Sessão Real */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Número do WhatsApp</span>
                  <span className="text-sm font-black text-slate-900 font-mono">{config.numeroConectado}</span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">🟢 Verificado & Autenticado</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Perfil Comercial</span>
                  <span className="text-sm font-black text-slate-900">{config.nomePerfil || 'Portaria'}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{config.plataforma || 'WhatsApp Business'}</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Bateria do Celular</span>
                  <span className="text-sm font-black text-slate-900">🔋 {config.bateria || 98}%</span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Conectado na Tomada</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Protocolo & Engine</span>
                  <span className="text-xs font-mono font-bold text-slate-800">Baileys Multi-Device v2</span>
                  <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">🟢 Webhook Escutando</span>
                </div>
              </div>

              {/* Dica de Utilização */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-slate-700 text-xs space-y-1">
                <strong className="text-emerald-950 block font-black">ℹ️ Como as mensagens operam com sua linha conectada:</strong>
                <p>
                  Todas as notificações de encomendas, recados e respostas da portaria e do síndico saem diretamente pelo número oficial <strong className="font-mono text-emerald-800">{config.numeroConectado}</strong>.
                  Quando moradores mandarem mensagens para este número, elas entrarão instantaneamente na fila de atendimentos com alerta sonoro.
                </p>
              </div>
            </div>
          ) : (
            /* SE ESTIVER DESCONECTADO: SELETOR DE MÉTODOS & QR CODE ORIGINAL WHATSAPP WEB */
            <div className="space-y-6">
              {/* Seletor de Modo de Conexão */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Conexão Oficial WhatsApp</h3>
                    <p className="text-xs text-slate-500">Escolha o método de pareamento desejado para o chip da guarita:</p>
                  </div>
                </div>

                {/* Botões de Seleção de Método */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
                  <button
                    onClick={() => setPairingMethod('qrcode')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                      pairingMethod === 'qrcode'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>QR Code Original</span>
                  </button>

                  <button
                    onClick={() => setPairingMethod('pairing_code')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                      pairingMethod === 'pairing_code'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    <span>Código 8 Dígitos</span>
                  </button>

                  <button
                    onClick={() => setPairingMethod('api_evolution')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                      pairingMethod === 'api_evolution'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    <span>Evolution API</span>
                  </button>
                </div>
              </div>

              {/* MODO 1: QR CODE ORIGINAL EM ALTA DEFINIÇÃO ESTILO WHATSAPP WEB */}
              {pairingMethod === 'qrcode' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
                  {/* Lado Esquerdo: Quadro do QR Code Escuro com Moldura WhatsApp Web */}
                  <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-950 text-white rounded-3xl text-center space-y-5 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl" />

                    <div className="space-y-1 relative z-10">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        WhatsApp Web Original
                      </div>
                      <h3 className="text-lg font-black text-white">Escaneie o QR Code</h3>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Aponte a câmera em <strong>Aparelhos Conectados</strong> no WhatsApp da Portaria.
                      </p>
                    </div>

                    {/* Moldura do QR Code Autêntico (Renderizado por QRCode canvas/image) */}
                    <div className="p-4 bg-white rounded-2xl shadow-2xl relative group border-4 border-emerald-500/80">
                      {isGeneratingQr || !realQrCodeDataUrl ? (
                        <div className="w-64 h-64 flex flex-col items-center justify-center bg-slate-100 rounded-xl space-y-2">
                          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                          <span className="text-xs font-bold text-slate-600">Gerando QR Code Criptografado...</span>
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Imagem Real do QR Code em Alta Resolução */}
                          <img
                            src={realQrCodeDataUrl}
                            alt="WhatsApp Web QR Code Original"
                            className="w-64 h-64 object-contain rounded-xl"
                          />

                          {/* Logo Oficial WhatsApp no Centro (Padrão WhatsApp Web) */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl border-3 border-white">
                              <Phone className="w-6 h-6 fill-current" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Temporizador de Expiração e Ações do QR Code */}
                    <div className="w-full max-w-xs space-y-3 relative z-10">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Expira em <strong className="text-white font-mono">{qrCodeTimeLeft}s</strong></span>
                        </div>
                        <button
                          onClick={() => {
                            setQrCodeTimeLeft(60);
                            setQrCodeSeed(Date.now());
                            audioAlertService.playActionSuccessSound();
                          }}
                          className="text-emerald-400 hover:text-emerald-300 font-black flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Recarregar QR</span>
                        </button>
                      </div>

                      {/* Botões Rápidos */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleDownloadQrCode}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold transition cursor-pointer"
                          title="Baixar imagem PNG do QR Code para impressão"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Baixar PNG</span>
                        </button>

                        <button
                          onClick={() => handleCopy(rawSessionString, 'payload')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold transition cursor-pointer"
                          title="Copiar token Baileys Multi-Device"
                        >
                          <Copy className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{copiedItem === 'payload' ? 'Copiado!' : 'Copiar Token'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lado Direito: Passo a Passo & Confirmação Rápida */}
                  <div className="lg:col-span-7 space-y-6">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                        Passo a Passo no Celular
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">
                        Como conectar pelo WhatsApp da Guarita
                      </h3>
                      <p className="text-xs text-slate-500">
                        O processo é idêntico ao WhatsApp Web que você já usa no computador:
                      </p>
                    </div>

                    {/* 3 Passos Ilustrados */}
                    <div className="space-y-3">
                      <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          1
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">Abra o WhatsApp no celular da Guarita</h4>
                          <p className="text-xs text-slate-500">Funciona tanto com WhatsApp Normal quanto WhatsApp Business.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          2
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">Acesse Aparelhos Conectados</h4>
                          <p className="text-xs text-slate-500">
                            No <strong>Android</strong>: Toque nos 3 pontinhos (⋮) &gt; <strong>Aparelhos Conectados</strong>.<br />
                            No <strong>iPhone</strong>: Toque em <strong>Configurações (⚙️)</strong> &gt; <strong>Aparelhos Conectados</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          3
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">Toque em "Conectar um Aparelho"</h4>
                          <p className="text-xs text-slate-500">Aponte a câmera para o QR Code ao lado para autenticar.</p>
                        </div>
                      </div>
                    </div>

                    {/* CARD DE AÇÃO RÁPIDA: CONFIRMAÇÃO OU AUTODETECÇÃO */}
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-emerald-950 flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          Confirmar Linha do Aparelho
                        </h4>
                        <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-md">
                          100% Automático
                        </span>
                      </div>

                      <form onSubmit={handleConfirmarPareamento} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-black text-slate-800 mb-1">
                              Número do WhatsApp do Chip *
                            </label>
                            <input
                              id="input-whatsapp-real-phone"
                              type="tel"
                              required
                              value={pairingPhoneInput}
                              onChange={(e) => setPairingPhoneInput(e.target.value)}
                              placeholder="Ex: (11) 98765-4321"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                            />
                            <span className="text-[10px] text-slate-500 block mt-1">
                              Número do chip pareado no QR Code.
                            </span>
                          </div>

                          <div>
                            <label className="block text-xs font-black text-slate-800 mb-1">
                              Nome do Perfil WhatsApp
                            </label>
                            <input
                              id="input-whatsapp-real-name"
                              type="text"
                              value={pairingProfileName}
                              onChange={(e) => setPairingProfileName(e.target.value)}
                              placeholder={`Portaria ${condominio.nome}`}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
                            />
                            <span className="text-[10px] text-slate-500 block mt-1">
                              Nome exibido aos moradores.
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={isSubmittingPairing}
                            className="w-full sm:flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-black text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {isSubmittingPairing ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Autenticando Sessão com WhatsApp...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Confirmar Pareamento e Conectar</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={handleSimularLeituraCelular}
                            disabled={isSubmittingPairing}
                            className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-white border-2 border-emerald-500 hover:bg-emerald-50 text-emerald-800 font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Simular escaneamento imediato da câmera"
                          >
                            <Smartphone className="w-4 h-4 text-emerald-600" />
                            <span>Simular Leitura no Celular</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* MODO 2: CÓDIGO DE PAREAMENTO DE 8 DÍGITOS (SEM USAR A CÂMERA) */}
              {pairingMethod === 'pairing_code' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                  <div className="max-w-xl mx-auto text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                      <Key className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900">Conectar com Código de 8 Dígitos</h3>
                      <p className="text-xs text-slate-500">
                        Novo recurso oficial do WhatsApp Web: conecte sem precisar apontar a câmera do celular.
                      </p>
                    </div>

                    {/* Display do Código de 8 Dígitos */}
                    <div className="p-6 bg-slate-950 rounded-3xl text-white space-y-3 border-2 border-emerald-500/50 shadow-2xl relative overflow-hidden">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block font-bold">
                        CÓDIGO DE PAREAMENTO WHATSAPP
                      </span>
                      <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-emerald-400 py-2">
                        {pairingCodeString}
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          onClick={() => handleCopy(pairingCodeString, 'code')}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer shadow-md shadow-emerald-600/20"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedItem === 'code' ? 'Código Copiado!' : 'Copiar Código'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setQrCodeSeed(Date.now());
                            audioAlertService.playActionSuccessSound();
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Gerar Novo</span>
                        </button>
                      </div>
                    </div>

                    {/* Instruções de Digitação no Celular */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 text-slate-700">
                      <strong className="block text-slate-900 font-black">Como digitar este código no WhatsApp:</strong>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600">
                        <li>Abra o WhatsApp no celular da portaria.</li>
                        <li>Vá em <strong>Aparelhos Conectados</strong> &gt; <strong>Conectar um aparelho</strong>.</li>
                        <li>Toque na opção inferior: <strong>"Conectar com número de telefone"</strong>.</li>
                        <li>Digite o código de 8 dígitos <strong className="font-mono text-emerald-700">{pairingCodeString}</strong> que apareceu acima.</li>
                      </ol>
                    </div>

                    <button
                      onClick={handleSimularLeituraCelular}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Conexão com Código Digitado</span>
                    </button>
                  </div>
                </div>
              )}

              {/* MODO 3: EVOLUTION API / SERVIDOR DEDICADO */}
              {pairingMethod === 'api_evolution' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-wider bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full">
                        Servidor Dedicado (Evolution API / Baileys)
                      </span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">
                        Integração de Servidor Próprio de WhatsApp
                      </h3>
                      <p className="text-xs text-slate-500">
                        Se o seu condomínio ou administradora possui uma VPS ou servidor Evolution API rodando, conecte diretamente:
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black px-3 py-1 rounded-xl flex items-center gap-1.5 ${
                        evolutionApiStatus === 'online'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : evolutionApiStatus === 'testing'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          evolutionApiStatus === 'online'
                            ? 'bg-emerald-500 animate-ping'
                            : evolutionApiStatus === 'testing'
                            ? 'bg-amber-500 animate-spin'
                            : 'bg-slate-400'
                        }`} />
                        Status: {evolutionApiStatus === 'online' ? 'Online (Conectado)' : evolutionApiStatus === 'testing' ? 'Testando...' : 'Motor Embutido Ativo'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        URL do Servidor Evolution API
                      </label>
                      <input
                        type="text"
                        value={customServerUrl}
                        onChange={(e) => setCustomServerUrl(e.target.value)}
                        placeholder="https://api.evolution.meucondominio.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Endpoint base da API (sem barra no final).
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 mb-1">
                        Global API Key / Token de Autenticação
                      </label>
                      <input
                        type="password"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="Chave secreta de autenticação"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Header <code>apikey</code> exigido pela Evolution API.
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={handleTestEvolutionApi}
                      disabled={isFetchingEvolutionQr}
                      className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                    >
                      {isFetchingEvolutionQr ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Buscando QR Code da API Remota...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Buscar QR Code da Evolution API ao Vivo</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleSimularLeituraCelular}
                      className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Salvar e Autenticar Instância</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: MORADORES & AGENDA WHATSAPP */}
      {/* ========================================================================= */}
      {activeDropDeskTab === 'contatos' && (
        <div className="space-y-4">
          {/* Header & Filtros da Agenda */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                  Agenda de Moradores do Condomínio
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Contatos de Moradores & Disparos WhatsApp
                </h3>
                <p className="text-xs text-slate-500">
                  Consulte moradores, inicie atendimentos no DropDesk ou dispare notificações estruturadas (Encomenda, Bicicletário, Garagem e Portaria).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAbrirModalNotificacao(null, 'encomenda')}
                  className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  <span>Nova Notificação Rápida</span>
                </button>
              </div>
            </div>

            {/* Barra de Busca e Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
              <div className="sm:col-span-8 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  placeholder="Buscar por nome, apartamento, bloco ou telefone..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {contactSearchQuery && (
                  <button
                    onClick={() => setContactSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="sm:col-span-4 flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-slate-500 shrink-0 mr-1">Bloco:</span>
                {['todos', ...Array.from(new Set(moradores.map((m) => m.unidade?.bloco || '1'))).sort()].map((bloco) => (
                  <button
                    key={bloco}
                    type="button"
                    onClick={() => setContactBlocoFilter(bloco)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      contactBlocoFilter === bloco
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {bloco === 'todos' ? 'Todos' : `Bloco ${bloco}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Métricas Rápidas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Moradores</span>
                <p className="text-lg font-black text-slate-900">{moradores.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Com WhatsApp Ativo</span>
                <p className="text-lg font-black text-emerald-900">
                  {moradores.filter((m) => (m.telefone || '').replace(/\D/g, '').length >= 10).length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-indigo-700">Atendimentos Abertos</span>
                <p className="text-lg font-black text-indigo-900">
                  {tickets.filter((t) => t.status === 'aguardando' || t.status === 'atendendo').length}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                <span className="text-[10px] uppercase font-bold text-amber-700">Notificações Prontas</span>
                <p className="text-lg font-black text-amber-900">100% Baileys</p>
              </div>
            </div>
          </div>

          {/* Grid de Cards dos Moradores */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {moradores
              .filter((m) => {
                const query = contactSearchQuery.toLowerCase().trim();
                const matchQuery =
                  !query ||
                  m.nome.toLowerCase().includes(query) ||
                  (m.unidade?.apto || '').toLowerCase().includes(query) ||
                  (m.unidade?.bloco || '').toLowerCase().includes(query) ||
                  (m.telefone || '').replace(/\D/g, '').includes(query.replace(/\D/g, ''));

                const matchBloco =
                  contactBlocoFilter === 'todos' || (m.unidade?.bloco || '1') === contactBlocoFilter;

                return matchQuery && matchBloco;
              })
              .map((morador) => {
                const ticketAberto = tickets.find(
                  (t) =>
                    (t.clienteId === morador.id || t.clienteTelefone === morador.telefone) &&
                    (t.status === 'aguardando' || t.status === 'atendendo')
                );

                return (
                  <div
                    key={morador.id}
                    className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Topo do Card: Avatar, Nome, Unidade e Badge de Chamado */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center border border-emerald-200 shrink-0 overflow-hidden">
                            {morador.avatarUrl ? (
                              <img
                                src={morador.avatarUrl}
                                alt={morador.nome}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              morador.nome.charAt(0)
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-900 leading-snug">{morador.nome}</h4>
                            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <span>🏢 Bloco {morador.unidade?.bloco || '1'} - Apto {morador.unidade?.apto}</span>
                            </p>
                          </div>
                        </div>

                        {ticketAberto ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            {ticketAberto.status === 'aguardando' ? 'Fila' : 'Em Atendimento'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                            Disponível
                          </span>
                        )}
                      </div>

                      {/* Informações de Contato */}
                      <div className="space-y-1.5 bg-slate-50/80 rounded-2xl p-3 border border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-[10px] uppercase font-bold text-slate-400">WhatsApp:</span>
                          <span className="font-mono font-bold text-slate-900">{morador.telefone || 'Não informado'}</span>
                        </div>
                        {morador.email && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-[10px] uppercase font-bold text-slate-400">E-mail:</span>
                            <span className="truncate max-w-[160px] text-slate-700">{morador.email}</span>
                          </div>
                        )}
                        {ticketAberto && (
                          <div className="pt-1 border-t border-slate-200/60 text-[11px] text-emerald-800 font-medium">
                            💬 Última: <em>"{ticketAberto.ultimaMensagem}"</em>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação Direta */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="grid grid-cols-2 gap-2">
                        {/* Botão 1: Abrir Chat no DropDesk */}
                        <button
                          type="button"
                          onClick={() => handleAbrirChatMorador(morador)}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center justify-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Abrir Chat</span>
                        </button>

                        {/* Botão 2: Abrir no WhatsApp Web Oficial */}
                        <button
                          type="button"
                          onClick={() => handleOpenDirectWhatsAppLink(morador.telefone, morador.nome)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition flex items-center justify-center gap-1.5 border border-slate-200 active:scale-95 cursor-pointer"
                          title="Abrir diretamente no WhatsApp Web ou App oficial"
                        >
                          <Globe className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp Web</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Botão 3: Disparar Notificação Rápida */}
                        <button
                          type="button"
                          onClick={() => handleAbrirModalNotificacao(morador, 'encomenda')}
                          className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-black text-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 text-amber-600" />
                          <span>Notificar</span>
                        </button>

                        {/* Botão 4: Interfone WebRTC */}
                        <button
                          type="button"
                          onClick={() => {
                            audioAlertService.playIntercomRingtone();
                            alert(`📞 Chamando ${morador.nome} (Apto ${morador.unidade?.apto}) via Interfone WebRTC...`);
                          }}
                          className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-black text-xs transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Interfone</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: DISPARO EM MASSA / BROADCAST (SÍNDICO) */}
      {/* ========================================================================= */}
      {activeDropDeskTab === 'broadcast' && (
        <div className="space-y-4">
          <WhatsAppBroadcastPanel condominio={condominio} moradores={moradores} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TRANSFERIR ATENDIMENTO */}
      {/* ========================================================================= */}
      {showTransferModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Transferir Atendimento</h3>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Selecione o setor ou atendente de destino para o chamado <strong>{selectedTicket.id}</strong> ({selectedTicket.clienteNome}):
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleTransferir('sindico', condominio.sindicoNome)}
                className="w-full p-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-black text-indigo-950">🏛️ Transferir para Síndico / Administração</h4>
                  <p className="text-[10px] text-indigo-700">{condominio.sindicoNome}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-600" />
              </button>

              <button
                onClick={() => handleTransferir('portaria', 'Portaria 24h')}
                className="w-full p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-black text-amber-950">🛡️ Transferir para Portaria / Guarita</h4>
                  <p className="text-[10px] text-amber-700">Porteiro de Plantão</p>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-600" />
              </button>

              <button
                onClick={() => handleTransferir('zeladoria', 'Zelador')}
                className="w-full p-3.5 rounded-2xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-left transition flex items-center justify-between cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-black text-teal-950">🛠️ Transferir para Zeladoria / Manutenção</h4>
                  <p className="text-[10px] text-teal-700">Equipe Predial</p>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-600" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FECHAR / FINALIZAR ATENDIMENTO */}
      {/* ========================================================================= */}
      {showFinishModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Encerrar Chamado {selectedTicket.id}</h3>
              </div>
              <button onClick={() => setShowFinishModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                Resumo / Motivo do Encerramento:
              </label>
              <textarea
                value={finishReason}
                onChange={(e) => setFinishReason(e.target.value)}
                rows={3}
                placeholder="Descreva a resolução para registro histórico..."
                className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleFinalizar('cancelado')}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition cursor-pointer"
              >
                Cancelar Chamado
              </button>
              <button
                type="button"
                onClick={() => handleFinalizar('finalizado')}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GERAR OCORRÊNCIA A PARTIR DO CHAT */}
      {/* ========================================================================= */}
      {showOcorrenciaModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Gerar Ocorrência Formal</h3>
              </div>
              <button onClick={() => setShowOcorrenciaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              O histórico da conversa com <strong>{selectedTicket.clienteNome}</strong> será anexado automaticamente no livro digital de ocorrências do condomínio.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título da Ocorrência:</label>
                <input
                  type="text"
                  value={ocorrenciaTitulo}
                  onChange={(e) => setOcorrenciaTitulo(e.target.value)}
                  placeholder={`Ex: ${selectedTicket.assunto}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria:</label>
                <select
                  value={ocorrenciaCategoria}
                  onChange={(e) => setOcorrenciaCategoria(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="barulho">🔊 Barulho / Perturbação</option>
                  <option value="vazamento">💧 Vazamento / Hidráulica</option>
                  <option value="garagem">🚗 Garagem / Estacionamento</option>
                  <option value="seguranca">🛡️ Segurança / Acesso</option>
                  <option value="manutencao">🛠️ Manutenção Predial</option>
                  <option value="outro">📋 Outro Motivo</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOcorrenciaModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGerarOcorrencia}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition"
              >
                Registrar no Painel do Síndico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAR RESPOSTA RÁPIDA */}
      {/* ========================================================================= */}
      {showAddQuickReplyModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Nova Resposta Rápida (Macro)</h3>
              </div>
              <button onClick={() => setShowAddQuickReplyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Atalho (ex: /encomenda):</label>
                <input
                  type="text"
                  value={newQrAtalho}
                  onChange={(e) => setNewQrAtalho(e.target.value)}
                  placeholder="/meuatalho"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título / Identificação:</label>
                <input
                  type="text"
                  value={newQrTitulo}
                  onChange={(e) => setNewQrTitulo(e.target.value)}
                  placeholder="Ex: 📦 Aviso de Encomenda"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Conteúdo da Mensagem:</label>
                <textarea
                  value={newQrConteudo}
                  onChange={(e) => setNewQrConteudo(e.target.value)}
                  rows={4}
                  placeholder="Olá {nome}! Sua encomenda está disponível na portaria..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Variáveis disponíveis: <code className="text-emerald-700 font-bold">{'{nome}'}</code>, <code className="text-emerald-700 font-bold">{'{apto}'}</code>, <code className="text-emerald-700 font-bold">{'{bloco}'}</code>, <code className="text-emerald-700 font-bold">{'{condominio}'}</code>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddQuickReplyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!newQrAtalho || !newQrConteudo}
                onClick={() => {
                  condoStore.addWhatsAppQuickReply(condominio.id, {
                    atalho: newQrAtalho,
                    titulo: newQrTitulo || newQrAtalho,
                    conteudo: newQrConteudo,
                    categoria: newQrCategoria,
                  });
                  setShowAddQuickReplyModal(false);
                  setNewQrAtalho('');
                  setNewQrTitulo('');
                  setNewQrConteudo('');
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md disabled:bg-slate-300"
              >
                Salvar Macro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADICIONAR ETIQUETA / TAG */}
      {/* ========================================================================= */}
      {showAddTagModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Adicionar Etiqueta</h3>
              </div>
              <button onClick={() => setShowAddTagModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome da Tag:</label>
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="Ex: #Encomenda, #Urgente, 7-ETIQUETAS"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {['#Encomenda', '#Visitante', '#Barulho', '#Manutenção', '#Boleto', '#Portão', '8 - IMENDES'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setNewTagInput(preset)}
                  className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 px-2 py-1 rounded-md border border-slate-200 transition"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTagModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!newTagInput.trim()}
                onClick={handleAddTag}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black disabled:bg-slate-300"
              >
                Adicionar Tag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SIMULADOR DE MENSAGEM RECEBIDA VIA WHATSAPP */}
      {/* ========================================================================= */}
      {showSimuladorModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Simulador de WhatsApp de Morador</h3>
              </div>
              <button onClick={() => setShowSimuladorModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Este simulador dispara uma mensagem como se um morador real tivesse enviado uma mensagem para o WhatsApp da Portaria/SmartCondo. O chamado entrará imediatamente na fila!
            </p>

            <form onSubmit={handleSimularMensagem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Morador:</label>
                  <input
                    type="text"
                    required
                    value={simuladorNome}
                    onChange={(e) => setSimuladorNome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone WhatsApp:</label>
                  <input
                    type="text"
                    required
                    value={simuladorTelefone}
                    onChange={(e) => setSimuladorTelefone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bloco:</label>
                  <input
                    type="text"
                    value={simuladorBloco}
                    onChange={(e) => setSimuladorBloco(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apartamento:</label>
                  <input
                    type="text"
                    value={simuladorApto}
                    onChange={(e) => setSimuladorApto(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mensagem do Morador:</label>
                <textarea
                  required
                  rows={3}
                  value={simuladorMensagem}
                  onChange={(e) => setSimuladorMensagem(e.target.value)}
                  placeholder="Escreva a mensagem que o morador está enviando..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Mensagens rápidas pré-definidas */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500">Exemplos rápidos:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSimuladorMensagem('Boa tarde, chegou alguma encomenda pro meu apto hoje?')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md"
                  >
                    📦 Pergunta Encomenda
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimuladorMensagem('Portaria, pode liberar a entrada do meu irmão que acabou de chegar aí?')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md"
                  >
                    👤 Liberar Visitante
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimuladorMensagem('Olá, tem alguém com som alto no andar de cima, poderiam verificar?')}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md"
                  >
                    🔊 Reclamação Barulho
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSimuladorModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-600/20"
                >
                  🚀 Enviar e Receber no Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DISPARO DE NOTIFICAÇÃO RÁPIDA WHATSAPP */}
      {/* ========================================================================= */}
      {showQuickNotificationModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Disparo de Notificação Rápida WhatsApp</h3>
                  <p className="text-xs text-slate-500">Envio automático formatado para o morador via WhatsApp Baileys</p>
                </div>
              </div>
              <button onClick={() => setShowQuickNotificationModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickNotifSuccessResult ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4 animate-in zoom-in-95">
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
                  <CheckCheck className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-black text-emerald-950">Notificação Enviada com Sucesso!</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    A mensagem foi disparada para <strong>{notifTargetMorador?.nome}</strong> ({notifTargetMorador?.telefone}) e já está registrada no histórico de conversas do DropDesk.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (notifTargetMorador) {
                        handleOpenDirectWhatsAppLink(notifTargetMorador.telefone, notifTargetMorador.nome);
                      }
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Ver no WhatsApp Web</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (notifTargetMorador) {
                        handleAbrirChatMorador(notifTargetMorador);
                        setShowQuickNotificationModal(false);
                      }
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Abrir Conversa no DropDesk</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setQuickNotifSuccessResult(null);
                      setNotifPin(Math.floor(100000 + Math.random() * 900000).toString());
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition cursor-pointer"
                  >
                    Enviar Outra Notificação
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEnviarNotificacaoRapida} className="space-y-4">
                {/* 1. SELETOR DE MORADOR DESTINATÁRIO */}
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    👤 Morador Destinatário:
                  </label>
                  <select
                    value={notifTargetMorador?.id || ''}
                    onChange={(e) => {
                      const m = moradores.find((mor) => mor.id === e.target.value) || null;
                      setNotifTargetMorador(m);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {moradores.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} — Bloco {m.unidade?.bloco || '1'} Apto {m.unidade?.apto} ({m.telefone || 'Sem WhatsApp'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. CATEGORIAS DE NOTIFICAÇÃO RÁPIDA */}
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">
                    📂 Categoria do Disparo:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { id: 'encomenda', label: 'Encomenda', icon: Package, color: 'hover:border-amber-400' },
                      { id: 'bicicleta', label: 'Bicicletário', icon: Bike, color: 'hover:border-emerald-400' },
                      { id: 'veiculo', label: 'Garagem/Carro', icon: Car, color: 'hover:border-blue-400' },
                      { id: 'visitante', label: 'Visitante', icon: UserCheck, color: 'hover:border-indigo-400' },
                      { id: 'aviso', label: 'Comunicado', icon: FileText, color: 'hover:border-teal-400' },
                      { id: 'interfone', label: 'Interfone PTT', icon: PhoneCall, color: 'hover:border-rose-400' },
                    ].map((cat) => {
                      const Icon = cat.icon;
                      const isSel = notifCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNotifCategory(cat.id as any)}
                          className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                            isSel
                              ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-500'
                              : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-600 font-bold'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSel ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <span className="text-[11px] leading-tight">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. CAMPOS ESPECÍFICOS POR CATEGORIA */}
                {notifCategory === 'encomenda' && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                    <h5 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-amber-700" />
                      <span>Detalhes da Encomenda</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Transportadora:</label>
                        <select
                          value={notifTransportadora}
                          onChange={(e) => setNotifTransportadora(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold"
                        >
                          {['Mercado Livre', 'Amazon', 'Shopee', 'Correios', 'Shein', 'Jadlog', 'FedEx', 'Magalu', 'Outro'].map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">PIN de Resgate:</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={notifPin}
                            onChange={(e) => setNotifPin(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-black text-emerald-800"
                          />
                          <button
                            type="button"
                            onClick={() => setNotifPin(Math.floor(100000 + Math.random() * 900000).toString())}
                            className="p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700"
                            title="Gerar novo PIN"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Prazo de Retirada:</label>
                        <select
                          value={notifPrazoDias}
                          onChange={(e) => setNotifPrazoDias(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold"
                        >
                          <option value={3}>3 dias corridos</option>
                          <option value={5}>5 dias corridos</option>
                          <option value={7}>7 dias corridos</option>
                          <option value={10}>10 dias corridos</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {notifCategory === 'bicicleta' && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-3">
                    <h5 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                      <Bike className="w-4 h-4 text-emerald-700" />
                      <span>Detalhes do Bicicletário</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Ação:</label>
                        <select
                          value={notifBikeAcao}
                          onChange={(e) => setNotifBikeAcao(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold"
                        >
                          <option value="retirada">🚲 Retirada de Bike</option>
                          <option value="devolucao">✅ Devolução com Vistoria</option>
                          <option value="reserva_5min">⏱️ Reserva de 5 min</option>
                          <option value="alerta_vaga">⚠️ Alerta de Vaga / Cadeado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Número / Tag Bike:</label>
                        <input
                          type="text"
                          value={notifBikeNumero}
                          onChange={(e) => setNotifBikeNumero(e.target.value)}
                          placeholder="Ex: 01, 14, 28"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Modelo da Bike:</label>
                        <input
                          type="text"
                          value={notifBikeModelo}
                          onChange={(e) => setNotifBikeModelo(e.target.value)}
                          placeholder="Ex: Caloi Urbana Preta"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {notifCategory === 'veiculo' && (
                  <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-3">
                    <h5 className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-blue-700" />
                      <span>Alerta de Garagem / Veículo</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Ocorrência:</label>
                        <select
                          value={notifVeiculoTipo}
                          onChange={(e) => setNotifVeiculoTipo(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold"
                        >
                          <option value="farol">💡 Farol Aceso</option>
                          <option value="vidro">🪟 Vidro Aberto</option>
                          <option value="vaga_presa">🚗 Vaga Presa / Trancando</option>
                          <option value="alarme">🚨 Alarme Disparando</option>
                          <option value="outro">⚠️ Estacionamento Irregular</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Placa:</label>
                        <input
                          type="text"
                          value={notifVeiculoPlaca}
                          onChange={(e) => setNotifVeiculoPlaca(e.target.value)}
                          placeholder="Ex: ABC-1234"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Modelo / Cor:</label>
                        <input
                          type="text"
                          value={notifVeiculoModelo}
                          onChange={(e) => setNotifVeiculoModelo(e.target.value)}
                          placeholder="Ex: Honda Civic Prata"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {notifCategory === 'visitante' && (
                  <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-3">
                    <h5 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-700" />
                      <span>Chegada de Visitante ou Entregador</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome do Visitante:</label>
                        <input
                          type="text"
                          required
                          value={notifVisitanteNome}
                          onChange={(e) => setNotifVisitanteNome(e.target.value)}
                          placeholder="Ex: Carlos Eduardo"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo:</label>
                        <select
                          value={notifVisitanteTipo}
                          onChange={(e) => setNotifVisitanteTipo(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold"
                        >
                          <option value="delivery">🛵 Delivery / Entregador</option>
                          <option value="visitante">👤 Visitante Social</option>
                          <option value="prestador">🛠️ Prestador de Serviços</option>
                          <option value="corretor">🏢 Corretor de Imóveis</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Empresa / App:</label>
                        <input
                          type="text"
                          value={notifVisitanteEmpresa}
                          onChange={(e) => setNotifVisitanteEmpresa(e.target.value)}
                          placeholder="Ex: iFood, Enel, Encomenda"
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {notifCategory === 'aviso' && (
                  <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3">
                    <h5 className="text-xs font-black text-teal-950 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-700" />
                      <span>Comunicado / Recado Livre</span>
                    </h5>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Título do Aviso:</label>
                      <input
                        type="text"
                        value={notifAvisoTitulo}
                        onChange={(e) => setNotifAvisoTitulo(e.target.value)}
                        placeholder="Ex: Recado Importante da Portaria"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Mensagem:</label>
                      <textarea
                        rows={2}
                        value={notifAvisoMensagem}
                        onChange={(e) => setNotifAvisoMensagem(e.target.value)}
                        placeholder="Escreva os detalhes que serão enviados ao WhatsApp do morador..."
                        className="w-full p-3 rounded-xl bg-white border border-slate-300 text-xs font-medium"
                      />
                    </div>
                  </div>
                )}

                {/* 4. PREVIEW EM TEMPO REAL DA MENSAGEM WHATSAPP */}
                <div className="p-3.5 rounded-2xl bg-[#e5ddd5]/40 border border-slate-200 space-y-1.5">
                  <span className="text-[10px] uppercase font-black tracking-wider text-slate-500 flex items-center gap-1">
                    <Smartphone className="w-3 h-3" /> Preview WhatsApp:
                  </span>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 shadow-2xs font-mono whitespace-pre-wrap leading-relaxed">
                    {notifCategory === 'encomenda' && (
                      <>
                        📦 *NOVA ENCOMENDA RECEBIDA!* 📦{'\n\n'}
                        Olá, *{notifTargetMorador?.nome || 'Morador'}*!{'\n'}
                        Unidade: Bloco {notifTargetMorador?.unidade?.bloco || '1'} - Apto {notifTargetMorador?.unidade?.apto}{'\n'}
                        Transportadora: *{notifTransportadora}*{'\n\n'}
                        🔐 *PIN de Retirada:* {notifPin}{'\n'}
                        ⏱️ Prazo: {notifPrazoDias} dias corridos.{'\n\n'}
                        _Portaria do {condominio.nome}_
                      </>
                    )}
                    {notifCategory === 'bicicleta' && (
                      <>
                        🚲 *BICICLETÁRIO - ATUALIZAÇÃO* 🚲{'\n\n'}
                        Olá, *{notifTargetMorador?.nome || 'Morador'}*!{'\n'}
                        Ação: *{notifBikeAcao.toUpperCase()}*{'\n'}
                        Bike #{notifBikeNumero} ({notifBikeModelo}){'\n\n'}
                        _Portaria do {condominio.nome}_
                      </>
                    )}
                    {notifCategory === 'veiculo' && (
                      <>
                        🚗 *ALERTA DE GARAGEM / VEÍCULO* 🚗{'\n\n'}
                        Olá, *{notifTargetMorador?.nome || 'Morador'}*!{'\n'}
                        Ocorrência: *{notifVeiculoTipo.toUpperCase()}*{'\n'}
                        Placa: {notifVeiculoPlaca || 'Identificada'} | {notifVeiculoModelo || 'Veículo'}{'\n\n'}
                        Por favor, compareça à garagem ou verifique seu veículo.{'\n\n'}
                        _Portaria do {condominio.nome}_
                      </>
                    )}
                    {notifCategory === 'visitante' && (
                      <>
                        🚪 *CHEGADA NA PORTARIA* 🚪{'\n\n'}
                        Olá, *{notifTargetMorador?.nome || 'Morador'}*!{'\n'}
                        *{notifVisitanteNome || 'Visitante'}* ({notifVisitanteEmpresa || notifVisitanteTipo}) está na guarita aguardando liberação para sua unidade.{'\n\n'}
                        _Portaria do {condominio.nome}_
                      </>
                    )}
                    {notifCategory === 'interfone' && (
                      <>
                        🔔 *TENTATIVA DE CONTATO - PORTARIA* 🔔{'\n\n'}
                        Olá, *{notifTargetMorador?.nome || 'Morador'}*!{'\n'}
                        Tentamos interfonar para sua unidade e não obtivemos resposta. Caso esteja aguardando entrega ou visitante, nos responda por aqui!{'\n\n'}
                        _Portaria do {condominio.nome}_
                      </>
                    )}
                    {notifCategory === 'aviso' && (
                      <>
                        📢 *{notifAvisoTitulo || 'COMUNICADO DA PORTARIA'}* 📢{'\n\n'}
                        Olá, *{notifTargetMorador?.nome || 'Morador'}*!{'\n'}
                        {notifAvisoMensagem || 'Recado informativo da portaria do condomínio.'}{'\n\n'}
                        _Portaria do {condominio.nome}_
                      </>
                    )}
                  </div>
                </div>

                {/* BOTÕES DO FORMULÁRIO */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowQuickNotificationModal(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold transition hover:bg-slate-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingQuickNotif || !notifTargetMorador}
                    className="px-6 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    {isSendingQuickNotif ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Disparando via Baileys...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>🚀 Disparar Notificação WhatsApp</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
