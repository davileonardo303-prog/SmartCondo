import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  Plus,
  TrendingUp,
  Layers,
  Bike,
  Package,
  Users,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  DollarSign,
  Check,
  X,
  UserCheck,
  KeyRound,
  Mail,
  Phone,
  Lock,
  UserPlus,
  Trash2,
  CreditCard,
  Send,
  Calendar,
  Sparkles,
  QrCode,
  Copy,
  Clock,
  Search,
  Filter,
  ArrowUpRight,
  SlidersHorizontal,
  Gift,
  HelpCircle,
  FileText,
  Settings,
} from 'lucide-react';
import {
  Condominio,
  UserRole,
  UsuarioSistema,
  CobrancaCondominio,
  Morador,
  PlanoTipo,
  PlanoConfigItem,
} from '../../types';
import { condoStore } from '../../services/mockStorage';
import { whatsappService } from '../../services/whatsappService';
import { ModulosCondominioModal } from './ModulosCondominioModal';
import confetti from 'canvas-confetti';

interface SuperAdminDashboardProps {
  condominios: Condominio[];
  onSelectCondo: (condoId: string) => void;
  setCurrentRole: (role: UserRole) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  condominios,
  onSelectCondo,
  setCurrentRole,
}) => {
  const [activeTab, setActiveTab] = useState<'condominios' | 'cobrancas' | 'aprovacoes' | 'sindicos'>('condominios');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [showNewCondoModal, setShowNewCondoModal] = useState(false);
  const [showNewSindicoModal, setShowNewSindicoModal] = useState(false);
  const [showConfigPlanosModal, setShowConfigPlanosModal] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominio | null>(null);
  const [billingCondo, setBillingCondo] = useState<Condominio | null>(null);
  const [planEditCondo, setPlanEditCondo] = useState<Condominio | null>(null);
  const [modulosCondoModal, setModulosCondoModal] = useState<Condominio | null>(null);
  const [estenderTesteCondo, setEstenderTesteCondo] = useState<Condominio | null>(null);
  const [extensaoDias, setExtensaoDias] = useState<number>(90);
  const [extensaoDataCustom, setExtensaoDataCustom] = useState<string>('');

  // Dynamic Plans Config from Store
  const planosConfig = condoStore.getPlanosConfig();
  const [editablePlanos, setEditablePlanos] = useState<Record<PlanoTipo, PlanoConfigItem>>(() => ({
    ...condoStore.getPlanosConfig(),
  }));

  // Form Novo Condomínio
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('RJ');
  const [totalUnidades, setTotalUnidades] = useState(100);
  const [plano, setPlano] = useState<PlanoTipo>('Teste');
  const [valorMensalidade, setValorMensalidade] = useState(0);
  const [sindicoNome, setSindicoNome] = useState('');
  const [sindicoEmail, setSindicoEmail] = useState('');
  const [sindicoTelefone, setSindicoTelefone] = useState('');
  const [sindicoSenha, setSindicoSenha] = useState('sindico123');

  // Form Novo Síndico
  const [sindicoTargetCondoId, setSindicoTargetCondoId] = useState(condominios[0]?.id || '');
  const [sindicoNovoNome, setSindicoNovoNome] = useState('');
  const [sindicoNovoEmail, setSindicoNovoEmail] = useState('');
  const [sindicoNovoTelefone, setSindicoNovoTelefone] = useState('');
  const [sindicoNovaSenha, setSindicoNovaSenha] = useState('');

  // Form Notificação de Cobrança
  const [cobMesRef, setCobMesRef] = useState(() => {
    const d = new Date();
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${meses[d.getMonth()]} / ${d.getFullYear()}`;
  });
  const [cobValor, setCobValor] = useState<number>(499);
  const [cobDataVenc, setCobDataVenc] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [cobChavePix, setCobChavePix] = useState('davileonardo303@gmail.com');
  const [cobMsgAdicional, setCobMsgAdicional] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);

  // Form Ajuste de Plano
  const [novoPlano, setNovoPlano] = useState<PlanoTipo>('Plus');
  const [novoValor, setNovoValor] = useState<number>(499);
  const [novoVencimento, setNovoVencimento] = useState<number>(10);
  const [novoStatusPag, setNovoStatusPag] = useState<'em_dia' | 'pendente' | 'vencido' | 'cortesia'>('em_dia');

  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'info'; texto: string } | null>(null);

  const showNotification = (texto: string, tipo: 'sucesso' | 'info' = 'sucesso') => {
    setFeedbackMsg({ tipo, texto });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handlePlanoChange = (novoP: PlanoTipo) => {
    setPlano(novoP);
    setValorMensalidade(planosConfig[novoP]?.valor || 0);
  };

  const handleAbrirConfigPlanos = () => {
    setEditablePlanos({ ...condoStore.getPlanosConfig() });
    setShowConfigPlanosModal(true);
  };

  const handleAbrirEstenderTeste = (condo: Condominio) => {
    setEstenderTesteCondo(condo);
    setExtensaoDias(90);
    setExtensaoDataCustom('');
  };

  const handleConfirmarEstenderTeste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estenderTesteCondo) return;

    let res;
    if (extensaoDataCustom) {
      res = condoStore.estenderPeriodoTeste(estenderTesteCondo.id, { dataExata: extensaoDataCustom });
    } else {
      res = condoStore.estenderPeriodoTeste(estenderTesteCondo.id, { dias: extensaoDias });
    }

    if (res.success) {
      confetti({ particleCount: 60, spread: 70 });
      const dataFmt = res.novaDataFim.split('-').reverse().join('/');
      showNotification(`🧪 Período de teste do condomínio "${estenderTesteCondo.nome}" estendido com sucesso até ${dataFmt}!`);
      setEstenderTesteCondo(null);
    }
  };

  const handleSalvarConfigPlanos = (e: React.FormEvent) => {
    e.preventDefault();
    Object.entries(editablePlanos).forEach(([key, item]) => {
      condoStore.updatePlanoConfig(key as PlanoTipo, item);
    });
    confetti({ particleCount: 50, spread: 60 });
    setShowConfigPlanosModal(false);
    showNotification('Tabela de valores e planos atualizada com sucesso!');
  };

  const handleRestaurarPlanosPadrao = () => {
    if (confirm('Deseja restaurar as configurações e preços padrões de fábrica dos planos?')) {
      condoStore.resetPlanosConfig();
      setEditablePlanos({ ...condoStore.getPlanosConfig() });
      showNotification('Planos restaurados para o padrão original.', 'info');
    }
  };

  const handleCreateCondo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !sindicoNome || !sindicoEmail) return;

    const isTeste = plano === 'Teste';
    const hoje = new Date();
    const fim = new Date();
    fim.setDate(fim.getDate() + 90);

    const newCondo = condoStore.addCondominio({
      nome,
      cnpj: cnpj || '00.000.000/0001-00',
      endereco: endereco || 'Av. Principal, 100 - Centro',
      cidade: cidade || 'Rio de Janeiro',
      uf: uf || 'RJ',
      totalUnidades: Number(totalUnidades) || 80,
      statusAssinatura: isTeste ? 'em_teste' : 'ativo',
      plano,
      valorMensalidade: isTeste ? 0 : Number(valorMensalidade) || planosConfig[plano]?.valor || 0,
      diaVencimento: 10,
      statusPagamento: isTeste ? 'cortesia' : 'em_dia',
      dataInicioTeste: isTeste ? hoje.toISOString().split('T')[0] : undefined,
      dataFimTeste: isTeste ? fim.toISOString().split('T')[0] : undefined,
      chavePix: 'davileonardo303@gmail.com',
      sindicoNome,
      sindicoEmail,
      regras: {
        limiteTempoBikeMinutos: 180,
        limiteBikesPorMorador: 1,
        horarioBicicletario: '06:00 às 22:00',
        diasAntecedenciaReserva: 30,
        taxaReservaSalao: 150,
      },
    });

    // Cria a credencial de login do Síndico
    condoStore.cadastrarSindico({
      nome: sindicoNome,
      email: sindicoEmail,
      senha: sindicoSenha || 'sindico123',
      telefone: sindicoTelefone,
      condominioId: newCondo.id,
    });

    confetti({ particleCount: 70, spread: 70 });
    setShowNewCondoModal(false);
    setNome('');
    setCnpj('');
    setEndereco('');
    setCidade('');
    setUf('RJ');
    setSindicoNome('');
    setSindicoEmail('');
    setSindicoTelefone('');
    setSindicoSenha('sindico123');
    showNotification(`Condomínio "${newCondo.nome}" e Síndico "${sindicoNome}" cadastrados com sucesso!`);
  };

  const handleUpdateCondo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCondo) return;

    condoStore.updateCondominio(editingCondo.id, {
      nome: editingCondo.nome,
      endereco: editingCondo.endereco,
      cidade: editingCondo.cidade,
      uf: editingCondo.uf,
      totalUnidades: Number(editingCondo.totalUnidades),
      cnpj: editingCondo.cnpj,
      plano: editingCondo.plano,
    });

    confetti({ particleCount: 40, spread: 50 });
    setEditingCondo(null);
    showNotification(`Informações do condomínio "${editingCondo.nome}" atualizadas com sucesso!`);
  };

  const handleCreateSindico = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sindicoNovoNome || !sindicoNovoEmail || !sindicoNovaSenha || !sindicoTargetCondoId) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    condoStore.cadastrarSindico({
      nome: sindicoNovoNome,
      email: sindicoNovoEmail,
      senha: sindicoNovaSenha,
      telefone: sindicoNovoTelefone,
      condominioId: sindicoTargetCondoId,
    });

    confetti({ particleCount: 60, spread: 60 });
    setShowNewSindicoModal(false);
    showNotification(`Síndico "${sindicoNovoNome}" cadastrado com sucesso!`);
    setSindicoNovoNome('');
    setSindicoNovoEmail('');
    setSindicoNovoTelefone('');
    setSindicoNovaSenha('');
  };

  const handleAbrirModalCobranca = (condo: Condominio) => {
    setBillingCondo(condo);
    setCobValor(condo.valorMensalidade || planosConfig[condo.plano || 'Plus'].valor);
    setCobChavePix(condo.chavePix || 'davileonardo303@gmail.com');
  };

  const handleEnviarNotificacaoCobranca = (enviarWhatsApp: boolean) => {
    if (!billingCondo) return;

    const sindico = condoStore.getSindicos(billingCondo.id)[0] || {
      nome: billingCondo.sindicoNome || 'Síndico',
      telefone: '5511999999999',
      email: billingCondo.sindicoEmail || '',
    };

    const codigoPix = `00020126580014BR.GOV.BCB.PIX0136${cobChavePix}520400005303986540${cobValor.toFixed(2)}5802BR5920Davi Leonardo6009SAO PAULO62070503***6304`;

    // 1. Cria registro da cobrança no store / Firestore
    const novaCob = condoStore.criarCobranca({
      condominioId: billingCondo.id,
      condominioNome: billingCondo.nome,
      sindicoNome: sindico.nome,
      sindicoEmail: sindico.email,
      sindicoTelefone: sindico.telefone || '',
      plano: billingCondo.plano || 'Plus',
      mesReferencia: cobMesRef,
      valor: Number(cobValor),
      dataVencimento: cobDataVenc,
      chavePix: cobChavePix,
      codigoPixCopiaCola: codigoPix,
      status: 'enviada',
      observacoes: cobMsgAdicional,
    });

    // 2. Se optou por WhatsApp, gera link e abre
    if (enviarWhatsApp && sindico.telefone) {
      const { whatsappUrl } = whatsappService.notificarCobrancaSindico({
        condominioNome: billingCondo.nome,
        sindicoNome: sindico.nome,
        sindicoTelefone: sindico.telefone,
        mesReferencia: cobMesRef,
        plano: `Plano ${billingCondo.plano || 'Plus'}`,
        valor: Number(cobValor),
        dataVencimento: cobDataVenc,
        chavePix: cobChavePix,
        codigoPixCopiaCola: codigoPix,
        mensagemAdicional: cobMsgAdicional,
      });

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    }

    confetti({ particleCount: 50, spread: 60 });
    setBillingCondo(null);
    showNotification(`Notificação de cobrança (${cobMesRef} - R$ ${Number(cobValor).toFixed(2)}) emitida com sucesso para "${billingCondo.nome}"!`);
  };

  const handleSalvarAjustePlano = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planEditCondo) return;

    condoStore.atualizarPlanoCondominio(
      planEditCondo.id,
      novoPlano,
      Number(novoValor),
      Number(novoVencimento),
      novoStatusPag
    );

    confetti({ particleCount: 40, spread: 50 });
    setPlanEditCondo(null);
    showNotification(`Plano do condomínio "${planEditCondo.nome}" alterado para ${novoPlano} (R$ ${Number(novoValor).toFixed(2)})!`);
  };

  const totalUnits = condominios.reduce((acc, c) => acc + c.totalUnidades, 0);
  const allPendentes = condoStore.getMoradoresPendentes();
  const sindicosList = condoStore.getSindicos();
  const cobrancasList = condoStore.getCobrancas();

  const handleAdminAprovar = (condoId: string, moradorId: string, moradorNome: string) => {
    condoStore.aprovarMorador(condoId, moradorId, 'Davi Leonardo (Admin Geral)');
    confetti({ particleCount: 50, spread: 60 });
    showNotification(`Cadastro de ${moradorNome} aprovado com sucesso!`);
  };

  const handleAdminRecusar = (condoId: string, moradorId: string, moradorNome: string) => {
    if (confirm(`Deseja recusar o cadastro de ${moradorNome}?`)) {
      condoStore.recusarMorador(condoId, moradorId);
      showNotification(`Cadastro de ${moradorNome} recusado.`, 'info');
    }
  };

  // Filtragem de condomínios
  const filteredCondos = condominios.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      c.cidade.toLowerCase().includes(q) ||
      (c.sindicoNome && c.sindicoNome.toLowerCase().includes(q)) ||
      (c.plano && c.plano.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Super Admin Global Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Super Administrador • Davi Leonardo
            </span>
            <span className="text-xs text-slate-500 font-medium">davileonardo303@gmail.com</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Painel Central de Administração Geral
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Controle total de condomínios, gestão de planos & cobranças aos síndicos, faturamento e aprovação de moradores.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            id="btn-config-planos-modal"
            onClick={handleAbrirConfigPlanos}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer"
            title="Cadastrar e alterar valores dos planos Smart, Plus, Pro, Enterprise e Teste"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>Valores dos Planos</span>
          </button>

          <button
            id="btn-cadastrar-sindico-modal"
            onClick={() => {
              if (condominios.length === 0) {
                setShowNewCondoModal(true);
              } else {
                setSindicoTargetCondoId(condominios[0].id);
                setShowNewSindicoModal(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Síndico</span>
          </button>

          <button
            id="btn-cadastrar-condo-modal"
            onClick={() => setShowNewCondoModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm shadow-purple-600/20 transition active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Condomínio</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            feedbackMsg.tipo === 'sucesso'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-blue-50 border border-blue-200 text-blue-900'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{feedbackMsg.texto}</span>
        </div>
      )}

      {/* Métricas Globais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-bold">
            <span>Condomínios Ativos</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{condominios.length}</div>
          <span className="text-xs font-medium text-purple-700 mt-1 block">
            {condominios.length === 0 ? 'Nenhum cadastrado' : 'Multi-Tenant com dados isolados'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-bold">
            <span>Faturamento Mensal Estimado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {condominios
              .reduce((acc, c) => acc + (c.valorMensalidade || planosConfig[c.plano || 'Plus'].valor), 0)
              .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
          <span className="text-xs font-medium text-slate-500 mt-1 block">
            Recorrência ativa (Planos Smart / Plus / Pro)
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-bold">
            <span>Total de Unidades</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalUnits}</div>
          <span className="text-xs font-medium text-slate-500 mt-1 block">
            Apartamentos e casas cadastrados
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-bold">
            <span>Solicitações Pendentes</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{allPendentes.length}</div>
          <span className="text-xs font-medium text-amber-700 mt-1 block">
            {allPendentes.length > 0 ? 'Requer aprovação do síndico/admin' : 'Tudo em dia (0)'}
          </span>
        </div>
      </div>

      {/* Navegação de Abas do Super Admin */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('condominios')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'condominios'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Condomínios ({condominios.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cobrancas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'cobrancas'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Planos & Notificações de Cobrança</span>
          {cobrancasList.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
              {cobrancasList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('aprovacoes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'aprovacoes'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Aprovações de Moradores</span>
          {allPendentes.length > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] animate-pulse">
              {allPendentes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sindicos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'sindicos'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Síndicos & Contas ({sindicosList.length})</span>
        </button>
      </div>

      {/* ABA 1: CONDOMÍNIOS CADASTRADOS */}
      {activeTab === 'condominios' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Condomínios Registrados na Plataforma ({filteredCondos.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Gerencie acessos, planos contratados, mensalidades e envie notificações de cobrança.
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, cidade ou síndico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {filteredCondos.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 text-sm">Nenhum condomínio encontrado</p>
              <p className="mt-1">Cadastre o primeiro condomínio para começar a gerenciar.</p>
              <button
                onClick={() => setShowNewCondoModal(true)}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition cursor-pointer"
              >
                Cadastrar Condomínio Agora
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Condomínio / Local</th>
                    <th className="py-3 px-4">Plano & Valor</th>
                    <th className="py-3 px-4">Síndico Responsável</th>
                    <th className="py-3 px-4">Unidades / Moradores</th>
                    <th className="py-3 px-4">Status Pagamento</th>
                    <th className="py-3 px-4 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCondos.map((c) => {
                    const sindicos = condoStore.getSindicos(c.id);
                    const sindicoPrincipal = sindicos[0];
                    const moradoresTotal = condoStore.getMoradores(c.id, false).length;
                    const moradoresAtivos = condoStore.getMoradores(c.id, true).length;
                    const currentPlano: PlanoTipo = (c.plano as PlanoTipo) || 'Plus';
                    const isPlanoTeste = currentPlano === 'Teste' || c.statusAssinatura === 'em_teste';
                    const mensalidade = isPlanoTeste ? 0 : (c.valorMensalidade !== undefined ? c.valorMensalidade : (planosConfig[currentPlano]?.valor || 0));

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">{c.nome}</div>
                          <div className="text-slate-500 text-[11px]">
                            {c.endereco ? `${c.endereco}, ` : ''}{c.cidade}/{c.uf}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isPlanoTeste ? (
                              <span className="px-2.5 py-1 rounded-full font-black text-[11px] bg-cyan-100 text-cyan-900 border border-cyan-300 flex items-center gap-1 shadow-xs">
                                <span>🧪</span> Teste (3 Meses)
                              </span>
                            ) : (
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
                                  currentPlano === 'Plus'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : currentPlano === 'Pro'
                                    ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                    : currentPlano === 'Enterprise'
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                                    : 'bg-slate-100 text-slate-800 border border-slate-300'
                                }`}
                              >
                                Plano {currentPlano}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5">
                            {isPlanoTeste ? (
                              <div className="space-y-1">
                                <div className="text-cyan-800 font-bold text-xs flex items-center gap-1">
                                  <span>Período Gratuito</span>
                                </div>
                                {c.dataFimTeste ? (
                                  <div className="text-[11px] bg-cyan-50 border border-cyan-200 text-cyan-900 px-2 py-0.5 rounded-md font-semibold inline-block">
                                    📅 Vencimento: <strong className="font-black">{c.dataFimTeste.split('-').reverse().join('/')}</strong>
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-cyan-600">3 meses de degustação</div>
                                )}
                                <div>
                                  <button
                                    onClick={() => handleAbrirEstenderTeste(c)}
                                    className="text-[10px] text-cyan-700 hover:text-cyan-900 font-extrabold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>➕ Aumentar Período de Teste</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-emerald-700 font-extrabold text-xs">
                                {mensalidade.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                <span className="text-slate-400 font-normal text-[10px]"> / mês</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{sindicoPrincipal?.nome || c.sindicoNome || 'Não definido'}</div>
                          <div className="text-slate-500 text-[11px]">{sindicoPrincipal?.email || c.sindicoEmail}</div>
                          {sindicoPrincipal?.telefone && (
                            <div className="text-slate-400 text-[10px]">{sindicoPrincipal.telefone}</div>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{c.totalUnidades} Unidades</div>
                          <div className="text-slate-500 text-[11px]">
                            {moradoresAtivos} moradores ativos ({moradoresTotal} no total)
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 ${
                              c.statusPagamento === 'vencido'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : c.statusPagamento === 'pendente'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : c.statusPagamento === 'cortesia'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            {c.statusPagamento === 'vencido'
                              ? 'Vencido'
                              : c.statusPagamento === 'pendente'
                              ? 'Pendente'
                              : c.statusPagamento === 'cortesia'
                              ? 'Cortesia / Teste'
                              : 'Em Dia'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Botão Estender Período de Teste */}
                          {isPlanoTeste && (
                            <button
                              onClick={() => handleAbrirEstenderTeste(c)}
                              title="Aumentar o Período de Teste Gratuito"
                              className="px-2.5 py-1.5 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-900 font-extrabold text-xs transition inline-flex items-center gap-1 cursor-pointer border border-cyan-300"
                            >
                              <span>🧪</span>
                              <span>+ Teste</span>
                            </button>
                          )}

                          {/* Botão Gestão de Serviços & Módulos Contratados */}
                          <button
                            onClick={() => setModulosCondoModal(c)}
                            title="Configurar Serviços e Módulos que este Condomínio terá (Bicicletas, Comida, etc.)"
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer border border-indigo-200"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Serviços</span>
                          </button>

                          {/* Botão Enviar Notificação de Cobrança */}
                          <button
                            onClick={() => handleAbrirModalCobranca(c)}
                            title="Enviar Notificação de Cobrança / PIX"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer border border-emerald-200"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Cobrar</span>
                          </button>

                          {/* Botão Ajustar Plano */}
                          <button
                            onClick={() => {
                              setPlanEditCondo(c);
                              setNovoPlano(c.plano || 'Plus');
                              setNovoValor(c.valorMensalidade || planosConfig[c.plano || 'Plus'].valor);
                              setNovoVencimento(c.diaVencimento || 10);
                              setNovoStatusPag(c.statusPagamento || 'em_dia');
                            }}
                            title="Alterar Plano e Valor da Mensalidade"
                            className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer border border-purple-200"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>Plano</span>
                          </button>

                          {/* Botão Editar Dados */}
                          <button
                            onClick={() => setEditingCondo(c)}
                            title="Editar Dados do Condomínio"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                          >
                            Editar
                          </button>

                          {/* Botão Entrar como Síndico */}
                          <button
                            onClick={() => {
                              onSelectCondo(c.id);
                              setCurrentRole('sindico');
                            }}
                            title="Acessar painel do condomínio como Síndico"
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                          >
                            Entrar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: GESTÃO DE PLANOS & NOTIFICAÇÃO DE COBRANÇAS */}
      {activeTab === 'cobrancas' && (
        <div className="space-y-6">
          {/* Vitrine Oficial dos Planos */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 rounded-3xl text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
                  Tabela Oficial de Planos SmartCondo
                </span>
                <h2 className="text-2xl font-black mt-2">Valores e Recursos dos Planos de Assinatura</h2>
                <p className="text-slate-300 text-xs mt-1">
                  Valores configuráveis para cada condomínio cliente. O <strong>Plano Teste</strong> permite 3 meses gratuitos para avaliação do síndico, e o <strong>Plano Plus</strong> é o mais popular.
                </p>
              </div>

              <button
                onClick={handleAbrirConfigPlanos}
                className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs shadow-lg transition active:scale-98 cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Editar Valores dos Planos</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Plano Teste (3 Meses Grátis) */}
              <div className="bg-cyan-950/40 backdrop-blur-md rounded-2xl p-5 border-2 border-cyan-400/60 flex flex-col justify-between relative shadow-lg">
                <div className="absolute -top-3 right-3 bg-cyan-400 text-cyan-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow">
                  🎁 Teste Grátis
                </div>
                <div>
                  <span className="text-xs font-black text-cyan-300 uppercase flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5" /> Plano Teste
                  </span>
                  <div className="text-2xl font-extrabold text-white mt-1">
                    R$ 0<span className="text-xs text-cyan-300 font-bold"> / 3 meses</span>
                  </div>
                  <div className="mt-1 inline-block text-[10px] bg-cyan-500/20 text-cyan-200 px-2 py-0.5 rounded-md font-semibold border border-cyan-400/30">
                    Duração: 3 Meses Sem Custo
                  </div>
                  <p className="text-[11px] text-slate-300 mt-2">{planosConfig.Teste?.desc || 'Período gratuito de 3 meses para o síndico testar no condomínio.'}</p>
                  <ul className="text-[11px] text-slate-200 mt-3 space-y-1.5">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> {planosConfig.Teste?.unidades || 'Até 100 aptos'}</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> {planosConfig.Teste?.bikes || 'Até 10 bikes'}</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-cyan-400" /> Avaliação completa sem custo</li>
                  </ul>
                </div>
              </div>

              {/* Plano Smart */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-300 uppercase">Plano Smart</span>
                  <div className="text-2xl font-extrabold mt-1">R$ {planosConfig.Smart?.valor ?? 249}<span className="text-xs text-slate-300">/mês</span></div>
                  <p className="text-[11px] text-slate-300 mt-2">{planosConfig.Smart?.desc}</p>
                  <ul className="text-[11px] text-slate-200 mt-3 space-y-1.5">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> {planosConfig.Smart?.unidades}</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> {planosConfig.Smart?.bikes}</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Gestão de Encomendas</li>
                  </ul>
                </div>
              </div>

              {/* Plano Plus (Destaque Principal) */}
              <div className="bg-gradient-to-b from-amber-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl p-5 border-2 border-amber-400 shadow-lg relative flex flex-col justify-between">
                <div className="absolute -top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow">
                  ⭐ Mais Popular
                </div>
                <div>
                  <span className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Plano Plus
                  </span>
                  <div className="text-3xl font-black text-amber-300 mt-1">R$ {planosConfig.Plus?.valor ?? 499}<span className="text-xs text-slate-200">/mês</span></div>
                  <p className="text-[11px] text-slate-200 mt-2">{planosConfig.Plus?.desc}</p>
                  <ul className="text-[11px] text-slate-100 mt-3 space-y-1.5 font-medium">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> <strong>{planosConfig.Plus?.unidades}</strong></li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> <strong>{planosConfig.Plus?.bikes}</strong></li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Áreas de Lazer & Reservas</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Disparador WhatsApp Integrado</li>
                  </ul>
                </div>
              </div>

              {/* Plano Pro */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-300 uppercase">Plano Pro</span>
                  <div className="text-2xl font-extrabold mt-1">R$ {planosConfig.Pro?.valor ?? 799}<span className="text-xs text-slate-300">/mês</span></div>
                  <p className="text-[11px] text-slate-300 mt-2">{planosConfig.Pro?.desc}</p>
                  <ul className="text-[11px] text-slate-200 mt-3 space-y-1.5">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> {planosConfig.Pro?.unidades}</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> {planosConfig.Pro?.bikes}</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Relatórios de Governança</li>
                  </ul>
                </div>
              </div>

              {/* Plano Enterprise */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-indigo-300 uppercase">Plano Enterprise</span>
                  <div className="text-2xl font-extrabold mt-1">R$ {planosConfig.Enterprise?.valor ?? 1299}<span className="text-xs text-slate-300">/mês</span></div>
                  <p className="text-[11px] text-slate-300 mt-2">{planosConfig.Enterprise?.desc}</p>
                  <ul className="text-[11px] text-slate-200 mt-3 space-y-1.5">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> {planosConfig.Enterprise?.unidades}</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> {planosConfig.Enterprise?.bikes}</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Suporte VIP 24h com SLA</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Histórico de Notificações de Cobrança Enviadas */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Histórico de Cobranças Emitidas aos Condomínios ({cobrancasList.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Faturas geradas, links de WhatsApp disparados e controle de pagamentos PIX recebidos.
                  </p>
                </div>
              </div>
            </div>

            {cobrancasList.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">Nenhuma notificação de cobrança emitida ainda.</p>
                <p className="mt-1">
                  Vá na aba &quot;Condomínios&quot; e clique no botão &quot;Cobrar&quot; para disparar a primeira notificação via WhatsApp ao síndico.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Condomínio</th>
                      <th className="py-3 px-4">Referência / Plano</th>
                      <th className="py-3 px-4">Síndico / Destinatário</th>
                      <th className="py-3 px-4">Valor & Vencimento</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cobrancasList.map((cob) => {
                      const dataVencFormat = cob.dataVencimento.includes('-')
                        ? new Date(cob.dataVencimento + 'T12:00:00').toLocaleDateString('pt-BR')
                        : cob.dataVencimento;

                      return (
                        <tr key={cob.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{cob.condominioNome}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-purple-700">{cob.mesReferencia}</span>
                            <div className="text-[11px] text-slate-500">Plano {cob.plano}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-800">{cob.sindicoNome}</div>
                            <div className="text-slate-500 text-[11px]">{cob.sindicoTelefone}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-emerald-700">
                              {cob.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <div className="text-[11px] text-slate-500">Venc: {dataVencFormat}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                                cob.status === 'paga'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : cob.status === 'enviada'
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              {cob.status === 'paga' ? '✓ PAGA' : cob.status === 'enviada' ? 'ENVIADA' : 'PENDENTE'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            {/* Reenviar no WhatsApp */}
                            {cob.sindicoTelefone && (
                              <button
                                onClick={() => {
                                  const { whatsappUrl } = whatsappService.notificarCobrancaSindico({
                                    condominioNome: cob.condominioNome,
                                    sindicoNome: cob.sindicoNome,
                                    sindicoTelefone: cob.sindicoTelefone,
                                    mesReferencia: cob.mesReferencia,
                                    plano: `Plano ${cob.plano}`,
                                    valor: cob.valor,
                                    dataVencimento: cob.dataVencimento,
                                    chavePix: cob.chavePix,
                                    codigoPixCopiaCola: cob.codigoPixCopiaCola,
                                    mensagemAdicional: cob.observacoes,
                                  });
                                  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer"
                                title="Reenviar Cobrança no WhatsApp"
                              >
                                <Send className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </button>
                            )}

                            {/* Marcar como Paga */}
                            {cob.status !== 'paga' && (
                              <button
                                onClick={() => {
                                  condoStore.atualizarStatusCobranca(cob.id, 'paga');
                                  confetti({ particleCount: 40, spread: 50 });
                                  showNotification(`Fatura de ${cob.condominioNome} marcada como Paga com sucesso!`);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                              >
                                Dar Baixa
                              </button>
                            )}

                            {/* Excluir cobrança */}
                            <button
                              onClick={() => {
                                if (confirm('Deseja excluir este registro de cobrança?')) {
                                  condoStore.excluirCobranca(cob.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Excluir Registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 3: APROVAÇÕES DE MORADORES (SUPORTA MÚLTIPLOS POR UNIDADE) */}
      {activeTab === 'aprovacoes' && (
        <div className="bg-white border-2 border-amber-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Aprovações de Cadastro de Moradores ({allPendentes.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Moradores cadastrados pelo portal aguardando aprovação. Múltiplos moradores por apartamento são permitidos e identificados abaixo.
                </p>
              </div>
            </div>
          </div>

          {allPendentes.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-sm">Nenhuma solicitação pendente no momento!</p>
              <p className="mt-1">Todos os moradores cadastrados já foram avaliados e liberados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-amber-50/70 text-amber-950 uppercase font-bold border-b border-amber-200">
                  <tr>
                    <th className="py-3 px-4">Morador Solicitante</th>
                    <th className="py-3 px-4">Condomínio</th>
                    <th className="py-3 px-4">Unidade / Outros Moradores no Imóvel</th>
                    <th className="py-3 px-4">WhatsApp / Tel</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4 text-right">Ação do Administrador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPendentes.map((m) => {
                    const condo = condominios.find((c) => c.id === m.condominioId);
                    const outrosMoradoresNaUnidade = condoStore
                      .getMoradoresDaUnidade(m.condominioId, m.unidade.bloco, m.unidade.apto)
                      .filter((outro) => outro.id !== m.id);

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 text-sm">{m.nome}</div>
                          <div className="text-[11px] text-slate-500">
                            Cadastrado em: {m.solicitadoEm ? new Date(m.solicitadoEm).toLocaleDateString('pt-BR') : 'Hoje'}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-semibold text-purple-700">
                          {condo?.nome || m.condominioId}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            Bloco {m.unidade.bloco} - Apto {m.unidade.apto}
                          </div>
                          {outrosMoradoresNaUnidade.length > 0 ? (
                            <div className="mt-1 p-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[10px] text-blue-900 font-medium">
                              👥 <strong>{outrosMoradoresNaUnidade.length} morador(es) já cadastrado(s) neste apartamento:</strong>
                              <div className="mt-0.5 text-blue-700">
                                {outrosMoradoresNaUnidade.map((o) => `${o.nome} (${o.statusCadastro})`).join(', ')}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Primeiro morador se cadastrando nesta unidade
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-700 font-medium">{m.telefone}</td>
                        <td className="py-3 px-4 text-slate-500">{m.email}</td>

                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleAdminRecusar(m.condominioId, m.id, m.nome)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 font-bold transition text-xs cursor-pointer"
                          >
                            Recusar
                          </button>
                          <button
                            onClick={() => handleAdminAprovar(m.condominioId, m.id, m.nome)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Aprovar Acesso
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ABA 4: SÍNDICOS & CREDENCIAIS DE ACESSO */}
      {activeTab === 'sindicos' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Síndicos Cadastrados no Sistema ({sindicosList.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Contas com privilégio de síndico para aprovar moradores, gerenciar encomendas e bicicletário.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (condominios.length > 0) setSindicoTargetCondoId(condominios[0].id);
                setShowNewSindicoModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Novo Síndico</span>
            </button>
          </div>

          {sindicosList.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">Nenhum síndico cadastrado no sistema.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nome do Síndico</th>
                    <th className="py-3 px-4">Condomínio Vinculado</th>
                    <th className="py-3 px-4">E-mail de Login</th>
                    <th className="py-3 px-4">Telefone / WhatsApp</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sindicosList.map((s) => {
                    const condo = condominios.find((c) => c.id === s.condominioId);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">{s.nome}</td>
                        <td className="py-3 px-4 font-semibold text-purple-700">{condo?.nome || 'Não associado'}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{s.email}</td>
                        <td className="py-3 px-4 text-slate-600">{s.telefone || '-'}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              if (condo) {
                                onSelectCondo(condo.id);
                                setCurrentRole('sindico');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
                          >
                            Abrir Painel do Síndico
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: NOTIFICAÇÃO DE COBRANÇA AO SÍNDICO */}
      {billingCondo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Notificação de Cobrança / Mensalidade</h3>
                  <p className="text-[11px] text-slate-500">
                    Envie os dados de pagamento PIX para o síndico de <strong>{billingCondo.nome}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBillingCondo(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mês de Referência *</label>
                  <input
                    type="text"
                    value={cobMesRef}
                    onChange={(e) => setCobMesRef(e.target.value)}
                    placeholder="Ex: Agosto / 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valor da Mensalidade (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cobValor}
                    onChange={(e) => setCobValor(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-bold text-emerald-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data de Vencimento *</label>
                  <input
                    type="date"
                    value={cobDataVenc}
                    onChange={(e) => setCobDataVenc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chave PIX do Administrador *</label>
                  <input
                    type="text"
                    value={cobChavePix}
                    onChange={(e) => setCobChavePix(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observação Adicional (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Referente ao Plano Plus com 15 bicicletas ativas."
                  value={cobMsgAdicional}
                  onChange={(e) => setCobMsgAdicional(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Card de Pré-visualização da Mensagem formatada */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 mb-1.5">
                  <span>📱 Pré-visualização da Mensagem WhatsApp</span>
                  <span className="text-[10px] text-emerald-700">Destinatário: {billingCondo.sindicoNome || 'Síndico'}</span>
                </div>
                <div className="p-2.5 bg-white border border-emerald-100 rounded-xl text-[11px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                  {`🏢 PLATAFORMA SMARTCONDO - MENSALIDADE
Olá, ${billingCondo.sindicoNome || 'Síndico'}!
Condomínio: ${billingCondo.nome}
📌 Ref: ${cobMesRef} | Plano ${billingCondo.plano || 'Plus'}
💰 Valor: R$ ${Number(cobValor).toFixed(2)} | Venc: ${cobDataVenc}
🔑 Chave PIX: ${cobChavePix}`}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setBillingCondo(null)}
                  className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => handleEnviarNotificacaoCobranca(false)}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
                >
                  Salvar Fatura no Sistema
                </button>

                <button
                  type="button"
                  onClick={() => handleEnviarNotificacaoCobranca(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-98 inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Disparar no WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AJUSTE DE PLANO E VALOR DO CONDOMÍNIO */}
      {planEditCondo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-800">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Configuração de Plano & Mensalidade</h3>
                  <p className="text-[11px] text-slate-500">
                    Condomínio: <strong>{planEditCondo.nome}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPlanEditCondo(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarAjustePlano} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Selecione o Plano da Plataforma *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['Teste', 'Smart', 'Plus', 'Pro', 'Enterprise'] as const).map((p) => {
                    const cfg = planosConfig[p];
                    const isSelected = novoPlano === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setNovoPlano(p);
                          setNovoValor(cfg?.valor ?? (p === 'Teste' ? 0 : 499));
                          if (p === 'Teste') {
                            setNovoStatusPag('cortesia');
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/80 text-purple-950 font-bold ring-2 ring-purple-500/20'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs">{p}</span>
                          {p === 'Plus' && (
                            <span className="text-[9px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                              Popular
                            </span>
                          )}
                          {p === 'Teste' && (
                            <span className="text-[9px] bg-cyan-200 text-cyan-900 font-bold px-1.5 py-0.5 rounded">
                              3 Meses
                            </span>
                          )}
                        </div>
                        <div className="text-emerald-700 font-extrabold text-sm mt-1">
                          {p === 'Teste' ? 'R$ 0,00' : `R$ ${cfg?.valor ?? 0}`}
                          <span className="text-[10px] text-slate-400 font-normal">{p === 'Teste' ? ' (teste)' : '/mês'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valor da Mensalidade (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={novoValor}
                    onChange={(e) => setNovoValor(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-bold text-emerald-700 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Dia de Vencimento Padrão *</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={novoVencimento}
                    onChange={(e) => setNovoVencimento(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status do Pagamento da Assinatura</label>
                <select
                  value={novoStatusPag}
                  onChange={(e) => setNovoStatusPag(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="em_dia">Em Dia (Acesso Liberado)</option>
                  <option value="pendente">Pendente (Aguardando Pagamento)</option>
                  <option value="vencido">Vencido (Alerta no Painel)</option>
                  <option value="cortesia">Cortesia / Período de Demonstração / Teste</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPlanEditCondo(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition active:scale-98 cursor-pointer"
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CADASTRAR NOVO CONDOMÍNIO */}
      {showNewCondoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Condomínio</h3>
                  <p className="text-[11px] text-slate-500">Cadastre o empreendimento e a conta do síndico responsável</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewCondoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCondo} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome do Condomínio *</label>
                <input
                  type="text"
                  placeholder="Ex: Condomínio Residencial Flores do Campo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Endereço Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: Estrada do Monteiro, 1200 - Campo Grande"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Cidade / Município *</label>
                  <input
                    type="text"
                    placeholder="Ex: Rio de Janeiro"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado (UF) *</label>
                  <select
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {['RJ', 'SP', 'MG', 'ES', 'BA', 'PR', 'SC', 'RS', 'GO', 'DF', 'PE', 'CE', 'PA', 'AM', 'MT', 'MS', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI', 'TO', 'RO', 'AC', 'AP', 'RR'].map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plano Escolhido *</label>
                  <select
                    value={plano}
                    onChange={(e) => handlePlanoChange(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-bold focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Teste">🎁 Plano Teste (3 Meses Grátis - R$ 0,00)</option>
                    <option value="Smart">Plano Smart (R$ {planosConfig.Smart?.valor ?? 249}/mês)</option>
                    <option value="Plus">Plano Plus - Recomendado (R$ {planosConfig.Plus?.valor ?? 499}/mês)</option>
                    <option value="Pro">Plano Pro (R$ {planosConfig.Pro?.valor ?? 799}/mês)</option>
                    <option value="Enterprise">Plano Enterprise (R$ {planosConfig.Enterprise?.valor ?? 1299}/mês)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total de Unidades / Aptos *</label>
                  <input
                    type="number"
                    min="1"
                    value={totalUnidades}
                    onChange={(e) => setTotalUnidades(Number(e.target.value))}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block mb-2">
                  Dados do Síndico Responsável
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Nome do Síndico *</label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Mendes"
                      value={sindicoNome}
                      onChange={(e) => setSindicoNome(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">WhatsApp / Telefone:</label>
                    <input
                      type="text"
                      placeholder="(21) 98765-4321"
                      value={sindicoTelefone}
                      onChange={(e) => setSindicoTelefone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">E-mail de Login *</label>
                    <input
                      type="email"
                      placeholder="sindico@condominio.com"
                      value={sindicoEmail}
                      onChange={(e) => setSindicoEmail(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Senha de Login *</label>
                    <input
                      type="password"
                      value={sindicoSenha}
                      onChange={(e) => setSindicoSenha(e.target.value)}
                      required
                      placeholder="Senha de acesso do síndico"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewCondoModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition active:scale-98 cursor-pointer"
                >
                  Cadastrar Condomínio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CADASTRAR NOVO SÍNDICO */}
      {showNewSindicoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Síndico</h3>
                  <p className="text-[11px] text-slate-500">Crie o acesso de login do síndico para o condomínio</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewSindicoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSindico} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Selecione o Condomínio *</label>
                <select
                  value={sindicoTargetCondoId}
                  onChange={(e) => setSindicoTargetCondoId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {condominios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} — {c.endereco ? `${c.endereco}, ` : ''}{c.cidade}/{c.uf}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo do Síndico *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Mendes"
                  value={sindicoNovoNome}
                  onChange={(e) => setSindicoNovoNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail de Login *</label>
                  <input
                    type="email"
                    required
                    placeholder="sindico@condominio.com"
                    value={sindicoNovoEmail}
                    onChange={(e) => setSindicoNovoEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp / Telefone</label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={sindicoNovoTelefone}
                    onChange={(e) => setSindicoNovoTelefone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Senha de Acesso do Síndico *</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 dígitos (ex: sindico123)"
                  value={sindicoNovaSenha}
                  onChange={(e) => setSindicoNovaSenha(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewSindicoModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition active:scale-98 cursor-pointer"
                >
                  Cadastrar Síndico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDITAR CONDOMÍNIO */}
      {editingCondo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Editar Condomínio</h3>
                  <p className="text-[11px] text-slate-500">Altere os dados de identificação, endereço e unidades</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCondo(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCondo} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome do Condomínio *</label>
                <input
                  type="text"
                  value={editingCondo.nome}
                  onChange={(e) => setEditingCondo({ ...editingCondo, nome: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Endereço Completo *</label>
                <input
                  type="text"
                  value={editingCondo.endereco || ''}
                  onChange={(e) => setEditingCondo({ ...editingCondo, endereco: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Cidade / Município *</label>
                  <input
                    type="text"
                    value={editingCondo.cidade}
                    onChange={(e) => setEditingCondo({ ...editingCondo, cidade: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estado (UF) *</label>
                  <select
                    value={editingCondo.uf}
                    onChange={(e) => setEditingCondo({ ...editingCondo, uf: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {['RJ', 'SP', 'MG', 'ES', 'BA', 'PR', 'SC', 'RS', 'GO', 'DF', 'PE', 'CE', 'PA', 'AM', 'MT', 'MS', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI', 'TO', 'RO', 'AC', 'AP', 'RR'].map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total de Unidades</label>
                  <input
                    type="number"
                    value={editingCondo.totalUnidades}
                    onChange={(e) => setEditingCondo({ ...editingCondo, totalUnidades: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={editingCondo.cnpj || ''}
                    onChange={(e) => setEditingCondo({ ...editingCondo, cnpj: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCondo(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CONFIGURAR E CADASTRAR VALORES DOS PLANOS */}
      {showConfigPlanosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cadastrar e Editar Valores dos Planos</h3>
                  <p className="text-[11px] text-slate-500">
                    Defina os preços, limites de apartamentos, bicicletário e período de teste gratuito (3 meses) para os síndicos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConfigPlanosModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvarConfigPlanos} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                {(['Teste', 'Smart', 'Plus', 'Pro', 'Enterprise'] as const).map((pKey) => {
                  const item: PlanoConfigItem = editablePlanos[pKey] || {
                    id: pKey,
                    nome: pKey,
                    valor: 0,
                    unidades: '',
                    bikes: '',
                    desc: '',
                    periodoMesesTeste: 3,
                  };

                  const isTestePlan = pKey === 'Teste';

                  return (
                    <div
                      key={pKey}
                      className={`p-4 rounded-2xl border ${
                        isTestePlan
                          ? 'border-cyan-300 bg-cyan-50/40 md:col-span-2'
                          : pKey === 'Plus'
                          ? 'border-amber-300 bg-amber-50/30'
                          : 'border-slate-200 bg-slate-50/70'
                      } space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isTestePlan ? (
                            <Gift className="w-4 h-4 text-cyan-600" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-purple-600" />
                          )}
                          <span className="font-extrabold text-sm text-slate-900">Plano {pKey}</span>
                          {isTestePlan && (
                            <span className="text-[10px] bg-cyan-200 text-cyan-900 font-bold px-2 py-0.5 rounded-full">
                              3 Meses Grátis para o Síndico
                            </span>
                          )}
                          {pKey === 'Plus' && (
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                              Mais Popular
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            {isTestePlan ? 'Valor (R$ / Teste)' : 'Valor Mensal (R$)'} *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.valor}
                            onChange={(e) =>
                              setEditablePlanos({
                                ...editablePlanos,
                                [pKey]: { ...item, valor: Number(e.target.value) },
                              })
                            }
                            required
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-emerald-700 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Limite Unidades *</label>
                          <input
                            type="text"
                            placeholder="Ex: Até 100 aptos"
                            value={item.unidades}
                            onChange={(e) =>
                              setEditablePlanos({
                                ...editablePlanos,
                                [pKey]: { ...item, unidades: e.target.value },
                              })
                            }
                            required
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Bicicletário *</label>
                          <input
                            type="text"
                            placeholder="Ex: Até 15 bikes"
                            value={item.bikes}
                            onChange={(e) =>
                              setEditablePlanos({
                                ...editablePlanos,
                                [pKey]: { ...item, bikes: e.target.value },
                              })
                            }
                            required
                            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {isTestePlan && (
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">
                            Período de Teste Gratuito (Meses):
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            value={item.periodoMesesTeste || 3}
                            onChange={(e) =>
                              setEditablePlanos({
                                ...editablePlanos,
                                [pKey]: { ...item, id: (item.id || pKey) as PlanoTipo, periodoMesesTeste: Number(e.target.value) },
                              })
                            }
                            className="w-full sm:w-1/3 bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-cyan-800 focus:outline-none focus:border-cyan-500"
                          />
                          <p className="text-[10px] text-cyan-700 mt-1">
                            Ao cadastrar um condomínio com este plano, o síndico terá acesso total durante {item.periodoMesesTeste || 3} meses sem cobrança.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Descrição / Benefícios *</label>
                        <input
                          type="text"
                          placeholder="Descrição rápida do plano..."
                          value={item.desc}
                          onChange={(e) =>
                            setEditablePlanos({
                              ...editablePlanos,
                              [pKey]: { ...item, desc: e.target.value },
                            })
                          }
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleRestaurarPlanosPadrao}
                  className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Restaurar Padrão
                </button>

                <div className="flex-1 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowConfigPlanosModal(false)}
                    className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition active:scale-98 cursor-pointer"
                  >
                    Salvar Valores dos Planos
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: ESTENDER PERÍODO DE TESTE GRATUITO DO CONDOMÍNIO */}
      {estenderTesteCondo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-cyan-100 text-cyan-800 text-base">
                  🧪
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Aumentar Período de Teste Gratuito</h3>
                  <p className="text-[11px] text-slate-500">
                    Condomínio: <strong className="text-slate-800">{estenderTesteCondo.nome}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEstenderTesteCondo(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmarEstenderTeste} className="space-y-4">
              <div className="p-3.5 bg-cyan-50/80 border border-cyan-200 rounded-2xl text-cyan-950 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">Vencimento Atual do Teste:</span>
                  <span className="font-black text-cyan-900 bg-white px-2.5 py-1 rounded-lg border border-cyan-200 text-xs">
                    {estenderTesteCondo.dataFimTeste ? estenderTesteCondo.dataFimTeste.split('-').reverse().join('/') : 'Não definido'}
                  </span>
                </div>
                <p className="text-[11px] text-cyan-800">
                  Você pode estender o período gratuito do síndico quantas vezes quiser para facilitar a adesão do condomínio!
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-2">Selecione quanto tempo deseja adicionar:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '+ 30 dias (1 Mês)', dias: 30 },
                    { label: '+ 60 dias (2 Meses)', dias: 60 },
                    { label: '+ 90 dias (3 Meses)', dias: 90 },
                    { label: '+ 180 dias (6 Meses)', dias: 180 },
                  ].map((opt) => (
                    <button
                      key={opt.dias}
                      type="button"
                      onClick={() => {
                        setExtensaoDias(opt.dias);
                        setExtensaoDataCustom('');
                      }}
                      className={`p-3 rounded-xl border text-left font-bold transition cursor-pointer ${
                        extensaoDias === opt.dias && !extensaoDataCustom
                          ? 'border-cyan-600 bg-cyan-50 text-cyan-900 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="text-xs">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ou escolha uma data de vencimento específica:
                </label>
                <input
                  type="date"
                  value={extensaoDataCustom}
                  onChange={(e) => {
                    setExtensaoDataCustom(e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEstenderTesteCondo(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-md shadow-cyan-600/20 transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🧪</span>
                  <span>Confirmar e Estender Teste</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: GESTÃO DE POLÍTICA DE SERVIÇOS & MÓDULOS POR CONDOMÍNIO */}
      {modulosCondoModal && (
        <ModulosCondominioModal
          condominio={modulosCondoModal}
          onClose={() => setModulosCondoModal(null)}
          onSuccess={() => {
            showNotification(
              `Política de serviços do condomínio "${modulosCondoModal.nome}" atualizada com sucesso!`
            );
            setModulosCondoModal(null);
          }}
        />
      )}
    </div>
  );
};
