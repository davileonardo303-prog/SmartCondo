import React, { useState } from 'react';
import {
  Package,
  Clock,
  ShieldCheck,
  Building,
  Bell,
  Save,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Mail,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { Condominio } from '../../types';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';

interface RegrasEncomendasPanelProps {
  condominio: Condominio;
}

export const RegrasEncomendasPanel: React.FC<RegrasEncomendasPanelProps> = ({ condominio }) => {
  const [diasLimite, setDiasLimite] = useState<number>(
    condominio.regras?.diasLimiteRetiradaEncomenda ?? 5
  );
  const [acaoAposLimite, setAcaoAposLimite] = useState<'encaminhar_administracao' | 'notificar_reincidencia'>(
    condominio.regras?.acaoAposLimiteEncomenda || 'encaminhar_administracao'
  );
  const [notificarPush, setNotificarPush] = useState(true);
  const [notificarEmail, setNotificarEmail] = useState(true);
  const [notificarWhatsApp, setNotificarWhatsApp] = useState(true);

  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSalvarRegras = (e: React.FormEvent) => {
    e.preventDefault();

    const novasRegras = {
      ...condominio.regras,
      diasLimiteRetiradaEncomenda: Number(diasLimite),
      acaoAposLimiteEncomenda: acaoAposLimite,
    };

    condoStore.updateCondominio(condominio.id, {
      regras: novasRegras,
    });

    setFeedback(`Regras de encomendas atualizadas com sucesso para o ${condominio.nome}!`);
    confetti({ particleCount: 50, spread: 60 });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner Explicativo */}
      <div className="bg-gradient-to-r from-amber-900 to-orange-950 text-white p-6 sm:p-7 rounded-3xl border border-amber-800/80 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
          <Package className="w-3.5 h-3.5" />
          <span>Regimento Interno & Prazos da Portaria</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black">
          Regras de Guarda & Prazos de Encomendas
        </h2>
        <p className="text-xs text-amber-200/90 max-w-2xl">
          Como cada condomínio possui regras próprias (ex: <strong>Jardins do Brito</strong> com prazo máximo de 5 dias), configure aqui o tempo que o pacote pode aguardar na portaria e o procedimento automático de encaminhamento para a Administração.
        </p>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Formulário de Configuração das Regras */}
      <form onSubmit={handleSalvarRegras} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campo 1: Dias de Limite na Portaria */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Prazo Limite para Retirada na Portaria (Dias Corridos):</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={60}
                required
                value={diasLimite}
                onChange={(e) => setDiasLimite(parseInt(e.target.value) || 5)}
                className="w-28 bg-slate-50 border-2 border-amber-300 rounded-2xl p-3 text-center text-lg font-black text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <div className="text-xs text-slate-600 font-medium leading-tight">
                <strong>{diasLimite} dias</strong> de permanência máxima autorizada na portaria antes de transferir o pacote.
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              * O sistema calcula a data de expiração automaticamente no instante em que o porteiro cadastra o pacote.
            </p>
          </div>

          {/* Campo 2: Ação Automática após Exceder o Prazo */}
          <div className="space-y-2">
            <label className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>Ação Automática ao Atingir o Prazo Limite:</span>
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setAcaoAposLimite('encaminhar_administracao')}
                className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                  acaoAposLimite === 'encaminhar_administracao'
                    ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="acaoAposLimite"
                  checked={acaoAposLimite === 'encaminhar_administracao'}
                  onChange={() => setAcaoAposLimite('encaminhar_administracao')}
                  className="mt-1 text-amber-600"
                />
                <div className="text-xs">
                  <div>Encaminhar para a Administração do Condomínio (Recomendado)</div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    Após {diasLimite} dias, a encomenda muda para o status "Na Administração" e o morador é alertado para retirar na secretaria.
                  </div>
                </div>
              </label>

              <label
                onClick={() => setAcaoAposLimite('notificar_reincidencia')}
                className={`flex items-start gap-3 p-3 rounded-2xl border transition cursor-pointer ${
                  acaoAposLimite === 'notificar_reincidencia'
                    ? 'bg-indigo-50/80 border-indigo-300 text-indigo-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <input
                  type="radio"
                  name="acaoAposLimite"
                  checked={acaoAposLimite === 'notificar_reincidencia'}
                  onChange={() => setAcaoAposLimite('notificar_reincidencia')}
                  className="mt-1 text-indigo-600"
                />
                <div className="text-xs">
                  <div>Manter na Portaria e Enviar Notificações Diárias de Cobrança</div>
                  <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                    O pacote continua na portaria mas entra em status de urgência visual.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Canais de Notificação Automática */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-600" />
            <span>Canais de Disparo Automático ao Lançar Encomenda:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
              <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="flex-1">
                <div>Barra de Notificação do Celular</div>
                <div className="text-[10px] text-slate-500 font-normal">Push Notification Nativa</div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold">
                Ativo
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <div>WhatsApp do Morador</div>
                <div className="text-[10px] text-slate-500 font-normal">Mensagem com Código PIN</div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold">
                Ativo
              </span>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="flex-1">
                <div>E-mail Cadastrado</div>
                <div className="text-[10px] text-slate-500 font-normal">Comprovante de Chegada</div>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold">
                Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Botão Salvar */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>Salvar Regras de Encomendas</span>
          </button>
        </div>
      </form>
    </div>
  );
};
