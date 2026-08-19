import React, { useState, useEffect, useRef } from 'react';
import { Condominio, Morador, UserAccount, UserRole, ChamadaInterfone, Unidade } from '../../types';
import { condoStore } from '../../services/mockStorage';
import { callAudioService } from '../../utils/callAudio';
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Shield,
  Building2,
  Lock,
  Unlock,
  Sparkles,
  Zap,
  Radio,
  Clock,
  User,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveCallModalProps {
  condominio: Condominio;
  currentUser: UserAccount;
  currentMorador?: Morador | null;
}

export const LiveCallModal: React.FC<LiveCallModalProps> = ({
  condominio,
  currentUser,
  currentMorador,
}) => {
  const [activeCall, setActiveCall] = useState<ChamadaInterfone | null>(() => {
    return condoStore.getChamadaAtiva(
      condominio.id,
      currentUser.id,
      currentUser.role,
      currentUser.unidade || currentMorador?.unidade
    );
  });

  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isGateUnlocked, setIsGateUnlocked] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);
  const videoLocalRef = useRef<HTMLVideoElement | null>(null);

  // Inscreve-se nas mudanças da store e nos eventos de chamada
  useEffect(() => {
    const checkCall = () => {
      const call = condoStore.getChamadaAtiva(
        condominio.id,
        currentUser.id,
        currentUser.role,
        currentUser.unidade || currentMorador?.unidade
      );
      setActiveCall(call);
    };

    const unsubscribe = condoStore.subscribe(checkCall);

    const handleIncomingCall = (e: any) => {
      checkCall();
    };

    const handleStatusChange = (e: any) => {
      checkCall();
    };

    window.addEventListener('smartcondo_incoming_call', handleIncomingCall);
    window.addEventListener('smartcondo_call_status_change', handleStatusChange);
    window.addEventListener('storage', checkCall);

    return () => {
      unsubscribe();
      window.removeEventListener('smartcondo_incoming_call', handleIncomingCall);
      window.removeEventListener('smartcondo_call_status_change', handleStatusChange);
      window.removeEventListener('storage', checkCall);
    };
  }, [condominio.id, currentUser.id, currentUser.role, currentUser.unidade, currentMorador]);

  const isIncoming = activeCall && activeCall.callerId !== currentUser.id && activeCall.status === 'ringing';
  const isOutgoing = activeCall && activeCall.callerId === currentUser.id && activeCall.status === 'ringing';
  const isConnected = activeCall && activeCall.status === 'connected';

  // Gerenciamento de Sons e Ringtone
  useEffect(() => {
    if (!activeCall) {
      callAudioService.stopAll();
      stopMicrophone();
      clearInterval(timerIntervalRef.current);
      setCallDuration(0);
      return;
    }

    if (isIncoming) {
      callAudioService.startIncomingRingtone();
    } else if (isOutgoing) {
      callAudioService.startOutgoingDialTone();
    } else if (isConnected) {
      callAudioService.playCallConnected();
      startMicrophone();

      // Inicia contador de duração da chamada
      const startMs = activeCall.connectedAt || Date.now();
      timerIntervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startMs) / 1000));
      }, 1000);
    } else if (activeCall.status === 'rejected' || activeCall.status === 'ended') {
      callAudioService.playCallEnded();
      stopMicrophone();
      clearInterval(timerIntervalRef.current);
      const t = setTimeout(() => {
        setActiveCall(null);
      }, 1500);
      return () => clearTimeout(t);
    }

    return () => {
      callAudioService.stopAll();
    };
  }, [activeCall?.id, activeCall?.status]);

  // Inicializa microfone e analisador de espectro de áudio
  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoEnabled,
      });
      localStreamRef.current = stream;

      if (videoLocalRef.current && isVideoEnabled) {
        videoLocalRef.current.srcObject = stream;
      }

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        }
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      console.warn('Microfone não acessível ou permissão negada:', err);
    }
  };

  const stopMicrophone = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // Alternar Mudo
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted; // Inverte
      });
      setIsMuted(!isMuted);
    }
  };

  // Alternar Câmera de Vídeo
  const toggleVideo = async () => {
    const nextVideoState = !isVideoEnabled;
    setIsVideoEnabled(nextVideoState);
    if (localStreamRef.current) {
      stopMicrophone();
      setTimeout(startMicrophone, 200);
    }
  };

  // Atender Chamada
  const handleAnswer = () => {
    if (!activeCall) return;
    callAudioService.stopAll();
    condoStore.atenderChamada(condominio.id, activeCall.id);
  };

  // Recusar Chamada
  const handleReject = () => {
    if (!activeCall) return;
    callAudioService.stopAll();
    callAudioService.playCallEnded();
    condoStore.recusarChamada(condominio.id, activeCall.id);
    setActiveCall(null);
  };

  // Encerrar Chamada Ativa
  const handleHangup = () => {
    if (!activeCall) return;
    callAudioService.stopAll();
    callAudioService.playCallEnded();
    condoStore.encerrarChamada(condominio.id, activeCall.id);
    stopMicrophone();
    setActiveCall(null);
  };

  // Destravar Portão durante a Chamada
  const handleUnlockGate = () => {
    setIsGateUnlocked(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
    setTimeout(() => setIsGateUnlocked(false), 4000);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!activeCall) return null;

  const otherPersonName = isIncoming ? activeCall.callerName : activeCall.receiverName;
  const otherPersonRole = isIncoming ? activeCall.callerRole : activeCall.receiverRole;
  const otherPersonUnidade = isIncoming ? activeCall.callerUnidade : activeCall.receiverUnidade;

  const roleLabel =
    otherPersonRole === 'portaria'
      ? 'Portaria Central 24h'
      : otherPersonRole === 'sindico'
      ? 'Síndico / Administração'
      : otherPersonRole === 'super_admin'
      ? 'Super Admin'
      : 'Morador';

  return (
    <div
      id="live-call-modal-overlay"
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-2xl animate-fade-in select-none"
    >
      {/* CARD PRINCIPAL DA LIGAÇÃO */}
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/60 rounded-[2.5rem] shadow-2xl overflow-hidden p-6 sm:p-8 flex flex-col items-center text-center text-white space-y-6">
        
        {/* Glow Superior */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isConnected
              ? 'bg-emerald-500/25'
              : isIncoming
              ? 'bg-amber-500/30 animate-pulse'
              : 'bg-indigo-500/25 animate-pulse'
          }`}
        />

        {/* CABEÇALHO DO STATUS */}
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] font-black uppercase tracking-wider text-slate-300">
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-black">Em Conversação Direta</span>
              </>
            ) : isIncoming ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-amber-300 font-black">Chamada Recebida</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <span className="text-indigo-300 font-black">Chamando Destinatário...</span>
              </>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isConnected ? formatDuration(callDuration) : isIncoming ? 'Chamada de Voz Interfone' : 'Ligando...'}
          </h2>

          <p className="text-xs text-slate-400 font-medium">
            {condominio.nome} • Interfonia Digital WebRTC
          </p>
        </div>

        {/* AVATAR COM RADAR E ONDAS DE TRANSMISSÃO */}
        <div className="relative my-2 z-10 flex items-center justify-center">
          {/* Ondas pulsantes de radar (Estilo WhatsApp / Instagram) */}
          {(isIncoming || isOutgoing || (isConnected && audioLevel > 15)) && (
            <>
              <div
                className={`absolute w-44 h-44 rounded-full animate-ping opacity-25 pointer-events-none ${
                  isConnected ? 'bg-emerald-500' : isIncoming ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ animationDuration: isConnected ? '1.2s' : '2s' }}
              />
              <div
                className={`absolute w-36 h-36 rounded-full animate-pulse opacity-40 pointer-events-none ${
                  isConnected ? 'bg-emerald-400' : isIncoming ? 'bg-amber-400' : 'bg-indigo-400'
                }`}
              />
            </>
          )}

          {/* Círculo do Avatar */}
          <div
            className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-4 transition-all duration-300 shadow-2xl flex items-center justify-center overflow-hidden ${
              isConnected
                ? 'border-emerald-500 bg-slate-800 shadow-emerald-500/20 ring-4 ring-emerald-500/20'
                : isIncoming
                ? 'border-amber-500 bg-slate-800 shadow-amber-500/30 ring-4 ring-amber-500/30 animate-bounce'
                : 'border-indigo-500 bg-slate-800 shadow-indigo-500/20 ring-4 ring-indigo-500/20'
            }`}
          >
            {isVideoEnabled ? (
              <video
                ref={videoLocalRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-full"
              />
            ) : otherPersonRole === 'portaria' ? (
              <div className="w-full h-full bg-gradient-to-br from-amber-600 to-amber-900 rounded-full flex items-center justify-center text-white">
                <Building2 className="w-12 h-12" />
              </div>
            ) : otherPersonRole === 'sindico' ? (
              <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-full flex items-center justify-center text-white">
                <Shield className="w-12 h-12" />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-600 to-slate-900 rounded-full flex items-center justify-center text-white text-2xl font-black">
                {otherPersonName.charAt(0)}
              </div>
            )}
          </div>

          {/* Badge de Cargo Sobreposto */}
          <div className="absolute -bottom-2 bg-slate-950 text-slate-200 border border-slate-700 px-3 py-0.5 rounded-full text-[10px] font-black uppercase shadow-lg">
            {roleLabel}
          </div>
        </div>

        {/* IDENTIFICAÇÃO DO INTERLOCUTOR */}
        <div className="space-y-1 z-10">
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            {otherPersonName}
          </h3>
          {otherPersonUnidade && (
            <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>
                Bloco {otherPersonUnidade.bloco} • Apto {otherPersonUnidade.apto}
              </span>
            </div>
          )}
        </div>

        {/* VISUALIZADOR DE ONDAS SONORAS EM TEMPO REAL (QUANDO CONECTADO) */}
        {isConnected && (
          <div className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 flex flex-col items-center space-y-2 z-10">
            <div className="flex items-center gap-1.5 h-8 w-full justify-center">
              {[40, 75, 55, 90, 60, 100, 70, 85, 45, 95, 65, 80, 50].map((baseHeight, i) => {
                const dynamicH = Math.max(12, Math.round((baseHeight * (audioLevel + 20)) / 100));
                return (
                  <span
                    key={i}
                    className="w-1.5 bg-emerald-400 rounded-full transition-all duration-75"
                    style={{
                      height: `${dynamicH}%`,
                      opacity: audioLevel > 5 ? 0.9 : 0.35,
                    }}
                  />
                );
              })}
            </div>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Mic className="w-3 h-3 text-emerald-400" />
              <span>Microfone Bidirecional Ativo • Full Duplex</span>
            </span>
          </div>
        )}

        {/* CONTROLES DURANTE A CHAMADA ATIVA */}
        {isConnected && (
          <div className="grid grid-cols-4 gap-2 w-full pt-1 z-10">
            {/* MUDO */}
            <button
              type="button"
              onClick={toggleMute}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5" />}
              <span>{isMuted ? 'Mudo' : 'Microfone'}</span>
            </button>

            {/* VIVA-VOZ */}
            <button
              type="button"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
                isSpeakerOn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5" />}
              <span>Viva-Voz</span>
            </button>

            {/* VÍDEO */}
            <button
              type="button"
              onClick={toggleVideo}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
                isVideoEnabled
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isVideoEnabled ? <Video className="w-5 h-5 text-indigo-400" /> : <VideoOff className="w-5 h-5" />}
              <span>Câmera</span>
            </button>

            {/* DESTRAVAR PORTÃO */}
            <button
              type="button"
              onClick={handleUnlockGate}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
                isGateUnlocked
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-800 hover:bg-amber-600/20 hover:border-amber-500 text-amber-300 border border-slate-700'
              }`}
            >
              {isGateUnlocked ? <Unlock className="w-5 h-5 text-emerald-300" /> : <Lock className="w-5 h-5" />}
              <span>{isGateUnlocked ? 'Aberto!' : 'Portão'}</span>
            </button>
          </div>
        )}

        {/* BOTÕES DE AÇÃO: ATENDER / RECUSAR / ENCERRAR */}
        <div className="w-full pt-2 z-10">
          {isIncoming ? (
            /* ESTADO 1: CHAMADA RECEBIDA (BOMBA NA TELA) */
            <div className="flex items-center justify-center gap-8 w-full">
              {/* BOTÃO RECUSAR */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleReject}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition cursor-pointer border-2 border-rose-400/50"
                  title="Recusar Chamada"
                >
                  <PhoneOff className="w-8 h-8" />
                </button>
                <span className="text-xs font-black text-rose-300 uppercase tracking-wider">Recusar</span>
              </div>

              {/* BOTÃO ATENDER */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleAnswer}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/50 transition cursor-pointer border-2 border-emerald-300 animate-bounce"
                  title="Atender Chamada"
                >
                  <PhoneCall className="w-8 h-8 text-slate-950" />
                </button>
                <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">Atender</span>
              </div>
            </div>
          ) : isOutgoing ? (
            /* ESTADO 2: CHAMANDO (CANCELAR) */
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleHangup}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition cursor-pointer border-2 border-rose-400/50"
                title="Cancelar Chamada"
              >
                <PhoneOff className="w-7 h-7" />
              </button>
              <span className="text-xs font-bold text-rose-300">Cancelar</span>
            </div>
          ) : (
            /* ESTADO 3: CONECTADO (ENCERRAR) */
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={handleHangup}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-rose-600/30 transition cursor-pointer border border-rose-400/30"
              >
                <PhoneOff className="w-5 h-5" />
                <span>Encerrar Chamada</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
