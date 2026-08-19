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
  const isPortariaOrStaff = currentUserRole === 'portaria' || currentUserRole === 'sindico' || currentUserRole === 'super_admin';

  // Mensagens do interfone
  const [mensagens, setMensagens] = useState<InterfoneMensagem[]>(() =>
    condoStore.getInterfoneMensagens(
      condominio.id,
      currentMorador?.id,
      currentMorador?.unidade?.bloco,
      currentMorador?.unidade?.apto
    )
  );

  // Destino da transmissão (para portaria)
  const [targetBloco, setTargetBloco] = useState('');
  const [targetApto, setTargetApto] = useState('');
  const [targetCanal, setTargetCanal] = useState<'portaria_morador' | 'geral' | 'emergencia'>('portaria_morador');
  const [textoMensagemRapida, setTextoMensagemRapida] = useState('');

  // Push-to-Talk (PTT) Estados
  const [isHoldingPTT, setIsHoldingPTT] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMicAvailable, setIsMicAvailable] = useState<boolean | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [autoPlayIncoming, setAutoPlayIncoming] = useState(true);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  // Audio Player State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Moradores cadastrados para auto-complete
  const todosMoradores = condoStore.getMoradores(condominio.id);

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

  // Checa permissão de notificação
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  const handleRequestPushPermission = async () => {
    const granted = await audioAlertService.requestNotificationPermission();
    setNotificationPermissionGranted(granted);
    if (granted) {
      audioAlertService.sendNotification('🔔 Notificações Ativadas!', {
        body: 'Você receberá alertas sonoros em tempo real de chamadas de interfone e liberações de visitantes.',
      });
      confetti({ particleCount: 40, spread: 60 });
    }
  };

  // Inicializa gravação do microfone ao segurar o botão PTT
  const startPTT = async () => {
    try {
      setMicError(null);
      audioAlertService.playChirpStart();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsMicAvailable(true);

      // Web Audio Analyser para feedback visual
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
      setIsHoldingPTT(true);
      startTimeRef.current = Date.now();
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    } catch (err: any) {
      console.warn('Microphone access denied or error:', err);
      setIsMicAvailable(false);
      setMicError('Permissão de microfone negada. Permita o uso do microfone no navegador.');
      setIsHoldingPTT(false);
    }
  };

  // Finaliza gravação e envia transmissão via rádio
  const stopPTT = async () => {
    if (!isHoldingPTT) return;
    setIsHoldingPTT(false);

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
      recorder.stream.getTracks().forEach((track) => track.stop());

      // Converte áudio para Data URL
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

  // Disparo da transmissão montada
  const dispatchAudioTransmission = async (audioDataUrl?: string, duracaoSegundos?: number, customTexto?: string) => {
    let destinatarioTipo: 'portaria' | 'morador' | 'todos' = 'morador';
    let destinatarioUnidade = undefined;
    let destinatarioMoradorId = undefined;

    if (!isPortariaOrStaff) {
      // Morador sempre envia para a portaria (ou emergência)
      destinatarioTipo = 'portaria';
    } else {
      if (targetCanal === 'geral' || targetCanal === 'emergencia') {
        destinatarioTipo = 'todos';
      } else {
        destinatarioTipo = 'morador';
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

    const textoFinal = customTexto || textoMensagemRapida.trim() || (audioDataUrl ? `Transmissão de Voz (${duracaoSegundos}s)` : 'Chamada no interfone');

    await condoStore.enviarInterfoneMensagem(condominio.id, {
      condominioId: condominio.id,
      remetenteId: currentMorador ? currentMorador.id : 'portaria_central',
      remetenteNome: isPortariaOrStaff ? 'Portaria Central' : currentMorador?.nome || 'Morador',
      remetenteTipo: isPortariaOrStaff ? 'portaria' : 'morador',
      remetenteUnidade: currentMorador?.unidade,
      destinatarioTipo,
      destinatarioUnidade,
      destinatarioMoradorId,
      tipoCanal: targetCanal,
      audioDataUrl,
      duracaoSegundos: duracaoSegundos || 3,
      texto: textoFinal,
      prioridade: targetCanal === 'emergencia' ? 'emergencia' : 'normal',
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
        { label: '🛵 Liberação de Delivery', text: 'Entregador do iFood liberado para subir.' },
        { label: '🚪 Portão da Garagem', text: 'Favor verificar acionamento do portão de veículos.' },
        { label: '📦 Chegada de Encomenda', text: 'Aguardando pacote Mercado Livre / Correios.' },
        { label: '🚨 Emergência no Apartamento', text: 'Solicitação urgente de apoio da portaria no apartamento!' },
      ];

  const handleSendPreset = async (presetText: string) => {
    await dispatchAudioTransmission(undefined, 2, presetText);
    audioAlertService.playRogerBeep();
    confetti({ particleCount: 30, spread: 50 });
  };

  return (
    <div className="space-y-6">
      {/* Banner de Ativação de Notificações em Segundo Plano */}
      {!notificationPermissionGranted && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-4 sm:p-5 rounded-3xl border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center font-bold shrink-0 animate-pulse">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white">
                Ativar Alertas em Segundo Plano & Toque de Interfone
              </h4>
              <p className="text-xs text-indigo-200">
                Receba chamadas de voz e toques do interfone mesmo com a tela bloqueada ou aba minimizada.
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestPushPermission}
            className="px-4 py-2 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 font-black text-xs shadow-md transition cursor-pointer shrink-0"
          >
            Ativar Notificações
          </button>
        </div>
      )}

      {/* Painel Principal do Walkie-Talkie (PTT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Rádio Transmissor PTT */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 flex flex-col items-center text-center relative overflow-hidden">
            {/* Indicador de Status do Canal */}
            <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${isHoldingPTT ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
                <span className="font-mono font-bold text-slate-300">
                  {isHoldingPTT ? 'TRANSMITINDO AO VIVO' : 'RÁDIO PRONTO / STANDBY'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                <Signal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Canal PTT Digital</span>
              </div>
            </div>

            {/* Configuração de Destino (apenas para Portaria) */}
            {isPortariaOrStaff ? (
              <div className="w-full space-y-3 mb-5 text-left">
                <label className="block text-xs font-bold text-slate-300">
                  Destino da Transmissão:
                </label>
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
                    onClick={() => setTargetCanal('portaria_morador')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                      targetCanal === 'portaria_morador'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Unidade Específica
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetCanal('geral')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                      targetCanal === 'geral'
                        ? 'bg-indigo-600 text-white border-indigo-400 font-extrabold'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    📢 Geral (Todos)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetCanal('emergencia')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition ${
                      targetCanal === 'emergencia'
                        ? 'bg-rose-600 text-white border-rose-400 font-extrabold animate-pulse'
                        : 'bg-slate-800 text-rose-400 border-slate-700'
                    }`}
                  >
                    🚨 Emergência
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full bg-slate-800/80 p-3 rounded-2xl border border-slate-700 mb-5 text-left flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white">Canal Direto da Portaria 24h</div>
                    <div className="text-[11px] text-slate-400">
                      Unidade: Bloco {currentMorador?.unidade?.bloco || '1'} - Apto {currentMorador?.unidade?.apto || '303'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Online
                </span>
              </div>
            )}

            {/* BOTÃO PTT CENTRAL (ESTILO ZELLO / WALKIE-TALKIE) */}
            <div className="relative my-4">
              {/* Círculo pulsante ao transmitir */}
              {isHoldingPTT && (
                <div
                  className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping pointer-events-none"
                  style={{ transform: `scale(${1 + audioLevel / 60})` }}
                />
              )}

              <button
                id="btn-ptt-walkie-talkie"
                onMouseDown={startPTT}
                onMouseUp={stopPTT}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startPTT();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  stopPTT();
                }}
                className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center gap-2 select-none shadow-2xl transition-all active:scale-95 cursor-pointer touch-none ${
                  isHoldingPTT
                    ? 'bg-gradient-to-tr from-rose-600 to-rose-500 text-white shadow-rose-600/50 ring-8 ring-rose-500/30'
                    : 'bg-gradient-to-tr from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/30 ring-4 ring-amber-500/20'
                }`}
              >
                <Mic className={`w-12 h-12 transition ${isHoldingPTT ? 'scale-110 animate-pulse' : ''}`} />
                <span className="font-black text-xs uppercase tracking-wider">
                  {isHoldingPTT ? 'SOLTE P/ ENVIAR' : 'SEGURE P/ FALAR'}
                </span>
              </button>
            </div>

            {/* Timer de Transmissão */}
            <div className="h-6 flex items-center justify-center">
              {isHoldingPTT ? (
                <div className="flex items-center gap-2 text-rose-400 font-mono font-black text-sm animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>00:{recordingTime.toString().padStart(2, '0')}s</span>
                  <span className="text-[10px] text-slate-400">({audioLevel}% vol)</span>
                </div>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Mantenha pressionado para falar como num rádio walkie-talkie
                </span>
              )}
            </div>

            {/* Erro de microfone se houver */}
            {micError && (
              <div className="mt-3 p-2 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{micError}</span>
              </div>
            )}

            {/* Teste Sonoro */}
            <div className="w-full flex items-center justify-between pt-4 mt-4 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => audioAlertService.playIntercomRingtone()}
                className="text-slate-400 hover:text-white flex items-center gap-1.5 transition text-[11px]"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Testar Toque do Interfone</span>
              </button>
              <button
                type="button"
                onClick={() => audioAlertService.playRogerBeep()}
                className="text-slate-400 hover:text-white flex items-center gap-1.5 transition text-[11px]"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Roger Beep</span>
              </button>
            </div>
          </div>

          {/* Atalhos Rápidos de Interfone */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-500">
              ⚡ Avisos Rápidos no Interfone (1-Clique)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendPreset(preset.text)}
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition cursor-pointer active:scale-98 space-y-1"
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
                  className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition"
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
                    Pressione o botão amarelo do rádio para enviar áudios instantâneos entre a Portaria e os Apartamentos.
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
                              onClick={() => handlePlayAudio(msg)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition ${
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
              placeholder="Digite uma mensagem rápida para enviar no canal..."
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
    </div>
  );
};
