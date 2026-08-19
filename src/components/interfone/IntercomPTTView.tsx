import React, { useState, useEffect, useRef } from 'react';
import { Condominio, Morador, InterfoneMensagem, UserRole } from '../../types';
import { condoStore } from '../../services/mockStorage';
import { audioAlertService } from '../../utils/audioAlerts';
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
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface IntercomPTTViewProps {
  condominio: Condominio;
  currentUserRole: UserRole;
  currentMorador?: Morador | null;
  currentUserName?: string;
}

export const IntercomPTTView: React.FC<IntercomPTTViewProps> = ({
  condominio,
  currentUserRole,
  currentMorador,
  currentUserName = 'Portaria Central',
}) => {
  const isPortariaOrStaff =
    currentUserRole === 'portaria' || currentUserRole === 'sindico' || currentUserRole === 'super_admin';

  // Mensagens do interfone
  const [mensagens, setMensagens] = useState<InterfoneMensagem[]>(() =>
    condoStore.getInterfoneMensagens(
      condominio.id,
      currentMorador?.id,
      currentMorador?.unidade?.bloco,
      currentMorador?.unidade?.apto
    )
  );

  // Destino da transmissão
  // Morador: 'portaria' | 'vizinho' | 'geral' | 'emergencia'
  // Portaria: 'apartamento' | 'geral' | 'emergencia'
  const [destinoModo, setDestinoModo] = useState<'portaria' | 'vizinho' | 'geral' | 'emergencia'>(
    isPortariaOrStaff ? 'apartamento' as any : 'portaria'
  );

  const [targetBloco, setTargetBloco] = useState('');
  const [targetApto, setTargetApto] = useState('');
  const [selectedVizinhoMoradorId, setSelectedVizinhoMoradorId] = useState('');
  const [textoMensagemRapida, setTextoMensagemRapida] = useState('');

  // Modo de operação do PTT: 'hold' (segurar) ou 'toggle' (clicar para iniciar/parar)
  const [pttMode, setPttMode] = useState<'hold' | 'toggle'>('toggle');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

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

  // Moradores cadastrados
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

  // Checa permissão inicial do microfone e notificações
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('Notification' in window) {
        setNotificationPermissionGranted(Notification.permission === 'granted');
      }

      if (navigator.permissions && navigator.permissions.query) {
        navigator.permissions
          .query({ name: 'microphone' as any })
          .then((permissionStatus) => {
            setMicPermissionState(permissionStatus.state as any);
            setIsMicAvailable(permissionStatus.state === 'granted');
            permissionStatus.onchange = () => {
              setMicPermissionState(permissionStatus.state as any);
              setIsMicAvailable(permissionStatus.state === 'granted');
            };
          })
          .catch(() => {
            // Alguns navegadores podem não suportar query para microphone
          });
      }
    }
  }, []);

  // Solicitar permissão de microfone
  const handleRequestMicPermission = async () => {
    try {
      setMicErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setIsMicAvailable(true);
      setMicPermissionState('granted');
      audioAlertService.playChirpStart();
      confetti({ particleCount: 40, spread: 60 });
      // Fecha a stream de teste
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

  // Iniciar Transmissão de Áudio
  const startRecording = async () => {
    try {
      setMicErrorMessage(null);
      audioAlertService.playChirpStart();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      setIsMicAvailable(true);
      setMicPermissionState('granted');

      // Web Audio Analyser para animação visual do som
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();

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
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
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
    } else {
      audioAlertService.playRogerBeep();
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

  // Disparo da transmissão montada
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
      } else {
        // Apartamento Específico
        destinatarioTipo = 'morador';
        tipoCanal = 'portaria_morador';
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
    } else {
      // Morador
      if (destinoModo === 'portaria') {
        destinatarioTipo = 'portaria';
        tipoCanal = 'portaria_morador';
      } else if (destinoModo === 'vizinho') {
        destinatarioTipo = 'morador';
        tipoCanal = 'portaria_morador';
        destinatarioUnidade = {
          bloco: targetBloco.trim() || '1',
          apto: targetApto.trim() || '101',
        };
        const moradorEncontrado = todosMoradores.find(
          (m) =>
            (selectedVizinhoMoradorId && m.id === selectedVizinhoMoradorId) ||
            (m.unidade?.apto === targetApto.trim() && (!targetBloco.trim() || m.unidade?.bloco === targetBloco.trim()))
        );
        if (moradorEncontrado) {
          destinatarioMoradorId = moradorEncontrado.id;
          destinatarioUnidade = moradorEncontrado.unidade;
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

    await condoStore.enviarInterfoneMensagem(condominio.id, {
      condominioId: condominio.id,
      remetenteId: currentMorador ? currentMorador.id : 'portaria_central',
      remetenteNome: isPortariaOrStaff
        ? 'Portaria Central'
        : `${currentMorador?.nome || 'Morador'} (Apto ${currentMorador?.unidade?.apto || '303'})`,
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

  return (
    <div className="space-y-6">
      {/* Banner de Permissão de Microfone e Notificações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status do Microfone */}
        <div
          className={`p-4 rounded-3xl border transition-all flex items-center justify-between gap-4 ${
            isMicAvailable
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100'
              : 'bg-gradient-to-r from-amber-950/60 to-slate-900 border-amber-500/40 text-amber-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                isMicAvailable ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950 animate-bounce'
              }`}
            >
              {isMicAvailable ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </div>
            <div>
              <div className="font-extrabold text-xs flex items-center gap-1.5">
                <span>Status do Microfone:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isMicAvailable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {isMicAvailable ? '🟢 Conectado & Ativo' : '🟡 Requer Permissão'}
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isMicAvailable
                  ? 'Pronto para transmissões de voz em tempo real.'
                  : 'Clique no botão para autorizar o microfone no seu dispositivo.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestMicPermission}
            className={`px-4 py-2 rounded-xl text-xs font-black shrink-0 transition shadow cursor-pointer ${
              isMicAvailable
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
            }`}
          >
            {isMicAvailable ? 'Testar Microfone' : 'Ativar Microfone'}
          </button>
        </div>

        {/* Status de Notificações em Segundo Plano */}
        <div className="p-4 rounded-3xl bg-indigo-950/40 border border-indigo-500/40 text-indigo-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-bold shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-xs flex items-center gap-1.5">
                <span>Alertas em Segundo Plano:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    notificationPermissionGranted
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {notificationPermissionGranted ? '🟢 Ativo' : 'Toque / Notificação'}
                </span>
              </div>
              <p className="text-[11px] opacity-80 mt-0.5">
                Receba toques e alertas sonoros quando chamarem seu interfone.
              </p>
            </div>
          </div>

          {!notificationPermissionGranted && (
            <button
              type="button"
              onClick={handleRequestPushPermission}
              className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs shrink-0 transition shadow cursor-pointer"
            >
              Ativar Sons
            </button>
          )}
        </div>
      </div>

      {/* Painel Principal do Walkie-Talkie (PTT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Rádio Transmissor PTT */}
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
                  {isRecording ? 'TRANSMITINDO AO VIVO' : 'RÁDIO PRONTO / STANDBY'}
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
              {!isPortariaOrStaff ? (
                // Destinos para o MORADOR
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDestinoModo('portaria')}
                      className={`p-2.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-2 cursor-pointer ${
                        destinoModo === 'portaria'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Portaria Central</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDestinoModo('vizinho')}
                      className={`p-2.5 rounded-xl text-xs font-black border transition flex items-center justify-center gap-2 cursor-pointer ${
                        destinoModo === 'vizinho'
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Outro Morador</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDestinoModo('geral')}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
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
                      onClick={() => setDestinoModo('emergencia')}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        destinoModo === 'emergencia'
                          ? 'bg-rose-600 text-white border-rose-400 font-black animate-pulse'
                          : 'bg-slate-800 text-rose-400 border-slate-700 hover:bg-slate-750'
                      }`}
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>🚨 Emergência</span>
                    </button>
                  </div>

                  {/* Detalhes do Vizinho Selecionado (quando em modo 'vizinho') */}
                  {destinoModo === 'vizinho' && (
                    <div className="p-3 bg-slate-800/90 rounded-2xl border border-indigo-500/30 space-y-2 animate-in fade-in">
                      <span className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold block">
                        Informe o Apartamento do Vizinho:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Bloco (Ex: 1 ou A)"
                          value={targetBloco}
                          onChange={(e) => {
                            setTargetBloco(e.target.value);
                            setSelectedVizinhoMoradorId('');
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Apto (Ex: 101)"
                          value={targetApto}
                          onChange={(e) => {
                            setTargetApto(e.target.value);
                            setSelectedVizinhoMoradorId('');
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                      </div>

                      {/* Chips de vizinhos rápidos */}
                      {outrosMoradores.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[10px] text-slate-400 block mb-1">Ou escolha um vizinho:</span>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                            {outrosMoradores.slice(0, 8).map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedVizinhoMoradorId(m.id);
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
                    </div>
                  )}
                </div>
              ) : (
                // Destinos para a PORTARIA
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Bloco</label>
                      <input
                        type="text"
                        placeholder="Bloco (Ex: 1 ou A)"
                        value={targetBloco}
                        onChange={(e) => setTargetBloco(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Apartamento</label>
                      <input
                        type="text"
                        placeholder="Apto (Ex: 303)"
                        value={targetApto}
                        onChange={(e) => setTargetApto(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDestinoModo('apartamento' as any)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        destinoModo === ('apartamento' as any)
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      Unidade Específica
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestinoModo('geral')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        destinoModo === 'geral'
                          ? 'bg-indigo-600 text-white border-indigo-400 font-extrabold'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      📢 Geral (Todos)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDestinoModo('emergencia')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                        destinoModo === 'emergencia'
                          ? 'bg-rose-600 text-white border-rose-400 font-extrabold animate-pulse'
                          : 'bg-slate-800 text-rose-400 border-slate-700'
                      }`}
                    >
                      🚨 Emergência
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÃO PTT CENTRAL (ESTILO ZELLO / WALKIE-TALKIE) */}
            <div className="relative my-3">
              {/* Círculo pulsante ao transmitir */}
              {isRecording && (
                <div
                  className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping pointer-events-none"
                  style={{ transform: `scale(${1 + audioLevel / 60})` }}
                />
              )}

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

            {/* Timer de Transmissão */}
            <div className="h-6 flex items-center justify-center">
              {isRecording ? (
                <div className="flex items-center gap-2 text-rose-400 font-mono font-black text-sm animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>00:{recordingTime.toString().padStart(2, '0')}s</span>
                  <span className="text-[10px] text-slate-400">({audioLevel}% volume)</span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400">
                  {pttMode === 'hold' ? 'Pressione e segure para falar' : 'Clique no microfone para iniciar a gravação de voz'}
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

          {/* Atalhos Rápidos de Interfone */}
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
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
