import React, { useState, useEffect } from 'react';
import {
  Condominio,
  Morador,
  Encomenda,
  Bicicleta,
  HistoricoLocacao,
  VisitanteLiberado,
} from '../../types';
import { condoStore } from '../../services/mockStorage';
import { ItensCompartilhadosView } from '../compartilhados/ItensCompartilhadosView';
import { ScrollableTabsNav } from '../common/ScrollableTabsNav';
import { UniversalQrCodeScanner } from '../common/UniversalQrCodeScanner';
import {
  Package,
  Bike,
  Plus,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Search,
  Users,
  Car,
  Check,
  X,
  Camera,
  Layers,
  Phone,
  AlertTriangle,
  Wrench,
  QrCode,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PortariaDashboardProps {
  condominio: Condominio;
  moradores: Morador[];
  encomendas: Encomenda[];
  bikes: Bicicleta[];
  historicoLocacoes: HistoricoLocacao[];
}

export const PortariaDashboard: React.FC<PortariaDashboardProps> = ({
  condominio,
  moradores,
  encomendas,
  bikes,
  historicoLocacoes,
}) => {
  const [activeTab, setActiveTab] = useState<
    'receber' | 'baixa' | 'bicicletario' | 'equipamentos' | 'visitantes' | 'historico'
  >('receber');

  // Encomendas: Receber
  const [selectedMoradorId, setSelectedMoradorId] = useState('');
  const [transportadora, setTransportadora] = useState('');
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [observacao, setObservacao] = useState('');

  // Encomendas: Baixa
  const [inputRescueCode, setInputRescueCode] = useState('');
  const [baixaFeedback, setBaixaFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Bicicletas: Código de Retirada de 5 Minutos
  const [inputBikeReservaCode, setInputBikeReservaCode] = useState('');
  const [bikeReservaFeedback, setBikeReservaFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Vistoria de Devolução de Bicicleta na Portaria
  const [selectedBikeForReturn, setSelectedBikeForReturn] = useState<Bicicleta | null>(null);
  const [returnVistoriaStatus, setReturnVistoriaStatus] = useState<'ok' | 'com_defeito'>('ok');
  const [returnFotoUrl, setReturnFotoUrl] = useState<string>('');
  const [returnDetalhesDefeito, setReturnDetalhesDefeito] = useState<string>('');
  const [returnLocal, setReturnLocal] = useState<string>('Totem da Portaria Principal');
  const [returnOperador, setReturnOperador] = useState<string>('Porteiro de Plantão');

  // Scanner Universal
  const [showUniversalScanner, setShowUniversalScanner] = useState(false);

  // Busca geral
  const [searchQuery, setSearchQuery] = useState('');

  // Notificações / Alertas
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dados reativos da Portaria
  const visitantes = condoStore.getVisitantes(condominio.id);

  const pendingPackages = encomendas.filter((e) => e.status === 'na_portaria');
  const deliveredPackages = encomendas.filter((e) => e.status === 'entregue');
  const reservedBikes = bikes.filter((b) => b.status === 'reservada_5min');
  const inUseBikes = bikes.filter((b) => b.status === 'em_uso');
  const maintenanceBikes = bikes.filter((b) => b.status === 'manutencao');

  // Transportadoras comuns
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

  // Registrar Encomenda
  const handleRegisterPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMoradorId || !transportadora) return;

    const morador = moradores.find((m) => m.id === selectedMoradorId);
    if (!morador) return;

    const newEnc = condoStore.addEncomenda(condominio.id, {
      moradorId: morador.id,
      transportadora,
      codigoRastreio: codigoRastreio.toUpperCase(),
      observacao,
      recebidoPor: 'Portaria Principal (Plantão)',
    });

    setActionAlert({
      type: 'success',
      text: `Encomenda de ${morador.nome} registrada com sucesso! PIN de Resgate: ${newEnc.codigoResgate}`,
    });

    // Reset
    setSelectedMoradorId('');
    setTransportadora('');
    setCodigoRastreio('');
    setObservacao('');

    confetti({ particleCount: 50, spread: 60 });
  };

  // Dar Baixa em Encomenda com PIN
  const handleBaixaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRescueCode || inputRescueCode.length < 6) {
      setBaixaFeedback({ success: false, message: 'Digite o código completo de 6 dígitos.' });
      return;
    }

    const result = condoStore.darBaixaEncomenda(condominio.id, inputRescueCode.trim(), 'Portaria Plantão');
    setBaixaFeedback(result);

    if (result.success) {
      setInputRescueCode('');
      confetti({ particleCount: 70, spread: 70 });
    }
  };

  // Validar Retirada de Bike de 5 Minutos
  const handleConfirmarRetiradaBike = (bikeId: string) => {
    const res = condoStore.confirmarRetiradaPortaria(condominio.id, bikeId, 'Portaria Plantonista');
    if (res.success) {
      setBikeReservaFeedback({ success: true, message: res.message });
      confetti({ particleCount: 60, spread: 60 });
    } else {
      setBikeReservaFeedback({ success: false, message: res.message });
    }
  };

  // Check-in de Visitante
  const handleCheckinVisitante = (visId: string) => {
    const res = condoStore.registrarEntradaPortaria(condominio.id, visId, 'Portaria Principal');
    if (res.success) {
      setActionAlert({ type: 'success', text: res.message });
      confetti({ particleCount: 40, spread: 50 });
    }
  };

  // Check-out de Visitante
  const handleCheckoutVisitante = (visId: string) => {
    const res = condoStore.registrarSaidaPortaria(condominio.id, visId);
    if (res.success) {
      setActionAlert({ type: 'success', text: res.message });
    }
  };

  // Abrir Vistoria de Devolução na Portaria
  const handleOpenReceberDevolucao = (bike: Bicicleta) => {
    setSelectedBikeForReturn(bike);
    setReturnVistoriaStatus('ok');
    setReturnFotoUrl('');
    setReturnDetalhesDefeito('');
  };

  // Confirmar Devolução e Vistoria Fotográfica na Portaria
  const handleReceberDevolucaoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBikeForReturn) return;

    const res = condoStore.receberDevolucaoPortariaBike(
      condominio.id,
      selectedBikeForReturn.id,
      {
        vistoriaStatus: returnVistoriaStatus,
        fotoVistoriaDevolucaoUrl: returnFotoUrl || undefined,
        detalhesDefeito: returnVistoriaStatus === 'com_defeito' ? returnDetalhesDefeito : undefined,
        localDevolucao: returnLocal,
        vistoriaOperador: returnOperador,
      }
    );

    if (res.success) {
      setActionAlert({
        type: res.emManutencao ? 'error' : 'success',
        text: res.message,
      });
      confetti({ particleCount: 70, spread: 70 });
      setSelectedBikeForReturn(null);
      setReturnFotoUrl('');
      setReturnDetalhesDefeito('');
    } else {
      setActionAlert({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Alerta de Feedback */}
      {actionAlert && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionAlert.text}</span>
          </div>
          <button onClick={() => setActionAlert(null)} className="underline text-xs">
            Fechar
          </button>
        </div>
      )}

      {/* Header Portaria */}
      <div className="bg-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Módulo Operacional
              </span>
              <span className="text-xs text-slate-400">{condominio.nome}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Controle de Portaria & Acessos
            </h1>
            <p className="text-xs text-slate-300">
              Gerenciamento unificado de encomendas, liberação de visitantes e totem de bicicletas.
            </p>
          </div>
        </div>

        {/* Métricas Rápidas & Scanner */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            id="btn-portaria-scanner-universal"
            onClick={() => setShowUniversalScanner(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition active:scale-98 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>⚡ Scanner Universal (QR & PIN)</span>
          </button>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl text-center border border-white/10 min-w-[90px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Na Portaria</span>
            <span className="text-xl font-black text-amber-400 font-mono">{pendingPackages.length}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl text-center border border-white/10 min-w-[90px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Bikes em 5min</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{reservedBikes.length}</span>
          </div>
        </div>
      </div>

      {/* Navegação de Abas */}
      <ScrollableTabsNav>
        <button
          onClick={() => setActiveTab('receber')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'receber'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Receber Encomenda</span>
        </button>

        <button
          onClick={() => setActiveTab('baixa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'baixa'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Entregar Pacote (PIN 6 Dígitos)</span>
          {pendingPackages.length > 0 && (
            <span className="text-[10px] bg-white text-amber-900 font-black px-1.5 py-0.5 rounded-full">
              {pendingPackages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('bicicletario')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'bicicletario'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Totem & Bikes (5 min)</span>
          {reservedBikes.length > 0 && (
            <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-full animate-bounce">
              {reservedBikes.length} reservadas
            </span>
          )}
        </button>

        <button
          id="tab-portaria-equipamentos"
          onClick={() => setActiveTab('equipamentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'equipamentos'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200'
          }`}
        >
          <Wrench className="w-4 h-4 text-teal-700" />
          <span>Itens & Equipamentos (5 min)</span>
        </button>

        <button
          onClick={() => setActiveTab('visitantes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'visitantes'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Controle de Visitantes</span>
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'historico'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Histórico</span>
        </button>
      </ScrollableTabsNav>

      {/* ABA 1: RECEBER ENCOMENDA */}
      {activeTab === 'receber' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                <span>Cadastrar Encomenda Recebida</span>
              </h2>
              <p className="text-xs text-slate-500">
                O morador receberá automaticamente uma notificação push com o código seguro de 6 dígitos.
              </p>
            </div>

            <form onSubmit={handleRegisterPackage} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Unidade e Morador de Destino:
                </label>
                <select
                  value={selectedMoradorId}
                  onChange={(e) => setSelectedMoradorId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">Selecione o morador...</option>
                  {moradores.map((m) => (
                    <option key={m.id} value={m.id}>
                      Bloco {m.unidade.bloco} - Apto {m.unidade.apto} • {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Transportadora / Entregador:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {commonCarriers.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTransportadora(c)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
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
                  placeholder="Ou digite outra transportadora..."
                  value={transportadora}
                  onChange={(e) => setTransportadora(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código de Rastreio / NFe:</label>
                  <input
                    type="text"
                    placeholder="Ex: BR123456789"
                    value={codigoRastreio}
                    onChange={(e) => setCodigoRastreio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Local na Portaria / Observação:</label>
                  <input
                    type="text"
                    placeholder="Ex: Prateleira B2, Caixa grande"
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition active:scale-98"
              >
                Gerar PIN de Resgate & Notificar Morador
              </button>
            </form>
          </div>

          {/* Lista de Encomendas Estocadas */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center justify-between">
              <span>Aguardando Retirada ({pendingPackages.length})</span>
            </h3>

            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {pendingPackages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">Nenhum pacote estocado.</p>
              ) : (
                pendingPackages.map((enc) => (
                  <div
                    key={enc.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-slate-900">{enc.moradorNome}</div>
                        <div className="text-amber-800 font-semibold text-xs">
                          Bloco {enc.unidade.bloco} - Apto {enc.unidade.apto}
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          {enc.transportadora} • {enc.codigoRastreio || 'Sem rastreio'}
                        </div>
                      </div>
                      <span className="font-mono font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-xl text-xs">
                        {enc.codigoResgate}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setInputRescueCode(enc.codigoResgate);
                        setActiveTab('baixa');
                      }}
                      className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition"
                    >
                      <span>Validar Baixa Direta</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: BAIXA DE ENCOMENDA */}
      {activeTab === 'baixa' && (
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-3xl p-7 shadow-lg text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <KeyRound className="w-7 h-7" />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-900">Baixa com PIN Seguro</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Digite o código de 6 dígitos apresentado pelo morador:
            </p>
          </div>

          {baixaFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 text-left font-bold ${
                baixaFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {baixaFeedback.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{baixaFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleBaixaSubmit} className="space-y-4">
            <input
              type="text"
              maxLength={6}
              value={inputRescueCode}
              onChange={(e) => setInputRescueCode(e.target.value)}
              placeholder="000000"
              className="w-full text-center text-4xl font-mono font-black tracking-widest bg-slate-50 border-2 border-amber-400 rounded-2xl py-3.5 text-slate-900 focus:outline-none focus:border-amber-600"
              autoFocus
            />

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-md shadow-amber-600/20 transition active:scale-98"
            >
              Validar Código & Entregar Pacote
            </button>
          </form>
        </div>
      )}

      {/* ABA 3: TOTEM & BICICLETÁRIO DE 5 MINUTOS */}
      {activeTab === 'bicicletario' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-950">
                  Validador de Retirada Novolar (5 Minutos)
                </h3>
                <p className="text-xs text-emerald-800">
                  Confira a senha do cadeado e valide a liberação física no totem da portaria.
                </p>
              </div>
            </div>
          </div>

          {bikeReservaFeedback && (
            <div
              className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                bikeReservaFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{bikeReservaFeedback.message}</span>
            </div>
          )}

          {/* Lista de Bicicletas Reservadas no Momento (5min) */}
          {reservedBikes.length > 0 && (
            <div className="bg-amber-500 text-white p-6 rounded-3xl shadow-lg space-y-4">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Clock className="w-5 h-5 animate-spin" />
                <span>Bicicletas com Reserva Ativa de 5 Minutos ({reservedBikes.length})</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reservedBikes.map((bike) => (
                  <div key={bike.id} className="bg-white text-slate-900 p-5 rounded-2xl shadow space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                        Bike #{bike.codigo}
                      </span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full font-mono">
                        Código: {bike.reservaCodigo || 'BK-5MIN'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900">{bike.modelo}</h4>
                      <p className="text-xs text-slate-600">
                        Morador: <strong>{bike.reservaMoradorNome}</strong> ({bike.reservaMoradorUnidade})
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                      <span className="text-slate-500 font-semibold">Senha do Cadeado:</span>
                      <span className="font-mono font-black text-emerald-700 text-sm">
                        {bike.lockPassword}
                      </span>
                    </div>

                    <button
                      onClick={() => handleConfirmarRetiradaBike(bike.id)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar Retirada na Portaria</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bicicletas Atualmente em Uso / Na Rua */}
          {inUseBikes.length > 0 && (
            <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Bike className="w-5 h-5 animate-pulse" />
                  <span>Bicicletas em Uso no Momento ({inUseBikes.length})</span>
                </h3>
                <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold">
                  Devolução com Vistoria Fotográfica Obrigatória
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inUseBikes.map((bike) => (
                  <div key={bike.id} className="bg-white text-slate-900 p-5 rounded-2xl shadow space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-600 text-white">
                        Bike #{bike.codigo}
                      </span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                        Em Trânsito / Uso
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900">{bike.modelo}</h4>
                      <p className="text-xs text-slate-600">
                        Morador: <strong>{bike.emUsoPorMoradorNome || 'Morador'}</strong>
                      </p>
                      {bike.inicioUsoTimestamp && (
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Retirada às: {new Date(bike.inicioUsoTimestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleOpenReceberDevolucao(bike)}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-emerald-400" />
                      <span>📸 Receber Devolução & Tirar Foto da Vistoria</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Todas as Bicicletas do Condomínio */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Estado Físico da Frota Novolar</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bikes.map((bike) => (
                <div key={bike.id} className="p-5 rounded-2xl border border-slate-200 space-y-3 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs">Bike #{bike.codigo}</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        bike.status === 'disponivel'
                          ? 'bg-emerald-100 text-emerald-800'
                          : bike.status === 'reservada_5min'
                          ? 'bg-amber-100 text-amber-900'
                          : bike.status === 'em_uso'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {bike.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900">{bike.modelo}</h4>
                  <p className="text-xs text-slate-500">{bike.localizacaoAtual}</p>

                  <div className="pt-2 border-t border-slate-200 text-xs flex justify-between">
                    <span className="text-slate-500">Cadeado:</span>
                    <strong className="font-mono">{bike.lockPassword}</strong>
                  </div>

                  {bike.avariasAtuais && bike.avariasAtuais.length > 0 && (
                    <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200 font-bold">
                      ⚠️ Avarias: {bike.avariasAtuais.join(', ')}
                    </div>
                  )}

                  {bike.status === 'em_uso' && (
                    <button
                      onClick={() => handleOpenReceberDevolucao(bike)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Receber c/ Vistoria</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA: ITENS E EQUIPAMENTOS COMPARTILHADOS */}
      {activeTab === 'equipamentos' && (
        <ItensCompartilhadosView
          condominio={condominio}
          isStaff={true}
          operadorNome="Portaria Principal"
        />
      )}

      {/* ABA 4: VISITANTES & PRESTADORES */}
      {activeTab === 'visitantes' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Controle de Visitantes e Prestadores</h3>
            <p className="text-xs text-slate-500">Autorizações emitidas pelos moradores pelo aplicativo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visitantes.map((vis) => (
              <div key={vis.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {vis.tipo}
                  </span>
                  <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                    Cód: {vis.codigoAcesso}
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">{vis.nomeVisitante}</h4>
                  {vis.empresa && <p className="text-xs text-slate-600 font-semibold">{vis.empresa}</p>}
                  <p className="text-xs text-slate-500 mt-1">
                    Unidade Anfitriã: <strong>{vis.unidade ? `Bloco ${vis.unidade.bloco} - Apto ${vis.unidade.apto}` : 'Residencial'}</strong> • {vis.moradorNome}
                  </p>
                  {vis.placaVeiculo && (
                    <p className="text-xs text-slate-700 mt-0.5 flex items-center gap-1 font-semibold">
                      <Car className="w-3.5 h-3.5" /> Placa: {vis.placaVeiculo}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">
                    Status: <strong className="uppercase">{vis.status}</strong>
                  </span>

                  {vis.status === 'pendente' ? (
                    <button
                      onClick={() => handleCheckinVisitante(vis.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition"
                    >
                      Registrar Entrada
                    </button>
                  ) : vis.status === 'dentro' ? (
                    <button
                      onClick={() => handleCheckoutVisitante(vis.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
                    >
                      Registrar Saída
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Finalizado</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE VISTORIA FOTOGRÁFICA DE DEVOLUÇÃO NA PORTARIA */}
      {selectedBikeForReturn && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Vistoria de Devolução — Bike #{selectedBikeForReturn.codigo}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Foto anexada automaticamente ao histórico do morador para perícia.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBikeForReturn(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReceberDevolucaoSubmit} className="space-y-4">
              {/* Info do Morador */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Morador Responsável:</span>
                  <strong className="text-slate-900">{selectedBikeForReturn.emUsoPorMoradorNome || 'Morador'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Modelo da Bike:</span>
                  <span className="font-bold text-slate-800">{selectedBikeForReturn.modelo}</span>
                </div>
              </div>

              {/* Status da Vistoria */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Estado Físico da Bicicleta na Entrega:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-1.5 transition ${
                      returnVistoriaStatus === 'ok'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-extrabold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vistoriaStatus"
                      value="ok"
                      checked={returnVistoriaStatus === 'ok'}
                      onChange={() => setReturnVistoriaStatus('ok')}
                      className="sr-only"
                    />
                    <CheckCircle2 className={`w-5 h-5 ${returnVistoriaStatus === 'ok' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="text-xs">100% Aprovada (Sem Danos)</span>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-1.5 transition ${
                      returnVistoriaStatus === 'com_defeito'
                        ? 'border-rose-500 bg-rose-50 text-rose-950 font-extrabold'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="vistoriaStatus"
                      value="com_defeito"
                      checked={returnVistoriaStatus === 'com_defeito'}
                      onChange={() => setReturnVistoriaStatus('com_defeito')}
                      className="sr-only"
                    />
                    <AlertTriangle className={`w-5 h-5 ${returnVistoriaStatus === 'com_defeito' ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span className="text-xs">⚠️ Com Defeito / Avaria</span>
                  </label>
                </div>
              </div>

              {/* Descrição do Defeito se houver */}
              {returnVistoriaStatus === 'com_defeito' && (
                <div className="space-y-1.5 bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200">
                  <label className="block text-xs font-extrabold text-rose-900">
                    Descreva o Defeito / Avaria Identificada (Para Investigação):
                  </label>
                  <textarea
                    rows={2}
                    value={returnDetalhesDefeito}
                    onChange={(e) => setReturnDetalhesDefeito(e.target.value)}
                    placeholder="Ex: Pneu furado, guidão desalinhado, pedal quebrado, arranhão profundo..."
                    className="w-full p-2.5 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white"
                    required
                  />
                  <p className="text-[11px] text-rose-700">
                    A bicicleta será automaticamente bloqueada e marcada como <strong>Em Manutenção</strong>.
                  </p>
                </div>
              )}

              {/* Registro Fotográfico Obrigatório */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  📸 Foto da Vistoria da Bicicleta (Obrigatório para Relatório):
                </label>

                {returnFotoUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                    <img
                      src={returnFotoUrl}
                      alt="Foto da Vistoria"
                      className="w-full h-44 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setReturnFotoUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full shadow text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center space-y-2 bg-slate-50 transition">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-600 font-semibold">
                        Tirar foto com a câmera do celular/tablet ou carregar imagem
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setReturnFotoUrl(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-extrabold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setReturnFotoUrl(
                          'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=600&q=80'
                        );
                      }}
                      className="w-full py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                    >
                      📷 Usar Foto Padrão de Demonstração
                    </button>
                  </div>
                )}
              </div>

              {/* Responsável da Portaria */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Local da Devolução</label>
                  <input
                    type="text"
                    value={returnLocal}
                    onChange={(e) => setReturnLocal(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Operador / Porteiro</label>
                  <input
                    type="text"
                    value={returnOperador}
                    onChange={(e) => setReturnOperador(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBikeForReturn(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar Recebimento & Arquivar Vistoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABA 6: HISTÓRICO GERAL */}
      {activeTab === 'historico' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base">Histórico Completo de Entregas</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Destinatário</th>
                  <th className="p-3">Transportadora</th>
                  <th className="p-3">Código Resgate</th>
                  <th className="p-3">Entrada</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {encomendas.map((enc) => (
                  <tr key={enc.id}>
                    <td className="p-3 font-semibold text-slate-900">
                      {enc.moradorNome} (Bl. {enc.unidade.bloco} - {enc.unidade.apto})
                    </td>
                    <td className="p-3 text-slate-600">{enc.transportadora}</td>
                    <td className="p-3 font-mono font-bold text-amber-900">{enc.codigoResgate}</td>
                    <td className="p-3 text-slate-500">{new Date(enc.recebidoEm).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          enc.status === 'na_portaria'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {enc.status === 'na_portaria' ? 'Na Portaria' : 'Entregue'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Scanner Universal de QR Code & PINs */}
      <UniversalQrCodeScanner
        isOpen={showUniversalScanner}
        onClose={() => setShowUniversalScanner(false)}
        condominioId={condominio.id}
        operadorNome="Porteiro de Plantão"
        onSuccess={() => {
          // Os listeners do condoStore atualizam o estado automaticamente
        }}
      />
    </div>
  );
};
