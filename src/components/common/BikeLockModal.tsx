import React from 'react';
import { LockOpen, Check, Copy, Clock, ShieldCheck, Bike } from 'lucide-react';
import { Bicicleta } from '../../types';

interface BikeLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  bike: Bicicleta | null;
  lockPassword: string;
}

export const BikeLockModal: React.FC<BikeLockModalProps> = ({
  isOpen,
  onClose,
  bike,
  lockPassword,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !bike) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(lockPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in zoom-in-95">
      <div className="w-full max-w-md bg-white border border-emerald-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800 p-6 text-center relative">
        {/* Ícone de Sucesso */}
        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
          <LockOpen className="w-7 h-7" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Desbloqueio Autorizado
        </span>

        <h3 className="text-xl font-extrabold text-slate-900 mt-2">
          Bike #{bike.codigo} • {bike.modelo}
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          Insira a combinação numérica no cadeado físico ou totem para soltar a bike:
        </p>

        {/* Caixa de Senha em Destaque */}
        <div className="my-5 p-4 rounded-xl bg-slate-50 border border-emerald-200 flex flex-col items-center">
          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-1">
            Senha do Cadeado
          </span>
          <div className="flex items-center justify-center gap-2 my-1">
            {lockPassword.split('').map((digit, idx) => (
              <span
                key={idx}
                className="w-11 h-13 rounded-xl bg-white border-2 border-emerald-400 flex items-center justify-center text-3xl font-extrabold text-emerald-700 font-mono shadow-sm"
              >
                {digit}
              </span>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-slate-200 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Senha copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar Senha</span>
              </>
            )}
          </button>
        </div>

        {/* Recomendações */}
        <div className="text-left bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-xs space-y-2 mb-5 text-emerald-950">
          <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Lembretes do Condomínio:</span>
          </div>
          <div className="flex items-start gap-2 text-slate-600 text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>Tempo sugerido de passeio: até 180 minutos por sessão.</span>
          </div>
          <div className="flex items-start gap-2 text-slate-600 text-xs">
            <Bike className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
            <span>Ao retornar, trave a corrente no totem e preencha a devolução no app.</span>
          </div>
        </div>

        {/* Botão de Fechar */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition active:scale-98"
        >
          Excelente, Iniciar Passeio
        </button>
      </div>
    </div>
  );
};
