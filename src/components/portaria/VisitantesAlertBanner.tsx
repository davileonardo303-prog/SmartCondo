import React from 'react';
import { VisitanteLiberado, Condominio } from '../../types';
import { condoStore } from '../../services/mockStorage';
import { audioAlertService } from '../../utils/audioAlerts';
import {
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  Clock,
  Car,
  Volume2,
  KeyRound,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VisitantesAlertBannerProps {
  condominio: Condominio;
  onOpenVisitantesTab?: () => void;
}

export const VisitantesAlertBanner: React.FC<VisitantesAlertBannerProps> = ({
  condominio,
  onOpenVisitantesTab,
}) => {
  const [visitantes, setVisitantes] = React.useState<VisitanteLiberado[]>(() =>
    condoStore.getVisitantes(condominio.id)
  );

  React.useEffect(() => {
    const unsub = condoStore.subscribe(() => {
      setVisitantes(condoStore.getVisitantes(condominio.id));
    });
    return unsub;
  }, [condominio.id]);

  // Visitantes pendentes (liberados pelo morador aguardando na portaria)
  const pendentes = visitantes.filter((v) => v.status === 'pendente');
  // Visitantes recém-liberados (últimos 30 minutos)
  const agora = Date.now();
  const recentes = pendentes.filter((v) => agora - v.criadoEm < 30 * 60 * 1000);

  if (pendentes.length === 0) return null;

  const handleLiberarEntrada = (vis: VisitanteLiberado) => {
    const res = condoStore.registrarEntradaPortaria(condominio.id, vis.id, 'Portaria Plantão');
    if (res.success) {
      audioAlertService.playRogerBeep();
      confetti({ particleCount: 50, spread: 60 });
    }
  };

  const handleTestarSom = () => {
    audioAlertService.playVisitorAlertSound();
  };

  return (
    <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-amber-400/50 space-y-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-700/50 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 animate-pulse shadow-lg shadow-amber-500/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-md">
                Atenção Portaria
              </span>
              <span className="text-xs text-amber-200 font-bold">
                {pendentes.length} {pendentes.length === 1 ? 'liberação ativa' : 'liberações ativas'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              🚨 Liberação de Visitantes / Prestadores Emitida
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestarSom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-700/80 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer"
            title="Ouvir som de alerta de visitante"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Alarme Sonoro</span>
          </button>
          {onOpenVisitantesTab && (
            <button
              onClick={onOpenVisitantesTab}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-amber-950 hover:bg-amber-100 text-xs font-black transition cursor-pointer shadow-md"
            >
              <span>Ver Todos</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Grid de Visitantes Pendentes com destaque */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {pendentes.slice(0, 3).map((vis) => (
          <div
            key={vis.id}
            className="bg-white text-slate-900 rounded-2xl p-4 shadow-md border border-amber-200 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    vis.tipo === 'prestador'
                      ? 'bg-blue-100 text-blue-900'
                      : vis.tipo === 'entrega'
                      ? 'bg-purple-100 text-purple-900'
                      : 'bg-emerald-100 text-emerald-900'
                  }`}
                >
                  {vis.tipo === 'prestador'
                    ? '🛠️ Prestador'
                    : vis.tipo === 'entrega'
                    ? '📦 Entrega'
                    : '👤 Convidado'}
                </span>
                <span className="text-xs font-mono font-black bg-amber-100 text-amber-950 px-2 py-0.5 rounded-lg border border-amber-300">
                  {vis.codigoAcesso}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-950 leading-tight">
                  {vis.nomeVisitante}
                </h3>
                {vis.empresa && (
                  <p className="text-xs text-slate-600 font-semibold">{vis.empresa}</p>
                )}
                <div className="text-xs text-amber-900 font-bold bg-amber-50 p-2 rounded-xl border border-amber-200 mt-2 space-y-0.5">
                  <div>
                    🏠 Unidade: Bloco {vis.unidade.bloco} - Apto {vis.unidade.apto}
                  </div>
                  <div className="text-slate-600 text-[11px]">
                    Autorizado por: <strong>{vis.moradorNome}</strong>
                  </div>
                  {vis.placaVeiculo && (
                    <div className="text-slate-700 text-[11px] flex items-center gap-1">
                      <Car className="w-3 h-3 text-slate-500" /> Placa: {vis.placaVeiculo}
                    </div>
                  )}
                  <div className="text-slate-500 text-[10px] flex items-center gap-1 pt-0.5">
                    <Clock className="w-3 h-3" /> Data: {vis.dataVisita} • {vis.periodoPermitido || 'Dia Todo'}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleLiberarEntrada(vis)}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Confirmar Entrada na Portaria</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
