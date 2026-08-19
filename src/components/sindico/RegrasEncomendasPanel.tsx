import React, { useState, useMemo } from 'react';
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
  Plus,
  Search,
  KeyRound,
  Check,
  Share2,
  ExternalLink,
  Users,
  Building2,
  Send,
  Camera,
  X,
  History,
  FileCheck2,
  Calendar,
  Filter,
} from 'lucide-react';
import { Condominio, Encomenda, Morador } from '../../types';
import { condoStore } from '../../services/mockStorage';
import { notificationService } from '../../services/notificationService';
import { whatsappService } from '../../services/whatsappService';
import { EntregaEncomendaModal } from '../portaria/EntregaEncomendaModal';
import { FotoEtiquetaCapture } from '../portaria/FotoEtiquetaCapture';
import confetti from 'canvas-confetti';

interface RegrasEncomendasPanelProps {
  condominio: Condominio;
}

export const RegrasEncomendasPanel: React.FC<RegrasEncomendasPanelProps> = ({ condominio }) => {
  const [activeSubTab, setActiveSubTab] = useState<'operacao' | 'historico' | 'regras'>('operacao');

  const [diasLimite, setDiasLimite] = useState<number>(
    condominio.regras?.diasLimiteRetiradaEncomenda ?? 5
  );
  const [acaoAposLimite, setAcaoAposLimite] = useState<'encaminhar_administracao' | 'notificar_reincidencia'>(
    condominio.regras?.acaoAposLimiteEncomenda || 'encaminhar_administracao'
  );

  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Estados para Lançamento Rápido de Encomenda pelo Síndico / Administração
  const [selectedMoradorId, setSelectedMoradorId] = useState<string>('');
  const [cadastroMode, setCadastroMode] = useState<'lista' | 'manual'>('lista');
  const [searchMoradorInput, setSearchMoradorInput] = useState('');
  const [manualBloco, setManualBloco] = useState('');
  const [manualApto, setManualApto] = useState('');
  const [manualNome, setManualNome] = useState('');
  const [manualTelefone, setManualTelefone] = useState('');
  const [transportadora, setTransportadora] = useState('Mercado Livre');
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [observacao, setObservacao] = useState('');
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Baixa com PIN / Modal de Entrega pelo Síndico
  const [rescuePinInput, setRescuePinInput] = useState('');
  const [baixaFeedback, setBaixaFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedEncomendaForEntrega, setSelectedEncomendaForEntrega] = useState<Encomenda | null>(null);
  const [isEntregaModalOpen, setIsEntregaModalOpen] = useState(false);
  const [previewFotoUrl, setPreviewFotoUrl] = useState<string | null>(null);
  const [previewTitulo, setPreviewTitulo] = useState<string>('Foto do Selo / Etiqueta');

  // Filtros do Histórico
  const [historicoSearch, setHistoricoSearch] = useState('');
  const [historicoFiltroStatus, setHistoricoFiltroStatus] = useState<'todos' | 'entregue' | 'pendente'>('todos');

  // Feedback de encomenda recém-cadastrada
  const [recemCadastrada, setRecemCadastrada] = useState<{
    encomenda: Encomenda;
    morador: Morador;
  } | null>(null);

  // Dados reativos
  const moradores = condoStore.getMoradores(condominio.id);
  const encomendas = condoStore.getEncomendas(condominio.id);

  const pendingPackages = encomendas.filter((e) => e.status === 'na_portaria');
  const adminPackages = encomendas.filter((e) => e.status === 'encaminhada_administracao');
  const deliveredPackages = encomendas.filter((e) => e.status === 'entregue');

  const commonCarriers = [
    'Mercado Livre',
    'Amazon',
    'Shopee',
    'Correios',
    'Shein',
    'Magalu',
    'Jadlog',
    'iFood / Delivery',
  ];

  // Encomendas filtradas para o Histórico Permanente
  const encomendasFiltradasHistorico = useMemo(() => {
    const q = historicoSearch.toLowerCase().trim();
    return encomendas.filter((e) => {
      // Filtro de status
      if (historicoFiltroStatus === 'entregue' && e.status !== 'entregue') return false;
      if (historicoFiltroStatus === 'pendente' && e.status === 'entregue') return false;

      if (!q) return true;

      const nomeMatch = (e.moradorNome || '').toLowerCase().includes(q);
      const blocoMatch = (e.unidade?.bloco || '').toLowerCase().includes(q);
      const aptoMatch = (e.unidade?.apto || '').toLowerCase().includes(q);
      const transpMatch = (e.transportadora || '').toLowerCase().includes(q);
      const rastreioMatch = (e.codigoRastreio || '').toLowerCase().includes(q);
      const pinMatch = (e.codigoResgate || '').toLowerCase().includes(q);
      const retiranteMatch = (e.nomeRetirante || e.entreguePara || '').toLowerCase().includes(q);

      return (
        nomeMatch ||
        blocoMatch ||
        aptoMatch ||
        transpMatch ||
        rastreioMatch ||
        pinMatch ||
        retiranteMatch
      );
    });
  }, [encomendas, historicoSearch, historicoFiltroStatus]);

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

    setFeedback(`Regras de encomendas salvas com sucesso para o ${condominio.nome}!`);
    confetti({ particleCount: 50, spread: 60 });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleCadastrarEncomenda = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!transportadora.trim()) {
      setFormError('Por favor, informe a transportadora da encomenda (Ex: Mercado Livre, Correios, Shopee).');
      return;
    }

    let morador: Morador | undefined;

    if (cadastroMode === 'lista') {
      if (selectedMoradorId) {
        morador = moradores.find((m) => m.id === selectedMoradorId);
      } else if (searchMoradorInput.trim()) {
        const query = searchMoradorInput.trim();
        const matchingMorador = moradores.find((m) =>
          m.nome.toLowerCase().includes(query.toLowerCase()) ||
          m.unidade.apto.toLowerCase() === query.toLowerCase() ||
          `${m.unidade.bloco} ${m.unidade.apto}`.toLowerCase().includes(query.toLowerCase()) ||
          `bloco ${m.unidade.bloco} apto ${m.unidade.apto}`.toLowerCase().includes(query.toLowerCase())
        );

        if (matchingMorador) {
          morador = matchingMorador;
        } else {
          const blocoMatch = query.match(/bloco\s*([0-9a-zA-Z]+)/i) || query.match(/^([0-9a-zA-Z]+)\s+([0-9]+)$/i);
          const aptoMatch = query.match(/apto\s*([0-9a-zA-Z]+)/i) || query.match(/([0-9]+)$/);

          const blocoExtraido = blocoMatch ? blocoMatch[1] : '1';
          const aptoExtraido = aptoMatch ? aptoMatch[1] : query;

          morador = condoStore.cadastrarOuObterMoradorRapido(condominio.id, {
            bloco: blocoExtraido,
            apto: aptoExtraido,
          });
        }
      }
    } else {
      if (!manualApto.trim()) {
        setFormError('Por favor, informe o número do apartamento para entrega.');
        return;
      }
      morador = condoStore.cadastrarOuObterMoradorRapido(condominio.id, {
        bloco: manualBloco.trim() || '1',
        apto: manualApto.trim(),
        nome: manualNome.trim(),
        telefone: manualTelefone.trim(),
      });
    }

    if (!morador) {
      setFormError('⚠️ Por favor, selecione para qual Morador/Apartamento a encomenda se destina.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newEnc = condoStore.addEncomenda(condominio.id, {
        moradorId: morador.id,
        transportadora: transportadora.trim(),
        codigoRastreio: codigoRastreio.trim().toUpperCase(),
        observacao: observacao.trim(),
        recebidoPor: 'Administração / Síndico',
        diasLimiteCustomizado: diasLimite,
        fotoUrl: fotoUrl,
      });

      // 1. Notificação In-App ao Morador
      condoStore.addNotification({
        condominioId: condominio.id,
        paraMoradorId: morador.id,
        titulo: '📦 Nova Encomenda Recebida na Portaria',
        mensagem: `Uma encomenda da ${newEnc.transportadora} chegou para o Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}! Seu PIN de retirada é ${newEnc.codigoResgate}.`,
        tipo: 'encomenda',
      });

      // 2. Disparo Push no Navegador
      notificationService.dispararNotificacaoNativa(`📦 Encomenda na Portaria! - ${condominio.nome}`, {
        body: `Olá ${morador.nome}! Pacote da ${newEnc.transportadora} disponível. PIN de Resgate: ${newEnc.codigoResgate}.`,
        tag: `enc-${newEnc.id}`,
      });

      // 3. Disparo WhatsApp Gateway
      whatsappService.notificarChegadaEncomendaAutomatica({
        condominio,
        morador,
        encomenda: newEnc,
      }).catch((err) => console.warn('[WhatsApp Sindico Dispatch]:', err));

      const payload = {
        encomenda: newEnc,
        morador,
      };

      setRecemCadastrada(payload);
      setFeedback(`🚀 Encomenda cadastrada com sucesso! Notificação com o PIN [ ${newEnc.codigoResgate} ] enviada para ${morador.nome}!`);
      confetti({ particleCount: 70, spread: 70 });

      // Reset Form
      setSelectedMoradorId('');
      setManualBloco('');
      setManualApto('');
      setManualNome('');
      setManualTelefone('');
      setCodigoRastreio('');
      setObservacao('');
      setFotoUrl(undefined);
      setSearchMoradorInput('');
      setFormError(null);
    } catch (err: any) {
      setFormError(`Erro ao lançar encomenda: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDarBaixaPIN = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescuePinInput.trim()) return;

    const res = condoStore.darBaixaEncomenda(
      condominio.id,
      rescuePinInput.trim(),
      'Administração / Síndico'
    );

    if (res.success) {
      setBaixaFeedback({ success: true, message: res.message });
      confetti({ particleCount: 70, spread: 70 });
      setRescuePinInput('');
    } else {
      setBaixaFeedback({ success: false, message: res.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior Principal */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white p-6 sm:p-7 rounded-3xl border border-amber-800/80 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
            <Package className="w-3.5 h-3.5" />
            <span>Gestão de Encomendas & Regras de Portaria</span>
          </div>

          <div className="text-xs text-amber-200/80 font-medium">
            Prazo de guarda ativo: <strong className="text-amber-300 font-bold">{diasLimite} dias</strong>
          </div>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black">
            Cadastro de Encomendas & Gestão de Prazos
          </h2>
          <p className="text-xs text-amber-200/90 max-w-3xl mt-1 leading-relaxed">
            Cadastre pacotes recebidos, valide entregas com PIN de 6 dígitos ou rúbrica e consulte o histórico permanente de todas as entregas do condomínio.
          </p>
        </div>

        {/* 3 Abas Principais de Navegação */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-800/60">
          <button
            type="button"
            onClick={() => setActiveSubTab('operacao')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'operacao'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white/10 text-amber-200 hover:bg-white/20'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Lançar & Entregar</span>
            <span className="bg-amber-950/80 text-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {pendingPackages.length + adminPackages.length} pendentes
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('historico')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'historico'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white/10 text-amber-200 hover:bg-white/20'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico de Entregas & Baixas</span>
            <span className="bg-amber-950/80 text-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
              {deliveredPackages.length} entregues
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('regras')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
              activeSubTab === 'regras'
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-white/10 text-amber-200 hover:bg-white/20'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Regras dos Prazos ({diasLimite} dias)</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-emerald-700 underline text-xs cursor-pointer">
            Fechar
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 1: LANÇAR ENCOMENDA & DAR BAIXA OPERACIONAL                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'operacao' && (
        <div className="space-y-6">
          {/* Card de Notificação Recente de Encomenda */}
          {recemCadastrada && (
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-500/50 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>🟢 Notificação Enviada 100% Automaticamente!</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black flex items-center gap-2">
                    <span>{recemCadastrada.morador.nome}</span>
                    <span className="text-xs bg-white/10 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                      Bloco {recemCadastrada.morador.unidade.bloco} - Apto {recemCadastrada.morador.unidade.apto}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Transportadora: <strong className="text-white">{recemCadastrada.encomenda.transportadora}</strong> • WhatsApp: <strong className="text-emerald-300">{recemCadastrada.morador.telefone || '(11) 98765-4321'}</strong>
                  </p>
                </div>

                <button
                  onClick={() => setRecemCadastrada(null)}
                  className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/60 rounded-xl transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider block">
                    🔐 Código PIN de Resgate:
                  </span>
                  <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-emerald-400">
                    {recemCadastrada.encomenda.codigoResgate}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Enviado automaticamente para o WhatsApp e disponível no app do morador.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(recemCadastrada.encomenda.codigoResgate);
                      setFeedback('🔐 Código PIN copiado para a área de transferência!');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <span>Copiar PIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      notificationService.dispararNotificacaoNativa(`📦 Encomenda Chegou! - ${condominio.nome}`, {
                        body: `Olá ${recemCadastrada.morador.nome}! Pacote da ${recemCadastrada.encomenda.transportadora} disponível na portaria. PIN: ${recemCadastrada.encomenda.codigoResgate}.`,
                        tag: `enc-${recemCadastrada.encomenda.id}`,
                      });
                      setFeedback('🔔 Notificação Push disparada!');
                    }}
                    className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-2 transition cursor-pointer text-xs"
                  >
                    <Smartphone className="w-4 h-4 text-indigo-300" />
                    <span>Testar Push</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grid Principal: Lançar Encomenda + Dar Baixa */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulário: Cadastrar Encomenda Recebida */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-600" />
                  <span>Cadastrar Encomenda Recebida</span>
                </h3>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setCadastroMode('lista')}
                    className={`px-3 py-1 rounded-lg transition ${
                      cadastroMode === 'lista' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Moradores Salvos
                  </button>
                  <button
                    type="button"
                    onClick={() => setCadastroMode('manual')}
                    className={`px-3 py-1 rounded-lg transition ${
                      cadastroMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Digitação Rápida
                  </button>
                </div>
              </div>

              <form onSubmit={handleCadastrarEncomenda} className="space-y-4">
                {cadastroMode === 'lista' ? (
                  <div className={`space-y-3 p-3 rounded-2xl transition border ${formError && !selectedMoradorId && !searchMoradorInput.trim() ? 'border-rose-400 bg-rose-50/30 ring-2 ring-rose-200' : 'border-slate-100 bg-slate-50/50'}`}>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Morador / Unidade Destino <span className="text-rose-500">*</span>
                        </label>
                        {selectedMoradorId && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            ✓ Selecionado
                          </span>
                        )}
                      </div>
                      <select
                        value={selectedMoradorId}
                        onChange={(e) => {
                          setSelectedMoradorId(e.target.value);
                          setSearchMoradorInput('');
                          setFormError(null);
                        }}
                        className="w-full p-3 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white cursor-pointer"
                      >
                        <option value="">Selecionar morador cadastrado...</option>
                        {moradores.map((m) => (
                          <option key={m.id} value={m.id}>
                            Bloco {m.unidade.bloco} - Apto {m.unidade.apto} • {m.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    {moradores.length > 0 && (
                      <div>
                        <span className="text-[11px] font-bold text-slate-500 block mb-1">
                          Seleção Rápida por Apartamento:
                        </span>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                          {moradores.slice(0, 16).map((m) => {
                            const isSelected = selectedMoradorId === m.id;
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => {
                                  setSelectedMoradorId(m.id);
                                  setSearchMoradorInput('');
                                  setFormError(null);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-amber-50 text-slate-700'
                                }`}
                              >
                                <span>Apto {m.unidade.apto}</span>
                                <span className="opacity-70 text-[10px]">({m.nome.split(' ')[0]})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border ${formError && !manualApto.trim() ? 'border-rose-400 bg-rose-50/30 ring-2 ring-rose-200' : 'border-slate-200 bg-slate-50'}`}>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Bloco</label>
                      <input
                        type="text"
                        placeholder="Ex: 1"
                        value={manualBloco}
                        onChange={(e) => {
                          setManualBloco(e.target.value);
                          setFormError(null);
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Apartamento *</label>
                      <input
                        type="text"
                        placeholder="Ex: 101"
                        required
                        value={manualApto}
                        onChange={(e) => {
                          setManualApto(e.target.value);
                          setFormError(null);
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nome Morador</label>
                      <input
                        type="text"
                        placeholder="Nome"
                        value={manualNome}
                        onChange={(e) => setManualNome(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp</label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999"
                        value={manualTelefone}
                        onChange={(e) => setManualTelefone(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Transportadora */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Transportadora</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {commonCarriers.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setTransportadora(c);
                          setFormError(null);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          transportadora === c
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    value={transportadora}
                    onChange={(e) => {
                      setTransportadora(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="Ex: Mercado Livre, Correios, Shopee..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Código de Rastreio (opcional)</label>
                    <input
                      type="text"
                      value={codigoRastreio}
                      onChange={(e) => setCodigoRastreio(e.target.value)}
                      placeholder="Ex: BR123456789"
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Observação (opcional)</label>
                    <input
                      type="text"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Ex: Caixa grande, pacote frágil..."
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 📸 Foto do Selo / Etiqueta da Encomenda */}
                <div className="pt-1">
                  <FotoEtiquetaCapture
                    fotoUrl={fotoUrl}
                    onFotoCapturada={setFotoUrl}
                  />
                </div>

                {formError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-amber-600/20 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Lançando Encomenda...' : '⚡ Lançar Encomenda & Notificar Morador (PIN: 6 Dígitos)'}</span>
                </button>
              </form>
            </div>

            {/* Formulário: Dar Baixa / Entregar Pacote via PIN ou Documento */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-emerald-600" />
                  <span>Dar Baixa Segura (PIN 6 Dígitos)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  O morador apresenta o PIN de 6 dígitos gerado no app ou recebido via WhatsApp.
                </p>

                <form onSubmit={handleDarBaixaPIN} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">PIN de Resgate (6 dígitos)</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Ex: 849201"
                      value={rescuePinInput}
                      onChange={(e) => setRescuePinInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-3 rounded-2xl border-2 border-emerald-300 text-center font-mono font-black text-2xl tracking-widest text-emerald-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-emerald-50/40"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rescuePinInput.length < 6}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar Entrega ao Morador</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500">PIN obrigatório para liberação.</span>
                    {(pendingPackages.length > 0 || adminPackages.length > 0) && (
                      <button
                        type="button"
                        onClick={() => {
                          const enc = pendingPackages[0] || adminPackages[0];
                          setSelectedEncomendaForEntrega(enc);
                          setIsEntregaModalOpen(true);
                        }}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Sem PIN? Doc + Rúbrica &rarr;
                      </button>
                    )}
                  </div>
                </form>

                {baixaFeedback && (
                  <div
                    className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                      baixaFeedback.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border border-rose-200 text-rose-900'
                    }`}
                  >
                    {baixaFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{baixaFeedback.message}</span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Segurança & Rastreabilidade:</span>
                </div>
                <p className="text-[11px]">
                  Ao dar baixa, o pacote é arquivado permanentemente no <strong>Histórico Geral</strong> com data, hora, método de entrega e comprovante registrado.
                </p>
              </div>
            </div>
          </div>

          {/* Lista de Encomendas Aguardando Retirada */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                <span>Pacotes Aguardando Retirada na Portaria & Administração ({pendingPackages.length + adminPackages.length})</span>
              </h3>
            </div>

            {pendingPackages.length > 0 || adminPackages.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {[...pendingPackages, ...adminPackages].map((enc) => {
                  const morador = moradores.find((m) => m.id === enc.moradorId);
                  const diasRestantes = Math.ceil(
                    ((enc.dataLimiteRetirada || enc.recebidoEm + diasLimite * 24 * 60 * 60 * 1000) - Date.now()) /
                      (24 * 60 * 60 * 1000)
                  );

                  return (
                    <div key={enc.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        {enc.fotoUrl ? (
                          <div
                            onClick={() => {
                              setPreviewFotoUrl(enc.fotoUrl!);
                              setPreviewTitulo(`Selo da Encomenda - ${enc.transportadora}`);
                            }}
                            className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-300 bg-slate-900 shrink-0 cursor-pointer group"
                            title="Clique para ver a foto do selo"
                          >
                            <img
                              src={enc.fotoUrl}
                              alt="Selo"
                              className="w-full h-full object-cover group-hover:scale-110 transition"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <Camera className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0 border border-amber-200 text-center leading-tight p-1">
                            Sem Foto
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 text-sm">
                              Bloco {enc.unidade.bloco} - Apto {enc.unidade.apto}
                            </span>
                            <span className="text-slate-500 font-medium">({enc.moradorNome})</span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                enc.status === 'na_portaria'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {enc.status === 'na_portaria' ? 'Na Portaria' : 'Na Administração'}
                            </span>
                          </div>

                          <p className="text-slate-600">
                            Transportadora: <strong>{enc.transportadora}</strong> • Rastreio: <span className="font-mono">{enc.codigoRastreio || 'N/A'}</span> • Recebido em: {new Date(enc.recebidoEm).toLocaleString('pt-BR')}
                          </p>

                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              PIN: <strong className="font-mono font-black">{enc.codigoResgate}</strong>
                            </span>
                            <span className={diasRestantes <= 1 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                              {diasRestantes > 0 ? `⏳ ${diasRestantes} dia(s) restantes de prazo` : '⚠️ Prazo excedido'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {morador && (
                          <a
                            href={notificationService.gerarLinkWhatsApp(morador, enc, condominio)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setSelectedEncomendaForEntrega(enc);
                            setIsEntregaModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Validar Entrega</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 space-y-1">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">Nenhum pacote pendente de retirada</p>
                <p className="text-xs">Todas as encomendas recebidas já foram entregues aos moradores.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 2: HISTÓRICO GERAL DE TODAS AS ENCOMENDAS (PERMANENTE)            */}
      {/* ========================================================================= */}
      {activeSubTab === 'historico' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <span>Histórico Geral de Entregas & Baixas (Permanente)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro permanente para consulta da portaria, síndico e administração em caso de dúvidas dos moradores.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                {deliveredPackages.length} entregue(s) arquivada(s)
              </span>
            </div>
          </div>

          {/* Barra de Filtros & Pesquisa Rápida */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por Morador, Bloco, Apartamento, Transportadora, Rastreio, PIN ou Retirante..."
                value={historicoSearch}
                onChange={(e) => setHistoricoSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50"
              />
            </div>

            <div className="sm:col-span-4 flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setHistoricoFiltroStatus('todos')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                  historicoFiltroStatus === 'todos'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({encomendas.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoricoFiltroStatus('entregue')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                  historicoFiltroStatus === 'entregue'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Entregues ({deliveredPackages.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoricoFiltroStatus('pendente')}
                className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition cursor-pointer ${
                  historicoFiltroStatus === 'pendente'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pendentes ({pendingPackages.length + adminPackages.length})
              </button>
            </div>
          </div>

          {/* Tabela / Lista Completa */}
          {encomendasFiltradasHistorico.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Destinatário</th>
                    <th className="p-3">Selo / Foto</th>
                    <th className="p-3">Transportadora & Rastreio</th>
                    <th className="p-3">Recebido Em</th>
                    <th className="p-3">Status / Prazo</th>
                    <th className="p-3">Comprovante de Baixa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {encomendasFiltradasHistorico.map((enc) => {
                    return (
                      <tr key={enc.id} className="hover:bg-slate-50/70 transition">
                        {/* Destinatário */}
                        <td className="p-3">
                          <div className="font-extrabold text-slate-900">{enc.moradorNome || 'Morador'}</div>
                          <div className="text-amber-800 text-[11px] font-bold">
                            Bloco {enc.unidade?.bloco || '1'} - Apto {enc.unidade?.apto || '-'}
                          </div>
                        </td>

                        {/* Foto Selo */}
                        <td className="p-3">
                          {enc.fotoUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewFotoUrl(enc.fotoUrl!);
                                setPreviewTitulo(`Selo da Encomenda - ${enc.transportadora}`);
                              }}
                              className="flex items-center gap-1.5 text-amber-800 hover:text-amber-950 font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg transition cursor-pointer"
                              title="Ver foto do selo"
                            >
                              <Camera className="w-3.5 h-3.5 text-amber-600" />
                              <span>Ver Selo</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Sem foto</span>
                          )}
                        </td>

                        {/* Transportadora */}
                        <td className="p-3 text-slate-700">
                          <div className="font-bold text-slate-900">{enc.transportadora}</div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {enc.codigoRastreio ? `Rastreio: ${enc.codigoRastreio}` : 'Sem rastreio'}
                          </div>
                          {enc.observacao && (
                            <div className="text-[10px] text-slate-500 italic mt-0.5">
                              Obs: {enc.observacao}
                            </div>
                          )}
                        </td>

                        {/* Data Recebimento */}
                        <td className="p-3 text-slate-600">
                          <div>{new Date(enc.recebidoEm).toLocaleDateString('pt-BR')}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(enc.recebidoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Por: {enc.recebidoPor || 'Portaria'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-3">
                          {enc.status === 'entregue' ? (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-0.5 rounded-full font-extrabold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
                                ✓ Entregue
                              </span>
                              <div className="text-[10px] text-slate-500 font-semibold">
                                {enc.metodoRetirada === 'documento_rubrica' ? (
                                  <span className="text-purple-700 font-bold">📄 Doc + Rúbrica</span>
                                ) : (
                                  <span className="text-emerald-700 font-bold">🔑 PIN Validado ({enc.codigoResgate})</span>
                                )}
                              </div>
                            </div>
                          ) : enc.status === 'encaminhada_administracao' ? (
                            <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-100 text-rose-900 border border-rose-300">
                              🏛️ Na Administração
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300 inline-block">
                                📦 Na Portaria
                              </span>
                              <div className="font-mono text-[10px] font-bold text-amber-800">
                                PIN: {enc.codigoResgate}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Comprovante de Baixa */}
                        <td className="p-3">
                          {enc.status === 'entregue' ? (
                            <div className="text-[11px] text-slate-700 space-y-1">
                              <div>
                                Retirado por: <strong>{enc.nomeRetirante || enc.entreguePara || enc.moradorNome || 'Morador'}</strong>
                              </div>
                              {enc.documentoRetirante && (
                                <div className="font-mono text-[10px] text-slate-500">
                                  Doc: <strong>{enc.documentoRetirante}</strong>
                                </div>
                              )}
                              {enc.entregueEm && (
                                <div className="text-[10px] text-emerald-700">
                                  Entregue em: {new Date(enc.entregueEm).toLocaleDateString('pt-BR')} às {new Date(enc.entregueEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              )}
                              {enc.assinaturaRetiranteUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewFotoUrl(enc.assinaturaRetiranteUrl!);
                                    setPreviewTitulo(`Rúbrica de Retirada - ${enc.nomeRetirante || enc.moradorNome}`);
                                  }}
                                  className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>✍️ Ver Rúbrica</span>
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEncomendaForEntrega(enc);
                                setIsEntregaModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Dar Baixa</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-slate-500 space-y-1">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Nenhum registro encontrado no histórico</p>
              <p className="text-xs">Tente buscar por outro termo ou cadastre novas encomendas.</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-ABA 3: REGRAS DOS PRAZOS DE GUARDA & NOTIFICAÇÕES                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'regras' && (
        <form onSubmit={handleSalvarRegras} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span>Configuração dos Prazos de Guarda (Regimento Interno)</span>
              </h3>
              <p className="text-xs text-slate-500">Defina o limite de dias antes do encaminhamento automático para a administração.</p>
            </div>
          </div>

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
                * O sistema calcula a data de expiração automaticamente no instante em que o pacote é cadastrado.
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
      )}

      {/* Modal de Validação de Entrega (PIN ou Documento + Rúbrica) */}
      <EntregaEncomendaModal
        isOpen={isEntregaModalOpen}
        onClose={() => {
          setIsEntregaModalOpen(false);
          setSelectedEncomendaForEntrega(null);
        }}
        encomenda={selectedEncomendaForEntrega}
        condominio={condominio}
        onSuccess={(msg) => {
          setFeedback(msg || 'Encomenda entregue com sucesso!');
          confetti({ particleCount: 60, spread: 60 });
        }}
      />

      {/* Modal para Visualização da Foto da Etiqueta ou Rúbrica em Alta Resolução */}
      {previewFotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex flex-col items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 text-sm">
                {previewTitulo}
              </span>
              <button
                type="button"
                onClick={() => setPreviewFotoUrl(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-amber-300 bg-slate-950 max-h-[65vh] flex items-center justify-center">
              <img
                src={previewFotoUrl}
                alt="Comprovante"
                className="max-h-[60vh] w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500 text-[11px]">
                Comprovante arquivado no histórico permanente do condomínio.
              </span>
              <button
                type="button"
                onClick={() => setPreviewFotoUrl(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
