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
        // Tenta encontrar morador existente pelo nome, apto ou bloco
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
      setFormError('⚠️ Por favor, selecione para qual Morador/Apartamento a encomenda se destina no campo acima.');
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

      // 3. Disparo 100% Automático via WhatsApp Gateway
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
      setFeedback(`🚀 Encomenda cadastrada com sucesso! Notificação com o PIN [ ${newEnc.codigoResgate} ] enviada para ${morador.nome} (Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto})!`);
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
      {/* Banner Explicativo */}
      <div className="bg-gradient-to-r from-amber-900 to-orange-950 text-white p-6 sm:p-7 rounded-3xl border border-amber-800/80 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
          <Package className="w-3.5 h-3.5" />
          <span>Recebimento de Encomendas & Regras de Portaria</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black">
          Cadastro de Encomendas & Gestão de Prazos
        </h2>
        <p className="text-xs text-amber-200/90 max-w-3xl">
          Síndico, porteiro ou administração cadastram aqui o pacote que chegou. O morador é avisado na hora de forma 100% automática (WhatsApp, Push e App) com o código PIN de resgate e o prazo de {diasLimite} dias.
        </p>
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

      {/* Métricas de Encomendas do Condomínio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-500 block">Aguardando na Portaria</span>
            <span className="text-2xl font-black text-amber-600 font-mono">{pendingPackages.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-500 block">Na Administração (prazo vencido)</span>
            <span className="text-2xl font-black text-rose-600 font-mono">{adminPackages.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-500 block">Entregues aos Moradores</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">{deliveredPackages.length}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

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
                  setFeedback('🔔 Notificação Push de teste disparada para a barra de tarefas!');
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

                {/* Seleção Rápida de Moradores em Chips */}
                {moradores.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                      Toque rápido na unidade:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {moradores.slice(0, 10).map((m) => {
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
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'bg-white text-slate-700 border border-slate-200 hover:bg-amber-50 hover:border-amber-300'
                            }`}
                          >
                            <span>Bl {m.unidade.bloco} - {m.unidade.apto}</span>
                            <span className="opacity-75 text-[10px]">({m.nome.split(' ')[0]})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Ou busque digitando número do bloco e apartamento:
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Ex: Bloco 20 303 ou 303..."
                      value={searchMoradorInput}
                      onChange={(e) => {
                        setSearchMoradorInput(e.target.value);
                        setSelectedMoradorId('');
                        setFormError(null);
                      }}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border ${formError && !manualApto.trim() ? 'border-rose-400 bg-rose-50/30 ring-2 ring-rose-200' : 'border-slate-200 bg-slate-50'}`}>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Bloco (rápido)</label>
                  <input
                    type="text"
                    placeholder="Ex: 20"
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
                    placeholder="Ex: 303"
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
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp Morador</label>
                  <input
                    type="text"
                    placeholder="(21) 99999-9999"
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

            {/* Banner de Erro Inline Imediato */}
            {formError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Sucesso Inline com PIN */}
            {recemCadastrada && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-extrabold text-emerald-900">
                      ✓ Encomenda Lançada: Bloco {recemCadastrada.morador.unidade.bloco} - Apto {recemCadastrada.morador.unidade.apto} ({recemCadastrada.morador.nome})
                    </p>
                    <p className="text-[11px] text-emerald-700 font-normal">
                      PIN de Resgate gerado e enviado via WhatsApp: <strong className="font-mono font-bold text-emerald-900">{recemCadastrada.encomenda.codigoResgate}</strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(recemCadastrada.encomenda.codigoResgate);
                    setFeedback('🔐 Código PIN copiado com sucesso!');
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shrink-0 cursor-pointer shadow-sm"
                >
                  Copiar PIN
                </button>
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
              O morador apresenta o PIN de 6 dígitos. Caso não tenha o código, utilize a conferência de documento e rúbrica.
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
                <span className="text-slate-500">PIN obrigatório para liberação direta.</span>
                {(pendingPackages.length > 0 || adminPackages.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      const enc = pendingPackages[0] || adminPackages[0];
                      setSelectedEncomendaForEntrega(enc);
                      setIsEntregaModalOpen(true);
                    }}
                    className="text-emerald-700 font-bold hover:underline"
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
              <span>Regra de Segurança do Condomínio:</span>
            </div>
            <p className="text-[11px]">
              O código PIN é único e intransferível. Ao dar baixa, o status da encomenda muda imediatamente para entregue no histórico do condomínio e no celular do morador.
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
                        onClick={() => setPreviewFotoUrl(enc.fotoUrl!)}
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

      {/* Formulário de Configuração das Regras e Prazos */}
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

      {/* Modal para Visualização da Foto da Etiqueta em Alta Resolução */}
      {previewFotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex flex-col items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900 text-sm">
                Foto do Selo / Etiqueta da Encomenda
              </span>
              <button
                type="button"
                onClick={() => setPreviewFotoUrl(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-amber-300 bg-slate-950 max-h-[65vh] flex items-center justify-center">
              <img
                src={previewFotoUrl}
                alt="Foto Etiqueta"
                className="max-h-[60vh] w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500 text-[11px]">
                Etiqueta registrada no momento do recebimento.
              </span>
              <button
                type="button"
                onClick={() => setPreviewFotoUrl(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs"
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
