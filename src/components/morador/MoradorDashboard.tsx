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
  Shield,
  Video,
  Camera,
  DollarSign,
  Receipt,
  CreditCard,
  MessageSquare,
  Vote,
  ThumbsUp,
  MessageCircle,
  Send,
  Plus,
  Trash2,
  X,
  Share2,
  Download,
  Search,
  ExternalLink,
  Users,
  Car,
  Dog,
  Eye,
  ArrowRight,
  TrendingUp,
  PieChart,
  RefreshCw,
  BellRing,
  KeyRound,
  Radio,
  Mic,
  PhoneCall,
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
  VisitanteLiberado,
  CameraAreaComum,
  Ocorrencia,
  BoletoMensalidade,
  ItemExtratoFinanceiro,
  MuralPost,
  EnqueteCondominio,
  SugestaoMorador,
  DocumentoCondominio,
} from '../../types';
import { condoStore } from '../../services/mockStorage';
import { QrScannerModal } from '../common/QrScannerModal';
import { BikeLockModal } from '../common/BikeLockModal';
import { BikeReturnModal } from '../common/BikeReturnModal';
import { BikeSelectionModal } from '../common/BikeSelectionModal';
import { ItensCompartilhadosView } from '../compartilhados/ItensCompartilhadosView';
import { SmartPassModal } from '../common/SmartPassModal';
import { SmartOcorrenciaModal } from '../common/SmartOcorrenciaModal';
import { SmartMuralView } from '../common/SmartMuralView';
import { ScrollableTabsNav } from '../common/ScrollableTabsNav';
import { IntercomPTTView } from '../interfone/IntercomPTTView';
import { Wrench, PhoneCall } from 'lucide-react';
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
  // Navigation Tabs (Todos os módulos do SmartCondo)
  const [activeTab, setActiveTab] = useState<
    | 'inicio'
    | 'bicicletario'
    | 'equipamentos'
    | 'lazer'
    | 'seguranca'
    | 'interfone'
    | 'encomendas'
    | 'ocorrencias'
    | 'financeiro'
    | 'mural'
    | 'documentos'
    | 'unidade'
  >('inicio');

  // Modais do Bicicletário
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedBikeForLock, setSelectedBikeForLock] = useState<Bicicleta | null>(null);
  const [selectedBikeForManualModal, setSelectedBikeForManualModal] = useState<Bicicleta | null>(null);
  const [currentLockPassword, setCurrentLockPassword] = useState('');
  const [bikeForReturn, setBikeForReturn] = useState<Bicicleta | null>(null);

  // Mensagens e Alertas
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success' | 'warning'; text: string } | null>(null);

  // State: Reserva de Áreas de Lazer
  const [reservaAreaId, setReservaAreaId] = useState('');
  const [reservaData, setReservaData] = useState('');
  const [reservaPeriodo, setReservaPeriodo] = useState<'manha' | 'tarde' | 'noite' | 'dia_inteiro'>('noite');
  const [reservaTermoAceito, setReservaTermoAceito] = useState(false);
  const [reservaObs, setReservaObs] = useState('');

  // State: Novo Visitante
  const [isNovoVisitanteModalOpen, setIsNovoVisitanteModalOpen] = useState(false);
  const [visNome, setVisNome] = useState('');
  const [visDoc, setVisDoc] = useState('');
  const [visPlaca, setVisPlaca] = useState('');
  const [visTipo, setVisTipo] = useState<'visitante' | 'prestador' | 'entrega'>('visitante');
  const [visEmpresa, setVisEmpresa] = useState('');
  const [visData, setVisData] = useState(new Date().toISOString().split('T')[0]);
  const [visPeriodo, setVisPeriodo] = useState('Dia Inteiro');
  const [visObs, setVisObs] = useState('');
  const [visitanteCriadoRecente, setVisitanteCriadoRecente] = useState<VisitanteLiberado | null>(null);

  // State: Nova Ocorrência
  const [isNovaOcorrenciaModalOpen, setIsNovaOcorrenciaModalOpen] = useState(false);
  const [ocorrTitulo, setOcorrTitulo] = useState('');
  const [ocorrDescricao, setOcorrDescricao] = useState('');
  const [ocorrCategoria, setOcorrCategoria] = useState<Ocorrencia['categoria']>('manutencao');
  const [ocorrPrioridade, setOcorrPrioridade] = useState<Ocorrencia['prioridade']>('media');

  // State: Novo Post no Mural
  const [isNovoPostModalOpen, setIsNovoPostModalOpen] = useState(false);
  const [postTipo, setPostTipo] = useState<MuralPost['tipo']>('troca_venda');
  const [postTitulo, setPostTitulo] = useState('');
  const [postConteudo, setPostConteudo] = useState('');
  const [postValor, setPostValor] = useState('');
  const [postContato, setPostContato] = useState(morador.telefone);
  const [comentarioTexto, setComentarioTexto] = useState<{ [postId: string]: string }>({});

  // State: Nova Sugestão
  const [isNovaSugestaoModalOpen, setIsNovaSugestaoModalOpen] = useState(false);
  const [sugTitulo, setSugTitulo] = useState('');
  const [sugMensagem, setSugMensagem] = useState('');

  // Estado das Câmeras selecionadas para tela cheia / visualização
  const [cameraAtiva, setCameraAtiva] = useState<CameraAreaComum | null>(null);

  // Filtro de avisos
  const [filtroAvisoCat, setFiltroAvisoCat] = useState<string>('todos');

  // Copiado feedback
  const [copiadoKey, setCopiadoKey] = useState<string | null>(null);

  // Modal de Foto da Encomenda / Selo em Alta Resolução
  const [modalFotoEncomenda, setModalFotoEncomenda] = useState<{ url: string; titulo: string; rastreio?: string } | null>(null);

  // Dados reativos carregados do store
  const visitantes = condoStore.getVisitantes(condominio.id, morador.id);
  const cameras = condoStore.getCameras(condominio.id);
  const ocorrencias = condoStore.getOcorrencias(condominio.id, morador.id);
  const boletos = condoStore.getBoletos(condominio.id, morador.id);
  const extrato = condoStore.getExtratoFinanceiro(condominio.id);
  const muralPosts = condoStore.getMuralPosts(condominio.id);
  const enquetes = condoStore.getEnquetes(condominio.id);
  const sugestoes = condoStore.getSugestoes(condominio.id);
  const documentos = condoStore.getDocumentos(condominio.id);

  // --------------------------------------------------------------------------
  // TIMER DE 5 MINUTOS DA RESERVA DE BICICLETA (NOVOLAR)
  // --------------------------------------------------------------------------
  // Localiza se o morador possui uma bicicleta reservada no momento
  const bikeReservadaMorador = bikes.find(
    (b) => b.status === 'reservada_5min' && b.reservaMoradorId === morador.id
  );

  // Localiza se o morador possui uma bicicleta atualmente em andamento (em uso)
  const activeBikeInUse = bikes.find(
    (b) => b.status === 'em_uso' && b.usuarioAtualId === morador.id
  );

  // Contagem regressiva em segundos do prazo de 5 minutos (300 segundos)
  const [segundosRestantes5Min, setSegundosRestantes5Min] = useState<number>(300);

  useEffect(() => {
    if (!bikeReservadaMorador || !bikeReservadaMorador.reserva5minTimestamp) {
      setSegundosRestantes5Min(300);
      return;
    }

    const updateCountdown = () => {
      const LIMITE_MS = 5 * 60 * 1000;
      const decorrido = Date.now() - bikeReservadaMorador.reserva5minTimestamp!;
      const restanteMs = Math.max(0, LIMITE_MS - decorrido);
      const segRestantes = Math.ceil(restanteMs / 1000);
      setSegundosRestantes5Min(segRestantes);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [bikeReservadaMorador]);

  // Formata MM:SS
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Timer para passeio em andamento (em minutos)
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

  // Ações do Bicicletário
  const handleReservar5Min = (bikeId: string) => {
    const res = condoStore.reservarBike5Min(condominio.id, bikeId, morador.id);
    if (res.success) {
      setAlertMessage({ type: 'success', text: res.message });
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } else {
      setAlertMessage({ type: 'error', text: res.message });
    }
  };

  const handleCancelarReserva5Min = (bikeId: string) => {
    const res = condoStore.cancelarReserva5Min(condominio.id, bikeId, 'Reserva cancelada voluntariamente pelo morador.');
    if (res.success) {
      setAlertMessage({ type: 'warning', text: res.message });
    } else {
      setAlertMessage({ type: 'error', text: res.message });
    }
  };

  const handleConfirmarRetirada = (bike: Bicicleta) => {
    const res = condoStore.confirmarRetiradaPortaria(condominio.id, bike.id, 'Morador via App');
    if (res.success && res.bike) {
      setSelectedBikeForLock(res.bike);
      setCurrentLockPassword(res.lockPassword || res.bike.lockPassword);
      setIsLockModalOpen(true);
      setAlertMessage({ type: 'success', text: res.message });
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
    } else {
      setAlertMessage({ type: 'error', text: res.message });
    }
  };

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
    fotoVistoriaDevolucaoUrl?: string;
    detalhesDefeito?: string;
  }) => {
    if (!bikeForReturn) return;
    const result = condoStore.checkinBike(condominio.id, bikeForReturn.id, morador.id, {
      ...data,
      vistoriaOperador: `${morador.nome} (Autoatendimento)`,
    });
    setIsReturnModalOpen(false);
    setBikeForReturn(null);
    setAlertMessage({
      type: result.emManutencao ? 'warning' : 'success',
      text: result.message,
    });
  };

  // Criação de Reserva de Lazer
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

  // Criação de Visitante
  const handleCriarVisitante = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visNome.trim()) {
      setAlertMessage({ type: 'error', text: 'Informe o nome do visitante ou prestador.' });
      return;
    }

    try {
      const novo = condoStore.addVisitante(condominio.id, {
        moradorId: morador.id,
        nomeVisitante: visNome.trim(),
        documento: visDoc.trim(),
        placaVeiculo: visPlaca.trim(),
        tipo: visTipo,
        empresa: visEmpresa.trim(),
        dataVisita: visData,
        periodoPermitido: visPeriodo,
        observacoes: visObs.trim(),
      });

      setVisitanteCriadoRecente(novo);
      setVisNome('');
      setVisDoc('');
      setVisPlaca('');
      setVisEmpresa('');
      setVisObs('');
      setAlertMessage({ type: 'success', text: `Autorização para ${novo.nomeVisitante} gerada com sucesso!` });
      confetti({ particleCount: 60, spread: 70 });
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Erro ao criar autorização.' });
    }
  };

  // Criação de Ocorrência
  const handleCriarOcorrencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ocorrTitulo.trim() || !ocorrDescricao.trim()) {
      setAlertMessage({ type: 'error', text: 'Preencha o título e o relato da ocorrência.' });
      return;
    }

    try {
      condoStore.addOcorrencia(condominio.id, {
        moradorId: morador.id,
        titulo: ocorrTitulo.trim(),
        descricao: ocorrDescricao.trim(),
        categoria: ocorrCategoria,
        prioridade: ocorrPrioridade,
      });

      setIsNovaOcorrenciaModalOpen(false);
      setOcorrTitulo('');
      setOcorrDescricao('');
      setAlertMessage({ type: 'success', text: 'Ocorrência enviada à administração e registrada com sucesso!' });
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Erro ao registrar ocorrência.' });
    }
  };

  // Criação de Post no Mural
  const handleCriarPostMural = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitulo.trim() || !postConteudo.trim()) {
      setAlertMessage({ type: 'error', text: 'Preencha o título e o conteúdo do anúncio.' });
      return;
    }

    try {
      condoStore.addMuralPost(condominio.id, {
        autorId: morador.id,
        tipo: postTipo,
        titulo: postTitulo.trim(),
        conteudo: postConteudo.trim(),
        valor: postValor ? parseFloat(postValor) : undefined,
        contatoTelefone: postContato.trim(),
      });

      setIsNovoPostModalOpen(false);
      setPostTitulo('');
      setPostConteudo('');
      setPostValor('');
      setAlertMessage({ type: 'success', text: 'Publicação realizada no mural da comunidade!' });
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      setAlertMessage({ type: 'error', text: err.message || 'Erro ao publicar no mural.' });
    }
  };

  // Comentar no Mural
  const handleComentarPost = (postId: string) => {
    const texto = comentarioTexto[postId];
    if (!texto || !texto.trim()) return;

    condoStore.addComentarioMural(condominio.id, postId, {
      autorNome: morador.nome,
      autorUnidade: `Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}`,
      texto: texto.trim(),
    });

    setComentarioTexto((prev) => ({ ...prev, [postId]: '' }));
  };

  // Votar em Enquete
  const handleVotarEnquete = (enqueteId: string, opcaoId: string) => {
    const res = condoStore.votarEnquete(condominio.id, enqueteId, opcaoId, morador.id);
    if (res) {
      setAlertMessage({ type: 'success', text: 'Voto computado com sucesso na enquete!' });
      confetti({ particleCount: 40, spread: 50 });
    }
  };

  // Enviar Sugestão
  const handleEnviarSugestao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sugTitulo.trim() || !sugMensagem.trim()) return;

    condoStore.addSugestao(condominio.id, {
      moradorId: morador.id,
      titulo: sugTitulo.trim(),
      mensagem: sugMensagem.trim(),
    });

    setIsNovaSugestaoModalOpen(false);
    setSugTitulo('');
    setSugMensagem('');
    setAlertMessage({ type: 'success', text: 'Sua sugestão foi enviada diretamente ao síndico!' });
  };

  // Copiar para clipboard
  const handleCopiarTexto = (texto: string, key: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoKey(key);
    setTimeout(() => setCopiadoKey(null), 2500);
  };

  // Totais e contadores seguros contra valores nulos (Encomendas entregues visíveis por até 5 dias para o morador)
  const cincoDiasMs = 5 * 24 * 60 * 60 * 1000;
  const agoraTimestamp = Date.now();
  const safeEncomendas = (Array.isArray(encomendas) ? encomendas.filter(Boolean) : []).filter((e) => {
    if (e.status !== 'entregue') return true; // Sempre exibe pendentes/na portaria/na administração
    const dataRef = e.entregueEm || e.recebidoEm || 0;
    return agoraTimestamp - dataRef <= cincoDiasMs; // Entregues nos últimos 5 dias
  });
  const pendingPackages = safeEncomendas.filter((e) => e && (e.status === 'na_portaria' || e.status === 'encaminhada_administracao'));
  const deliveredPackages = safeEncomendas.filter((e) => e && e.status === 'entregue');
  const myReservations = (reservas || []).filter((r) => r && r.moradorId === morador?.id);
  const availableBikesCount = (bikes || []).filter((b) => b && b.status === 'disponivel').length;
  const inUseBikesCount = (bikes || []).filter((b) => b && b.status === 'em_uso').length;
  const avisoDestaque = (avisos || []).find((a) => a && a.prioritario) || (avisos || [])[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Alerta de Feedback Superior */}
      {alertMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-sm shadow-sm border transition-all ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : alertMessage.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-3">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : alertMessage.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-xs font-bold underline hover:opacity-75 ml-4"
          >
            Fechar
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* DESTAQUE PRINCIPAL: CONTADOR DE 5 MINUTOS DA RESERVA DE BIKE        */}
      {/* ==================================================================== */}
      {bikeReservadaMorador && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/20 border border-amber-300 relative overflow-hidden animate-pulse-slow">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  Reserva em Andamento • Prazo de 5 Minutos
                </span>
                <span className="bg-amber-900/40 text-amber-100 text-xs font-bold px-2.5 py-1 rounded-full">
                  Totem Portaria
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Bike #{bikeReservadaMorador.codigo} — {bikeReservadaMorador.modelo}
              </h2>
              <p className="text-sm text-amber-100 font-medium max-w-xl">
                Apresente o código na portaria ou digite no totem para destravar. Se não for retirada em 5 minutos, a reserva será liberada automaticamente para outro morador.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="bg-white text-slate-900 px-3.5 py-1.5 rounded-xl font-black text-sm shadow-sm flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  Código de Retirada: <span className="text-amber-700 tracking-wider font-mono">{bikeReservadaMorador.reservaCodigo || 'BK-5MIN'}</span>
                </div>
                <div className="bg-white/15 backdrop-blur-md text-white px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-200" />
                  Senha do Cadeado: {bikeReservadaMorador.lockPassword}
                </div>
              </div>
            </div>

            {/* Contador Regressivo Gigante */}
            <div className="flex flex-col items-center justify-center bg-white text-slate-900 p-5 rounded-2xl shadow-lg shrink-0 w-full sm:w-auto min-w-[220px]">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                Tempo Restante
              </span>
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-amber-600">
                {formatCountdown(segundosRestantes5Min)}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-full transition-all duration-1000"
                  style={{ width: `${Math.max(0, Math.min(100, (segundosRestantes5Min / 300) * 100))}%` }}
                ></div>
              </div>
              <div className="flex items-center gap-2 mt-4 w-full">
                <button
                  onClick={() => handleConfirmarRetirada(bikeReservadaMorador)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition shadow"
                >
                  Destravar Cadeado
                </button>
                <button
                  onClick={() => handleCancelarReserva5Min(bikeReservadaMorador.id)}
                  className="bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs py-2 px-3 rounded-xl transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* BANNER DE PASSEIO ATIVO (EM USO)                                     */}
      {/* ==================================================================== */}
      {activeBikeInUse && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-600/20 border border-emerald-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-inner">
              <Bike className="w-8 h-8 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white text-emerald-900 px-2.5 py-0.5 rounded-full">
                  Pedalada em Andamento
                </span>
                <span className="text-sm font-bold text-emerald-100">
                  Bike #{activeBikeInUse.codigo}
                </span>
              </div>
              <h3 className="text-xl font-black mt-1">
                {activeBikeInUse.modelo} ({activeBikeInUse.tipo})
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100 mt-1">
                <span className="flex items-center gap-1.5 font-bold bg-emerald-800/60 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-emerald-300" />
                  Tempo de Uso: ~{elapsedMinutes} min (Limite: {condominio.regras.limiteTempoBikeMinutos} min)
                </span>
                <span className="flex items-center gap-1.5 font-bold bg-white text-slate-900 px-2.5 py-1 rounded-lg">
                  <LockOpen className="w-3.5 h-3.5 text-emerald-600" />
                  Cadeado: {activeBikeInUse.lockPassword}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setBikeForReturn(activeBikeInUse);
              setIsReturnModalOpen(true);
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-emerald-900 font-extrabold text-sm shadow-lg transition active:scale-98"
          >
            Finalizar Viagem & Devolver
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CABEÇALHO DO MORADOR COM DADOS DA UNIDADE                            */}
      {/* ==================================================================== */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center font-black text-xl shadow-sm">
            {morador.nome.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Morador Ativo
              </span>
              <span className="text-xs text-slate-500 font-medium">{condominio.nome}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Olá, {morador.nome}
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Unidade: <strong className="text-slate-900">Bloco {morador.unidade.bloco}</strong> • Apartamento{' '}
              <strong className="text-slate-900">{morador.unidade.apto}</strong>
            </p>
          </div>
        </div>

        {/* Botão de Interfone PTT e Contato com Portaria */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            id="btn-header-ligar-portaria-ao-vivo"
            type="button"
            onClick={() => {
              condoStore.iniciarChamada({
                condominioId: condominio.id,
                callerId: morador.id,
                callerName: morador.nome,
                callerRole: 'morador',
                callerUnidade: morador.unidade,
                receiverId: 'portaria',
                receiverName: 'Portaria Central 24h',
                receiverRole: 'portaria',
                tipo: 'audio',
              });
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition active:scale-98 cursor-pointer"
          >
            <PhoneCall className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>📞 Ligar Portaria (Ao Vivo)</span>
          </button>

          <button
            id="btn-header-interfone-morador"
            type="button"
            onClick={() => setActiveTab('interfone')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition active:scale-98 cursor-pointer"
          >
            <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
            <span>📻 Interfone & PTT</span>
          </button>

          <a
            href={`https://api.whatsapp.com/send?phone=5521999999999&text=Ol%C3%A1%20Portaria,%20aqui%20%C3%A9%20o%20morador%20${encodeURIComponent(
              morador.nome
            )}%20do%20Bloco%20${morador.unidade.bloco}%20Apto%20${morador.unidade.apto}.`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs transition"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Portaria</span>
          </a>

          {!activeBikeInUse && !bikeReservadaMorador && (
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-md transition active:scale-98"
            >
              <QrCode className="w-4 h-4" />
              <span>Escanear Totem</span>
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BARRA DE NAVEGAÇÃO ENTRE OS MÓDULOS (SCROLL HORIZONTAL RESPONSIVO)  */}
      {/* ==================================================================== */}
      <ScrollableTabsNav>
        <button
          onClick={() => setActiveTab('inicio')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'inicio'
              ? 'bg-slate-900 text-white shadow'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Início</span>
        </button>

        <button
          onClick={() => setActiveTab('bicicletario')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'bicicletario'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Bicicletas (5 min)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeTab === 'bicicletario'
                ? 'bg-emerald-800 text-emerald-100'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {availableBikesCount} livres
          </span>
        </button>

        <button
          id="tab-morador-equipamentos"
          onClick={() => setActiveTab('equipamentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'equipamentos'
              ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
              : 'text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200'
          }`}
        >
          <Wrench className="w-4 h-4 text-teal-700" />
          <span>Itens & Equipamentos</span>
        </button>

        <button
          onClick={() => setActiveTab('lazer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'lazer'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Reservas & Lazer</span>
          {myReservations.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-black bg-white text-emerald-800">
              {myReservations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('seguranca')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'seguranca'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Visitantes & Convidados</span>
        </button>

        <button
          id="tab-morador-interfone"
          onClick={() => setActiveTab('interfone')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'interfone'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <PhoneCall className="w-4 h-4 text-indigo-600" />
          <span>📞 Interfone / Portaria PTT</span>
        </button>

        <button
          onClick={() => setActiveTab('encomendas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'encomendas'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Encomendas</span>
          {pendingPackages.length > 0 && (
            <span className="text-[10px] bg-amber-500 text-white font-black px-2 py-0.5 rounded-full animate-bounce">
              {pendingPackages.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ocorrencias')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'ocorrencias'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Ocorrências</span>
        </button>

        <button
          onClick={() => setActiveTab('financeiro')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'financeiro'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financeiro</span>
        </button>

        <button
          onClick={() => setActiveTab('mural')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'mural'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Comunidade</span>
        </button>

        <button
          onClick={() => setActiveTab('documentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'documentos'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documentos</span>
        </button>
      </ScrollableTabsNav>

      {/* ==================================================================== */}
      {/* MÓDULO 1: TELA INICIAL (DASHBOARD EXECUTIVO DO MORADOR)              */}
      {/* ==================================================================== */}
      {activeTab === 'inicio' && (
        <div className="space-y-6">
          {/* Banner Interfone & Walkie-Talkie Digital */}
          <div
            onClick={() => setActiveTab('interfone')}
            className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:border-amber-400/60 transition group"
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20 shrink-0 group-hover:scale-105 transition">
                <Radio className="w-6 h-6 animate-pulse text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                    Interfonia Digital (PTT)
                  </span>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Portaria 24h & Vizinhos Online
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">
                  Interfone & Walkie-Talkie em Tempo Real
                </h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Fale com a Portaria ou interfone para outro morador/vizinho direto pelo aplicativo.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('interfone');
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition shrink-0 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <Mic className="w-4 h-4" />
              <span>Abrir Interfone & Falar</span>
            </button>
          </div>

          {/* Card de Aviso Destaque (Aviso mais importante do dia) */}
          {avisoDestaque && (
            <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md">
                      Aviso Destaque
                    </span>
                    <span className="text-xs text-slate-400">Publicado por {avisoDestaque.autor}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    {avisoDestaque.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 mt-0.5">
                    {avisoDestaque.mensagem}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('mural')}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0"
              >
                Ver todos avisos <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Cards Rápidos de Acesso em 1 Clique */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Bicicletas Compartilhadas (Novolar) */}
            <div
              onClick={() => setActiveTab('bicicletario')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition">
                  <Bike className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {availableBikesCount} livres
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition">
                Bicicletas (5 min)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Reserve em 1 clique com tolerância de 5 min para retirada no totem.
              </p>
            </div>

            {/* 2. Contador de Entregas */}
            <div
              onClick={() => setActiveTab('encomendas')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-500 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition">
                  <Package className="w-5 h-5" />
                </div>
                {pendingPackages.length > 0 ? (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                    {pendingPackages.length} na portaria
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Tudo entregue
                  </span>
                )}
              </div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-700 transition">
                {pendingPackages.length > 0
                  ? `Você tem ${pendingPackages.length} pacote${pendingPackages.length > 1 ? 's' : ''} esperando!`
                  : 'Minhas Encomendas'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {pendingPackages.length > 0
                  ? 'Veja o código PIN de 6 dígitos para retirada na portaria.'
                  : 'Histórico de entregas e notificações em tempo real.'}
              </p>
            </div>

            {/* 3. Reservas de Áreas Comuns */}
            <div
              onClick={() => setActiveTab('lazer')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {areasLazer.length} espaços
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-700 transition">
                Áreas de Lazer
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Churrasqueira, Salão de Festas, Quadra e Piscina com confirmação imediata.
              </p>
            </div>

            {/* 4. Ocorrências e Problemas */}
            <div
              onClick={() => setActiveTab('ocorrencias')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-rose-500 hover:shadow-md transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-110 transition">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  {ocorrencias.length} chamados
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 group-hover:text-rose-700 transition">
                Ocorrências
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Registre reparos, barulho ou limpeza com fotos e acompanhe a resposta do síndico.
              </p>
            </div>
          </div>

          {/* Seção Secundária: Câmeras ao Vivo & Boleto Rápido */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Boleto Condominial Rápido */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900">Boleto Condominial</h3>
                </div>
                <span className="text-xs font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Em Dia
                </span>
              </div>

              {boletos[0] ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Mês Referência:</span>
                    <strong className="text-slate-900">{boletos[0].mesReferencia}</strong>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Vencimento:</span>
                    <strong className="text-slate-900">{boletos[0].dataVencimento}</strong>
                  </div>
                  <div className="flex justify-between items-center text-base pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-700">Valor Total:</span>
                    <strong className="text-emerald-700 text-lg font-black">
                      R$ {boletos[0].valor.toFixed(2)}
                    </strong>
                  </div>

                  {boletos[0].pixCopiaCola && (
                    <button
                      onClick={() => handleCopiarTexto(boletos[0].pixCopiaCola!, 'pix_home')}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiadoKey === 'pix_home' ? 'Código PIX Copiado!' : 'Copiar Chave PIX'}</span>
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Nenhum boleto pendente.</p>
              )}
            </div>

            {/* Visitantes e Convidados Rápidos */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-slate-900">Visitantes & Prestadores Autorizados</h3>
                </div>
                <button
                  onClick={() => setIsNovoVisitanteModalOpen(true)}
                  className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Liberar Novo</span>
                </button>
              </div>

              {visitantes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {visitantes.slice(0, 2).map((vis) => (
                    <div
                      key={vis.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {vis.tipo}
                        </span>
                        <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                          {vis.codigoAcesso}
                        </span>
                      </div>
                      <div className="font-extrabold text-slate-900 text-xs">{vis.nomeVisitante}</div>
                      <div className="text-[10px] text-slate-500">
                        {vis.dataVisita} • {vis.periodoPermitido}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-500">Nenhum visitante liberado hoje.</p>
                  <button
                    onClick={() => setIsNovoVisitanteModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Liberar Visita / Prestador</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MÓDULO 4.1: BICICLETÁRIO COMPARTILHADO (NOVOLAR - PRIORIDADE MÁXIMA)  */}
      {/* ==================================================================== */}
      {activeTab === 'bicicletario' && (
        <div className="space-y-6">
          {/* Informações das Regras de Retirada */}
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-950">
                  Mobilidade & Bicicletas Compartilhadas Novolar
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  ⏱️ <strong>Retirada com Senha da Portaria / Síndico:</strong> Selecione e marque a bicicleta desejada. O porteiro ou síndico fornecerá a senha do cadeado para você destravar e aproveitar o passeio.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  const bikeDisponivel = bikes.find((b) => b.status === 'disponivel');
                  if (bikeDisponivel) {
                    setSelectedBikeForManualModal(bikeDisponivel);
                  } else {
                    setAlertMessage({ type: 'warning', text: 'Nenhuma bicicleta disponível no totem no momento.' });
                  }
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Marcar Bike & Pegar Senha</span>
              </button>

              <button
                onClick={() => setIsQrModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold text-xs transition whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer"
                title="Desbloqueio alternativo via QR Code"
              >
                <QrCode className="w-4 h-4 text-emerald-800" />
                <span className="hidden md:inline">Ler QR Code</span>
              </button>
            </div>
          </div>

          {/* Grid de Bicicletas do Condomínio */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {bikes.map((bike) => {
              const isReservedByMe =
                bike.status === 'reservada_5min' && bike.reservaMoradorId === morador.id;
              const isUsedByMe =
                bike.status === 'em_uso' && bike.usuarioAtualId === morador.id;

              return (
                <div
                  key={bike.id}
                  className={`bg-white rounded-3xl border transition shadow-sm overflow-hidden flex flex-col justify-between ${
                    isReservedByMe
                      ? 'border-amber-400 ring-2 ring-amber-400'
                      : isUsedByMe
                      ? 'border-emerald-500 ring-2 ring-emerald-500'
                      : bike.status === 'disponivel'
                      ? 'border-slate-200 hover:border-emerald-400 hover:shadow-md'
                      : 'border-slate-200 opacity-90'
                  }`}
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-3 py-1 rounded-xl bg-slate-900 text-white">
                        Bike #{bike.codigo}
                      </span>

                      {bike.status === 'disponivel' ? (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Disponível
                        </span>
                      ) : bike.status === 'reservada_5min' ? (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {isReservedByMe ? 'Sua Reserva (5min)' : 'Reservada'}
                        </span>
                      ) : bike.status === 'em_uso' ? (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {isUsedByMe ? 'Com Você' : 'Em Uso'}
                        </span>
                      ) : (
                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          Manutenção
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-lg font-extrabold text-slate-900">{bike.modelo}</h4>
                      <p className="text-xs text-slate-500 font-medium capitalize">
                        Categoria: {bike.tipo}
                      </p>
                    </div>

                    {/* Detalhes de Bateria se for E-Bike */}
                    {bike.tipo === 'e-bike' && bike.nivelBateria !== undefined && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <BatteryCharging className="w-4 h-4 text-emerald-600" />
                        <span>Bateria Elétrica: {bike.nivelBateria}%</span>
                      </div>
                    )}

                    {/* Localização Atual */}
                    <div className="text-xs text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{bike.localizacaoAtual || 'Totem Central Novolar'}</span>
                    </div>

                    {/* Status da Reserva / Uso */}
                    {bike.status === 'reservada_5min' && (
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>Aguardando Retirada:</span>
                          <span className="font-mono font-black text-amber-700">
                            {isReservedByMe ? formatCountdown(segundosRestantes5Min) : '5 min máx'}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800">
                          {isReservedByMe
                            ? `Apresente o código ${bike.reservaCodigo || 'BK-5MIN'} na portaria para liberar.`
                            : `Reservada por morador do ${bike.reservaMoradorUnidade || 'condomínio'}.`}
                        </p>
                      </div>
                    )}

                    {bike.status === 'em_uso' && (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                        <span>Em trânsito com morador ({bike.usuarioAtualUnidade || 'Residente'}).</span>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação do Card */}
                  <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex items-center gap-2">
                    {bike.status === 'disponivel' && !activeBikeInUse && !bikeReservadaMorador && (
                      <button
                        onClick={() => setSelectedBikeForManualModal(bike)}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Marcar & Retirar Bike</span>
                      </button>
                    )}

                    {isReservedByMe && (
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => setSelectedBikeForManualModal(bike)}
                          className="flex-1 py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <LockOpen className="w-3.5 h-3.5" />
                          <span>Digitar Senha / Destravar</span>
                        </button>
                        <button
                          onClick={() => handleCancelarReserva5Min(bike.id)}
                          className="py-2.5 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}

                    {isUsedByMe && (
                      <button
                        onClick={() => {
                          setBikeForReturn(bike);
                          setIsReturnModalOpen(true);
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow transition cursor-pointer"
                      >
                        Devolver com Vistoria Fotográfica
                      </button>
                    )}

                    {bike.status === 'manutencao' && (
                      <span className="w-full text-center text-xs font-semibold text-rose-600 py-1">
                        Indisponível (Em Revisão Técnica)
                      </span>
                    )}

                    {bike.status !== 'disponivel' && !isReservedByMe && !isUsedByMe && bike.status !== 'manutencao' && (
                      <span className="w-full text-center text-xs font-semibold text-slate-500 py-1">
                        Indisponível no momento
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Histórico Recente de Locações do Morador */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Seu Histórico de Viagens & Vistorias</span>
            </h3>

            {historicoLocacoes.filter((h) => h.moradorId === morador.id).length > 0 ? (
              <div className="divide-y divide-slate-100">
                {historicoLocacoes
                  .filter((h) => h.moradorId === morador.id)
                  .map((hist) => (
                    <div key={hist.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3">
                        {hist.fotoVistoriaDevolucaoUrl && (
                          <img
                            src={hist.fotoVistoriaDevolucaoUrl}
                            alt="Vistoria"
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900 font-extrabold text-sm">
                              Bike #{hist.bikeCodigo}
                            </strong>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                hist.vistoriaStatus === 'com_defeito'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {hist.vistoriaStatus === 'com_defeito' ? '⚠️ Avaria Registrada' : '✓ 100% Aprovada'}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Retirada: {new Date(hist.retiradaEm).toLocaleString('pt-BR')} • {hist.localDevolucao || 'Totem Principal'}
                          </p>
                          {hist.detalhesDefeito && (
                            <p className="text-rose-700 text-[11px] font-bold mt-1">
                              Nota de vistoria: {hist.detalhesDefeito}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-[11px]">
                          Devolvida no Totem
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Nenhuma viagem registrada ainda.</p>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MÓDULO: ITENS E EQUIPAMENTOS COMPARTILHADOS (REGRAS A CUSTO ZERO)    */}
      {/* ==================================================================== */}
      {activeTab === 'equipamentos' && (
        <ItensCompartilhadosView
          condominio={condominio}
          moradorAtual={morador}
          isStaff={false}
        />
      )}

      {/* ==================================================================== */}
      {/* MÓDULO 4.2: RESERVAS DE ÁREAS COMUNS (CHURRASQUEIRA, SALÃO, ETC.)   */}
      {/* ==================================================================== */}
      {activeTab === 'lazer' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário de Reserva Rápida */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>Nova Reserva de Espaço</span>
              </h3>

              <form onSubmit={handleCreateReserva} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Espaço Desejado
                  </label>
                  <select
                    value={reservaAreaId}
                    onChange={(e) => setReservaAreaId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  >
                    <option value="">Selecione uma área...</option>
                    {areasLazer
                      .filter((a) => a.permiteReserva)
                      .map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.nome} {area.taxaReserva > 0 ? `(Taxa: R$ ${area.taxaReserva})` : '(Gratuito)'}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data da Reserva
                  </label>
                  <input
                    type="date"
                    value={reservaData}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setReservaData(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Turno / Horário</label>
                  <select
                    value={reservaPeriodo}
                    onChange={(e: any) => setReservaPeriodo(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="manha">Manhã (08:00 às 13:00)</option>
                    <option value="tarde">Tarde (13:00 às 18:00)</option>
                    <option value="noite">Noite (18:00 às 23:00)</option>
                    <option value="dia_inteiro">Dia Inteiro (09:00 às 22:00)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observações (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Aniversário em família"
                    value={reservaObs}
                    onChange={(e) => setReservaObs(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="termoReserva"
                    checked={reservaTermoAceito}
                    onChange={(e) => setReservaTermoAceito(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    required
                  />
                  <label htmlFor="termoReserva" className="text-[11px] text-slate-600">
                    Li e concordo com o regulamento de limpeza e silêncio.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition active:scale-98"
                >
                  Confirmar Reserva
                </button>
              </form>
            </div>

            {/* Lista das Áreas Comuns do Condomínio */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">
                Espaços Disponíveis no Condomínio
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {areasLazer.map((area) => (
                  <div key={area.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {area.tipo.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        Capacidade: {area.capacidade} pessoas
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900">{area.nome}</h4>
                    <p className="text-xs text-slate-600">{area.aviso || 'Espaço equipado e climatizado.'}</p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>Horário: {area.horarioFuncionamento}</span>
                      <strong className="text-emerald-700 font-black">
                        {area.taxaReserva > 0 ? `Taxa: R$ ${area.taxaReserva}` : 'Gratuito'}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* Minhas Reservas Agendadas */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 mt-6">
                <h4 className="font-extrabold text-slate-900 text-sm">Suas Próximas Reservas</h4>
                {myReservations.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {myReservations.map((res) => (
                      <div key={res.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-900">{res.espaco}</strong>
                          <p className="text-slate-500">
                            Data: {res.data} • Turno: {res.periodo}
                          </p>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                          Confirmada
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Você não possui reservas agendadas.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MÓDULO 3: VISITANTES, PRESTADORES E CONVIDADOS                      */}
      {/* ==================================================================== */}
      {activeTab === 'seguranca' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Visitantes & Convidados</h3>
              <p className="text-xs text-slate-500">Libere visitas com QR Code e acompanhe a entrada e saída de prestadores e convidados.</p>
            </div>

            <button
              onClick={() => setIsNovoVisitanteModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Liberar Visitante / Prestador</span>
            </button>
          </div>

          {/* Lista de Visitantes e Prestadores Autorizados */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Autorizações de Acesso Criadas</span>
            </h4>

            {visitantes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visitantes.map((vis) => (
                  <div
                    key={vis.id}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        {vis.tipo}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          vis.status === 'pendente'
                            ? 'bg-amber-100 text-amber-900'
                            : vis.status === 'dentro'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {vis.status === 'pendente'
                          ? 'Aguardando Chegada'
                          : vis.status === 'dentro'
                          ? 'No Condomínio'
                          : 'Finalizado'}
                      </span>
                    </div>

                    <div>
                      <h5 className="font-extrabold text-slate-900 text-base">{vis.nomeVisitante}</h5>
                      {vis.empresa && <p className="text-xs text-slate-600 font-semibold">{vis.empresa}</p>}
                      <p className="text-xs text-slate-500 mt-1">
                        Data: <strong>{vis.dataVisita}</strong> • Período: {vis.periodoPermitido}
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Código Portaria</span>
                        <div className="font-mono font-black text-sm text-slate-900">{vis.codigoAcesso}</div>
                      </div>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Olá ${vis.nomeVisitante}! Seu acesso ao condomínio ${condominio.nome} foi liberado pela unidade Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}. Código de entrada: *${vis.codigoAcesso}*.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Enviar WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Nenhum visitante liberado no momento.</p>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MÓDULO INTERFONE & WALKIE-TALKIE PTT COM A PORTARIA (ESTILO ZELLO)  */}
      {/* ==================================================================== */}
      {activeTab === 'interfone' && (
        <IntercomPTTView
          condominio={condominio}
          currentUserRole="morador"
          currentMorador={morador}
          currentUserName={morador.nome}
        />
      )}

      {/* ==================================================================== */}
      {/* MÓDULO 5: OCORRÊNCIAS E PROBLEMAS                                   */}
      {/* ==================================================================== */}
      {activeTab === 'ocorrencias' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Ocorrências & Chamados</h3>
              <p className="text-xs text-slate-500">Abra chamados para a administração e acompanhe o status em tempo real.</p>
            </div>

            <button
              onClick={() => setIsNovaOcorrenciaModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Abrir Nova Ocorrência</span>
            </button>
          </div>

          <div className="space-y-4">
            {ocorrencias.length > 0 ? (
              ocorrencias.map((ocorr) => (
                <div
                  key={ocorr.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                        {ocorr.categoria}
                      </span>
                      <span className="text-xs text-slate-500">
                        Criado em {new Date(ocorr.criadoEm).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-black px-3 py-1 rounded-full uppercase ${
                        ocorr.status === 'resolvido'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ocorr.status === 'em_andamento'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ocorr.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-extrabold text-slate-900">{ocorr.titulo}</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">{ocorr.descricao}</p>
                  </div>

                  {ocorr.respostaSindico && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-emerald-900">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Resposta da Administração ({ocorr.respondidoPor || 'Síndico'}):</span>
                      </div>
                      <p className="text-emerald-800 font-medium">{ocorr.respostaSindico}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">Nenhum chamado aberto</h4>
                <p className="text-xs">Tudo tranquilo! Caso encontre qualquer problema no condomínio, abra uma ocorrência.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MÓDULO 6: FINANCEIRO E TRANSPARÊNCIA                                */}
      {/* ==================================================================== */}
      {activeTab === 'financeiro' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Financeiro & Transparência</h3>
            <p className="text-xs text-slate-500">2ª via de boletos com PIX Copia-e-Cola e prestação de contas mensal.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Boletos */}
            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-900 text-base">Boletos da Sua Unidade</h4>
              {boletos.map((bol) => (
                <div key={bol.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{bol.mesReferencia}</span>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                        bol.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {bol.status === 'pago' ? 'Quitado' : 'A Vencer'}
                    </span>
                  </div>

                  <div className="text-2xl font-black text-slate-900">
                    R$ {bol.valor.toFixed(2)}
                  </div>
                  <p className="text-xs text-slate-500">Vencimento: {bol.dataVencimento}</p>

                  {bol.status !== 'pago' && bol.pixCopiaCola && (
                    <button
                      onClick={() => handleCopiarTexto(bol.pixCopiaCola!, bol.id)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiadoKey === bol.id ? 'PIX Copiado!' : 'Pagar via PIX Copia e Cola'}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Balancete e Extrato Financeiro Transparente */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">Prestação de Contas</h4>
                  <p className="text-xs text-slate-500">Extrato discriminado das receitas e despesas das áreas comuns.</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Agosto / 2026
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {extrato.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-slate-900">{item.descricao}</strong>
                      <div className="text-slate-400 capitalize">
                        {item.categoria.replace('_', ' ')} • {item.data}
                      </div>
                    </div>

                    <strong
                      className={`text-sm font-black ${
                        item.tipo === 'receita' ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {item.tipo === 'receita' ? '+' : '-'} R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MÓDULO 7: COMUNIDADE, MURAL, ENQUETES E SUGESTÕES                  */}
      {/* ==================================================================== */}
      {activeTab === 'mural' && (
        <SmartMuralView condominio={condominio} moradorAtual={morador} />
      )}

      {/* ==================================================================== */}
      {/* MÓDULO 8: DOCUMENTOS E INFORMAÇÕES DO CONDOMÍNIO                     */}
      {/* ==================================================================== */}
      {activeTab === 'documentos' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Documentos Oficiais</h3>
            <p className="text-xs text-slate-500">Regulamentos, atas, convenções e laudos de vistoria para download e consulta.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentos.map((doc) => (
              <div key={doc.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {doc.categoria}
                    </span>
                    <span className="text-xs text-slate-400">{doc.tamanho}</span>
                  </div>

                  <h4 className="text-base font-extrabold text-slate-900">{doc.titulo}</h4>
                  <p className="text-xs text-slate-600">{doc.descricao}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Publicado: {doc.dataPublicacao}</span>
                  <a
                    href="#download"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Download simulado do arquivo PDF: ${doc.titulo}`);
                    }}
                    className="flex items-center gap-1.5 font-bold text-emerald-600 hover:underline"
                  >
                    <Download className="w-4 h-4" />
                    <span>Visualizar PDF</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MÓDULO 2: ENCOMENDAS & PACOTES                                       */}
      {/* ==================================================================== */}
      {activeTab === 'encomendas' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-6 h-6 text-amber-600" />
                <span>Suas Encomendas</span>
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhe pacotes recebidos pela portaria, confira a foto da etiqueta e resgate com seu PIN.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                {pendingPackages.length} aguardando na portaria
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {safeEncomendas.length > 0 ? (
              safeEncomendas.map((enc) => {
                if (!enc) return null;
                const blocoDisplay = enc.unidade?.bloco || morador?.unidade?.bloco || '1';
                const aptoDisplay = enc.unidade?.apto || morador?.unidade?.apto || '-';
                const dataRecebidaStr = enc.recebidoEm
                  ? new Date(enc.recebidoEm).toLocaleString('pt-BR')
                  : 'Registrado recentemente';
                const transportadoraNome = enc.transportadora || 'Entrega / Pacote';
                const codigoPin = enc.codigoResgate || '••••••';

                return (
                  <div
                    key={enc.id}
                    className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 hover:border-amber-200 transition"
                  >
                    {/* Topo do Card */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center font-bold shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-base">{transportadoraNome}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {enc.codigoRastreio ? `Rastreio: ${enc.codigoRastreio}` : 'Sem código de rastreio'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full border ${
                          enc.status === 'na_portaria'
                            ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {enc.status === 'na_portaria' ? '📦 Aguardando Retirada' : '✅ Entregue'}
                      </span>
                    </div>

                    {/* Foto do Selo / Etiqueta e Informações Detalhadas */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      {/* Imagem do Selo / Pacote */}
                      <div className="md:col-span-4 flex flex-col items-center">
                        {enc.fotoUrl ? (
                          <div className="w-full space-y-2">
                            <div
                              onClick={() =>
                                setModalFotoEncomenda({
                                  url: enc.fotoUrl!,
                                  titulo: `Selo da Encomenda - ${transportadoraNome}`,
                                  rastreio: enc.codigoRastreio,
                                })
                              }
                              className="relative w-full h-36 rounded-xl overflow-hidden border-2 border-amber-300 bg-slate-900 cursor-pointer group shadow-xs"
                              title="Clique para ampliar a foto do selo"
                            >
                              <img
                                src={enc.fotoUrl}
                                alt="Selo da Encomenda"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-2.5">
                                <span className="text-[10px] font-bold text-white flex items-center gap-1">
                                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Selo Registrado</span>
                                </span>
                                <span className="text-[10px] font-bold bg-white/20 text-white backdrop-blur-xs px-2 py-0.5 rounded-md">
                                  Ampliar 🔍
                                </span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 text-center leading-tight">
                              Foto tirada na portaria. Confira seu nome e bloco na etiqueta.
                            </p>
                          </div>
                        ) : (
                          <div className="w-full h-28 rounded-xl border border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 text-xs p-3 text-center">
                            <Camera className="w-6 h-6 mb-1 text-slate-300" />
                            <span>Foto do selo não anexada na portaria</span>
                          </div>
                        )}
                      </div>

                      {/* Detalhes de Entrada */}
                      <div className="md:col-span-8 space-y-2 text-xs text-slate-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-400 text-[11px] block">Destinatário:</span>
                            <strong className="text-slate-900">{enc.moradorNome || morador?.nome || 'Morador'}</strong>
                            <div className="text-[11px] text-amber-800 font-semibold">
                              Bloco {blocoDisplay} - Apto {aptoDisplay}
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 text-[11px] block">Recebido na Portaria:</span>
                            <strong className="text-slate-900">
                              {dataRecebidaStr}
                            </strong>
                            <div className="text-[11px] text-slate-500">Por: {enc.recebidoPor || 'Portaria'}</div>
                          </div>
                        </div>

                        {enc.observacao && (
                          <div className="pt-1">
                            <span className="text-slate-400 text-[11px] block">Local / Observação:</span>
                            <span className="text-slate-800 font-medium">{enc.observacao}</span>
                          </div>
                        )}

                        {enc.status === 'entregue' && (
                          <div className="pt-2 border-t border-slate-200 mt-2">
                            <span className="text-[11px] font-bold text-emerald-800 block mb-1">
                              Comprovante de Retirada:
                            </span>
                            <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-950 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div>
                                  Retirado por: <strong>{enc.nomeRetirante || enc.entreguePara || enc.moradorNome || 'Morador'}</strong>
                                </div>
                                <div className="text-[11px] text-emerald-800">
                                  Método:{' '}
                                  <strong>
                                    {enc.metodoRetirada === 'documento_rubrica'
                                      ? 'Documento com Foto + Rúbrica'
                                      : 'Código PIN de 6 Dígitos'}
                                  </strong>
                                  {enc.documentoRetirante && ` (Doc: ${enc.documentoRetirante})`}
                                </div>
                                {enc.entregueEm && (
                                  <div className="text-[10px] text-emerald-700">
                                    Em: {new Date(enc.entregueEm).toLocaleString('pt-BR')}
                                  </div>
                                )}
                              </div>

                              {enc.assinaturaRetiranteUrl && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setModalFotoEncomenda({
                                      url: enc.assinaturaRetiranteUrl!,
                                      titulo: `Rúbrica de Retirada - ${enc.nomeRetirante || enc.moradorNome || 'Morador'}`,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
                                >
                                  <span>Ver Rúbrica</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Box de PIN para Encomendas Pendentes */}
                    {enc.status === 'na_portaria' && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md shadow-amber-500/20">
                        <div className="text-center sm:text-left">
                          <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-100 block">
                            🔑 Seu Código PIN de Resgate na Portaria
                          </span>
                          <div className="text-3xl font-mono font-black tracking-widest text-white mt-0.5">
                            {codigoPin}
                          </div>
                          <p className="text-[11px] text-amber-100 mt-1 max-w-md">
                            Apresente este código de 6 dígitos ao porteiro. Sem o código, a retirada só poderá ser feita mediante apresentação de documento com foto e assinatura.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (enc.codigoResgate) {
                              navigator.clipboard.writeText(enc.codigoResgate);
                            }
                            setCopiadoKey(`pin_${enc.id}`);
                            setTimeout(() => setCopiadoKey(null), 2500);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-white text-amber-900 font-extrabold text-xs hover:bg-amber-50 transition active:scale-95 shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiadoKey === `pin_${enc.id}` ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 text-amber-700" />
                              <span>Copiar PIN</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500 space-y-2">
                <Package className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-800">Nenhuma encomenda registrada</h4>
                <p className="text-xs">Você será notificado imediatamente assim que um pacote chegar na portaria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAIS (QR Scanner, Desbloqueio, Devolução, Visitante, Ocorrência)  */}
      {/* ==================================================================== */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onScanSuccess={handleScanCheckout}
      />

      {selectedBikeForLock && (
        <BikeLockModal
          isOpen={isLockModalOpen}
          onClose={() => {
            setIsLockModalOpen(false);
            setSelectedBikeForLock(null);
          }}
          bike={selectedBikeForLock}
          lockPassword={currentLockPassword}
        />
      )}

      {bikeForReturn && (
        <BikeReturnModal
          isOpen={isReturnModalOpen}
          onClose={() => {
            setIsReturnModalOpen(false);
            setBikeForReturn(null);
          }}
          bike={bikeForReturn}
          condominio={condominio}
          locaisDisponiveis={condominio.regras?.locaisDevolucao}
          currentMorador={morador}
          onSubmitReturn={handleReturnSubmit}
          onSubmit={handleReturnSubmit}
        />
      )}

      {/* Modal: SmartPass - Novo Visitante com QR Code */}
      <SmartPassModal
        isOpen={isNovoVisitanteModalOpen}
        onClose={() => setIsNovoVisitanteModalOpen(false)}
        condominio={condominio}
        morador={morador}
        onSuccess={(vis) => {
          setAlertMessage({
            type: 'success',
            text: `Convite gerado com sucesso para ${vis.nomeVisitante}!`,
          });
        }}
      />

      {/* Modal: SmartOcorrência - Chamado com Fotos e Localização */}
      <SmartOcorrenciaModal
        isOpen={isNovaOcorrenciaModalOpen}
        onClose={() => setIsNovaOcorrenciaModalOpen(false)}
        condominio={condominio}
        morador={morador}
        onSuccess={(ocorr) => {
          setAlertMessage({
            type: 'success',
            text: `Chamado "${ocorr.titulo}" aberto com sucesso!`,
          });
        }}
      />

      {/* Modal: Novo Post no Mural */}
      {isNovoPostModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-900">Novo Anúncio no Mural</h3>
              <button
                onClick={() => setIsNovoPostModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarPostMural} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria do Post</label>
                <select
                  value={postTipo}
                  onChange={(e: any) => setPostTipo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="troca_venda">Classificados / Venda</option>
                  <option value="doacao">Doação</option>
                  <option value="perdi_achei">Achados & Perdidos</option>
                  <option value="servicos">Serviços de Morador</option>
                  <option value="geral">Recado Geral</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  placeholder="Ex: Vendo bicicleta infantil aro 16"
                  value={postTitulo}
                  onChange={(e) => setPostTitulo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$, opcional)</label>
                <input
                  type="number"
                  placeholder="Ex: 120"
                  value={postValor}
                  onChange={(e) => setPostValor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Descreva seu item ou serviço..."
                  value={postConteudo}
                  onChange={(e) => setPostConteudo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition"
              >
                Publicar no Mural
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enviar Sugestão ao Síndico */}
      {isNovaSugestaoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-900">Sugestão para a Administração</h3>
              <button
                onClick={() => setIsNovaSugestaoModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnviarSugestao} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assunto</label>
                <input
                  type="text"
                  placeholder="Ex: Melhoria na iluminação do bicicletário"
                  value={sugTitulo}
                  onChange={(e) => setSugTitulo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sua Mensagem</label>
                <textarea
                  rows={4}
                  placeholder="Escreva sua ideia ou sugestão de melhoria..."
                  value={sugMensagem}
                  onChange={(e) => setSugMensagem(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition"
              >
                Enviar ao Síndico
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Marcar Bicicleta & Destravar com Senha sem QR Code */}
      <BikeSelectionModal
        isOpen={!!selectedBikeForManualModal}
        onClose={() => setSelectedBikeForManualModal(null)}
        bike={selectedBikeForManualModal}
        condoId={condominio.id}
        morador={morador}
        onSuccessUnlock={(unlockedBike, lockPassword) => {
          setSelectedBikeForLock(unlockedBike);
          setCurrentLockPassword(lockPassword);
          setIsLockModalOpen(true);
          setAlertMessage({
            type: 'success',
            text: `Bicicleta #${unlockedBike.codigo} destravada com sucesso! Bom passeio!`,
          });
        }}
      />

      {/* Modal: Visualizador da Foto do Selo / Etiqueta em Alta Resolução */}
      {modalFotoEncomenda && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm p-4 flex flex-col items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-black text-slate-900 text-sm block">
                  {modalFotoEncomenda.titulo}
                </span>
                {modalFotoEncomenda.rastreio && (
                  <span className="text-[11px] font-mono text-slate-500">
                    Rastreio: {modalFotoEncomenda.rastreio}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalFotoEncomenda(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-amber-300 bg-slate-950 max-h-[65vh] flex items-center justify-center">
              <img
                src={modalFotoEncomenda.url}
                alt="Foto da Encomenda"
                className="max-h-[60vh] w-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500 text-[11px]">
                🔍 Verifique se os dados e bloco correspondem à sua compra.
              </span>
              <button
                type="button"
                onClick={() => setModalFotoEncomenda(null)}
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
