import React, { useState, useEffect } from 'react';
import {
  Bike,
  QrCode,
  Package,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
  LockOpen,
  CheckCircle2,
  AlertTriangle,
  BatteryCharging,
  ChevronRight,
  ShieldCheck,
  Building,
  User,
  Copy,
  Info,
  Layers,
  FileText,
  MapPin,
  Home,
  Check,
  Phone,
  HelpCircle,
  Flame,
  Waves,
  Dumbbell,
} from 'lucide-react';
import {
  Condominio,
  Morador,
  Bicicleta,
  Encomenda,
  AreaLazer,
  Reserva,
  Aviso,
  HistoricoLocacao,
} from '../../types';
import { condoStore } from '../../services/mockStorage';
import { QrScannerModal } from '../common/QrScannerModal';
import { BikeLockModal } from '../common/BikeLockModal';
import { BikeReturnModal } from '../common/BikeReturnModal';
import confetti from 'canvas-confetti';

interface MoradorDashboardProps {
  condominio: Condominio;
  morador: Morador;
  bikes: Bicicleta[];
  encomendas: Encomenda[];
  areasLazer: AreaLazer[];
  reservas: Reserva[];
  avisos: Aviso[];
  historicoLocacoes: HistoricoLocacao[];
}

export const MoradorDashboard: React.FC<MoradorDashboardProps> = ({
  condominio,
  morador,
  bikes,
  encomendas,
  areasLazer,
  reservas,
  avisos,
  historicoLocacoes,
}) => {
  const [activeTab, setActiveTab] = useState<'bicicletario' | 'encomendas' | 'lazer' | 'avisos' | 'unidade'>('bicicletario');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedBikeForLock, setSelectedBikeForLock] = useState<Bicicleta | null>(null);
  const [currentLockPassword, setCurrentLockPassword] = useState('');
  const [bikeForReturn, setBikeForReturn] = useState<Bicicleta | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // New Reservation Form State
  const [reservaAreaId, setReservaAreaId] = useState('');
  const [reservaData, setReservaData] = useState('');
  const [reservaPeriodo, setReservaPeriodo] = useState<'manha' | 'tarde' | 'noite' | 'dia_inteiro'>('noite');
  const [reservaTermoAceito, setReservaTermoAceito] = useState(false);
  const [reservaObs, setReservaObs] = useState('');

  // Active bike used by current morador
  const activeBikeInUse = bikes.find((b) => b.status === 'em_uso' && b.usuarioAtualId === morador.id);

  // Timer for active ride
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  useEffect(() => {
    if (!activeBikeInUse || !activeBikeInUse.inicioUsoTimestamp) {
      setElapsedMinutes(0);
      return;
    }
    const updateTimer = () => {
      const diff = Math.floor((Date.now() - activeBikeInUse.inicioUsoTimestamp!) / 60000);
      setElapsedMinutes(Math.max(1, diff));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 15000);
    return () => clearInterval(interval);
  }, [activeBikeInUse]);

  const handleScanCheckout = (bikeCodeOrToken: string) => {
    setIsQrModalOpen(false);
    const result = condoStore.checkoutBike(condominio.id, bikeCodeOrToken, morador.id);

    if (result.success && result.bike) {
      setSelectedBikeForLock(result.bike);
      setCurrentLockPassword(result.lockPassword || result.bike.lockPassword);
      setIsLockModalOpen(true);
      setAlertMessage({ type: 'success', text: result.message });
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } else {
      setAlertMessage({ type: 'error', text: result.message });
    }
  };

  const handleReturnSubmit = (data: {
    localDevolucao: string;
    freiosOk: boolean;
    correnteOk: boolean;
    pneusOk: boolean;
    quadroOk: boolean;
    observacoes: string;
  }) => {
    if (!bikeForReturn) return;
    const result = condoStore.checkinBike(condominio.id, bikeForReturn.id, morador.id, data);
    setIsReturnModalOpen(false);
    setBikeForReturn(null);
    setAlertMessage({
      type: result.emManutencao ? 'error' : 'success',
      text: result.message,
    });
  };

  const handleCreateReserva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaAreaId || !reservaData) {
      setAlertMessage({ type: 'error', text: 'Selecione o espaço e a data desejada.' });
      return;
    }

    const area = areasLazer.find((a) => a.id === reservaAreaId);
    if (!area) return;

    const res = condoStore.addReserva(condominio.id, {
      areaId: area.id,
      espaco: area.nome,
      data: reservaData,
      periodo: reservaPeriodo,
      moradorId: morador.id,
      termoAceito: reservaTermoAceito,
      valorTaxa: area.taxaReserva,
      observacoes: reservaObs,
    });

    if (res.success) {
      setAlertMessage({ type: 'success', text: res.message });
      setReservaData('');
      setReservaTermoAceito(false);
      setReservaObs('');
      confetti({ particleCount: 50, spread: 60 });
    } else {
      setAlertMessage({ type: 'error', text: res.message });
    }
  };

  const pendingPackages = encomendas.filter((e) => e.status === 'na_portaria');
  const deliveredPackages = encomendas.filter((e) => e.status === 'entregue');
  const myReservations = reservas.filter((r) => r.moradorId === morador.id);

  const availableBikesCount = bikes.filter((b) => b.status === 'disponivel').length;
  const inUseBikesCount = bikes.filter((b) => b.status === 'em_uso').length;
  const maintenanceBikesCount = bikes.filter((b) => b.status === 'manutencao').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Alertas de Notificação do Sistema */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm shadow-sm border transition-all ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-xs font-semibold underline hover:opacity-75 ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Cartão de Boas-Vindas Elegante */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Espaço do Morador
            </span>
            <span className="text-xs text-slate-500 font-medium">{condominio.nome}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Olá, {morador.nome}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Sua unidade: <strong>Bloco {morador.unidade.bloco}</strong> • Apartamento{' '}
            <strong>{morador.unidade.apto}</strong>
          </p>
        </div>

        {/* Ação Rápida em Destaque */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {!activeBikeInUse ? (
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition active:scale-98"
            >
              <QrCode className="w-4 h-4" />
              <span>Desbloquear Bicicleta</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setBikeForReturn(activeBikeInUse);
                setIsReturnModalOpen(true);
              }}
              className="w-full md:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition active:scale-98"
            >
              <Bike className="w-4 h-4" />
              <span>Devolver Bike #{activeBikeInUse.codigo}</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner de Viagem Ativa (Quando o morador está com uma bike em uso) */}
      {activeBikeInUse && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Bike className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  Passeio em Andamento
                </span>
                <span className="text-sm font-bold text-slate-900">
                  Bike #{activeBikeInUse.codigo}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {activeBikeInUse.modelo} ({activeBikeInUse.tipo})
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                <span className="flex items-center gap-1.5 font-medium text-emerald-800">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Tempo de uso: ~{elapsedMinutes} min (Limite: {condominio.regras.limiteTempoBikeMinutos} min)
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  Senha do Cadeado: {activeBikeInUse.lockPassword}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setBikeForReturn(activeBikeInUse);
              setIsReturnModalOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow transition"
          >
            Finalizar Viagem & Devolver
          </button>
        </div>
      )}

      {/* Abas de Navegação Elegantes */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bicicletario')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'bicicletario'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Bicicletário</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
            activeTab === 'bicicletario' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
          }`}>
            {availableBikesCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('encomendas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'encomendas'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Minhas Encomendas</span>
          {pendingPackages.length > 0 && (
            <span className="text-xs bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
              {pendingPackages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('lazer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'lazer'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Espaços & Lazer</span>
          {myReservations.length > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'lazer' ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {myReservations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('avisos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'avisos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Comunicados</span>
          {avisos.filter((a) => a.prioritario).length > 0 && (
            <span className="text-xs bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
              Urgente
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('unidade')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'unidade'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Minha Unidade</span>
        </button>
      </div>

      {/* ABA 1: BICICLETÁRIO COMPARTILHADO */}
      {activeTab === 'bicicletario' && (
        <div className="space-y-6">
          {/* Cartões de Resumo Rápido */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Disponíveis no Totem
                </span>
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{availableBikesCount}</div>
              <p className="text-xs text-slate-500 mt-1">Prontas para retirada com QR Code</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Em Uso por Vizinhos
                </span>
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{inUseBikesCount}</div>
              <p className="text-xs text-slate-500 mt-1">Circulando no momento</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Em Revisão Preventiva
                </span>
                <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{maintenanceBikesCount}</div>
              <p className="text-xs text-slate-500 mt-1">Garantia de segurança e revisão</p>
            </div>
          </div>

          {/* Grid de Bicicletas com visual moderno */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Frota de Bicicletas do Condomínio</h2>
                <p className="text-xs text-slate-500">Escolha uma bicicleta disponível e aponte a câmera para o QR Code</p>
              </div>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Escanear QR Code</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bikes.map((bike) => {
                const isAvailable = bike.status === 'disponivel';
                const isInUse = bike.status === 'em_uso';
                const isMaintenance = bike.status === 'manutencao';
                const isMyBike = isInUse && bike.usuarioAtualId === morador.id;

                return (
                  <div
                    key={bike.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isMyBike
                        ? 'bg-emerald-50/50 border-emerald-300 shadow-md ring-2 ring-emerald-500/20'
                        : isAvailable
                        ? 'bg-white border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300'
                        : isInUse
                        ? 'bg-slate-50/80 border-slate-200 opacity-90'
                        : 'bg-rose-50/30 border-rose-200/60 opacity-80'
                    }`}
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                            #{bike.codigo}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 capitalize">
                            {bike.tipo === 'e-bike' ? '⚡ Elétrica' : bike.tipo}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            isAvailable
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : isInUse
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isAvailable ? 'Disponível' : isInUse ? 'Em Uso' : 'Em Revisão'}
                        </span>
                      </div>

                      {/* Modelo e Informações */}
                      <h3 className="font-bold text-base text-slate-900">{bike.modelo}</h3>

                      {/* Bateria se for elétrica */}
                      {bike.nivelBateria !== undefined && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100 w-fit">
                          <BatteryCharging className="w-4 h-4 text-teal-600" />
                          <span>Bateria: {bike.nivelBateria}% (Autonomia ~35 km)</span>
                        </div>
                      )}

                      {/* Localização e Status */}
                      <div className="mt-3 text-xs text-slate-600 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{bike.localizacaoAtual}</span>
                        </div>

                        {isInUse && (
                          <div className="text-amber-800 text-xs font-medium">
                            {isMyBike ? (
                              <strong className="text-emerald-700">✓ Em passeio com você</strong>
                            ) : (
                              <span>Retirada por {bike.usuarioAtualNome || 'Morador'}</span>
                            )}
                          </div>
                        )}

                        {isMaintenance && bike.avariasAtuais && bike.avariasAtuais.length > 0 && (
                          <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                            Motivo da revisão: {bike.avariasAtuais.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botão de Ação */}
                    <div className="mt-5 pt-3 border-t border-slate-100">
                      {isAvailable ? (
                        <button
                          onClick={() => handleScanCheckout(bike.codigo)}
                          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition active:scale-98"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Desbloquear Esta Bike</span>
                        </button>
                      ) : isMyBike ? (
                        <button
                          onClick={() => {
                            setBikeForReturn(bike);
                            setIsReturnModalOpen(true);
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition active:scale-98"
                        >
                          <Bike className="w-4 h-4" />
                          <span>Devolver & Checklist</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-not-allowed text-center"
                        >
                          {isMaintenance ? 'Em Revisão Técnica' : 'Ocupada no Momento'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Histórico Recente de Passeios */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Histórico Recente de Uso do Bicicletário
            </h3>

            {historicoLocacoes.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum passeio registrado recentemente.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {historicoLocacoes.slice(0, 5).map((h) => (
                  <div key={h.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 font-bold">Bike #{h.bikeCodigo}</strong>
                        <span className="text-slate-600">• {h.moradorNome} ({h.moradorUnidade})</span>
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {h.localDevolucao || 'Totem Principal'} •{' '}
                        {new Date(h.retiradaEm).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(h.retiradaEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    <div>
                      {h.avariasReportadas && h.avariasReportadas.length > 0 ? (
                        <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          Avaria: {h.avariasReportadas[0]}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          Devolvida 100% OK
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: MINHAS ENCOMENDAS */}
      {activeTab === 'encomendas' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-600" />
                  Encomendas Aguardando Retirada na Portaria
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dirija-se à portaria e informe o seu <strong>Código de Resgate</strong> para retirar o pacote com segurança.
                </p>
              </div>
            </div>

            {pendingPackages.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">Você não tem encomendas pendentes</p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Assim que a transportadora entregar um pacote para sua unidade na portaria, você receberá uma notificação com o código de 6 dígitos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingPackages.map((enc) => (
                  <div
                    key={enc.id}
                    className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Disponível na Portaria
                        </span>
                        <span className="text-xs text-slate-500">
                          Chegou às {new Date(enc.recebidoEm).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{enc.transportadora}</h3>
                      <p className="text-xs text-slate-600 mt-1">
                        Código de Rastreio: <strong className="text-slate-800">{enc.codigoRastreio}</strong>
                      </p>
                      {enc.observacao && (
                        <p className="text-xs text-slate-600 mt-2 bg-white p-2.5 rounded-xl border border-amber-100">
                          Anotação da Portaria: {enc.observacao}
                        </p>
                      )}
                    </div>

                    {/* Destaque do Código de Resgate de 6 Dígitos */}
                    <div className="mt-4 p-4 rounded-xl bg-white border border-amber-300 text-center shadow-sm">
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block mb-1">
                        Código de Resgate na Portaria
                      </span>
                      <div className="text-3xl font-extrabold tracking-widest text-slate-900 font-mono">
                        {enc.codigoResgate}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        Apresente este número ao porteiro de plantão
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histórico de Encomendas Entregues */}
          {deliveredPackages.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Histórico de Encomendas Retiradas
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {deliveredPackages.map((enc) => (
                  <div key={enc.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-slate-800">{enc.transportadora}</div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        Rastreio: {enc.codigoRastreio} • Atendido por: {enc.recebidoPor}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200">
                        Entregue
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {enc.entregueEm ? new Date(enc.entregueEm).toLocaleDateString('pt-BR') : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: ESPAÇOS E LAZER */}
      {activeTab === 'lazer' && (
        <div className="space-y-6">
          {/* Status Operacional dos Espaços Comuns */}
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Status Operacional das Áreas Comuns
              </h2>
              <p className="text-xs text-slate-500">Acompanhe em tempo real as condições de uso, piscinas, academia e sauna</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {areasLazer.map((area) => {
                const isOpen = area.status === 'aberto';
                const isCleaning = area.status === 'limpeza';
                const isMaintenance = area.status === 'manutencao';
                const isWeather = area.status === 'fechado_clima';

                return (
                  <div
                    key={area.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-bold text-sm text-slate-900">{area.nome}</span>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            isOpen
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : isCleaning
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : isWeather
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {isOpen
                            ? 'Livre / Aberto'
                            : isCleaning
                            ? 'Em Limpeza'
                            : isWeather
                            ? 'Clima Chuvoso'
                            : 'Em Manutenção'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed mt-1">{area.aviso}</p>

                      {area.previsaoReabertura && (
                        <div className="mt-2 text-xs font-semibold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                          Previsão de Liberação: <strong>{area.previsaoReabertura}</strong>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                      <span>Capacidade: <strong>{area.capacidade} pessoas</strong></span>
                      <span>{area.horarioFuncionamento}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Módulo de Agendamento e Reservas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulário de Reserva */}
            <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Agendar Salão de Festas ou Espaço Gourmet
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Selecione o espaço e confirme seu termo de responsabilidade digital.
              </p>

              <form onSubmit={handleCreateReserva} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Espaço Desejado:
                  </label>
                  <select
                    value={reservaAreaId}
                    onChange={(e) => setReservaAreaId(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione o espaço para o evento...</option>
                    {areasLazer
                      .filter((a) => a.permiteReserva)
                      .map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.nome} (Taxa de Limpeza: R$ {area.taxaReserva},00)
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Data do Evento:
                    </label>
                    <input
                      type="date"
                      value={reservaData}
                      onChange={(e) => setReservaData(e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Período / Turno:
                    </label>
                    <select
                      value={reservaPeriodo}
                      onChange={(e) => setReservaPeriodo(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="noite">Noite (18:00 às 02:00)</option>
                      <option value="tarde">Tarde (12:00 às 18:00)</option>
                      <option value="manha">Manhã (08:00 às 12:00)</option>
                      <option value="dia_inteiro">Dia Inteiro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Finalidade / Motivo (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Almoço em família, aniversário..."
                    value={reservaObs}
                    onChange={(e) => setReservaObs(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Termo de Responsabilidade */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      id="termoAceite"
                      checked={reservaTermoAceito}
                      onChange={(e) => setReservaTermoAceito(e.target.checked)}
                      className="mt-0.5 accent-emerald-600 w-4 h-4 rounded cursor-pointer"
                    />
                    <label htmlFor="termoAceite" className="text-slate-600 text-xs leading-relaxed cursor-pointer">
                      Declaro que estou ciente do regimento interno, respeito ao limite de som após as 22h e responsabilidade civil e patrimonial no {condominio.nome}.
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!reservaTermoAceito}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition shadow ${
                    reservaTermoAceito
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-98'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Confirmar Reserva do Espaço
                </button>
              </form>
            </div>

            {/* Minhas Reservas & Agenda do Condomínio */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Minhas Reservas Agendadas
                </h3>

                {myReservations.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">Você não possui reservas agendadas no momento.</p>
                ) : (
                  <div className="space-y-2.5">
                    {myReservations.map((r) => (
                      <div
                        key={r.id}
                        className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{r.espaco}</div>
                          <div className="text-emerald-800 text-xs font-semibold mt-0.5">
                            Data: {new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')} • Turno: {r.periodo}
                          </div>
                          {r.observacoes && (
                            <div className="text-slate-500 text-[11px] mt-0.5">Obs: {r.observacoes}</div>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            if (confirm('Deseja cancelar esta reserva?')) {
                              condoStore.cancelarReserva(condominio.id, r.id);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quadro de Ocupação Transparente */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  Quadro de Datas Reservadas no Condomínio
                </h3>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {reservas.filter((r) => r.status === 'confirmada').length === 0 ? (
                    <p className="text-slate-500 text-xs py-2">Todas as datas livres no momento.</p>
                  ) : (
                    reservas
                      .filter((r) => r.status === 'confirmada')
                      .map((r) => (
                        <div key={r.id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800">{r.espaco}</span>
                            <span className="text-slate-500 text-xs block">
                              Data: <strong>{new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')}</strong> ({r.periodo})
                            </span>
                          </div>
                          <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                            Reservado (Bloco {r.unidade.bloco})
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: MURAL DE COMUNICADOS */}
      {activeTab === 'avisos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-emerald-600" />
                Mural de Avisos & Comunicados da Administração
              </h2>
              <p className="text-xs text-slate-500">Notificações oficiais do síndico, manutenções programadas e assembleias</p>
            </div>
          </div>

          <div className="space-y-3">
            {avisos.map((aviso) => (
              <div
                key={aviso.id}
                className={`p-5 rounded-2xl border transition-all ${
                  aviso.prioritario
                    ? 'bg-rose-50/40 border-l-4 border-l-rose-500 border-slate-200 shadow-sm'
                    : 'bg-white border-l-4 border-l-emerald-600 border-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {aviso.prioritario && (
                      <span className="text-xs font-bold bg-rose-600 text-white px-2.5 py-0.5 rounded-full">
                        Importante
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      {aviso.categoria}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    Publicado em {new Date(aviso.criadoEm).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{aviso.titulo}</h3>
                <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                  {aviso.mensagem}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Autor: <strong className="text-slate-800">{aviso.autor}</strong> ({aviso.autorCargo})
                  </span>
                  {aviso.expiraEm && <span>Válido até: {aviso.expiraEm}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 5: MINHA UNIDADE & CONVENIÊNCIA */}
      {activeTab === 'unidade' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados da Unidade e Morador */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              Cadastro da Unidade Residencial
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Titular da Unidade:</span>
                <strong className="text-slate-900 font-bold">{morador.nome}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Bloco e Apartamento:</span>
                <strong className="text-slate-900 font-bold">Bloco {morador.unidade.bloco} - Apto {morador.unidade.apto}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">E-mail:</span>
                <span className="text-slate-800 font-medium">{morador.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Telefone / WhatsApp:</span>
                <span className="text-slate-800 font-medium">{morador.telefone}</span>
              </div>
              <div className="flex justify-between py-2 items-center">
                <span className="text-slate-500">Situação Cadastral:</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {morador.statusAdimplencia === 'em_dia' ? 'Adimplente / Liberado' : 'Com Pendência'}
                </span>
              </div>
            </div>
          </div>

          {/* Regras e Contatos Rápidos */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-600" />
              Canais de Atendimento & Normas
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block font-bold">Portaria Principal</strong>
                  <span className="text-slate-500">Ramal interno 1001 (24 Horas)</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-white px-2 py-1 rounded border border-slate-200">
                  Online
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block font-bold">Administração / Síndico</strong>
                  <span className="text-slate-500">{condominio.sindicoNome}</span>
                </div>
                <span className="text-xs text-slate-600">
                  Seg a Sex, 09h às 18h
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <strong className="text-emerald-900 block font-bold mb-1">Regras do Bicicletário:</strong>
                <ul className="list-disc list-inside text-emerald-800 space-y-0.5 text-xs">
                  <li>Tempo máximo de uso contínuo: {condominio.regras.limiteTempoBikeMinutos} minutos.</li>
                  <li>Horário de funcionamento do totem: {condominio.regras.horarioBicicletario}.</li>
                  <li>Devolução obrigatória com travamento no cadeado e checklist.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAIS INTERATIVOS */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        availableBikes={bikes}
        currentMorador={morador}
        onScanSuccess={(bike, lockPass) => {
          setSelectedBikeForLock(bike);
          setCurrentLockPassword(lockPass);
          setIsLockModalOpen(true);
        }}
        onScanError={(msg) => setAlertMessage({ type: 'error', text: msg })}
        onDirectCheckout={handleScanCheckout}
      />

      <BikeLockModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        bike={selectedBikeForLock}
        lockPassword={currentLockPassword}
      />

      <BikeReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setBikeForReturn(null);
        }}
        bike={bikeForReturn}
        currentMorador={morador}
        onSubmitReturn={handleReturnSubmit}
      />
    </div>
  );
};
