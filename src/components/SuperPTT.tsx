import React, { useState, useRef, useEffect, useMemo } from 'react';
import { nextelAudio } from '../utils/nextelAudio';
import { Condominio, Morador, UserRole } from '../types';
import { condoStore } from '../services/mockStorage';
import {
  Radio,
  Building2,
  Users,
  Briefcase,
  ShieldAlert,
  Mic,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Signal,
  Headphones,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CanalPTT {
  id: string;
  nome: string;
  tipo: 'portaria' | 'sindico' | 'morador' | 'geral' | 'emergencia';
  descricao: string;
}

interface SuperPTTProps {
  condominio?: Condominio;
  currentUserRole?: UserRole;
  currentMorador?: Morador | null;
  currentUserName?: string;
  onSendVoiceTransmission?: (audioBase64: string, durationSec: number, channel: string) => void;
}

export const SuperPTT: React.FC<SuperPTTProps> = ({
  condominio,
  currentUserRole = 'morador',
  currentMorador,
  currentUserName = 'Morador',
  onSendVoiceTransmission,
}) => {
  const isPortariaOrStaff =
    currentUserRole === 'portaria' || currentUserRole === 'sindico' || currentUserRole === 'super_admin';

  // Canais disponíveis
  const canais: CanalPTT[] = useMemo(() => {
    if (isPortariaOrStaff) {
      return [
        { id: 'moradores', nome: 'Moradores / Unidades', tipo: 'morador', descricao: 'Comunicação direta com apartamentos' },
        { id: 'sindico', nome: 'Síndico / Administração', tipo: 'sindico', descricao: 'Canal exclusivo da gestão' },
        { id: 'geral', nome: '📢 Canal Geral (Todos)', tipo: 'geral', descricao: 'Comunicado simultâneo a todo o condomínio' },
        { id: 'emergencia', nome: '🚨 Canal de Emergência', tipo: 'emergencia', descricao: 'Alerta crítico de segurança' },
      ];
    }
    return [
      { id: 'portaria', nome: 'Portaria 24h', tipo: 'portaria', descricao: 'Canal direto com o posto de portaria' },
      { id: 'sindico', nome: 'Síndico / Gestão', tipo: 'sindico', descricao: 'Mensagens diretas à administração' },
      { id: 'vizinho', nome: 'Vizinho / Morador', tipo: 'morador', descricao: 'Interfonia entre unidades vizinhas' },
      { id: 'geral', nome: '📢 Canal Geral', tipo: 'geral', descricao: 'Canal aberto comunitário' },
    ];
  }, [isPortariaOrStaff]);

  const [canalAtivo, setCanalAtivo] = useState<string>(isPortariaOrStaff ? 'moradores' : 'portaria');
  const [transmitindo, setTransmitindo] = useState<boolean>(false);
  const [recebendoAudio, setRecebendoAudio] = useState<boolean>(false);
  const [quemEstaFalando, setQuemEstaFalando] = useState<string | null>(null);
  const [segundos, setSegundos] = useState<number>(0);
  const [targetBloco, setTargetBloco] = useState<string>('1');
  const [targetApto, setTargetApto] = useState<string>('101');
  const [pttMode, setPttMode] = useState<'hold' | 'toggle'>('hold');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<number[]>([20, 35, 60, 80, 45, 25, 65, 90, 70, 40, 20, 50]);

  const timerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Solicita permissão prévia do microfone no carregamento
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
        })
        .catch((err) => console.warn('Aguardando permissão de microfone:', err));
    }

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  // Escuta novas mensagens do interfone para simular recebimento RX imediato com bipe
  useEffect(() => {
    if (!condominio) return;

    const unsub = condoStore.subscribe(() => {
      const msgs = condoStore.getInterfoneMensagens(
        condominio.id,
        currentMorador?.id,
        currentMorador?.unidade?.bloco,
        currentMorador?.unidade?.apto
      );

      if (msgs.length > 0) {
        const lastMsg = msgs[msgs.length - 1];
        const isRecent = Date.now() - new Date(lastMsg.criadoEm).getTime() < 3500;
        const isFromOther = lastMsg.remetenteId !== (currentMorador?.id || 'portaria_central');

        if (isRecent && isFromOther && !transmitindo) {
          setQuemEstaFalando(lastMsg.remetenteNome);
          setRecebendoAudio(true);
          nextelAudio.playChirp();

          if (lastMsg.audioDataUrl) {
            const audio = new Audio(lastMsg.audioDataUrl);
            audio.play().catch(() => {});
            audio.onended = () => {
              nextelAudio.playRogerBeep();
              setRecebendoAudio(false);
              setQuemEstaFalando(null);
            };
          } else {
            setTimeout(() => {
              nextelAudio.playRogerBeep();
              setRecebendoAudio(false);
              setQuemEstaFalando(null);
            }, (lastMsg.duracaoSegundos || 2) * 1000);
          }
        }
      }
    });

    return unsub;
  }, [condominio, currentMorador, transmitindo]);

  // INICIAR TRANSMISSÃO PTT (ESTILO NEXTEL)
  const iniciarTransmissao = async () => {
    if (recebendoAudio || transmitindo) return;

    try {
      // 1. Toca o clássico bipe Chirp do Nextel imediatamente
      nextelAudio.playChirp();

      // 2. Obtém microfone ou usa stream ativo
      const stream =
        mediaStreamRef.current && mediaStreamRef.current.active
          ? mediaStreamRef.current
          : await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // 3. Web Audio Analyser para animação ao vivo
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
          const step = Math.max(1, Math.floor(dataArray.length / 12));

          for (let i = 0; i < 12; i++) {
            const val = dataArray[i * step] || 0;
            sum += val;
            bars.push(Math.max(15, Math.min(100, Math.round((val / 255) * 100))));
          }

          setFrequencyData(bars);
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          animationFrameRef.current = requestAnimationFrame(updateSpectrum);
        }
      };
      updateSpectrum();

      // 4. MediaRecorder para empacotar o áudio de voz
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

      setTransmitindo(true);
      setSegundos(0);
      startTimeRef.current = Date.now();

      // Trava de segurança de 30 segundos
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSegundos((prev) => {
          if (prev >= 29) {
            pararTransmissao();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.warn('Erro ao iniciar transmissão PTT:', err);
      setTransmitindo(false);
    }
  };

  // PARAR TRANSMISSÃO PTT (ROGER BEEP DE ENCERRAMENTO)
  const pararTransmissao = () => {
    if (!transmitindo) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    // Toca o bipe característico de encerramento
    nextelAudio.playRogerBeep();
    setTransmitindo(false);

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      const duracao = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      setTimeout(() => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;

          if (onSendVoiceTransmission) {
            onSendVoiceTransmission(base64, duracao, canalAtivo);
          } else if (condominio) {
            // Disparo automático via condoStore
            const isGeral = canalAtivo === 'geral';
            const isEmergencia = canalAtivo === 'emergencia';
            const isSindicoChannel = canalAtivo === 'sindico';

            condoStore.enviarInterfoneMensagem(condominio.id, {
              condominioId: condominio.id,
              remetenteId: currentMorador ? currentMorador.id : 'portaria_central',
              remetenteNome: isPortariaOrStaff
                ? 'Portaria Central'
                : `${currentMorador?.nome || 'Morador'} (Bloco ${currentMorador?.unidade?.bloco || '1'} - Apto ${currentMorador?.unidade?.apto || '303'})`,
              remetenteTipo: isPortariaOrStaff ? 'portaria' : 'morador',
              remetenteUnidade: currentMorador?.unidade,
              destinatarioTipo: isGeral || isEmergencia ? 'todos' : isPortariaOrStaff ? 'morador' : 'portaria',
              destinatarioUnidade:
                canalAtivo === 'vizinho' || (isPortariaOrStaff && canalAtivo === 'moradores')
                  ? { bloco: targetBloco, apto: targetApto }
                  : undefined,
              tipoCanal: isEmergencia ? 'emergencia' : isGeral ? 'geral' : 'portaria_morador',
              audioDataUrl: base64,
              duracaoSegundos: duracao,
              texto: `Transmissão de Voz PTT Nextel (${duracao}s)`,
              prioridade: isEmergencia ? 'emergencia' : 'normal',
            });
          }
        };
        reader.readAsDataURL(audioBlob);
      }, 200);
    }

    setSegundos(0);
  };

  const canalSelecionadoObj = canais.find((c) => c.id === canalAtivo) || canais[0];

  return (
    <div className="bg-[#0b1728] text-white p-6 sm:p-7 rounded-3xl border border-[#00D7A5]/30 shadow-2xl max-w-lg mx-auto select-none relative overflow-hidden">
      {/* Luz ambiente de transmissão */}
      {transmitindo && (
        <div className="absolute inset-0 bg-rose-500/10 pointer-events-none animate-pulse" />
      )}

      {/* Cabeçalho Nextel */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#132742] border border-[#00D7A5]/30 flex items-center justify-center text-[#00EBB4] font-black shadow-inner">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-[#00EBB4] uppercase bg-[#132742] px-2 py-0.5 rounded-md border border-[#00D7A5]/20">
              DTA Nextel PTT • WebRTC
            </span>
            <h2 className="text-lg sm:text-xl font-black tracking-wide mt-0.5">
              Rádio Interfone Instantâneo
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#050d1a] px-3 py-1.5 rounded-full border border-slate-800">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              transmitindo
                ? 'bg-rose-500 animate-ping'
                : recebendoAudio
                ? 'bg-amber-400 animate-pulse'
                : 'bg-emerald-400'
            }`}
          />
          <span className="text-[11px] font-mono font-bold uppercase text-slate-300">
            {transmitindo ? 'TX (Ao Vivo)' : recebendoAudio ? 'RX (Ouvindo)' : 'Standby'}
          </span>
        </div>
      </div>

      {/* Seletor de Modo PTT (Segurar vs Clique) */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-4 px-1">
        <span className="font-semibold text-slate-300">Selecione o Canal:</span>
        <button
          type="button"
          onClick={() => setPttMode(pttMode === 'hold' ? 'toggle' : 'hold')}
          className="text-[#00EBB4] hover:underline font-bold text-[11px] cursor-pointer flex items-center gap-1"
        >
          <span>Modo:</span>
          <strong className="text-white underline">
            {pttMode === 'hold' ? 'Segurar p/ Falar' : 'Clique p/ Ligar/Desligar'}
          </strong>
        </button>
      </div>

      {/* Grid de Canais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {canais.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCanalAtivo(c.id)}
            disabled={transmitindo}
            className={`py-2 px-2 text-center rounded-2xl text-xs font-black transition-all border cursor-pointer ${
              canalAtivo === c.id
                ? 'bg-[#00D7A5] text-[#050d1a] border-[#00D7A5] shadow-lg shadow-[#00D7A5]/25 scale-102'
                : 'bg-[#10243d] text-slate-300 border-slate-700 hover:bg-[#18365a] hover:text-white'
            }`}
          >
            {c.nome}
          </button>
        ))}
      </div>

      {/* Configuração de Apartamento Específico quando canal for Morador/Vizinho */}
      {(canalAtivo === 'vizinho' || canalAtivo === 'moradores') && (
        <div className="p-3 bg-[#081322] border border-[#00D7A5]/20 rounded-2xl mb-4 text-xs space-y-2 animate-in fade-in">
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#00EBB4] block">
            Unidade de Destino:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Bloco (Ex: 1 ou A)"
              value={targetBloco}
              onChange={(e) => setTargetBloco(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#050d1a] border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-[#00D7A5] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Apto (Ex: 303)"
              value={targetApto}
              onChange={(e) => setTargetApto(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#050d1a] border border-slate-700 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-[#00D7A5] focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Visor Central LCD / Status do Transmissor */}
      <div className="bg-[#050d1a] border-2 border-slate-800 rounded-2xl p-5 mb-6 text-center relative overflow-hidden shadow-inner">
        {transmitindo ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Sua voz está ao vivo no canal</span>
            </div>

            <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-widest">
              00:{segundos < 10 ? `0${segundos}` : segundos} <span className="text-xs text-slate-500">/ 00:30s</span>
            </div>

            {/* Barra de Progresso de Transmissão */}
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 mt-2">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-rose-600 transition-all duration-150 rounded-full"
                style={{ width: `${Math.min(100, (segundos / 30) * 100)}%` }}
              />
            </div>

            {/* Espectro de Ondas de Voz */}
            <div className="flex items-end justify-center gap-1 h-8 pt-2">
              {frequencyData.map((val, idx) => (
                <div
                  key={idx}
                  className="w-2 bg-[#00D7A5] rounded-t-sm transition-all duration-75"
                  style={{ height: `${val}%`, minHeight: '6px' }}
                />
              ))}
            </div>
          </div>
        ) : recebendoAudio ? (
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase tracking-widest animate-pulse">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Recebendo áudio ao vivo</span>
            </div>
            <p className="text-xl font-black text-white">{quemEstaFalando || 'Portaria Principal'}</p>
            <p className="text-xs text-slate-400">Canal: {canalSelecionadoObj.nome}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="text-xs font-mono uppercase tracking-wider text-[#00EBB4]">
              {canalSelecionadoObj.nome}
            </div>
            <p className="text-xs text-slate-400">{canalSelecionadoObj.descricao}</p>
            <p className="text-[11px] text-slate-500 pt-1">
              {pttMode === 'hold'
                ? 'Pressione e segure o botão central para falar'
                : 'Clique no botão central para iniciar a transmissão de voz'}
            </p>
          </div>
        )}
      </div>

      {/* Botão Central de Transmissão Estilo Nextel com Efeitos Sonoros */}
      <div className="flex flex-col items-center justify-center mb-4">
        {pttMode === 'hold' ? (
          <button
            id="btn-super-ptt-hold"
            onMouseDown={iniciarTransmissao}
            onMouseUp={pararTransmissao}
            onTouchStart={(e) => {
              e.preventDefault();
              iniciarTransmissao();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              pararTransmissao();
            }}
            className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full font-black tracking-wider uppercase transition-all duration-150 flex flex-col items-center justify-center border-4 shadow-2xl cursor-pointer select-none touch-none ${
              transmitindo
                ? 'bg-rose-600 border-rose-400 text-white scale-95 shadow-rose-600/50 ring-8 ring-rose-500/30'
                : 'bg-[#132d4e] hover:bg-[#1a3c68] border-[#00D7A5] text-[#00EBB4] active:scale-95 shadow-[#00D7A5]/30'
            }`}
          >
            <Mic className={`w-10 h-10 mb-1 transition ${transmitindo ? 'scale-110 animate-pulse text-white' : ''}`} />
            <span className="text-[11px] font-mono font-black">
              {transmitindo ? 'SOLTE P/ ENVIAR' : 'SEGURE P/ FALAR'}
            </span>
          </button>
        ) : (
          <button
            id="btn-super-ptt-toggle"
            type="button"
            onClick={() => {
              if (transmitindo) pararTransmissao();
              else iniciarTransmissao();
            }}
            className={`w-36 h-36 sm:w-40 sm:h-40 rounded-full font-black tracking-wider uppercase transition-all duration-150 flex flex-col items-center justify-center border-4 shadow-2xl cursor-pointer select-none ${
              transmitindo
                ? 'bg-rose-600 border-rose-400 text-white scale-95 shadow-rose-600/50 ring-8 ring-rose-500/30 animate-pulse'
                : 'bg-[#132d4e] hover:bg-[#1a3c68] border-[#00D7A5] text-[#00EBB4] active:scale-95 shadow-[#00D7A5]/30'
            }`}
          >
            <Mic className={`w-10 h-10 mb-1 transition ${transmitindo ? 'scale-110 text-white' : ''}`} />
            <span className="text-[11px] font-mono font-black">
              {transmitindo ? 'CLIQUE P/ ENCERRAR' : 'CLIQUE P/ FALAR'}
            </span>
          </button>
        )}

        {/* Rodapé com testes de bipe */}
        <div className="flex items-center justify-between w-full pt-4 mt-5 border-t border-slate-800 text-[11px] text-slate-400">
          <button
            type="button"
            onClick={() => nextelAudio.playChirp()}
            className="hover:text-[#00EBB4] transition cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00EBB4]" />
            <span>Testar Chirp</span>
          </button>

          <button
            type="button"
            onClick={() => nextelAudio.playRogerBeep()}
            className="hover:text-[#00EBB4] transition cursor-pointer flex items-center gap-1"
          >
            <Radio className="w-3.5 h-3.5 text-[#00EBB4]" />
            <span>Testar Roger Beep</span>
          </button>
        </div>
      </div>
    </div>
  );
};
