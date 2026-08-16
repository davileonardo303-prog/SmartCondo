import React, { useState } from 'react';
import {
  X,
  Bike,
  KeyRound,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  BatteryCharging,
  MapPin,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Bicicleta, Morador } from '../../types';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';

interface BikeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bike: Bicicleta | null;
  condoId: string;
  morador: Morador;
  onSuccessUnlock: (bike: Bicicleta, lockPassword: string) => void;
}

export const BikeSelectionModal: React.FC<BikeSelectionModalProps> = ({
  isOpen,
  onClose,
  bike,
  condoId,
  morador,
  onSuccessUnlock,
}) => {
  const [senhaInput, setSenhaInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [solicitacaoAtiva, setSolicitacaoAtiva] = useState<{
    codigoReserva: string;
    timestamp: number;
  } | null>(null);
  const [copiado, setCopiado] = useState(false);

  if (!isOpen || !bike) return null;

  // Verifica se a bike já está reservada por este morador
  const isReservedByMe =
    bike.status === 'reservada_5min' && bike.reservaMoradorId === morador.id;
  const codigoExibicao =
    solicitacaoAtiva?.codigoReserva || bike.reservaCodigo || `BK-${bike.codigo}`;

  const handleMarcarBike = () => {
    setErrorMessage('');
    const res = condoStore.solicitarRetiradaBike(condoId, bike.id, morador.id);
    if (res.success && res.codigoReserva) {
      setSolicitacaoAtiva({
        codigoReserva: res.codigoReserva,
        timestamp: Date.now(),
      });
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleValidarSenha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senhaInput.trim()) {
      setErrorMessage('Por favor, digite a senha fornecida pela portaria ou síndico.');
      return;
    }

    setErrorMessage('');
    const res = condoStore.desbloquearBikeComSenha(
      condoId,
      bike.id,
      morador.id,
      senhaInput.trim()
    );

    if (res.success && res.bike) {
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      onSuccessUnlock(res.bike, res.lockPassword || res.bike.lockPassword || '1234');
      onClose();
    } else {
      setErrorMessage(res.message || 'Senha incorreta.');
    }
  };

  const handleCopiarCodigo = () => {
    navigator.clipboard.writeText(codigoExibicao);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Retirada de Bicicleta #{bike.codigo}
              </h3>
              <p className="text-xs text-slate-500 font-medium">{bike.modelo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Card com Detalhes da Bike */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black px-3 py-1 rounded-xl bg-slate-900 text-white">
                Código: #{bike.codigo}
              </span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {bike.status === 'disponivel' ? 'Disponível no Totem' : 'Reserva em Andamento'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Categoria</span>
                <span className="font-bold text-slate-800 capitalize">{bike.tipo}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Localização</span>
                <span className="font-bold text-slate-800 truncate block">
                  {bike.localizacaoAtual || 'Totem Portaria'}
                </span>
              </div>
            </div>

            {bike.tipo === 'e-bike' && bike.nivelBateria !== undefined && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <BatteryCharging className="w-4 h-4 text-emerald-600" />
                <span>Nível de Carga Elétrica: {bike.nivelBateria}%</span>
              </div>
            )}
          </div>

          {/* Mensagem de Erro se houver */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* FLUXO 1: AINDA NÃO MARCOU A BIKE */}
          {bike.status === 'disponivel' && !solicitacaoAtiva && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center gap-2 font-black">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Como funciona a retirada sem QR Code:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-emerald-900 font-medium pl-1">
                  <li>Clique no botão abaixo para <strong>marcar a bicicleta</strong>.</li>
                  <li>Um código de solicitação de 4 dígitos será gerado.</li>
                  <li>Apresente ao porteiro ou síndico para obter a <strong>senha do cadeado</strong>.</li>
                  <li>Insira a senha para destravar e aproveitar o passeio!</li>
                </ol>
              </div>

              <button
                onClick={handleMarcarBike}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Confirmar & Gerar Código de Retirada</span>
              </button>
            </div>
          )}

          {/* FLUXO 2: BIKE MARCADA / AGUARDANDO SENHA DO PORTEIRO OU SÍNDICO */}
          {(solicitacaoAtiva || isReservedByMe) && (
            <div className="space-y-4">
              {/* Código de Solicitação em Destaque */}
              <div className="bg-amber-500 text-white p-5 rounded-2xl text-center shadow-md space-y-2">
                <span className="text-xs uppercase font-bold tracking-wider text-amber-100 block">
                  Código de Liberação na Portaria:
                </span>
                <div className="text-3xl font-black font-mono tracking-widest bg-white/15 py-2 px-4 rounded-xl inline-block border border-white/20">
                  {codigoExibicao}
                </div>

                <div className="flex justify-center pt-1">
                  <button
                    onClick={handleCopiarCodigo}
                    className="px-3.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition flex items-center gap-1.5"
                  >
                    {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiado ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-amber-100 mt-1">
                  ⏱️ Tolerância de 5 minutos para retirada no totem.
                </p>
              </div>

              {/* Inserir Senha da Portaria / Cadeado */}
              <form onSubmit={handleValidarSenha} className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-800 block">
                  🔑 Digite a Senha fornecida pelo Porteiro ou Síndico:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: 5820"
                    value={senhaInput}
                    onChange={(e) => setSenhaInput(e.target.value)}
                    className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-2xl px-4 py-3 text-slate-900 font-mono font-black text-center text-lg focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-2xl transition shadow-md shadow-emerald-600/20 active:scale-98 flex items-center gap-1.5 shrink-0"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Destravar Bike</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Assim que o porteiro ou síndico liberar, use a senha informada para abrir o cadeado físico.
                </p>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
