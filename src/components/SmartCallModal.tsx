import React, { useEffect, useState, useRef } from 'react';
import { ringtoneAudio, callAudioService } from '../utils/callAudio';
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
  Building2,
  Shield,
  Lock,
  Unlock,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export interface ChamadaData {
  id: string;
  origemId?: string;
  origemNome: string;
  origemTipo: 'portaria' | 'sindico' | 'morador' | 'super_admin';
  origemUnidade?: string;
  destinoId?: string;
  destinoNome?: string;
  destinoTipo?: 'portaria' | 'sindico' | 'morador';
  destinoUnidade?: string;
  tipoMidia: 'audio' | 'video';
  status: 'chamando' | 'em_andamento' | 'finalizada' | 'recusada';
  criadoEm?: number;
  sdpOffer?: any;
  sdpAnswer?: any;
}

interface Props {
  chamada: ChamadaData | null;
  onAtender: () => void;
  onRecusar: () => void;
  onFinalizar: () => void;
  duracaoChamada: number; // Segundos
}

export const SmartCallModal: React.FC<Props> = ({
  chamada,
  onAtender,
  onRecusar,
  onFinalizar,
  duracaoChamada,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isGateUnlocked, setIsGateUnlocked] = useState(false);

  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (chamada?.status === 'chamando') {
      ringtoneAudio.playRingTone();
      stopMicrophone();
    } else if (chamada?.status === 'em_andamento') {
      ringtoneAudio.stopRingTone();
      callAudioService.playCallConnected();
      startMicrophone();
    } else {
      ringtoneAudio.stopRingTone();
      stopMicrophone();
    }

    return () => {
      ringtoneAudio.stopRingTone();
      stopMicrophone();
    };
  }, [chamada?.status]);

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideoEnabled,
      });
      localStreamRef.current = stream;

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
    } catch {
      // Ignora se não houver microfone disponível
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

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleUnlockGate = () => {
    setIsGateUnlocked(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
    setTimeout(() => setIsGateUnlocked(false), 4000);
  };

  if (!chamada || chamada.status === 'finalizada' || chamada.status === 'recusada') {
    return null;
  }

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min < 10 ? '0' : ''}${min}:${seg < 10 ? '0' : ''}${seg}`;
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#050d1a]/95 backdrop-blur-2xl flex flex-col justify-between items-center py-10 px-6 text-white select-none animate-fadeIn">
      {/* Topo: Identificação de quem liga */}
      <div className="text-center mt-4 space-y-2">
        <span className="text-xs font-mono uppercase bg-[#132742] text-[#00EBB4] border border-[#00D7A5]/30 px-3.5 py-1 rounded-full font-black tracking-wider">
          {chamada.origemTipo === 'portaria'
            ? '🏢 Portaria Principal 24h'
            : chamada.origemTipo === 'sindico'
            ? '👔 Administração / Síndico'
            : '🏠 Interfone Morador'}
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold mt-4 tracking-tight text-slate-100">
          {chamada.origemNome}
        </h2>
        {chamada.origemUnidade && (
          <p className="text-sm font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
            <Building2 className="w-4 h-4" />
            <span>{chamada.origemUnidade}</span>
          </p>
        )}
        <p className="text-sm font-semibold mt-2 text-slate-300">
          {chamada.status === 'chamando'
            ? '📞 Chamando no Interfone Digital...'
            : `🟢 Em chamada em tempo real (${formatarTempo(duracaoChamada)})`}
        </p>
      </div>

      {/* Centro: Avatar com Efeito Pulsante de Onda Sonora / Radar */}
      <div className="relative flex items-center justify-center my-auto">
        {chamada.status === 'chamando' && (
          <>
            <div className="absolute w-48 h-48 rounded-full bg-[#00D7A5]/20 animate-ping" />
            <div className="absolute w-40 h-40 rounded-full bg-[#00D7A5]/30 animate-pulse" />
          </>
        )}
        {chamada.status === 'em_andamento' && audioLevel > 15 && (
          <div
            className="absolute rounded-full bg-emerald-500/25 animate-ping"
            style={{ width: `${140 + audioLevel}px`, height: `${140 + audioLevel}px` }}
          />
        )}
        <div className="relative w-32 h-32 rounded-full bg-[#10243d] border-4 border-[#00D7A5] flex items-center justify-center shadow-2xl shadow-[#00D7A5]/40 overflow-hidden">
          {chamada.origemTipo === 'portaria' ? (
            <Building2 className="w-16 h-16 text-[#00EBB4]" />
          ) : chamada.origemTipo === 'sindico' ? (
            <Shield className="w-16 h-16 text-[#00EBB4]" />
          ) : (
            <span className="text-4xl font-black text-[#00EBB4]">
              {chamada.origemNome.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Visualizador de Áudio & Controles em Chamada */}
      {chamada.status === 'em_andamento' && (
        <div className="w-full max-w-sm space-y-4 my-2">
          {/* Ondas Sonoras */}
          <div className="w-full bg-[#0c1c30] border border-slate-700/60 rounded-2xl p-3 flex flex-col items-center space-y-1.5">
            <div className="flex items-center gap-1.5 h-6 w-full justify-center">
              {[40, 75, 55, 90, 60, 100, 70, 85, 45, 95, 65, 80, 50].map((baseHeight, i) => {
                const dynamicH = Math.max(15, Math.round((baseHeight * (audioLevel + 20)) / 100));
                return (
                  <span
                    key={i}
                    className="w-1.5 bg-[#00EBB4] rounded-full transition-all duration-75"
                    style={{
                      height: `${dynamicH}%`,
                      opacity: audioLevel > 5 ? 0.95 : 0.4,
                    }}
                  />
                );
              })}
            </div>
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Mic className="w-3 h-3 text-[#00EBB4]" />
              <span>Transmissão WebRTC P2P Ativa</span>
            </span>
          </div>

          {/* Botões Rápidos (Mudo, Viva-Voz, Portão) */}
          <div className="grid grid-cols-3 gap-2 w-full">
            <button
              type="button"
              onClick={toggleMute}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-[#10243d] hover:bg-[#163050] text-slate-200 border border-slate-700'
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5 text-rose-400" /> : <Mic className="w-5 h-5" />}
              <span>{isMuted ? 'Mudo' : 'Microfone'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
                isSpeakerOn
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-[#10243d] hover:bg-[#163050] text-slate-200 border border-slate-700'
              }`}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5 text-[#00EBB4]" /> : <VolumeX className="w-5 h-5" />}
              <span>Viva-Voz</span>
            </button>

            <button
              type="button"
              onClick={handleUnlockGate}
              className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition cursor-pointer ${
                isGateUnlocked
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-[#10243d] hover:bg-amber-600/20 text-amber-300 border border-slate-700'
              }`}
            >
              {isGateUnlocked ? <Unlock className="w-5 h-5 text-emerald-300" /> : <Lock className="w-5 h-5" />}
              <span>{isGateUnlocked ? 'Aberto!' : 'Portão'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Rodapé: Botões de Ação */}
      <div className="w-full max-w-sm">
        {chamada.status === 'chamando' ? (
          <div className="flex justify-around items-center">
            {/* Botão Recusar */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onRecusar}
                className="w-20 h-20 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition-all cursor-pointer border-2 border-rose-400/50"
                title="Recusar Chamada"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <span className="text-xs font-bold text-rose-400">Recusar</span>
            </div>

            {/* Botão Atender */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={onAtender}
                className="w-20 h-20 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40 active:scale-95 animate-bounce transition-all cursor-pointer border-2 border-emerald-300"
                title="Atender Chamada"
              >
                <PhoneCall className="w-8 h-8 text-slate-950" />
              </button>
              <span className="text-xs font-bold text-emerald-400">Atender</span>
            </div>
          </div>
        ) : (
          /* Botão Encerrar Chamada Ativa */
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onFinalizar}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-rose-600/30 active:scale-98 transition-all cursor-pointer border border-rose-400/30"
            >
              <PhoneOff className="w-6 h-6" />
              <span>Encerrar Ligação</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
