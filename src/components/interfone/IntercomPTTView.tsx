import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Condominio, Morador, InterfoneMensagem, UserRole } from '../../types';
import { condoStore } from '../../services/mockStorage';
import { audioAlertService } from '../../utils/audioAlerts';
import { nextelAudio } from '../../utils/nextelAudio';
import { SuperPTT } from '../SuperPTT';
import {
  Mic,
  MicOff,
  Radio,
  Volume2,
  VolumeX,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Send,
  Play,
  Pause,
  Clock,
  ShieldAlert,
  Users,
  CheckCircle2,
  AlertCircle,
  Bell,
  Trash2,
  User,
  Building2,
  Headphones,
  Signal,
  Sparkles,
  Info,
  Lock,
  Unlock,
  Volume1,
  MessageSquare,
  Search,
  Phone,
  Shield,
  Briefcase,
  Layers,
  ArrowRight,
  Filter,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface IntercomPTTViewProps {
  condominio: Condominio;
  currentUserRole: UserRole;
  currentMorador?: Morador | null;
  currentUserName?: string;
  initialTab?: 'ptt' | 'super_ptt' | 'mensagens' | 'moradores';
}

export const IntercomPTTView: React.FC<IntercomPTTViewProps> = ({
  condominio,
  currentUserRole,
  currentMorador,
  currentUserName = 'Portaria Central',
  initialTab = 'ptt',
}) => {
  const isPortariaOrStaff =
    currentUserRole === 'portaria' || currentUserRole === 'sindico' || currentUserRole === 'super_admin';
  const isSindico = currentUserRole === 'sindico';

  // Sub-abas do componente: 'ptt' (Rádio Interfone), 'super_ptt' (Nextel DTA PTT), 'mensagens' (Chat Direto), 'moradores' (Lista de Moradores & Contatos)
  const [activeSubTab, setActiveSubTab] = useState<'ptt' | 'super_ptt' | 'mensagens' | 'moradores'>(initialTab);

  // Mensagens do interfone
  const [mensagens, setMensagens] = useState<InterfoneMensagem[]>(() =>
    condoStore.getInterfoneMensagens(
      condominio.id,
      currentMorador?.id,
      currentMorador?.unidade?.bloco,
      currentMorador?.unidade?.apto
    )
  );

  // Pesquisa de Moradores por Nome, Bloco ou Apto
  const [searchMoradorQuery, setSearchMoradorQuery] = useState('');

  // Destino da transmissão no Rádio PTT
  // 'portaria' | 'sindico' | 'vizinho' | 'geral' | 'emergencia'
  const [destinoModo, setDestinoModo] = useState<'portaria' | 'sindico' | 'vizinho' | 'geral' | 'emergencia'>(
    isPortariaOrStaff ? 'vizinho' : 'portaria'
  );

  const [targetBloco, setTargetBloco] = useState('');
  const [targetApto, setTargetApto] = useState('');
  const [selectedMoradorTarget, setSelectedMoradorTarget] = useState<Morador | null>(null);

  // Mensagens de texto
  const [textoMensagemRapida, setTextoMensagemRapida] = useState('');
  const [textoChatDireto, setTextoChatDireto] = useState('');

  // Filtro de canal do chat direto
  const [chatChannelFilter, setChatChannelFilter] = useState<'todos' | 'portaria' | 'sindico' | 'moradores' | 'geral'>('todos');

  // Modo de operação do PTT: 'hold' (segurar) ou 'toggle' (clicar para iniciar/parar)
  const [pttMode, setPttMode] = useState<'hold' | 'toggle'>('toggle');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0); // em segundos
  const [audioLevel, setAudioLevel] = useState(0);
  const [frequencyData, setFrequencyData] = useState<number[]>([15, 30, 45, 60, 40, 20, 50, 75, 90, 60, 30, 20, 40, 80, 65, 35]);

  const MAX_RECORDING_SECONDS = 30;

  // Permissões e status do microfone
  const [micPermissionState, setMicPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [isMicAvailable, setIsMicAvailable] = useState<boolean | null>(null);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [showMicHelpModal, setShowMicHelpModal] = useState(false);

  // Notificações em segundo plano
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  // Audio Player State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Lista de todos os moradores do condomínio
  const todosMoradores = condoStore.getMoradores(condominio.id);
  const outrosMoradores = todosMoradores.filter((m) => m.id !== currentMorador?.id);

  // Subscrição reativa aos dados do condoStore
  useEffect(() => {
    const unsub = condoStore.subscribe(() => {
      setMensagens(
        condoStore.getInterfoneMensagens(
          condominio.id,
          currentMorador?.id,
          currentMorador?.unidade?.bloco,
          currentMorador?.unidade?.apto
        )
      );
    });
    return unsub;
  }, [condominio.id, currentMorador]);

  // SOLICITAÇÃO AUTOMÁTICA DA PERMISSÃO DO MICROFONE AO ABRIR A TELA
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const autoRequestMic = async () => {
      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

      try {
        // Tenta obter permissão do microfone automaticamente
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        activeStream = stream;
        setIsMicAvailable(true);
        setMicPermissionState('granted');
        setMicErrorMessage(null);
        // Libera as faixas do teste
        stream.getTracks().forEach((track) => track.stop());
      } catch (err: any) {
        console.log('[Auto Mic Check]: Microfone aguardando permissão ou não concedido:', err?.name);
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setIsMicAvailable(false);
          setMicPermissionState('denied');
          setMicErrorMessage('Permissão de microfone bloqueada pelo navegador.');
        } else {
          setMicPermissionState('prompt');
        }
      }
    };

    autoRequestMic();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermissionGranted(Notification.permission === 'granted');
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Solicitar permissão de microfone manualmente caso necessário
  const handleRequestMicPermission = async () => {
    try {
      setMicErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setIsMicAvailable(true);
      setMicPermissionState('granted');
      audioAlertService.playChirpStart();
      confetti({ particleCount: 40, spread: 60 });
      stream.getTracks().forEach((track) => track.stop());
    } catch (err: any) {
      console.warn('Microphone permission error:', err);
      setIsMicAvailable(false);
      setMicPermissionState('denied');
      setMicErrorMessage(
        'Permissão de microfone não concedida pelo navegador. Clique no ícone de permissões/cadeado na barra de endereços para permitir o uso do microfone.'
      );
      setShowMicHelpModal(true);
    }
  };

  const handleRequestPushPermission = async () => {
    const granted = await audioAlertService.requestNotificationPermission();
    setNotificationPermissionGranted(granted);
    if (granted) {
      audioAlertService.sendNotification(`📻 Interfone Ativo - ${condominio.nome}`, {
        body: 'Alertas sonoros e chamadas de voz do interfone ativos.',
      });
      confetti({ particleCount: 40, spread: 60 });
    }
  };

  // Iniciar Transmissão de Áudio com Waveform e AnalyserNode
  const startRecording = async () => {
    try {
      setMicErrorMessage(null);
      nextelAudio.playChirp();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setIsMicAvailable(true);
      setMicPermissionState('granted');

      // Web Audio Analyser para animação visual do espectro de voz em tempo real
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateSpectrum = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          const bars: number[] = [];
          const step = Math.max(1, Math.floor(dataArray.length / 16));

          for (let i = 0; i < 16; i++) {
            const val = dataArray[i * step] || 0;
            sum += val;
            bars.push(Math.max(12, Math.min(100, Math.round((val / 255) * 100))));
          }

          setFrequencyData(bars);
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateSpectrum);
        }
      };
      updateSpectrum();

      // Media Recorder
      audioChunksRef.current = [];
      const options = MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : MediaRecorder.isTypeSupported('audio/ogg')
        ? { mimeType: 'audio/ogg' }
        : undefined;

      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(100);
      setIsRecording(true);
      startTimeRef.current = Date.now();
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);
        // Trava automática ao atingir 30 segundos
        if (elapsed >= MAX_RECORDING_SECONDS) {
          stopRecording();
        }
      }, 100);
    } catch (err: any) {
      console.warn('Microphone access denied or error:', err);
      setIsMicAvailable(false);
      setMicPermissionState('denied');
      setMicErrorMessage(
        'Permissão de microfone negada ou indisponível. Conceda permissão no navegador ou envie mensagens rápidas com voz sintetizada.'
      );
      setIsRecording(false);
    }
  };

  // Parar Transmissão e Enviar
  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Toca o clássico Roger Beep de encerramento imediatamente
    nextelAudio.playRogerBeep();

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      setTimeout(async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

        const reader = new FileReader();
        reader.onloadend = async () => {
          const audioBase64 = reader.result as string;
          await dispatchAudioTransmission(audioBase64, durationSec);
        };
        reader.readAsDataURL(audioBlob);
      }, 200);
    }
  };

  // Toggle do PTT para quem prefere clique único
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Disparo da transmissão montada (Voz ou Texto)
  const dispatchAudioTransmission = async (
    audioDataUrl?: string,
    duracaoSegundos?: number,
    customTexto?: string
  ) => {
    let destinatarioTipo: 'portaria' | 'morador' | 'todos' = 'portaria';
    let destinatarioUnidade = undefined;
    let destinatarioMoradorId = undefined;
    let tipoCanal: 'portaria_morador' | 'geral' | 'emergencia' = 'portaria_morador';

    if (isPortariaOrStaff) {
      if (destinoModo === 'geral') {
        destinatarioTipo = 'todos';
        tipoCanal = 'geral';
      } else if (destinoModo === 'emergencia') {
        destinatarioTipo = 'todos';
        tipoCanal = 'emergencia';
      } else if (destinoModo === 'sindico') {
        destinatarioTipo = 'morador';
        tipoCanal = 'portaria_morador';
        const sindicoUser = todosMoradores.find((m) => m.tipoMorador === 'proprietario' || m.nome.toLowerCase().includes('síndico'));
        if (sindicoUser) {
          destinatarioMoradorId = sindicoUser.id;
          destinatarioUnidade = sindicoUser.unidade;
        }
      } else {
        // Morador / Unidade
        destinatarioTipo = 'morador';
        tipoCanal = 'portaria_morador';
        if (selectedMoradorTarget) {
          destinatarioMoradorId = selectedMoradorTarget.id;
          destinatarioUnidade = selectedMoradorTarget.unidade;
        } else {
          destinatarioUnidade = {
            bloco: targetBloco.trim() || '1',
            apto: targetApto.trim() || '101',
          };
          const moradorEncontrado = todosMoradores.find(
            (m) =>
              m.unidade?.apto === targetApto.trim() &&
              (!targetBloco.trim() || m.unidade?.bloco === targetBloco.trim())
          );
          if (moradorEncontrado) {
            destinatarioMoradorId = moradorEncontrado.id;
          }
        }
      }
    } else {
      // MORADOR
      if (destinoModo === 'portaria') {
        destinatarioTipo = 'portaria';
        tipoCanal = 'portaria_morador';
      } else if (destinoModo === 'sindico') {
        destinatarioTipo = 'morador';
        tipoCanal = 'portaria_morador';
        const sindicoUser = todosMoradores.find((m) => m.tipoMorador === 'proprietario' || m.nome.toLowerCase().includes('síndico'));
        if (sindicoUser) {
          destinatarioMoradorId = sindicoUser.id;
          destinatarioUnidade = sindicoUser.unidade;
        }
      } else if (destinoModo === 'vizinho') {
        destinatarioTipo = 'morador';
        tipoCanal = 'portaria_morador';
        if (selectedMoradorTarget) {
          destinatarioMoradorId = selectedMoradorTarget.id;
          destinatarioUnidade = selectedMoradorTarget.unidade;
        } else {
          destinatarioUnidade = {
            bloco: targetBloco.trim() || '1',
            apto: targetApto.trim() || '101',
          };
          const moradorEncontrado = todosMoradores.find(
            (m) =>
              m.unidade?.apto === targetApto.trim() &&
              (!targetBloco.trim() || m.unidade?.bloco === targetBloco.trim())
          );
          if (moradorEncontrado) {
            destinatarioMoradorId = moradorEncontrado.id;
            destinatarioUnidade = moradorEncontrado.unidade;
          }
        }
      } else if (destinoModo === 'geral') {
        destinatarioTipo = 'todos';
        tipoCanal = 'geral';
      } else if (destinoModo === 'emergencia') {
        destinatarioTipo = 'todos';
        tipoCanal = 'emergencia';
      }
    }

    const textoFinal =
      customTexto ||
      textoMensagemRapida.trim() ||
      (audioDataUrl ? `Transmissão de Voz (${duracaoSegundos}s)` : 'Chamada no interfone');

    const remetenteLabel = isSindico
      ? 'Síndico / Administração'
      : isPortariaOrStaff
      ? 'Portaria Central'
      : `${currentMorador?.nome || 'Morador'} (Bloco ${currentMorador?.unidade?.bloco || '1'} - Apto ${currentMorador?.unidade?.apto || '303'})`;

    await condoStore.enviarInterfoneMensagem(condominio.id, {
      condominioId: condominio.id,
      remetenteId: currentMorador ? currentMorador.id : isSindico ? 'sindico_adm' : 'portaria_central',
      remetenteNome: remetenteLabel,
      remetenteTipo: isPortariaOrStaff ? 'portaria' : 'morador',
      remetenteUnidade: currentMorador?.unidade,
      destinatarioTipo,
      destinatarioUnidade,
      destinatarioMoradorId,
      tipoCanal,
      audioDataUrl,
      duracaoSegundos: duracaoSegundos || 3,
      texto: textoFinal,
      prioridade: tipoCanal === 'emergencia' ? 'emergencia' : 'normal',
    });

    setTextoMensagemRapida('');
    setTextoChatDireto('');
  };

  // Reproduz áudio da mensagem
  const handlePlayAudio = (msg: InterfoneMensagem) => {
    if (!msg.audioDataUrl) return;

    if (playingAudioId === msg.id) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    const audio = new Audio(msg.audioDataUrl);
    audioPlayerRef.current = audio;
    setPlayingAudioId(msg.id);

    audio.onended = () => {
      setPlayingAudioId(null);
      condoStore.marcarInterfoneLido(condominio.id, msg.id);
    };

    audio.onerror = () => {
      setPlayingAudioId(null);
    };

    audio.play().catch((err) => {
      console.warn('Playback error:', err);
      setPlayingAudioId(null);
    });

    condoStore.marcarInterfoneLido(condominio.id, msg.id);
  };

  // Presets Rápidos
  const quickPresets = isPortariaOrStaff
    ? [
        { label: '🛵 Entregador na Portaria', text: 'Entregador de aplicativo / delivery aguardando no portão social.' },
        { label: '👤 Visitante Chegou', text: 'Seu visitante/convidado acabou de chegar na portaria.' },
        { label: '📦 Retirar Encomenda', text: 'Sua encomenda já está pronta para retirada no balcão da portaria.' },
        { label: '🚗 Alerta Veículo', text: 'Favor verificar veículo na garagem (farol aceso ou vaga incorreta).' },
      ]
    : [
        { label: '🛵 Liberar Delivery', text: 'Olá Portaria! O entregador de delivery está liberado para subir.' },
        { label: '👤 Liberar Visitante', text: 'Olá Portaria! Meu convidado/visitante está autorizado a entrar.' },
        { label: '📦 Dúvida Encomenda', text: 'Olá Portaria! Chegou alguma encomenda ou pacote para o meu apartamento hoje?' },
        { label: '🚗 Portão Garagem', text: 'Olá Portaria! Poderia acionar a abertura do portão da garagem por gentileza?' },
        { label: '🚨 Apoio Emergência', text: 'URGENTE: Solicito apoio da portaria no meu apartamento imediatamente!' },
      ];

  const handleSendPreset = async (presetText: string) => {
    await dispatchAudioTransmission(undefined, 2, presetText);
    audioAlertService.playRogerBeep();
    confetti({ particleCount: 30, spread: 50 });
  };

  // Filtragem da Lista de Moradores
  const filteredMoradores = useMemo(() => {
    const q = searchMoradorQuery.trim().toLowerCase();
    if (!q) return outrosMoradores;

    return outrosMoradores.filter((m) => {
      const nomeMatch = m.nome.toLowerCase().includes(q);
      const aptoMatch = (m.unidade?.apto || '').toLowerCase().includes(q);
      const blocoMatch = (m.unidade?.bloco || '').toLowerCase().includes(q);
      const telMatch = (m.telefone || '').includes(q);
      return nomeMatch || aptoMatch || blocoMatch || telMatch;
    });
  }, [outrosMoradores, searchMoradorQuery]);

  // Mensagens filtradas para o chat direto
  const filteredMensagens = useMemo(() => {
    if (chatChannelFilter === 'todos') return mensagens;
    if (chatChannelFilter === 'portaria') {
      return mensagens.filter((m) => m.remetenteTipo === 'portaria' || m.destinatarioTipo === 'portaria');
    }
    if (chatChannelFilter === 'sindico') {
      return mensagens.filter((m) => m.remetenteNome.toLowerCase().includes('síndico') || m.texto?.toLowerCase().includes('síndico'));
    }
    if (chatChannelFilter === 'moradores') {
      return mensagens.filter((m) => m.destinatarioTipo === 'morador' || m.remetenteTipo === 'morador');
    }
    if (chatChannelFilter === 'geral') {
      return mensagens.filter((m) => m.destinatarioTipo === 'todos' || m.tipoCanal === 'geral');
    }
    return mensagens;
  }, [mensagens, chatChannelFilter]);

  return (
    <div className="space-y-6">
      {/* NAVEGAÇÃO DE SUB-ABAS (RÁDIO PTT, CHAT DE MENSAGENS, LISTA DE MORADORES) */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('ptt')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeSubTab === 'ptt'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>📻 Rádio Interfone PTT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('super_ptt')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeSubTab === 'super_ptt'
                ? 'bg-[#00D7A5] text-[#050d1a] shadow-md shadow-[#00D7A5]/30'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className="w-4 h-4 text-emerald-500" />
            <span>⚡ SuperPTT Nextel Real</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('mensagens')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeSubTab === 'mensagens'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>💬 Chat & Mensagens Diretas</span>
            {mensagens.length > 0 && (
              <span className="text-[10px] bg-indigo-100 text-indigo-900 font-bold px-1.5 py-0.2 rounded-full">
                {mensagens.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('moradores')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer ${
              activeSubTab === 'moradores'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 Lista de Moradores & Contatos</span>
            <span className="text-[10px] bg-teal-100 text-teal-900 font-bold px-1.5 py-0.2 rounded-full">
              {todosMoradores.length}
            </span>
          </button>
        </div>

        {/* Status Rápido do Microfone */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-1.5">
            {isMicAvailable ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
            <span className="text-[11px] text-slate-700">
              Microfone: {isMicAvailable ? 'Ativo (Automático)' : 'Conectando...'}
            </span>
          </div>
          {!isMicAvailable && (
            <button
              type="button"
              onClick={handleRequestMicPermission}
              className="text-[10px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-md cursor-pointer"
            >
              Ativar
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SUB-ABA 1: RÁDIO WALKIE-TALKIE PTT (VOZ EM TEMPO REAL)              */}
      {/* ==================================================================== */}
      {activeSubTab === 'ptt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Transmissor Rádio PTT */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col items-center text-center relative overflow-hidden">
              {/* Indicador de Status do Canal */}
              <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isRecording ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="font-mono font-bold text-slate-300">
                    {isRecording ? 'GRAVANDO E TRANSMITINDO AO VIVO' : 'RÁDIO PRONTO / STANDBY'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                  <Signal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PTT Interfone</span>
                </div>
              </div>

              {/* SELEÇÃO DO DESTINO DA TRANSMISSÃO */}
              <div className="w-full space-y-3 mb-5 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">
                    {isPortariaOrStaff ? 'Destino da Transmissão (Portaria):' : 'Falar com quem? (Interfone):'}
                  </label>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>Modo:</span>
                    <button
                      type="button"
                      onClick={() => setPttMode(pttMode === 'hold' ? 'toggle' : 'hold')}
                      className="text-amber-400 font-bold underline cursor-pointer hover:text-amber-300"
                    >
                      {pttMode === 'hold' ? 'Segurar p/ Falar' : 'Clique p/ Ligar/Desligar'}
                    </button>
                  </div>
                </div>

                {/* Botões de Seleção de Canal / Destino */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {!isPortariaOrStaff ? (
                    <button
                      type="button"
                      onClick={() => {
                        setDestinoModo('portaria');
                        setSelectedMoradorTarget(null);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        destinoModo === 'portaria'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Portaria 24h</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setDestinoModo('sindico');
                      setSelectedMoradorTarget(null);
                    }}
                    className={`p-2.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      destinoModo === 'sindico'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Síndico / Adm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDestinoModo('vizinho');
                    }}
                    className={`p-2.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      destinoModo === 'vizinho'
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>{isPortariaOrStaff ? 'Apartamento' : 'Vizinho / Morador'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDestinoModo('geral');
                      setSelectedMoradorTarget(null);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      destinoModo === 'geral'
                        ? 'bg-teal-600 text-white border-teal-400 font-black'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Canal Geral</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDestinoModo('emergencia');
                      setSelectedMoradorTarget(null);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      destinoModo === 'emergencia'
                        ? 'bg-rose-600 text-white border-rose-400 font-black animate-pulse'
                        : 'bg-slate-800 text-rose-400 border-slate-700 hover:bg-slate-750'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>🚨 Emergência</span>
                  </button>
                </div>

                {/* Seleção do Apartamento / Morador quando destino for 'vizinho' */}
                {destinoModo === 'vizinho' && (
                  <div className="p-3.5 bg-slate-800/90 rounded-2xl border border-indigo-500/30 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold block">
                        Destinatário da Chamada:
                      </span>
                      {selectedMoradorTarget && (
                        <button
                          type="button"
                          onClick={() => setSelectedMoradorTarget(null)}
                          className="text-[10px] text-amber-400 hover:underline"
                        >
                          Limpar Seleção
                        </button>
                      )}
                    </div>

                    {selectedMoradorTarget ? (
                      <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-500/50 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                            {selectedMoradorTarget.nome.charAt(0)}
                          </div>
                          <div>
                            <div className="font-extrabold text-white">{selectedMoradorTarget.nome}</div>
                            <div className="text-[10px] text-indigo-300">
                              Bloco {selectedMoradorTarget.unidade.bloco} - Apto {selectedMoradorTarget.unidade.apto}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                          Selecionado
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Bloco (Ex: 1 ou A)"
                            value={targetBloco}
                            onChange={(e) => setTargetBloco(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Apto (Ex: 303)"
                            value={targetApto}
                            onChange={(e) => setTargetApto(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                          />
                        </div>

                        {/* Chips de vizinhos rápidos */}
                        {outrosMoradores.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[10px] text-slate-400 block mb-1">Moradores rápidos:</span>
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                              {outrosMoradores.slice(0, 8).map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedMoradorTarget(m);
                                    setTargetBloco(m.unidade.bloco);
                                    setTargetApto(m.unidade.apto);
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                                    targetApto === m.unidade.apto && targetBloco === m.unidade.bloco
                                      ? 'bg-indigo-600 text-white border-indigo-400'
                                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
                                  }`}
                                >
                                  Bloco {m.unidade.bloco} - Apto {m.unidade.apto} ({m.nome.split(' ')[0]})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ========================================================== */}
              {/* BARRA DE CONTAGEM E MOSTRADOR DE ÁUDIO SENDO GRAVADO     */}
              {/* ========================================================== */}
              {isRecording ? (
                <div className="w-full space-y-3 my-2 p-4 rounded-2xl bg-slate-800/90 border border-rose-500/50 animate-in zoom-in-95">
                  <div className="flex items-center justify-between text-xs font-black">
                    <div className="flex items-center gap-2 text-rose-400">
                      <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                      <span>GRAVANDO ÁUDIO AO VIVO...</span>
                    </div>
                    <span className="font-mono text-white text-sm bg-rose-950/80 px-2.5 py-0.5 rounded-lg border border-rose-700">
                      00:{recordingTime.toString().padStart(2, '0')}s / 00:30s
                    </span>
                  </div>

                  {/* Barra de Progresso / Contagem de Gravação */}
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-rose-600 transition-all duration-100 ease-linear rounded-full"
                      style={{ width: `${Math.min(100, (recordingTime / MAX_RECORDING_SECONDS) * 100)}%` }}
                    />
                  </div>

                  {/* Equalizador / Ondas do Áudio Sendo Gravado em Tempo Real */}
                  <div className="flex items-end justify-center gap-1.5 h-12 pt-2 bg-slate-950/60 rounded-xl px-3 border border-slate-800">
                    {frequencyData.map((val, idx) => (
                      <div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-rose-600 via-amber-400 to-emerald-400 rounded-t-sm transition-all duration-75"
                        style={{ height: `${val}%`, minHeight: '6px' }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Fale claramente no microfone. O áudio será transmitido ao encerrar.
                  </p>
                </div>
              ) : null}

              {/* BOTÃO PTT CENTRAL (ESTILO ZELLO / WALKIE-TALKIE) */}
              <div className="relative my-3">
                {pttMode === 'hold' ? (
                  // Modo Segurar para Falar
                  <button
                    id="btn-ptt-walkie-talkie-hold"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startRecording();
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      stopRecording();
                    }}
                    className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center gap-2 select-none shadow-2xl transition-all active:scale-95 cursor-pointer touch-none ${
                      isRecording
                        ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-rose-600/50 ring-8 ring-rose-500/30'
                        : 'bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/30 ring-4 ring-amber-500/20'
                    }`}
                  >
                    <Mic className={`w-12 h-12 transition ${isRecording ? 'scale-110 animate-pulse' : ''}`} />
                    <span className="font-black text-xs uppercase tracking-wider">
                      {isRecording ? 'SOLTE P/ ENVIAR' : 'SEGURE P/ FALAR'}
                    </span>
                  </button>
                ) : (
                  // Modo Clique para Iniciar / Parar
                  <button
                    id="btn-ptt-walkie-talkie-toggle"
                    type="button"
                    onClick={toggleRecording}
                    className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center gap-2 select-none shadow-2xl transition-all active:scale-95 cursor-pointer ${
                      isRecording
                        ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-rose-600/50 ring-8 ring-rose-500/30 animate-pulse'
                        : 'bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/30 ring-4 ring-amber-500/20'
                    }`}
                  >
                    <Mic className={`w-12 h-12 transition ${isRecording ? 'scale-110 animate-pulse text-white' : ''}`} />
                    <span className="font-black text-xs uppercase tracking-wider">
                      {isRecording ? 'CLIQUE P/ ENCERRAR' : 'CLIQUE P/ FALAR'}
                    </span>
                  </button>
                )}
              </div>

              {/* Status do PTT */}
              <div className="h-6 flex items-center justify-center">
                {!isRecording && (
                  <span className="text-[11px] text-slate-400">
                    {pttMode === 'hold' ? 'Pressione e segure para falar' : 'Clique no botão acima para iniciar e gravar sua voz'}
                  </span>
                )}
              </div>

              {/* Erro de microfone com botão de ajuda */}
              {micErrorMessage && (
                <div className="mt-3 p-3 rounded-2xl bg-rose-950/90 border border-rose-700 text-rose-200 text-xs font-bold text-left space-y-1.5">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Acesso ao Microfone Necessário</span>
                  </div>
                  <p className="text-[11px] text-rose-300 font-normal leading-relaxed">
                    {micErrorMessage}
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRequestMicPermission}
                      className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold cursor-pointer transition"
                    >
                      Tentar Novamente
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMicHelpModal(true)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold cursor-pointer transition"
                    >
                      Como Permitir?
                    </button>
                  </div>
                </div>
              )}

              {/* Testes Sonoros */}
              <div className="w-full flex items-center justify-between pt-4 mt-4 border-t border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => audioAlertService.playIntercomRingtone()}
                  className="text-slate-400 hover:text-white flex items-center gap-1.5 transition text-[11px] cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Testar Toque</span>
                </button>
                <button
                  type="button"
                  onClick={() => audioAlertService.playRogerBeep()}
                  className="text-slate-400 hover:text-white flex items-center gap-1.5 transition text-[11px] cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Roger Beep</span>
                </button>
              </div>
            </div>

            {/* Avisos Rápidos de Interfone */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Avisos Rápidos no Interfone (1-Clique)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendPreset(preset.text)}
                    className="p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/50 hover:border-amber-200 border border-slate-200 text-left transition cursor-pointer active:scale-98 space-y-1"
                  >
                    <div className="font-extrabold text-xs text-slate-900">{preset.label}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">{preset.text}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Coluna Direita: Registro de Transmissões / Mensagens em Tempo Real */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Transmissões & Chamadas do Interfone
                    </h3>
                    <p className="text-xs text-slate-500">Histórico de áudios e comunicados imediatos.</p>
                  </div>
                </div>

                {mensagens.length > 0 && isPortariaOrStaff && (
                  <button
                    onClick={() => condoStore.limparHistoricoInterfone(condominio.id)}
                    className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition cursor-pointer"
                    title="Limpar histórico"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar</span>
                  </button>
                )}
              </div>

              {/* Lista de Transmissões */}
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto mt-3 pr-1 space-y-3">
                {mensagens.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Radio className="w-7 h-7" />
                    </div>
                    <div className="text-slate-500 font-bold text-sm">Nenhuma transmissão recente</div>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      {isPortariaOrStaff
                        ? 'Pressione o botão amarelo do rádio para enviar áudios aos moradores.'
                        : 'Pressione o botão para falar diretamente com a Portaria ou outro Morador.'}
                    </p>
                  </div>
                ) : (
                  mensagens
                    .slice()
                    .reverse()
                    .map((msg) => {
                      const isFromPortaria = msg.remetenteTipo === 'portaria';
                      const isPlaying = playingAudioId === msg.id;

                      return (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-2xl border transition space-y-2.5 ${
                            msg.prioridade === 'emergencia'
                              ? 'bg-rose-50 border-rose-300'
                              : isFromPortaria
                              ? 'bg-amber-50/60 border-amber-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  msg.prioridade === 'emergencia'
                                    ? 'bg-rose-600 text-white'
                                    : isFromPortaria
                                    ? 'bg-amber-500 text-slate-950'
                                    : 'bg-indigo-600 text-white'
                                }`}
                              >
                                {msg.remetenteTipo === 'portaria'
                                  ? '🛡️ Portaria Central'
                                  : `🏠 Apto ${msg.remetenteUnidade?.apto || '-'}`}
                              </span>
                              <span className="font-extrabold text-xs text-slate-900">
                                {msg.remetenteNome}
                              </span>
                              {msg.destinatarioUnidade && (
                                <span className="text-[11px] text-slate-500">
                                  ➔ Bloco {msg.destinatarioUnidade.bloco} - Apto {msg.destinatarioUnidade.apto}
                                </span>
                              )}
                              {msg.destinatarioTipo === 'portaria' && (
                                <span className="text-[11px] text-amber-700 font-bold">
                                  ➔ Portaria
                                </span>
                              )}
                              {msg.destinatarioTipo === 'todos' && (
                                <span className="text-[11px] text-indigo-700 font-bold">
                                  ➔ Geral (Todos)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(msg.criadoEm).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Texto da transmissão */}
                          {msg.texto && (
                            <p className="text-xs text-slate-800 font-medium">{msg.texto}</p>
                          )}

                          {/* Player de Áudio se houver gravação Base64 */}
                          {msg.audioDataUrl && (
                            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
                              <button
                                type="button"
                                onClick={() => handlePlayAudio(msg)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition cursor-pointer ${
                                  isPlaying
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                              >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                              </button>

                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                  <span>{isPlaying ? 'Reproduzindo Áudio...' : 'Áudio do Interfone'}</span>
                                  <span className="font-mono">{msg.duracaoSegundos || 3}s</span>
                                </div>
                                {/* Barra de Ondas Visuais */}
                                <div className="flex items-center gap-1 h-3">
                                  {[40, 70, 30, 90, 60, 45, 80, 25, 95, 50, 65, 35].map((h, i) => (
                                    <div
                                      key={i}
                                      className={`flex-1 rounded-full transition-all ${
                                        isPlaying ? 'bg-indigo-600 animate-pulse' : 'bg-slate-300'
                                      }`}
                                      style={{ height: `${h}%` }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Campo de Envio Rápido de Texto pelo Interfone */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!textoMensagemRapida.trim()) return;
                dispatchAudioTransmission(undefined, 2, textoMensagemRapida.trim());
              }}
              className="pt-3 border-t border-slate-100 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Digite uma mensagem rápida para transmitir..."
                value={textoMensagemRapida}
                onChange={(e) => setTextoMensagemRapida(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmitir</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-ABA: DTA SUPER PTT NEXTEL REAL (WEBRTC & WEB AUDIO SINTETIZADO) */}
      {/* ==================================================================== */}
      {activeSubTab === 'super_ptt' && (
        <div className="space-y-4">
          <SuperPTT
            condominio={condominio}
            currentUserRole={currentUserRole}
            currentMorador={currentMorador}
            currentUserName={currentUserName}
            onSendVoiceTransmission={(audioBase64, durationSec, channel) => {
              dispatchAudioTransmission(audioBase64, durationSec);
            }}
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-ABA 2: CHAT & MENSAGENS DIRETAS (MORADOR <-> PORTARIA <-> SÍNDICO)*/}
      {/* ==================================================================== */}
      {activeSubTab === 'mensagens' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <span>Central de Mensagens Diretas & Interfonia</span>
              </h3>
              <p className="text-xs text-slate-500">
                Comunicação segura entre Moradores, Portaria e Síndico.
              </p>
            </div>

            {/* Filtros de Canal do Chat */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setChatChannelFilter('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  chatChannelFilter === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setChatChannelFilter('portaria')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  chatChannelFilter === 'portaria' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Portaria
              </button>
              <button
                type="button"
                onClick={() => setChatChannelFilter('sindico')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  chatChannelFilter === 'sindico' ? 'bg-blue-600 text-white font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Síndico
              </button>
              <button
                type="button"
                onClick={() => setChatChannelFilter('moradores')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  chatChannelFilter === 'moradores' ? 'bg-indigo-600 text-white font-black' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Moradores / Vizinhos
              </button>
            </div>
          </div>

          {/* Histórico do Chat */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 min-h-[350px] max-h-[500px] overflow-y-auto space-y-3">
            {filteredMensagens.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold">Nenhuma mensagem neste canal ainda.</p>
                <p className="text-[11px]">Envie uma mensagem de texto ou áudio abaixo.</p>
              </div>
            ) : (
              filteredMensagens.map((msg) => {
                const isMe =
                  (currentMorador && msg.remetenteId === currentMorador.id) ||
                  (!currentMorador && msg.remetenteTipo === 'portaria');

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                      <span className="font-bold text-slate-600">{msg.remetenteNome}</span>
                      <span>•</span>
                      <span>{new Date(msg.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs shadow-xs space-y-2 ${
                        isMe
                          ? 'bg-slate-900 text-white rounded-br-none'
                          : msg.remetenteTipo === 'portaria'
                          ? 'bg-amber-100 text-slate-900 border border-amber-300 rounded-bl-none'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none'
                      }`}
                    >
                      {msg.texto && <p className="leading-relaxed">{msg.texto}</p>}

                      {msg.audioDataUrl && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handlePlayAudio(msg)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
                              playingAudioId === msg.id
                                ? 'bg-rose-500 text-white animate-pulse'
                                : isMe
                                ? 'bg-white/20 text-white hover:bg-white/30'
                                : 'bg-slate-900 text-white'
                            }`}
                          >
                            {playingAudioId === msg.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                          </button>
                          <span className="text-[10px] opacity-80">Áudio ({msg.duracaoSegundos || 3}s)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Compositor de Mensagens Diretas */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!textoChatDireto.trim()) return;
              dispatchAudioTransmission(undefined, 2, textoChatDireto.trim());
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Escreva uma mensagem para o condomínio, portaria ou síndico..."
              value={textoChatDireto}
              onChange={(e) => setTextoChatDireto(e.target.value)}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Send className="w-4 h-4" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-ABA 3: LISTA DE MORADORES COM BARRA DE PESQUISA POR NOME         */}
      {/* ==================================================================== */}
      {activeSubTab === 'moradores' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                <span>Lista Telefônica & Diretório de Moradores</span>
              </h3>
              <p className="text-xs text-slate-500">
                Pesquise qualquer morador pelo nome para interfonar, mandar mensagem ou ligar.
              </p>
            </div>

            {/* BARRA DE PESQUISA RÁPIDA POR NOME / APTO */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar pelo nome do morador, bloco ou apto..."
                value={searchMoradorQuery}
                onChange={(e) => setSearchMoradorQuery(e.target.value)}
                className="w-full pl-9.5 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
              {searchMoradorQuery && (
                <button
                  type="button"
                  onClick={() => setSearchMoradorQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Grade de Moradores Filtrados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMoradores.length === 0 ? (
              <div className="col-span-full text-center py-12 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <div className="text-slate-600 font-bold text-xs">Nenhum morador encontrado para "{searchMoradorQuery}"</div>
                <p className="text-[11px] text-slate-400">Verifique a ortografia do nome ou o número do apartamento.</p>
              </div>
            ) : (
              filteredMoradores.map((morador) => (
                <div
                  key={morador.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-400 hover:shadow-sm transition flex flex-col justify-between space-y-3 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                      {morador.nome.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">
                        {morador.nome}
                      </h4>
                      <div className="text-teal-800 font-bold text-[11px] flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span>
                          Bloco {morador.unidade.bloco} • Apto {morador.unidade.apto}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {morador.tipoMorador === 'proprietario' ? 'Proprietário' : 'Inquilino'} • {morador.telefone || '(21) 99999-9999'}
                      </div>
                    </div>
                  </div>

                  {/* Ações Rápidas com o Morador */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMoradorTarget(morador);
                        setTargetBloco(morador.unidade.bloco);
                        setTargetApto(morador.unidade.apto);
                        setDestinoModo('vizinho');
                        setActiveSubTab('ptt');
                      }}
                      className="py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                    >
                      <Radio className="w-3 h-3" />
                      <span>Interfonar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMoradorTarget(morador);
                        setTargetBloco(morador.unidade.bloco);
                        setTargetApto(morador.unidade.apto);
                        setDestinoModo('vizinho');
                        setActiveSubTab('mensagens');
                      }}
                      className="py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs transition cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Mensagem</span>
                    </button>

                    <a
                      href={`https://api.whatsapp.com/send?phone=55${(morador.telefone || '21999999999').replace(/\D/g, '')}&text=Ol%C3%A1%20${encodeURIComponent(
                        morador.nome
                      )},%20sou%20seu%20vizinho%20do%20condom%C3%ADnio%20${encodeURIComponent(condominio.nome)}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow-xs transition"
                    >
                      <Phone className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal de Ajuda com Permissão de Microfone */}
      {showMicHelpModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-black text-base">
                <Mic className="w-5 h-5 text-amber-600" />
                <span>Como Ativar o Microfone</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMicHelpModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <p>
                Para falar pelo interfone walkie-talkie (PTT), seu navegador precisa de permissão de acesso ao microfone:
              </p>
              <ol className="list-decimal pl-4 space-y-2 font-medium">
                <li>
                  Localize o <strong>ícone de cadeado ou configurações</strong> ao lado do endereço do site (barra de navegação no topo).
                </li>
                <li>
                  Clique em <strong>Permissões do Site</strong> ou <strong>Microfone</strong>.
                </li>
                <li>
                  Altere para <strong>Permitir</strong> (Allow).
                </li>
                <li>
                  Recarregue a página ou clique em <strong>"Tentar Novamente"</strong> no botão abaixo.
                </li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMicHelpModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Entendi
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMicHelpModal(false);
                  handleRequestMicPermission();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                Solicitar Microfone Agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
