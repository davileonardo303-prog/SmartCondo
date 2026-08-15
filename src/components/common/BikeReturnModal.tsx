import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ClipboardCheck,
  Wrench,
  Shield,
  Bike,
} from 'lucide-react';
import { Bicicleta, Morador } from '../../types';
import confetti from 'canvas-confetti';

interface BikeReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  bike: Bicicleta | null;
  currentMorador: Morador | undefined;
  onSubmitReturn: (data: {
    localDevolucao: string;
    freiosOk: boolean;
    correnteOk: boolean;
    pneusOk: boolean;
    quadroOk: boolean;
    observacoes: string;
  }) => void;
}

export const BikeReturnModal: React.FC<BikeReturnModalProps> = ({
  isOpen,
  onClose,
  bike,
  currentMorador,
  onSubmitReturn,
}) => {
  const [localDevolucao, setLocalDevolucao] = useState('Totem Principal - Portaria A');
  const [freiosOk, setFreiosOk] = useState(true);
  const [correnteOk, setCorrenteOk] = useState(true);
  const [pneusOk, setPneusOk] = useState(true);
  const [quadroOk, setQuadroOk] = useState(true);
  const [observacoes, setObservacoes] = useState('');

  if (!isOpen || !bike) return null;

  const hasAvaria = !freiosOk || !correnteOk || !pneusOk || !quadroOk;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAvaria) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
    onSubmitReturn({
      localDevolucao,
      freiosOk,
      correnteOk,
      pneusOk,
      quadroOk,
      observacoes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Devolução & Checklist da Bike
              </h3>
              <p className="text-xs text-slate-500">
                Bike #{bike.codigo} • {bike.modelo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Station Selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Onde você está devolvendo a bicicleta?
            </label>
            <select
              value={localDevolucao}
              onChange={(e) => setLocalDevolucao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="Totem Principal - Portaria A">
                Totem Principal - Portaria A
              </option>
              <option value="Totem Secundário - Portaria B">
                Totem Secundário - Portaria B
              </option>
              <option value="Deck de Bicicletas - Subsolo 1">
                Deck de Bicicletas - Subsolo 1
              </option>
              <option value="Bicicletário da Piscina / Clube">
                Bicicletário da Piscina / Clube
              </option>
            </select>
          </div>

          {/* Checklist de Condições */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Wrench className="w-4 h-4 text-amber-600" />
                Checklist Rápido de Estado da Bicicleta
              </label>
              <span className="text-[11px] text-slate-500">
                (Clique para sinalizar algum problema)
              </span>
            </div>

            {/* Grid dos itens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Freios */}
              <div
                onClick={() => setFreiosOk(!freiosOk)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  freiosOk
                    ? 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">Freios Diant. / Tras.</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {freiosOk ? '✓ Funcionando perfeitamente' : '⚠️ Com folga / chiando'}
                  </div>
                </div>
              </div>

              {/* Corrente & Marchas */}
              <div
                onClick={() => setCorrenteOk(!correnteOk)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  correnteOk
                    ? 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">Corrente & Marchas</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {correnteOk ? '✓ Lubrificada e precisa' : '⚠️ Corrente caída / travando'}
                  </div>
                </div>
              </div>

              {/* Pneus */}
              <div
                onClick={() => setPneusOk(!pneusOk)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  pneusOk
                    ? 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">Pressão dos Pneus</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {pneusOk ? '✓ Calibrados' : '⚠️ Pneu murcho / furado'}
                  </div>
                </div>
              </div>

              {/* Quadro e Selim */}
              <div
                onClick={() => setQuadroOk(!quadroOk)}
                className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  quadroOk
                    ? 'bg-slate-50 border-slate-200 hover:border-emerald-300'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">Quadro, Guidão & Selim</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {quadroOk ? '✓ Em ótimo estado' : '⚠️ Arranhão / Peça solta'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aviso se houver avaria */}
          {hasAvaria && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                Você sinalizou itens que precisam de atenção. A bicicleta será automaticamente direcionada para a oficina de manutenção preventiva do condomínio.
              </p>
            </div>
          )}

          {/* Observações Livres */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Observações adicionais para a equipe de manutenção:
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Pneu traseiro pareceu esvaziar um pouco durante o trajeto..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Botão de Conclusão */}
          <div className="pt-2">
            <button
              type="submit"
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition active:scale-98 ${
                hasAvaria
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {hasAvaria
                ? 'Concluir Devolução & Solicitar Manutenção'
                : 'Concluir Devolução com Sucesso ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
