import React, { useState, useEffect } from 'react';
import {
  Building2,
  Bike,
  Sparkles,
  Calendar,
  AlertCircle,
  Plus,
  Users,
  CheckCircle2,
  Edit,
  Trash2,
  ShieldCheck,
  Send,
  Check,
  PhoneCall,
  Search,
  Settings,
  X,
  MessageSquare,
  UserPlus,
  Save,
  MapPin,
  FileText,
  DollarSign,
  Vote,
  MessageCircle,
  Download,
  ThumbsUp,
  Wrench,
  HelpCircle,
  Copy,
  Receipt,
  FileSpreadsheet,
  KeyRound,
  Lock,
  Clock,
  Shirt,
  ShoppingBag,
  Package,
} from 'lucide-react';
import {
  Condominio,
  Morador,
  Bicicleta,
  AreaLazer,
  Reserva,
  Aviso,
  AreaStatus,
  NoticeCategory,
  Ocorrencia,
  BoletoMensalidade,
  ExtratoMensalItem,
  MuralPost,
  EnqueteCondominio,
  SugestaoMorador,
  DocumentoCondominio,
} from '../../types';
import { condoStore } from '../../services/mockStorage';
import { WhatsAppBroadcastPanel } from './WhatsAppBroadcastPanel';
import { GestaoEquipePermissoes } from './GestaoEquipePermissoes';
import { RegrasEncomendasPanel } from './RegrasEncomendasPanel';
import { RelatorioMensalAssembleiaModal } from './RelatorioMensalAssembleiaModal';
import { ItensCompartilhadosView } from '../compartilhados/ItensCompartilhadosView';
import { CentralTelefonicaView } from '../interfone/CentralTelefonicaView';
import { IntercomPTTView } from '../interfone/IntercomPTTView';
import { ScrollableTabsNav } from '../common/ScrollableTabsNav';
import { TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SindicoDashboardProps {
  condominio: Condominio;
  moradores: Morador[];
  bikes: Bicicleta[];
  areasLazer: AreaLazer[];
  reservas: Reserva[];
  avisos: Aviso[];
}

export const SindicoDashboard: React.FC<SindicoDashboardProps> = ({
  condominio,
  moradores,
  bikes,
  areasLazer,
  reservas,
  avisos,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'moradores'
    | 'interfone'
    | 'equipe'
    | 'regras_encomendas'
    | 'frota'
    | 'equipamentos'
    | 'liberacoes'
    | 'lazer'
    | 'reservas'
    | 'ocorrencias'
    | 'financeiro'
    | 'comunidade'
    | 'documentos'
    | 'avisos'
    | 'whatsapp'
    | 'aprovacoes'
    | 'configuracoes'
  >('moradores');

  // Filtro de Moradores
  const [moradorSearch, setMoradorSearch] = useState('');
  const [moradorFilterStatus, setMoradorFilterStatus] = useState<'todos' | 'em_dia' | 'com_pendencia' | 'pendente'>('todos');

  // Liberação Rápida Síndico / Validação de Código e Senhas
  const [liberacaoSearchCode, setLiberacaoSearchCode] = useState('');
  const [liberacaoFeedback, setLiberacaoFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Modais de Morador
  const [showAddMoradorModal, setShowAddMoradorModal] = useState(false);
  const [editingMorador, setEditingMorador] = useState<Morador | null>(null);
  const [recemAprovado, setRecemAprovado] = useState<{
    id: string;
    nome: string;
    bloco: string;
    apto: string;
    email: string;
    telefone: string;
    aprovadoEm: number;
  } | null>(null);

  // Form Novo Morador
  const [novoMoradorNome, setNovoMoradorNome] = useState('');
  const [novoMoradorBloco, setNovoMoradorBloco] = useState('1');
  const [novoMoradorApto, setNovoMoradorApto] = useState('101');
  const [novoMoradorTelefone, setNovoMoradorTelefone] = useState('');
  const [novoMoradorEmail, setNovoMoradorEmail] = useState('');
  const [novoMoradorSenha, setNovoMoradorSenha] = useState('morador123');
  const [novoMoradorAdimplencia, setNovoMoradorAdimplencia] = useState<'em_dia' | 'com_pendencia'>('em_dia');
  const [novoMoradorAprovadoDireto, setNovoMoradorAprovadoDireto] = useState(true);

  // Modais de Bicicleta
  const [newBikeCodigo, setNewBikeCodigo] = useState('');
  const [newBikeModelo, setNewBikeModelo] = useState('');
  const [newBikeTipo, setNewBikeTipo] = useState<'urbana' | 'e-bike' | 'mountain'>('urbana');
  const [newBikeLockPassword, setNewBikeLockPassword] = useState('');
  const [newBikeLocalizacao, setNewBikeLocalizacao] = useState('Totem Principal - Portaria A');
  const [editingBike, setEditingBike] = useState<Bicicleta | null>(null);

  // Gestão de Pontos & Totens de Devolução
  const [locaisDevolucaoList, setLocaisDevolucaoList] = useState<string[]>([
    'Totem Principal - Portaria A',
    'Totem Secundário - Portaria B',
    'Deck de Bicicletas - Subsolo 1',
    'Bicicletário da Piscina / Clube',
  ]);
  const [novoLocalDevolucao, setNovoLocalDevolucao] = useState('');

  // Modais de Áreas de Lazer
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaLazer | null>(null);
  const [novaAreaNome, setNovaAreaNome] = useState('');
  const [novaAreaTipo, setNovaAreaTipo] = useState<'piscina' | 'salao_festas' | 'churrasqueira' | 'academia' | 'quadra' | 'sauna'>('churrasqueira');
  const [novaAreaCapacidade, setNovaAreaCapacidade] = useState(25);
  const [novaAreaHorario, setNovaAreaHorario] = useState('08:00 às 22:00');
  const [novaAreaPermiteReserva, setNovaAreaPermiteReserva] = useState(true);
  const [novaAreaTaxa, setNovaAreaTaxa] = useState(100);

  // Area Status Form
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [newAreaStatus, setNewAreaStatus] = useState<AreaStatus>('aberto');
  const [newAreaAviso, setNewAreaAviso] = useState('');
  const [newAreaPrevisao, setNewAreaPrevisao] = useState('');

  // Notice Form
  const [noticeTitulo, setNoticeTitulo] = useState('');
  const [noticeMensagem, setNoticeMensagem] = useState('');
  const [noticeCategoria, setNoticeCategoria] = useState<NoticeCategory>('comunicado');
  const [noticePrioritario, setNoticePrioritario] = useState(false);

  // Form Configurações do Condomínio
  const [configNome, setConfigNome] = useState(condominio.nome);
  const [configEndereco, setConfigEndereco] = useState(condominio.endereco || '');
  const [configCidade, setConfigCidade] = useState(condominio.cidade || '');
  const [configUf, setConfigUf] = useState(condominio.uf || 'RJ');
  const [configUnidades, setConfigUnidades] = useState(condominio.totalUnidades);
  const [configCnpj, setConfigCnpj] = useState(condominio.cnpj || '');
  const [configSindicoNome, setConfigSindicoNome] = useState(condominio.sindicoNome);
  const [configSindicoEmail, setConfigSindicoEmail] = useState(condominio.sindicoEmail);
  const [configLimiteTempoBike, setConfigLimiteTempoBike] = useState(condominio.regras?.limiteTempoBikeMinutos || 180);
  const [configLimiteBikesMorador, setConfigLimiteBikesMorador] = useState(condominio.regras?.limiteBikesPorMorador || 1);
  const [configHorarioBicicletario, setConfigHorarioBicicletario] = useState(condominio.regras?.horarioBicicletario || '06:00 às 22:00');
  const [configTaxaSalao, setConfigTaxaSalao] = useState(condominio.regras?.taxaReservaSalao || 150);
  const [configDiasAntecedencia, setConfigDiasAntecedencia] = useState(condominio.regras?.diasAntecedenciaReserva || 30);

  // Estados de Ocorrências
  const [ocorrenciaFiltroStatus, setOcorrenciaFiltroStatus] = useState<'todas' | 'aberto' | 'em_andamento' | 'resolvido'>('todas');
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Ocorrencia | null>(null);
  const [respostaOcorrenciaTexto, setRespostaOcorrenciaTexto] = useState('');
  const [respostaOcorrenciaStatus, setRespostaOcorrenciaStatus] = useState<'em_andamento' | 'resolvido'>('resolvido');

  // Estados de Financeiro
  const [showAddExtratoModal, setShowAddExtratoModal] = useState(false);
  const [novoExtratoDescricao, setNovoExtratoDescricao] = useState('');
  const [novoExtratoTipo, setNovoExtratoTipo] = useState<'receita' | 'despesa'>('despesa');
  const [novoExtratoCategoria, setNovoExtratoCategoria] = useState<ExtratoMensalItem['categoria']>('manutencao_predial');
  const [novoExtratoValor, setNovoExtratoValor] = useState<number>(1500);
  const [novoExtratoData, setNovoExtratoData] = useState(new Date().toISOString().split('T')[0]);

  // Estados de Comunidade & Enquetes
  const [showAddEnqueteModal, setShowAddEnqueteModal] = useState(false);
  const [novaEnqueteTitulo, setNovaEnqueteTitulo] = useState('');
  const [novaEnqueteDescricao, setNovaEnqueteDescricao] = useState('');
  const [novaEnqueteOpcoes, setNovaEnqueteOpcoes] = useState<string[]>(['Sim, sou a favor', 'Não, sou contra']);
  const [novaEnqueteNovaOpcao, setNovaEnqueteNovaOpcao] = useState('');

  // Estados de Documentos
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [novoDocTitulo, setNovoDocTitulo] = useState('');
  const [novoDocCategoria, setNovoDocCategoria] = useState<DocumentoCondominio['categoria']>('regulamento');
  const [novoDocDescricao, setNovoDocDescricao] = useState('');
  const [novoDocTamanho, setNovoDocTamanho] = useState('2.4 MB');

  // Relatório Mensal Assembleia
  const [showRelatorioModal, setShowRelatorioModal] = useState(false);

  // Sincroniza formulário de configurações quando o condomínio for alterado ou carregado
  useEffect(() => {
    if (condominio) {
      setConfigNome(condominio.nome || '');
      setConfigEndereco(condominio.endereco || '');
      setConfigCidade(condominio.cidade || '');
      setConfigUf(condominio.uf || 'RJ');
      setConfigUnidades(condominio.totalUnidades || 0);
      setConfigCnpj(condominio.cnpj || '');
      setConfigSindicoNome(condominio.sindicoNome || '');
      setConfigSindicoEmail(condominio.sindicoEmail || '');
      setConfigLimiteTempoBike(condominio.regras?.limiteTempoBikeMinutos || 180);
      setConfigLimiteBikesMorador(condominio.regras?.limiteBikesPorMorador || 1);
      setConfigHorarioBicicletario(condominio.regras?.horarioBicicletario || '06:00 às 22:00');
      setConfigTaxaSalao(condominio.regras?.taxaReservaSalao || 150);
      setConfigDiasAntecedencia(condominio.regras?.diasAntecedenciaReserva || 30);
      if (condominio.regras?.locaisDevolucao && condominio.regras.locaisDevolucao.length > 0) {
        setLocaisDevolucaoList(condominio.regras.locaisDevolucao);
        if (!newBikeLocalizacao) {
          setNewBikeLocalizacao(condominio.regras.locaisDevolucao[0]);
        }
      }
    }
  }, [condominio]);

  const [feedbackMsg, setFeedbackMsg] = useState('');

  const condoId = condominio?.id || 'condo_park_avenue';
  const safeMoradores = moradores || [];
  const safeBikes = bikes || [];
  const safeAreasLazer = areasLazer || [];
  const safeReservas = reservas || [];
  const safeAvisos = avisos || [];

  const moradoresPendentes = condoStore.getMoradoresPendentes(condoId);
  const ocorrencias = condoStore.getOcorrencias(condoId);
  const extratoFinanceiro = condoStore.getExtratoFinanceiro(condoId);
  const boletosCondominio = condoStore.getBoletos(condoId);
  const enquetes = condoStore.getEnquetes(condoId);
  const muralPosts = condoStore.getMuralPosts(condoId);
  const sugestoes = condoStore.getSugestoes(condoId);
  const documentos = condoStore.getDocumentos(condoId);
  const adimplentesCount = safeMoradores.filter((m) => m.statusAdimplencia === 'em_dia').length;
  const inadimplentesCount = safeMoradores.filter((m) => m.statusAdimplencia === 'com_pendencia').length;

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(''), 5000);
  };

  // --- Handlers de Moradores ---
  const handleAddMorador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoMoradorNome || !novoMoradorEmail || !novoMoradorTelefone) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    condoStore.addMorador(condominio.id, {
      nome: novoMoradorNome,
      email: novoMoradorEmail,
      telefone: novoMoradorTelefone,
      senha: novoMoradorSenha || 'morador123',
      unidade: {
        bloco: novoMoradorBloco,
        apto: novoMoradorApto,
      },
      statusAdimplencia: novoMoradorAdimplencia,
      statusCadastro: novoMoradorAprovadoDireto ? 'ativo' : 'pendente_aprovacao',
      aprovadoPor: novoMoradorAprovadoDireto ? `${condominio.sindicoNome} (Síndico)` : undefined,
      aprovadoEm: novoMoradorAprovadoDireto ? Date.now() : undefined,
      solicitadoEm: Date.now(),
    });

    confetti({ particleCount: 60, spread: 60 });
    setShowAddMoradorModal(false);
    setNovoMoradorNome('');
    setNovoMoradorTelefone('');
    setNovoMoradorEmail('');
    setNovoMoradorSenha('morador123');
    showNotification(`Morador ${novoMoradorNome} cadastrado com sucesso!`);
  };

  const handleUpdateMorador = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMorador) return;

    condoStore.updateMorador(condominio.id, editingMorador.id, {
      nome: editingMorador.nome,
      email: editingMorador.email,
      telefone: editingMorador.telefone,
      unidade: editingMorador.unidade,
      statusAdimplencia: editingMorador.statusAdimplencia,
      statusCadastro: editingMorador.statusCadastro,
      senha: editingMorador.senha,
    });

    confetti({ particleCount: 40, spread: 50 });
    setEditingMorador(null);
    showNotification(`Cadastro de ${editingMorador.nome} atualizado com sucesso!`);
  };

  const handleDeleteMorador = (morador: Morador) => {
    if (confirm(`Deseja realmente remover o morador ${morador.nome} (Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto})?`)) {
      condoStore.deleteMorador(condominio.id, morador.id);
      showNotification(`Morador ${morador.nome} excluído com sucesso.`);
    }
  };

  const handleToggleAdimplencia = (morador: Morador) => {
    const novaSituacao = morador.statusAdimplencia === 'em_dia' ? 'com_pendencia' : 'em_dia';
    condoStore.updateMorador(condominio.id, morador.id, {
      statusAdimplencia: novaSituacao,
    });
    showNotification(`Situação de ${morador.nome} alterada para: ${novaSituacao === 'em_dia' ? 'Em Dia' : 'Com Pendência'}`);
  };

  const handleAprovar = (moradorId: string, moradorNome: string) => {
    const moradorEncontrado = safeMoradores.find((m) => m.id === moradorId);
    condoStore.aprovarMorador(condominio.id, moradorId, condominio.sindicoNome);
    confetti({ particleCount: 60, spread: 70 });
    
    if (moradorEncontrado) {
      setRecemAprovado({
        id: moradorEncontrado.id,
        nome: moradorEncontrado.nome,
        bloco: moradorEncontrado.unidade.bloco,
        apto: moradorEncontrado.unidade.apto,
        email: moradorEncontrado.email,
        telefone: moradorEncontrado.telefone,
        aprovadoEm: Date.now(),
      });
    }

    showNotification(`✅ Morador ${moradorNome} APROVADO! O cadastro foi ativado e está disponível na aba "Moradores".`);
  };

  const handleRecusar = (moradorId: string, moradorNome: string) => {
    if (confirm(`Deseja recusar o cadastro de ${moradorNome}?`)) {
      condoStore.recusarMorador(condominio.id, moradorId);
      showNotification(`Cadastro de ${moradorNome} recusado.`);
    }
  };

  // --- Handlers de Bicicletas ---
  const handleAddBike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBikeCodigo || !newBikeModelo) return;

    const pass = newBikeLockPassword.trim() || Math.floor(1000 + Math.random() * 9000).toString();
    const qr = `QR-${condominio.id.toUpperCase()}-${newBikeCodigo.toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const localInicial = newBikeLocalizacao.trim() || locaisDevolucaoList[0] || 'Totem Principal - Portaria A';

    const bikeData: any = {
      codigo: newBikeCodigo.toUpperCase(),
      modelo: newBikeModelo,
      tipo: newBikeTipo,
      status: 'disponivel',
      usuarioAtualId: null,
      qrToken: qr,
      lockPassword: pass,
      localizacaoAtual: localInicial,
      ultimaRevisao: new Date().toLocaleDateString('pt-BR'),
    };
    if (newBikeTipo === 'e-bike') {
      bikeData.nivelBateria = 100;
    }

    condoStore.addBike(condominio.id, bikeData);

    setNewBikeCodigo('');
    setNewBikeModelo('');
    setNewBikeLockPassword('');
    confetti({ particleCount: 50, spread: 60 });
    showNotification('Nova bicicleta cadastrada na frota do condomínio com sucesso!');
  };

  const handleAddLocalDevolucao = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = novoLocalDevolucao.trim();
    if (!trimmed) return;
    if (locaisDevolucaoList.some((l) => l.toLowerCase() === trimmed.toLowerCase())) {
      showNotification('Este ponto de devolução já está cadastrado.');
      return;
    }
    const updated = [...locaisDevolucaoList, trimmed];
    setLocaisDevolucaoList(updated);
    setNovoLocalDevolucao('');

    condoStore.updateCondominio(condominio.id, {
      regras: {
        ...condominio.regras,
        limiteTempoBikeMinutos: Number(configLimiteTempoBike),
        limiteBikesPorMorador: Number(configLimiteBikesMorador),
        horarioBicicletario: configHorarioBicicletario,
        diasAntecedenciaReserva: Number(configDiasAntecedencia),
        taxaReservaSalao: Number(configTaxaSalao),
        locaisDevolucao: updated,
      },
    });
    confetti({ particleCount: 40, spread: 50 });
    showNotification(`Ponto "${trimmed}" cadastrado como local de devolução oficial!`);
  };

  const handleRemoveLocalDevolucao = (locToRemove: string) => {
    if (locaisDevolucaoList.length <= 1) {
      alert('O condomínio precisa ter pelo menos um ponto de devolução cadastrado.');
      return;
    }
    if (confirm(`Deseja remover o ponto de devolução "${locToRemove}"?`)) {
      const updated = locaisDevolucaoList.filter((l) => l !== locToRemove);
      setLocaisDevolucaoList(updated);
      condoStore.updateCondominio(condominio.id, {
        regras: {
          ...condominio.regras,
          limiteTempoBikeMinutos: Number(configLimiteTempoBike),
          limiteBikesPorMorador: Number(configLimiteBikesMorador),
          horarioBicicletario: configHorarioBicicletario,
          diasAntecedenciaReserva: Number(configDiasAntecedencia),
          taxaReservaSalao: Number(configTaxaSalao),
          locaisDevolucao: updated,
        },
      });
      showNotification(`Ponto "${locToRemove}" removido.`);
    }
  };

  const handleUpdateBike = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBike) return;

    condoStore.updateBike(condominio.id, editingBike.id, {
      codigo: editingBike.codigo,
      modelo: editingBike.modelo,
      tipo: editingBike.tipo,
      lockPassword: editingBike.lockPassword,
      status: editingBike.status,
      localizacaoAtual: editingBike.localizacaoAtual,
    });

    confetti({ particleCount: 40, spread: 50 });
    setEditingBike(null);
    showNotification(`Bicicleta ${editingBike.codigo} atualizada!`);
  };

  const handleDeleteBike = (bike: Bicicleta) => {
    if (confirm(`Deseja remover a bicicleta #${bike.codigo} (${bike.modelo}) da frota?`)) {
      condoStore.deleteBike(condominio.id, bike.id);
      showNotification(`Bicicleta #${bike.codigo} removida.`);
    }
  };

  // --- Handlers de Áreas de Lazer ---
  const handleAddArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaAreaNome) return;

    condoStore.addAreaLazer(condominio.id, {
      nome: novaAreaNome,
      tipo: novaAreaTipo,
      status: 'aberto',
      aviso: 'Disponível para os moradores',
      horarioFuncionamento: novaAreaHorario,
      capacidade: Number(novaAreaCapacidade) || 20,
      permiteReserva: novaAreaPermiteReserva,
      taxaReserva: Number(novaAreaTaxa) || 0,
    });

    confetti({ particleCount: 50, spread: 60 });
    setShowAddAreaModal(false);
    setNovaAreaNome('');
    showNotification(`Área "${novaAreaNome}" cadastrada com sucesso!`);
  };

  const handleUpdateArea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArea) return;

    condoStore.updateAreaLazer(condominio.id, editingArea.id, {
      nome: editingArea.nome,
      tipo: editingArea.tipo,
      capacidade: Number(editingArea.capacidade),
      horarioFuncionamento: editingArea.horarioFuncionamento,
      permiteReserva: editingArea.permiteReserva,
      taxaReserva: Number(editingArea.taxaReserva),
      aviso: editingArea.aviso,
      status: editingArea.status,
      previsaoReabertura: editingArea.previsaoReabertura,
    });

    confetti({ particleCount: 40, spread: 50 });
    setEditingArea(null);
    showNotification(`Área "${editingArea.nome}" atualizada com sucesso!`);
  };

  const handleDeleteArea = (area: AreaLazer) => {
    if (confirm(`Deseja remover o espaço "${area.nome}" do condomínio?`)) {
      condoStore.deleteAreaLazer(condominio.id, area.id);
      showNotification(`Área "${area.nome}" removida.`);
    }
  };

  const handleUpdateAreaStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAreaId) return;

    condoStore.updateAreaLazerStatus(
      condominio.id,
      selectedAreaId,
      newAreaStatus,
      newAreaAviso || 'Status atualizado pela administração.',
      newAreaPrevisao
    );

    setSelectedAreaId(null);
    confetti({ particleCount: 40, spread: 50 });
    showNotification('Status da área comum atualizado e comunicado gerado para os moradores!');
  };

  const handlePublishNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitulo || !noticeMensagem) return;

    condoStore.addAviso(condominio.id, {
      titulo: noticeTitulo,
      mensagem: noticeMensagem,
      categoria: noticeCategoria,
      prioritario: noticePrioritario,
      autor: condominio.sindicoNome,
      autorCargo: 'Síndico Geral',
    });

    setNoticeTitulo('');
    setNoticeMensagem('');
    setNoticePrioritario(false);
    confetti({ particleCount: 60, spread: 60 });
    showNotification('Aviso publicado no mural digital dos moradores com sucesso!');
  };

  const handleSaveCondoConfig = (e: React.FormEvent) => {
    e.preventDefault();
    condoStore.updateCondominio(condominio.id, {
      nome: configNome,
      endereco: configEndereco,
      cidade: configCidade,
      uf: configUf,
      totalUnidades: Number(configUnidades),
      cnpj: configCnpj,
      sindicoNome: configSindicoNome,
      sindicoEmail: configSindicoEmail,
      regras: {
        limiteTempoBikeMinutos: Number(configLimiteTempoBike),
        limiteBikesPorMorador: Number(configLimiteBikesMorador),
        horarioBicicletario: configHorarioBicicletario,
        diasAntecedenciaReserva: Number(configDiasAntecedencia),
        taxaReservaSalao: Number(configTaxaSalao),
        locaisDevolucao: locaisDevolucaoList,
      },
    });

    confetti({ particleCount: 50, spread: 60 });
    showNotification('Informações e regras do condomínio atualizadas com sucesso!');
  };

  // Handlers de Ocorrências
  const handleResponderOcorrencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOcorrencia) return;

    condoStore.responderOcorrencia(
      condominio.id,
      selectedOcorrencia.id,
      respostaOcorrenciaTexto,
      respostaOcorrenciaStatus,
      condominio.sindicoNome
    );

    confetti({ particleCount: 40, spread: 50 });
    showNotification(`Chamado #${selectedOcorrencia.id.slice(-4)} atualizado com sucesso!`);
    setSelectedOcorrencia(null);
    setRespostaOcorrenciaTexto('');
  };

  // Handlers Financeiros
  const handleAddExtratoItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoExtratoDescricao || novoExtratoValor <= 0) {
      alert('Preencha a descrição e um valor válido.');
      return;
    }

    condoStore.addExtratoItem(condominio.id, {
      mesReferencia: 'Agosto/2026',
      descricao: novoExtratoDescricao,
      tipo: novoExtratoTipo,
      categoria: novoExtratoCategoria,
      valor: Number(novoExtratoValor),
      data: novoExtratoData,
    });

    confetti({ particleCount: 40, spread: 50 });
    showNotification('Lançamento financeiro registrado com sucesso no balancete!');
    setShowAddExtratoModal(false);
    setNovoExtratoDescricao('');
    setNovoExtratoValor(1500);
  };

  const handleToggleBoletoPago = (boletoId: string) => {
    condoStore.marcarBoletoComoPago(condominio.id, boletoId);
    showNotification('Status do boleto alterado para PAGO com sucesso!');
  };

  // Handlers de Enquetes
  const handleAddEnquete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaEnqueteTitulo || novaEnqueteOpcoes.length < 2) {
      alert('A enquete precisa de um título e no mínimo 2 opções de resposta.');
      return;
    }

    condoStore.addEnquete(condominio.id, {
      titulo: novaEnqueteTitulo,
      descricao: novaEnqueteDescricao,
      opcoesTextos: novaEnqueteOpcoes,
    });

    confetti({ particleCount: 50, spread: 60 });
    showNotification('Enquete criada e aberta para votação de todos os moradores!');
    setShowAddEnqueteModal(false);
    setNovaEnqueteTitulo('');
    setNovaEnqueteDescricao('');
    setNovaEnqueteOpcoes(['Sim, sou a favor', 'Não, sou contra']);
  };

  const handleFinalizarEnquete = (enqueteId: string) => {
    if (confirm('Deseja encerrar esta enquete? Novos votos não serão mais aceitos.')) {
      condoStore.finalizarEnquete(condominio.id, enqueteId);
      showNotification('Enquete finalizada com sucesso.');
    }
  };

  // Handlers de Documentos
  const handleAddDocumento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoDocTitulo || !novoDocDescricao) {
      alert('Preencha o título e a descrição do documento.');
      return;
    }

    condoStore.addDocumento(condominio.id, {
      titulo: novoDocTitulo,
      categoria: novoDocCategoria,
      descricao: novoDocDescricao,
      tamanho: novoDocTamanho,
      tipoArquivo: 'pdf',
    });

    confetti({ particleCount: 40, spread: 50 });
    showNotification('Documento publicado e disponibilizado para consulta dos moradores!');
    setShowAddDocModal(false);
    setNovoDocTitulo('');
    setNovoDocDescricao('');
  };

  const handleDeleteDocumento = (docId: string) => {
    if (confirm('Deseja excluir este documento da biblioteca oficial?')) {
      condoStore.deleteDocumento(condominio.id, docId);
      showNotification('Documento excluído.');
    }
  };

  const handleDeleteMuralPost = (postId: string) => {
    if (confirm('Deseja remover esta publicação do mural comunitário?')) {
      condoStore.deleteMuralPost(condominio.id, postId);
      showNotification('Publicação moderada e removida do mural.');
    }
  };

  const handleUpdateSugestaoStatus = (sugId: string, status: SugestaoMorador['status']) => {
    condoStore.updateSugestaoStatus(condominio.id, sugId, status);
    showNotification('Status da sugestão atualizado.');
  };

  // Filtragem de Moradores
  const filteredMoradores = moradores.filter((m) => {
    const matchesSearch =
      m.nome.toLowerCase().includes(moradorSearch.toLowerCase()) ||
      m.unidade.bloco.toLowerCase().includes(moradorSearch.toLowerCase()) ||
      m.unidade.apto.toLowerCase().includes(moradorSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(moradorSearch.toLowerCase()) ||
      m.telefone.includes(moradorSearch);

    if (!matchesSearch) return false;

    if (moradorFilterStatus === 'em_dia') return m.statusAdimplencia === 'em_dia';
    if (moradorFilterStatus === 'com_pendencia') return m.statusAdimplencia === 'com_pendencia';
    if (moradorFilterStatus === 'pendente') return m.statusCadastro === 'pendente_aprovacao';

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner Executivo */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Painel de Gestão do Síndico
            </span>
            <span className="text-xs text-slate-700 font-bold">{condominio.nome}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Administração Geral do Condomínio
          </h1>
          <p className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
            <span>Síndico: <strong className="text-slate-800">{condominio.sindicoNome}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <MapPin className="w-3 h-3 text-indigo-600" />
              {condominio.endereco || 'Endereço não informado'} ({condominio.cidade} - {condominio.uf})
            </span>
            <span>•</span>
            <span><strong>{condominio.totalUnidades}</strong> Unidades</span>
          </p>
        </div>

        {/* Ações Rápidas do Síndico */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-sindico-header-novo-morador"
              onClick={() => {
                setActiveTab('moradores');
                setShowAddMoradorModal(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Cadastrar Morador</span>
            </button>

            <button
              id="btn-sindico-header-relatorio"
              onClick={() => setShowRelatorioModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-600/20 transition active:scale-98 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Relatório de Assembleia</span>
            </button>

            <button
              id="btn-sindico-header-config"
              onClick={() => setActiveTab('configuracoes')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition active:scale-98 cursor-pointer border border-slate-200"
            >
              <Settings className="w-4 h-4 text-slate-600" />
              <span>Alterar Dados & Regras</span>
            </button>
          </div>

          {/* Resumos Executivos */}
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 text-center">
              <div className="text-base font-extrabold text-indigo-900 leading-tight">{moradores.length}</div>
              <div className="text-[10px] font-semibold text-indigo-700">Moradores</div>
            </div>
            <div className="bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 text-center">
              <div className="text-base font-extrabold text-purple-900 leading-tight">{bikes.length}</div>
              <div className="text-[10px] font-semibold text-purple-700">Frota Bikes</div>
            </div>
            <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-center">
              <div className="text-base font-extrabold text-emerald-900 leading-tight">{areasLazer.length}</div>
              <div className="text-[10px] font-semibold text-emerald-700">Áreas Lazer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg('')} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Abas de Navegação */}
      <ScrollableTabsNav>
        <button
          onClick={() => setActiveTab('moradores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'moradores'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Moradores & Cadastros ({moradores.length})</span>
        </button>

        <button
          id="tab-sindico-interfone"
          onClick={() => setActiveTab('interfone')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'interfone'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300'
          }`}
        >
          <PhoneCall className="w-4 h-4 text-emerald-600" />
          <span>Central Telefônica & Interfone</span>
        </button>

        <button
          id="tab-sindico-equipe"
          onClick={() => setActiveTab('equipe')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'equipe'
              ? 'bg-indigo-900 text-white shadow-md shadow-indigo-900/30'
              : 'text-indigo-950 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Equipe & Permissões ({condoStore.getFuncionarios(condominio.id).length})</span>
        </button>

        <button
          id="tab-sindico-regras-encomendas"
          onClick={() => setActiveTab('regras_encomendas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'regras_encomendas'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <Package className="w-4 h-4 text-amber-600" />
          <span>Regras de Encomendas ({condominio.regras?.diasLimiteRetiradaEncomenda ?? 5} dias)</span>
        </button>

        <button
          onClick={() => setActiveTab('frota')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'frota'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Gestão da Frota ({bikes.length})</span>
        </button>

        <button
          id="tab-sindico-liberacoes"
          onClick={() => setActiveTab('liberacoes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'liberacoes'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <KeyRound className="w-4 h-4 text-emerald-600" />
          <span>Liberação & Senhas ({bikes.filter((b) => b.status === 'reservada_5min').length})</span>
          {bikes.filter((b) => b.status === 'reservada_5min').length > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
              {bikes.filter((b) => b.status === 'reservada_5min').length}
            </span>
          )}
        </button>

        <button
          id="tab-sindico-equipamentos"
          onClick={() => setActiveTab('equipamentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'equipamentos'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Itens & Equipamentos</span>
        </button>

        <button
          onClick={() => setActiveTab('lazer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'lazer'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Áreas Comuns & Lazer ({areasLazer.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reservas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'reservas'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda & Reservas ({reservas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ocorrencias')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap relative cursor-pointer ${
            activeTab === 'ocorrencias'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-amber-700 bg-amber-50 hover:bg-amber-100 hover:text-amber-900 border border-amber-200/80'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Ocorrências & Chamados ({ocorrencias.length})</span>
          {ocorrencias.filter((o) => o.status === 'aberto').length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {ocorrencias.filter((o) => o.status === 'aberto').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('financeiro')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'financeiro'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Financeiro & Prestação</span>
        </button>

        <button
          onClick={() => setActiveTab('comunidade')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'comunidade'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>Comunidade & Enquetes ({enquetes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('documentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'documentos'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documentos ({documentos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('avisos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'avisos'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Comunicados ({avisos.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-200/80'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Disparador WhatsApp</span>
        </button>

        <button
          onClick={() => setActiveTab('aprovacoes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap relative cursor-pointer ${
            activeTab === 'aprovacoes'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Aprovações</span>
          {moradoresPendentes.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
              {moradoresPendentes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('configuracoes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'configuracoes'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configurações & Regras</span>
        </button>
      </ScrollableTabsNav>

      {/* ========================================================================= */}
      {/* ABA: MORADORES & CADASTROS */}
      {/* ========================================================================= */}
      {activeTab === 'moradores' && (
        <div className="space-y-6">
          {/* Métricas e Botão de Ação */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase">Total de Moradores</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-1">{moradores.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Cadastrados no sistema</div>
            </div>
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-emerald-700 uppercase">Em Dia (Adimplentes)</div>
              <div className="text-3xl font-extrabold text-emerald-800 mt-1">{adimplentesCount}</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Liberados para bikes e salão</div>
            </div>
            <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
              <div className="text-xs font-bold text-rose-700 uppercase">Com Pendências</div>
              <div className="text-3xl font-extrabold text-rose-800 mt-1">{inadimplentesCount}</div>
              <div className="text-[11px] text-rose-600 mt-0.5">Aviso financeiro ativo</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-indigo-900 uppercase">Adicionar Morador</div>
                <div className="text-xs text-indigo-700 mt-1">Cadastre novos moradores diretamente</div>
              </div>
              <button
                id="btn-sindico-novo-morador"
                onClick={() => setShowAddMoradorModal(true)}
                className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Cadastrar Novo Morador</span>
              </button>
            </div>
          </div>

          {/* Tabela de Moradores */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Gerenciamento Completo de Moradores ({filteredMoradores.length})
                </h3>
              </div>

              {/* Filtros e Busca */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, bloco, apto..."
                    value={moradorSearch}
                    onChange={(e) => setMoradorSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <select
                  value={moradorFilterStatus}
                  onChange={(e) => setMoradorFilterStatus(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="em_dia">Apenas Em Dia</option>
                  <option value="com_pendencia">Apenas Com Pendência</option>
                  <option value="pendente">Apenas Pendentes de Aprovação</option>
                </select>

                <button
                  onClick={() => setShowAddMoradorModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Morador</span>
                </button>
              </div>
            </div>

            {filteredMoradores.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-800">Nenhum morador encontrado</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  {moradorSearch || moradorFilterStatus !== 'todos'
                    ? 'Tente alterar os filtros de busca acima.'
                    : 'Cadastre o primeiro morador do condomínio para liberar acessos e permissões.'}
                </p>
                <button
                  onClick={() => setShowAddMoradorModal(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition active:scale-98 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Primeiro Morador</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Morador</th>
                      <th className="py-3 px-4">Unidade</th>
                      <th className="py-3 px-4">Contato (WhatsApp / E-mail)</th>
                      <th className="py-3 px-4">Situação Financeira</th>
                      <th className="py-3 px-4">Status Acesso</th>
                      <th className="py-3 px-4 text-right">Ações do Síndico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMoradores.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                              {m.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{m.nome}</div>
                              <div className="text-[10px] text-slate-400">Login: {m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg">
                            Bloco {m.unidade.bloco} - Apto {m.unidade.apto}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          <div className="font-medium text-slate-900 flex items-center gap-1">
                            <span>{m.telefone}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{m.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleAdimplencia(m)}
                            title="Clique para alternar entre Em Dia e Com Pendência"
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 cursor-pointer transition ${
                              m.statusAdimplencia === 'em_dia'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${m.statusAdimplencia === 'em_dia' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{m.statusAdimplencia === 'em_dia' ? 'Em Dia' : 'Com Pendência'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              m.statusCadastro === 'ativo'
                                ? 'bg-slate-100 text-slate-700 border border-slate-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            }`}
                          >
                            {m.statusCadastro === 'ativo' ? 'Ativo' : 'Pendente'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {/* Enviar WhatsApp */}
                          <a
                            href={`https://wa.me/${m.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Olá ${m.nome}, aqui é da Administração do ${condominio.nome}. Seu acesso ao aplicativo está ativo. Login: ${m.email} | Senha padrão: morador123`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs transition cursor-pointer"
                            title="Enviar credenciais via WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">WhatsApp</span>
                          </a>

                          {/* Editar */}
                          <button
                            onClick={() => setEditingMorador({ ...m, unidade: { ...m.unidade } })}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs transition cursor-pointer"
                            title="Editar informações do morador"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => handleDeleteMorador(m)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition cursor-pointer"
                            title="Excluir morador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: EQUIPE & PERMISSÕES DOS FUNCIONÁRIOS (PORTEIRO, ZELADOR, ADMIN) */}
      {/* ========================================================================= */}
      {activeTab === 'equipe' && (
        <GestaoEquipePermissoes condominio={condominio} />
      )}

      {/* ========================================================================= */}
      {/* ABA: REGRAS & PRAZOS DE ENCOMENDAS (EX: JARDINS DO BRITO - 5 DIAS) */}
      {/* ========================================================================= */}
      {activeTab === 'regras_encomendas' && (
        <RegrasEncomendasPanel condominio={condominio} />
      )}

      {/* ========================================================================= */}
      {/* ABA: GESTÃO DA FROTA DE BIKES */}
      {/* ========================================================================= */}
      {activeTab === 'frota' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulário de Adicionar Bicicleta */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Plus className="w-5 h-5 text-indigo-600" />
              Cadastrar Nova Bicicleta na Frota
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Provisione uma nova unidade de bike compartilhada com QR Code e trava digital.
            </p>

            <form onSubmit={handleAddBike} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Código de Identificação *
                </label>
                <input
                  type="text"
                  placeholder="Ex: BK-01"
                  value={newBikeCodigo}
                  onChange={(e) => setNewBikeCodigo(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 uppercase focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Modelo e Marca *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Caloi Vulcan Aro 29"
                  value={newBikeModelo}
                  onChange={(e) => setNewBikeModelo(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tipo de Bicicleta:
                </label>
                <select
                  value={newBikeTipo}
                  onChange={(e) => setNewBikeTipo(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="urbana">Urbana Convencional</option>
                  <option value="e-bike">E-Bike Elétrica Assistida</option>
                  <option value="mountain">Mountain Bike (MTB)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Senha do Cadeado Digital (4 Dígitos):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Ex: 5820 (ou deixe vazio para gerar aleatório)"
                  value={newBikeLockPassword}
                  onChange={(e) => setNewBikeLockPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition mt-2 active:scale-98 cursor-pointer"
              >
                Cadastrar Bicicleta
              </button>
            </form>
          </div>

          {/* Grid da Frota Atual */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Frota Atual do Condomínio ({bikes.length})</span>
            </h3>

            {bikes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Bike className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-800">Nenhuma bicicleta cadastrada</h4>
                <p className="text-xs text-slate-500 mt-1">Use o formulário ao lado para cadastrar sua frota inicial.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bikes.map((bike) => (
                  <div
                    key={bike.id}
                    className={`p-5 rounded-2xl border text-xs flex flex-col justify-between ${
                      bike.status === 'manutencao'
                        ? 'bg-rose-50/40 border-rose-200 shadow-sm'
                        : bike.status === 'em_uso'
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-white border-slate-200/80 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg">
                            #{bike.codigo}
                          </span>
                          <span className="text-slate-600 capitalize font-medium">{bike.tipo}</span>
                        </div>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            bike.status === 'disponivel'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : bike.status === 'em_uso'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {bike.status === 'disponivel' ? 'Disponível' : bike.status === 'em_uso' ? 'Em Uso' : 'Manutenção'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900">{bike.modelo}</h4>
                      <p className="text-slate-500 text-xs mt-1">
                        Cadeado: <strong className="text-slate-800 font-mono">{bike.lockPassword}</strong>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Local: {bike.localizacaoAtual || 'Bicicletário'}
                      </p>

                      {bike.status === 'manutencao' && bike.avariasAtuais && (
                        <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                          Avarias: {bike.avariasAtuais.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setEditingBike({ ...bike })}
                        className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold transition cursor-pointer"
                        title="Editar Bicicleta"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {bike.status === 'manutencao' ? (
                        <button
                          onClick={() => condoStore.updateBikeStatus(condominio.id, bike.id, 'disponivel', [])}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                        >
                          Liberar da Oficina
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            condoStore.updateBikeStatus(condominio.id, bike.id, 'manutencao', [
                              'Intervenção preventiva agendada pelo síndico',
                            ])
                          }
                          className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs transition border border-slate-200 cursor-pointer"
                        >
                          Interditar p/ Revisão
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteBike(bike)}
                        className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold transition cursor-pointer"
                        title="Excluir Bicicleta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: CENTRAL DE LIBERAÇÃO E SENHAS DE BIKES & CADEADOS                   */}
      {/* ========================================================================= */}
      {activeTab === 'liberacoes' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-500/20">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Painel do Síndico & Portaria
                </span>
                <span className="text-xs text-slate-300">Liberação Sem Sensores Físicos</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                <KeyRound className="w-6 h-6 text-emerald-400" />
                <span>Central de Senhas & Liberação de Bicicletas</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                O morador solicita no app, recebe a senha e tem 5 minutos de tolerância para ir até a portaria/totem.
                O síndico e o porteiro podem validar o código gerado ou liberar diretamente por esta tela.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-center min-w-[170px]">
              <div className="text-2xl font-black text-emerald-400">
                {bikes.filter((b) => b.status === 'reservada_5min').length}
              </div>
              <div className="text-xs font-semibold text-slate-300">Reserva(s) em Andamento</div>
            </div>
          </div>

          {/* Validador Rápido de Código de 6 Dígitos */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base">Validar Código de Retirada do Morador</h3>
            </div>
            <p className="text-xs text-slate-600">
              Digite o código de 6 dígitos gerado no app do morador (ex: <strong className="font-mono text-slate-800">849201</strong>) ou o código da bicicleta (ex: <strong className="font-mono text-slate-800">BK-01</strong>):
            </p>

            {liberacaoFeedback && (
              <div
                className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${
                  liberacaoFeedback.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {liberacaoFeedback.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{liberacaoFeedback.message}</span>
                </div>
                <button onClick={() => setLiberacaoFeedback(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!liberacaoSearchCode.trim()) return;
                const res = condoStore.confirmarRetiradaPortaria(
                  condominio.id,
                  liberacaoSearchCode.trim(),
                  `${condominio.sindicoNome} (Síndico)`
                );
                setLiberacaoFeedback(res);
                if (res.success) {
                  confetti({ particleCount: 50, spread: 60 });
                  setLiberacaoSearchCode('');
                }
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={liberacaoSearchCode}
                onChange={(e) => setLiberacaoSearchCode(e.target.value.toUpperCase())}
                placeholder="Digite o código (ex: 849201 ou BK-01)"
                className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white uppercase"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-98"
              >
                Validar & Liberar Cadeado
              </button>
            </form>
          </div>

          {/* Lista de Bicicletas com Reserva Ativa de 5 Minutos */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600 animate-spin" />
              <span>Bicicletas com Reserva Ativa no Momento (5 Minutos)</span>
            </h3>

            {bikes.filter((b) => b.status === 'reservada_5min').length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                Nenhuma bicicleta com reserva pendente no momento. As reservas aparecem aqui em tempo real.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bikes
                  .filter((b) => b.status === 'reservada_5min')
                  .map((bike) => (
                    <div
                      key={bike.id}
                      className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono">
                          Bike #{bike.codigo}
                        </span>
                        <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full font-mono">
                          PIN: {bike.reservaCodigo || 'BK-5MIN'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{bike.modelo}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Morador: <strong>{bike.reservaMoradorNome}</strong> ({bike.reservaMoradorUnidade})
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs flex justify-between items-center">
                        <span className="text-slate-600 font-semibold">Senha do Cadeado:</span>
                        <span className="font-mono font-black text-emerald-700 text-base">
                          {bike.lockPassword}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          const res = condoStore.confirmarRetiradaPortaria(
                            condominio.id,
                            bike.id,
                            `${condominio.sindicoNome} (Síndico)`
                          );
                          setLiberacaoFeedback(res);
                          if (res.success) {
                            confetti({ particleCount: 40, spread: 50 });
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <Check className="w-4 h-4" />
                        <span>Confirmar Liberação & Destravar</span>
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Todas as Senhas de Cadeados Cadastradas na Frota */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              <span>Tabela de Senhas de Cadeados de Toda a Frota</span>
            </h3>
            <p className="text-xs text-slate-500">
              Guia oficial para o síndico e portaria consultar a senha de qualquer cadeado físico:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {bikes.map((bike) => (
                <div
                  key={bike.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-black text-slate-800">#{bike.codigo} - {bike.modelo}</div>
                    <div className="text-[11px] text-slate-500 capitalize">{bike.tipo} • {bike.localizacaoAtual || 'Totem Principal'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Senha</div>
                    <div className="font-mono font-black text-emerald-700 text-sm">{bike.lockPassword}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: ITENS E EQUIPAMENTOS COMPARTILHADOS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'equipamentos' && (
        <ItensCompartilhadosView
          condominio={condominio}
          isStaff={true}
          operadorNome={`${condominio.sindicoNome} (Síndico)`}
        />
      )}

      {activeTab === 'lazer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Espaços e Áreas Comuns ({areasLazer.length})
              </h3>
              <button
                onClick={() => setShowAddAreaModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nova Área / Espaço</span>
              </button>
            </div>

            {areasLazer.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Sparkles className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-800">Nenhuma área cadastrada</h4>
                <p className="text-xs text-slate-500 mt-1">Cadastre piscinas, churrasqueiras, salão de festas e academias.</p>
                <button
                  onClick={() => setShowAddAreaModal(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Espaço de Lazer</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {areasLazer.map((area) => (
                  <div
                    key={area.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{area.nome}</h4>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            area.status === 'aberto'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          }`}
                        >
                          {area.status === 'aberto' ? 'Liberado' : area.status}
                        </span>
                        {area.permiteReserva && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Reserva: R$ {area.taxaReserva || 0}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{area.aviso}</p>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                        <span>Horário: {area.horarioFuncionamento}</span>
                        <span>•</span>
                        <span>Capacidade: {area.capacidade} pessoas</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedAreaId(area.id);
                          setNewAreaStatus(area.status);
                          setNewAreaAviso(area.aviso);
                          setNewAreaPrevisao(area.previsaoReabertura || '');
                        }}
                        className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer"
                      >
                        Status
                      </button>
                      <button
                        onClick={() => setEditingArea({ ...area })}
                        className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                        title="Editar detalhes do espaço"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteArea(area)}
                        className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer"
                        title="Excluir espaço"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comutar Status */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Atualizar Status Operacional
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Notifique instantaneamente todos os moradores sobre fechamentos temporários ou liberações.
            </p>

            <form onSubmit={handleUpdateAreaStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Selecionar Área:
                </label>
                <select
                  value={selectedAreaId || ''}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedAreaId(id);
                    const a = areasLazer.find((x) => x.id === id);
                    if (a) {
                      setNewAreaStatus(a.status);
                      setNewAreaAviso(a.aviso);
                      setNewAreaPrevisao(a.previsaoReabertura || '');
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="">Selecione uma área...</option>
                  {areasLazer.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Novo Status:
                </label>
                <select
                  value={newAreaStatus}
                  onChange={(e) => setNewAreaStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="aberto">Aberta (Liberada para uso normal)</option>
                  <option value="limpeza">Em Limpeza / Higienização</option>
                  <option value="manutencao">Interditada para Manutenção</option>
                  <option value="fechado_clima">Fechada por Chuva / Clima</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Motivo / Comunicado:
                </label>
                <input
                  type="text"
                  value={newAreaAviso}
                  onChange={(e) => setNewAreaAviso(e.target.value)}
                  placeholder="Ex: Tratamento de choque de cloro na piscina"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Previsão de Reabertura (Opcional):
                </label>
                <input
                  type="text"
                  value={newAreaPrevisao}
                  onChange={(e) => setNewAreaPrevisao(e.target.value)}
                  placeholder="Ex: Hoje às 16:00 ou Amanhã"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={!selectedAreaId}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition shadow ${
                  selectedAreaId
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 active:scale-98 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Salvar & Notificar Moradores
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: RESERVAS */}
      {/* ========================================================================= */}
      {activeTab === 'reservas' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Todas as Reservas de Espaços Agendadas ({reservas.length})
          </h3>

          {reservas.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-slate-800">Nenhuma reserva agendada</h4>
              <p className="text-xs text-slate-500 mt-1">Quando os moradores reservarem salão de festas ou churrasqueira, elas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Espaço</th>
                    <th className="py-3 px-4">Data do Evento</th>
                    <th className="py-3 px-4">Turno</th>
                    <th className="py-3 px-4">Morador / Unidade</th>
                    <th className="py-3 px-4">Taxa Limpeza</th>
                    <th className="py-3 px-4">Termo Digital</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reservas.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{res.espaco}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {new Date(res.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-600">{res.periodo}</td>
                      <td className="py-3 px-4 text-slate-700">
                        Bloco {res.unidade.bloco} - Apto {res.unidade.apto}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">R$ {res.valorTaxa},00</td>
                      <td className="py-3 px-4">
                        {res.termoAceito ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                            Assinado ✓
                          </span>
                        ) : (
                          <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded">Pendente</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          {res.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: COMUNICADOS OFICIAIS */}
      {/* ========================================================================= */}
      {activeTab === 'avisos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Send className="w-5 h-5 text-indigo-600" />
              Publicar Novo Comunicado
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Envie um comunicado oficial para o mural digital dos moradores.
            </p>

            <form onSubmit={handlePublishNotice} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Título do Comunicado *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Manutenção preventiva na cisterna dia 20"
                  value={noticeTitulo}
                  onChange={(e) => setNoticeTitulo(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Categoria:
                </label>
                <select
                  value={noticeCategoria}
                  onChange={(e) => setNoticeCategoria(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="comunicado">Comunicado Geral</option>
                  <option value="manutencao">Aviso de Manutenção</option>
                  <option value="assembleia">Convocação de Assembleia</option>
                  <option value="urgente">Alerta Urgente</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mensagem Detalhada *
                </label>
                <textarea
                  rows={4}
                  placeholder="Descreva as orientações para os moradores..."
                  value={noticeMensagem}
                  onChange={(e) => setNoticeMensagem(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="noticePrio"
                  checked={noticePrioritario}
                  onChange={(e) => setNoticePrioritario(e.target.checked)}
                  className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="noticePrio" className="text-slate-700 font-bold cursor-pointer">
                  Marcar como aviso urgente de alta prioridade
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
              >
                Publicar no Mural Digital
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <h3 className="text-base font-bold text-slate-900">
              Comunicados Ativos no Mural ({avisos.length})
            </h3>

            {avisos.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-800">Nenhum comunicado publicado</h4>
                <p className="text-xs text-slate-500 mt-1">Publique convocações, informes e alertas no mural digital.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {avisos.map((a) => (
                  <div key={a.id} className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                          {a.categoria}
                        </span>
                        {a.prioritario && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white">
                            Urgente
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {new Date(a.criadoEm).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h4 className="font-bold text-base text-slate-900">{a.titulo}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{a.mensagem}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: DISPARO WHATSAPP EM MASSA */}
      {/* ========================================================================= */}
      {activeTab === 'whatsapp' && (
        <WhatsAppBroadcastPanel
          condominio={condominio}
          moradores={moradores}
        />
      )}

      {/* ========================================================================= */}
      {/* ABA: APROVAÇÕES PENDENTES */}
      {/* ========================================================================= */}
      {activeTab === 'aprovacoes' && (
        <div className="space-y-6">
          {/* Banner de Morador Recém-Aprovado */}
          {recemAprovado && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 border border-emerald-300 rounded-2xl p-5 shadow-sm transition-all animate-fadeIn">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wide bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-md">
                        Aprovado com Sucesso!
                      </span>
                      <span className="text-xs text-emerald-800 font-semibold">
                        {new Date(recemAprovado.aprovadoEm).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-emerald-950 mt-1">
                      {recemAprovado.nome} (Bloco {recemAprovado.bloco} - Apto {recemAprovado.apto})
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      E-mail: <strong>{recemAprovado.email}</strong> • Telefone: <strong>{recemAprovado.telefone}</strong>
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                      💡 O cadastro deste morador agora está <strong>ATIVO</strong> e disponível na aba <strong>Moradores</strong>. O acesso às bicicletas e áreas comuns foi liberado!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => {
                      setMoradorSearch(recemAprovado.nome);
                      setActiveTab('moradores');
                    }}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    <span>Ver na Aba Moradores</span>
                  </button>
                  <a
                    href={`https://wa.me/55${recemAprovado.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Olá ${recemAprovado.nome}! Seu cadastro no condomínio ${condominio.nome} foi APROVADO pela administração. Você já pode acessar o sistema para usar as bicicletas e reservar áreas de lazer!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Solicitações Pendentes */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Solicitações de Primeiro Acesso Aguardando Validação
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Valide a unidade, telefone e identidade antes de liberar o acesso do morador ao bicicletário e áreas de lazer.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                {moradoresPendentes.length} solicitação(ões) pendente(s)
              </span>
            </div>

            {moradoresPendentes.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">Nenhuma solicitação pendente!</h4>
                <p className="text-xs text-slate-500">Todos os moradores cadastrados foram analisados e aprovados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nome do Morador</th>
                      <th className="py-3 px-4">Unidade Residencial</th>
                      <th className="py-3 px-4">WhatsApp / Celular</th>
                      <th className="py-3 px-4">E-mail Cadastrado</th>
                      <th className="py-3 px-4 text-right">Ações do Síndico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {moradoresPendentes.map((m) => {
                      const outrosMoradoresNaUnidade = condoStore
                        .getMoradoresDaUnidade(m.condominioId, m.unidade.bloco, m.unidade.apto)
                        .filter((outro) => outro.id !== m.id);

                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{m.nome}</div>
                            <div className="text-[10px] text-slate-400">
                              Solicitado em {m.solicitadoEm ? new Date(m.solicitadoEm).toLocaleString('pt-BR') : 'Hoje'}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-indigo-900">
                            <div>Bloco {m.unidade.bloco} - Apto {m.unidade.apto}</div>
                            {outrosMoradoresNaUnidade.length > 0 ? (
                              <div className="mt-1 p-1 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-800 font-normal">
                                👥 <strong>Outros no apto:</strong> {outrosMoradoresNaUnidade.map((o) => `${o.nome} (${o.statusCadastro})`).join(', ')}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 font-normal">
                                1º morador cadastrado nesta unidade
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{m.telefone}</td>
                          <td className="py-3 px-4 text-slate-600">{m.email}</td>
                          <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleRecusar(m.id, m.nome)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 font-bold transition text-xs cursor-pointer"
                            >
                              Recusar
                            </button>
                            <button
                              onClick={() => handleAprovar(m.id, m.nome)}
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

          {/* Histórico de Cadastros Aprovados Recentemente */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Histórico de Moradores Aprovados ({safeMoradores.filter((m) => m.statusCadastro === 'ativo').length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lista de moradores com cadastro aprovado e acesso ativo ao sistema.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('moradores')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ir para Gerenciamento de Moradores</span>
              </button>
            </div>

            {safeMoradores.filter((m) => m.statusCadastro === 'ativo').length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Nenhum morador ativo aprovado até o momento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Morador Aprovado</th>
                      <th className="py-3 px-4">Unidade</th>
                      <th className="py-3 px-4">WhatsApp</th>
                      <th className="py-3 px-4">E-mail</th>
                      <th className="py-3 px-4">Status / Aprovado Por</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {safeMoradores
                      .filter((m) => m.statusCadastro === 'ativo')
                      .sort((a, b) => (b.aprovadoEm || 0) - (a.aprovadoEm || 0))
                      .map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{m.nome}</span>
                              {recemAprovado?.id === m.id && (
                                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                                  Recém-aprovado!
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-indigo-900">
                            Bloco {m.unidade.bloco} - Apto {m.unidade.apto}
                          </td>
                          <td className="py-3 px-4 text-slate-700">{m.telefone}</td>
                          <td className="py-3 px-4 text-slate-600">{m.email}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Ativo
                            </span>
                            {m.aprovadoPor && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Por {m.aprovadoPor} {m.aprovadoEm ? `em ${new Date(m.aprovadoEm).toLocaleDateString('pt-BR')}` : ''}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setMoradorSearch(m.nome);
                                setActiveTab('moradores');
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-indigo-600 hover:bg-indigo-50 font-bold transition text-xs cursor-pointer"
                            >
                              Ver Detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: CONFIGURAÇÕES & REGRAS DO CONDOMÍNIO */}
      {/* ========================================================================= */}
      {activeTab === 'configuracoes' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <Settings className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Configurações & Regras do Condomínio
              </h3>
              <p className="text-xs text-slate-500">
                Edite os dados cadastrais do empreendimento, endereço e parâmetros operacionais do condomínio.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveCondoConfig} className="space-y-6 text-xs text-slate-800">
            {/* Seção 1: Dados do Condomínio */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Dados de Identificação & Localização</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nome do Condomínio *</label>
                  <input
                    type="text"
                    value={configNome}
                    onChange={(e) => setConfigNome(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={configCnpj}
                    onChange={(e) => setConfigCnpj(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Endereço Completo (Rua/Avenida, Número, Bairro, CEP) *</label>
                  <input
                    type="text"
                    value={configEndereco}
                    onChange={(e) => setConfigEndereco(e.target.value)}
                    required
                    placeholder="Ex: Estrada do Monteiro, 1200 - Campo Grande"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cidade / Município *</label>
                  <input
                    type="text"
                    value={configCidade}
                    onChange={(e) => setConfigCidade(e.target.value)}
                    required
                    placeholder="Ex: Rio de Janeiro"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Estado (UF) *</label>
                    <select
                      value={configUf}
                      onChange={(e) => setConfigUf(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {['RJ', 'SP', 'MG', 'ES', 'BA', 'PR', 'SC', 'RS', 'GO', 'DF', 'PE', 'CE', 'PA', 'AM', 'MT', 'MS', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI', 'TO', 'RO', 'AC', 'AP', 'RR'].map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Total Unidades</label>
                    <input
                      type="number"
                      value={configUnidades}
                      onChange={(e) => setConfigUnidades(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Dados do Síndico */}
            <div className="border-t border-slate-100 pt-5">
              <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Dados de Contato do Síndico Responsável</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nome do Síndico *</label>
                  <input
                    type="text"
                    value={configSindicoNome}
                    onChange={(e) => setConfigSindicoNome(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail de Notificações *</label>
                  <input
                    type="email"
                    value={configSindicoEmail}
                    onChange={(e) => setConfigSindicoEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Seção 3: Regras Operacionais */}
            <div className="border-t border-slate-100 pt-5">
              <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Regras de Bicicletas & Reservas de Espaços</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Limite Tempo Bike (Minutos)</label>
                  <input
                    type="number"
                    value={configLimiteTempoBike}
                    onChange={(e) => setConfigLimiteTempoBike(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Horário Bicicletário</label>
                  <input
                    type="text"
                    value={configHorarioBicicletario}
                    onChange={(e) => setConfigHorarioBicicletario(e.target.value)}
                    placeholder="06:00 às 22:00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Taxa Reserva Salão (R$)</label>
                  <input
                    type="number"
                    value={configTaxaSalao}
                    onChange={(e) => setConfigTaxaSalao(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Todas as Configurações</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: OCORRÊNCIAS & CHAMADOS DOS MORADORES */}
      {/* ========================================================================= */}
      {activeTab === 'ocorrencias' && (
        <div className="space-y-6">
          {/* Header com Filtros */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <span>Gestão de Chamados & Ocorrências dos Moradores</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Acompanhe reclamações de barulho, vazamentos, manutenções e responda diretamente aos moradores.
              </p>
            </div>

            {/* Filtro por Status */}
            <div className="flex items-center gap-2">
              {(['todas', 'aberto', 'em_andamento', 'resolvido'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setOcorrenciaFiltroStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
                    ocorrenciaFiltroStatus === st
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'todas' ? 'Todas' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Chamados */}
          {ocorrencias.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200/80 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 text-sm">Nenhuma ocorrência registrada</h4>
              <p className="text-xs text-slate-500">Tudo calmo no condomínio! Não há chamados em aberto no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ocorrencias
                .filter((oc) => ocorrenciaFiltroStatus === 'todas' || oc.status === ocorrenciaFiltroStatus)
                .map((oc) => (
                  <div
                    key={oc.id}
                    className={`bg-white rounded-2xl border p-5 transition flex flex-col justify-between shadow-sm ${
                      oc.status === 'aberto'
                        ? 'border-amber-200 hover:border-amber-400'
                        : oc.status === 'em_andamento'
                        ? 'border-blue-200 hover:border-blue-400'
                        : 'border-slate-200 opacity-90'
                    }`}
                  >
                    <div>
                      {/* Top Bar da Ocorrência */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              oc.status === 'aberto'
                                ? 'bg-amber-100 text-amber-800'
                                : oc.status === 'em_andamento'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {oc.status === 'aberto'
                              ? '⏳ Aberto'
                              : oc.status === 'em_andamento'
                              ? '⚙️ Em Análise'
                              : '✅ Resolvido'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
                            {oc.categoria.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-700 font-medium">
                          {new Date(oc.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>

                      {/* Título & Detalhes */}
                      <h4 className="font-bold text-slate-900 text-sm mb-1">{oc.titulo}</h4>
                      <p className="text-xs text-slate-600 mb-3 whitespace-pre-wrap">{oc.descricao}</p>

                      {/* Informações do Solicitante */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between mb-3">
                        <div>
                          <strong>{oc.moradorNome}</strong> • {oc.unidade ? `Bloco ${oc.unidade.bloco} - Apto ${oc.unidade.apto}` : 'Unidade'}
                        </div>
                        {oc.local && <span className="text-slate-500">Local: {oc.local}</span>}
                      </div>

                      {/* Resposta do Síndico se houver */}
                      {oc.respostaSindico && (
                        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 mb-3 text-xs">
                          <div className="text-[10px] font-bold text-indigo-900 mb-1 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Resposta Oficial da Administração:</span>
                          </div>
                          <p className="text-indigo-950 font-medium">{oc.respostaSindico}</p>
                          {oc.respondidoEm && (
                            <div className="text-[9px] text-indigo-600 mt-1">
                              Respondido em {new Date(oc.respondidoEm).toLocaleDateString('pt-BR')} por {oc.respondidoPor || 'Síndico'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedOcorrencia(oc);
                          setRespostaOcorrenciaTexto(oc.respostaSindico || '');
                          setRespostaOcorrenciaStatus(oc.status === 'resolvido' ? 'resolvido' : 'em_andamento');
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{oc.respostaSindico ? 'Atualizar Resposta' : 'Responder ao Morador'}</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: FINANCEIRO & PRESTAÇÃO DE CONTAS */}
      {/* ========================================================================= */}
      {activeTab === 'financeiro' && (
        <div className="space-y-6">
          {/* Card Resumo Financeiro */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-xs font-bold text-slate-500 mb-1">Total de Receitas (Mês Atual)</div>
              <div className="text-2xl font-black text-emerald-600">
                R${' '}
                {extratoFinanceiro
                  .filter((e) => e.tipo === 'receita')
                  .reduce((acc, curr) => acc + curr.valor, 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">Taxas condominiais e aportes</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-xs font-bold text-slate-500 mb-1">Total de Despesas Operacionais</div>
              <div className="text-2xl font-black text-rose-600">
                R${' '}
                {extratoFinanceiro
                  .filter((e) => e.tipo === 'despesa')
                  .reduce((acc, curr) => acc + curr.valor, 0)
                  .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-rose-700 mt-1">Portaria, manutenção, água e energia</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="text-xs font-bold text-slate-500 mb-1">Saldo Líquido / Fundo de Reserva</div>
              <div className="text-2xl font-black text-indigo-600">
                R${' '}
                {(
                  extratoFinanceiro
                    .filter((e) => e.tipo === 'receita')
                    .reduce((acc, curr) => acc + curr.valor, 0) -
                  extratoFinanceiro
                    .filter((e) => e.tipo === 'despesa')
                    .reduce((acc, curr) => acc + curr.valor, 0)
                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-indigo-700 mt-1">Superávit em conta bancária</div>
            </div>
          </div>

          {/* Balancete Transparente & Ações */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  <span>Balancete Mensal Transparente (Agosto/2026)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Lançamentos visíveis no aplicativo de todos os condôminos para máxima transparência.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    if (confirm('Tem certeza que deseja zerar todos os lançamentos do financeiro deste condomínio?')) {
                      condoStore.zerarFinanceiro(condominio.id);
                      showNotification('Módulo financeiro zerado com sucesso!');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-1.5"
                  title="Zera lançamentos de balancete e boletos do condomínio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Zerar Financeiro</span>
                </button>

                <button
                  onClick={() => setShowAddExtratoModal(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Lançamento Financeiro</span>
                </button>
              </div>
            </div>

            {/* Tabela de Lançamentos */}
            {extratoFinanceiro.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-800">Nenhum lançamento financeiro registrado</h4>
                <p className="text-xs text-slate-500 mt-1">
                  O módulo financeiro está limpo e zerado. Adicione novos lançamentos de receitas e despesas quando desejar.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-bold text-[11px]">
                      <th className="pb-3">Data</th>
                      <th className="pb-3">Descrição da Despesa / Receita</th>
                      <th className="pb-3">Categoria</th>
                      <th className="pb-3">Tipo</th>
                      <th className="pb-3 text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {extratoFinanceiro.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 text-slate-500 font-medium">
                          {item.data.split('-').reverse().slice(0, 2).join('/')}
                        </td>
                        <td className="py-3 font-semibold text-slate-800">{item.descricao}</td>
                        <td className="py-3">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize">
                            {item.categoria.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.tipo === 'receita'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.tipo === 'receita' ? 'Receita (+)' : 'Despesa (-)'}
                          </span>
                        </td>
                        <td
                          className={`py-3 text-right font-bold ${
                            item.tipo === 'receita' ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {item.tipo === 'receita' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Gestão de Boletos das Unidades */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  <span>Boletos & Cobranças das Unidades ({boletosCondominio.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Monitore quem já quitou a taxa condominial ou baixe pagamentos efetuados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {boletosCondominio.map((bol) => (
                <div
                  key={bol.id}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-900">{bol.moradorNome}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          bol.status === 'pago'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {bol.status === 'pago' ? '✅ Quitado' : '⏳ Pendente'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Unidade: Bloco {bol.unidade.bloco} - Apto {bol.unidade.apto}
                    </div>
                    <div className="text-[11px] text-slate-500">Vencimento: {bol.dataVencimento}</div>
                    <div className="text-base font-black text-slate-900 mt-2">
                      R$ {bol.valor.toFixed(2)}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200/60 flex items-center justify-end gap-2">
                    {bol.status !== 'pago' && (
                      <button
                        onClick={() => handleToggleBoletoPago(bol.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar Pagamento</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: COMUNIDADE, MURAL & ENQUETES */}
      {/* ========================================================================= */}
      {activeTab === 'comunidade' && (
        <div className="space-y-6">
          {/* Seção 1: Enquetes Oficiais */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Vote className="w-5 h-5 text-indigo-600" />
                  <span>Enquetes & Votações do Condomínio ({enquetes.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Consulte a opinião dos moradores sobre reformas, horários e regulamentos.
                </p>
              </div>
              <button
                onClick={() => setShowAddEnqueteModal(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Nova Enquete</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enquetes.map((enq) => (
                <div
                  key={enq.id}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          enq.finalizada
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {enq.finalizada ? '🔒 Finalizada' : '🟢 Votação Aberta'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {enq.totalVotos} votos registrados
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">{enq.titulo}</h4>
                    <p className="text-xs text-slate-600 mb-3">{enq.descricao}</p>

                    {/* Resultados Parciais */}
                    <div className="space-y-2 mb-3">
                      {enq.opcoes.map((op) => {
                        const pct =
                          enq.totalVotos > 0
                            ? Math.round((op.votosCount / enq.totalVotos) * 100)
                            : 0;
                        return (
                          <div key={op.id} className="bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="flex justify-between text-xs font-bold text-slate-800 mb-1">
                              <span>{op.texto}</span>
                              <span>
                                {op.votosCount} votos ({pct}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {!enq.finalizada && (
                    <div className="pt-2 border-t border-slate-200 flex justify-end">
                      <button
                        onClick={() => handleFinalizarEnquete(enq.id)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-800 transition cursor-pointer"
                      >
                        Encerrar Votação
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Seção 2: Moderação do Mural Comunitário */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
                <span>Mural & Classificados dos Moradores ({muralPosts.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Visualize e modere os anúncios de desapegos, prestação de serviços e comunicados comunitários.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {muralPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 capitalize">
                        {post.tipo}
                      </span>
                      <span className="text-[10px] text-slate-700 font-medium">
                        {new Date(post.criadoEm).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mb-1">{post.titulo}</h4>
                    <p className="text-xs text-slate-600 mb-2">{post.conteudo}</p>
                    <div className="text-[11px] text-slate-500">
                      Por: <strong>{post.autorNome}</strong> ({post.autorUnidade})
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] text-slate-700 font-bold">
                      ❤️ {post.curtidas.length} curtidas • 💬 {post.comentarios.length} comentários
                    </span>
                    <button
                      onClick={() => handleDeleteMuralPost(post.id)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 3: Caixa de Sugestões dos Moradores */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <span>Caixa de Sugestões & Elogios ({sugestoes.length})</span>
              </h3>
              <p className="text-xs text-slate-500">Ideias e melhorias enviadas pelos condôminos.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sugestoes.map((sug) => (
                <div
                  key={sug.id}
                  className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-900">{sug.titulo}</span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full capitalize">
                        {sug.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-2">{sug.mensagem}</p>
                    <div className="text-[11px] text-slate-500">
                      Enviado por: <strong>{sug.moradorNome}</strong> ({sug.unidade})
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleUpdateSugestaoStatus(sug.id, 'em_analise')}
                      className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                    >
                      Em Análise
                    </button>
                    <button
                      onClick={() => handleUpdateSugestaoStatus(sug.id, 'atendida')}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition cursor-pointer"
                    >
                      Atendida
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: CENTRAL DE DOCUMENTOS OFICIAIS */}
      {/* ========================================================================= */}
      {activeTab === 'documentos' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>Biblioteca de Documentos & Normas Oficiais ({documentos.length})</span>
              </h3>
              <p className="text-xs text-slate-500">
                Regulamentos internos, atas de assembleias, laudos prediais e convenção disponíveis para todos os moradores.
              </p>
            </div>
            <button
              onClick={() => setShowAddDocModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Novo Documento</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {documentos.map((doc) => (
              <div
                key={doc.id}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-indigo-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700">
                      <FileText className="w-5 h-5" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 capitalize">
                      {doc.categoria}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-xs mb-1 line-clamp-2">{doc.titulo}</h4>
                  <p className="text-[11px] text-slate-500 mb-3 line-clamp-3">{doc.descricao}</p>

                  <div className="text-[10px] text-slate-700 font-medium">
                    Tamanho: {doc.tamanho} • Publicado em: {doc.dataPublicacao}
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => showNotification(`Download iniciado: ${doc.titulo}`)}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Visualizar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteDocumento(doc.id)}
                    className="text-rose-600 hover:text-rose-800 text-xs font-bold transition cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: CENTRAL TELEFÔNICA, LIGAÇÕES & INTERFONE SÍNDICO                     */}
      {/* ========================================================================= */}
      {activeTab === 'interfone' && (
        <div className="space-y-6">
          <CentralTelefonicaView
            condominio={condominio}
            currentUser={{
              id: 'sindico',
              nome: condominio.sindicoNome || 'Síndico Geral',
              email: condominio.sindicoEmail || 'sindico@condominio.com',
              role: 'sindico',
              condominioId: condominio.id,
            }}
          />

          <IntercomPTTView
            condominio={condominio}
            currentUserRole="sindico"
            currentUserName={condominio.sindicoNome || 'Síndico Geral'}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CADASTRAR NOVO MORADOR */}
      {/* ========================================================================= */}
      {showAddMoradorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cadastrar Novo Morador</h3>
                  <p className="text-[11px] text-slate-500">Crie o acesso de login do morador com unidade e situação</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMoradorModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMorador} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo do Morador *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Albuquerque"
                  value={novoMoradorNome}
                  onChange={(e) => setNovoMoradorNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bloco / Torre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 1 ou A"
                    value={novoMoradorBloco}
                    onChange={(e) => setNovoMoradorBloco(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Apartamento / Unidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 302"
                    value={novoMoradorApto}
                    onChange={(e) => setNovoMoradorApto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp / Celular com DDD *</label>
                  <input
                    type="text"
                    required
                    placeholder="(21) 99887-6655"
                    value={novoMoradorTelefone}
                    onChange={(e) => setNovoMoradorTelefone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail de Login *</label>
                  <input
                    type="email"
                    required
                    placeholder="morador@gmail.com"
                    value={novoMoradorEmail}
                    onChange={(e) => setNovoMoradorEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Senha de Acesso *</label>
                  <input
                    type="password"
                    required
                    placeholder="Senha de login do morador"
                    value={novoMoradorSenha}
                    onChange={(e) => setNovoMoradorSenha(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Situação Financeira:</label>
                  <select
                    value={novoMoradorAdimplencia}
                    onChange={(e) => setNovoMoradorAdimplencia(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="em_dia">Em Dia (Adimplente)</option>
                    <option value="com_pendencia">Com Pendência (Inadimplente)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="aprovadoDireto"
                  checked={novoMoradorAprovadoDireto}
                  onChange={(e) => setNovoMoradorAprovadoDireto(e.target.checked)}
                  className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="aprovadoDireto" className="text-slate-700 font-bold cursor-pointer">
                  Aprovar cadastro imediatamente (libera bicicletário e áreas de lazer)
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddMoradorModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
                >
                  Cadastrar Morador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR MORADOR */}
      {/* ========================================================================= */}
      {editingMorador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Editar Dados do Morador</h3>
                  <p className="text-[11px] text-slate-500">Atualize informações de cadastro, unidade ou adimplência</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMorador(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMorador} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={editingMorador.nome}
                  onChange={(e) => setEditingMorador({ ...editingMorador, nome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bloco / Torre *</label>
                  <input
                    type="text"
                    required
                    value={editingMorador.unidade.bloco}
                    onChange={(e) =>
                      setEditingMorador({
                        ...editingMorador,
                        unidade: { ...editingMorador.unidade, bloco: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Apartamento *</label>
                  <input
                    type="text"
                    required
                    value={editingMorador.unidade.apto}
                    onChange={(e) =>
                      setEditingMorador({
                        ...editingMorador,
                        unidade: { ...editingMorador.unidade, apto: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    value={editingMorador.telefone}
                    onChange={(e) => setEditingMorador({ ...editingMorador, telefone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={editingMorador.email}
                    onChange={(e) => setEditingMorador({ ...editingMorador, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Situação Financeira:</label>
                  <select
                    value={editingMorador.statusAdimplencia}
                    onChange={(e) =>
                      setEditingMorador({
                        ...editingMorador,
                        statusAdimplencia: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="em_dia">Em Dia (Adimplente)</option>
                    <option value="com_pendencia">Com Pendência (Inadimplente)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status do Acesso:</label>
                  <select
                    value={editingMorador.statusCadastro}
                    onChange={(e) =>
                      setEditingMorador({
                        ...editingMorador,
                        statusCadastro: e.target.value as any,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="ativo">Ativo (Liberado)</option>
                    <option value="pendente_aprovacao">Pendente de Aprovação</option>
                    <option value="recusado">Recusado</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMorador(null)}
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

      {/* ========================================================================= */}
      {/* MODAL: EDITAR BICICLETA */}
      {/* ========================================================================= */}
      {editingBike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Editar Bicicleta #{editingBike.codigo}</h3>
                  <p className="text-[11px] text-slate-500">Atualize os detalhes, senha da trava e status da unidade</p>
                </div>
              </div>
              <button
                onClick={() => setEditingBike(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBike} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código de Identificação *</label>
                  <input
                    type="text"
                    required
                    value={editingBike.codigo}
                    onChange={(e) => setEditingBike({ ...editingBike, codigo: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Bicicleta:</label>
                  <select
                    value={editingBike.tipo}
                    onChange={(e) => setEditingBike({ ...editingBike, tipo: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="urbana">Urbana Convencional</option>
                    <option value="e-bike">E-Bike Elétrica Assistida</option>
                    <option value="mountain">Mountain Bike (MTB)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Modelo e Marca *</label>
                <input
                  type="text"
                  required
                  value={editingBike.modelo}
                  onChange={(e) => setEditingBike({ ...editingBike, modelo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Senha do Cadeado Digital *</label>
                  <input
                    type="text"
                    required
                    value={editingBike.lockPassword}
                    onChange={(e) => setEditingBike({ ...editingBike, lockPassword: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Operacional:</label>
                  <select
                    value={editingBike.status}
                    onChange={(e) => setEditingBike({ ...editingBike, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="disponivel">Disponível</option>
                    <option value="em_uso">Em Uso</option>
                    <option value="manutencao">Em Manutenção / Oficina</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Localização Atual</label>
                <input
                  type="text"
                  value={editingBike.localizacaoAtual || ''}
                  onChange={(e) => setEditingBike({ ...editingBike, localizacaoAtual: e.target.value })}
                  placeholder="Ex: Bicicletário Principal - Vaga 04"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingBike(null)}
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

      {/* ========================================================================= */}
      {/* MODAL: CADASTRAR NOVA ÁREA DE LAZER */}
      {/* ========================================================================= */}
      {showAddAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cadastrar Área / Espaço de Lazer</h3>
                  <p className="text-[11px] text-slate-500">Adicione piscina, churrasqueira, salão de festas ou quadra</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddAreaModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddArea} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome do Espaço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Salão de Festas Nobre ou Churrasqueira 2"
                  value={novaAreaNome}
                  onChange={(e) => setNovaAreaNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Espaço:</label>
                  <select
                    value={novaAreaTipo}
                    onChange={(e) => setNovaAreaTipo(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="churrasqueira">Churrasqueira / Gourmet</option>
                    <option value="salao_festas">Salão de Festas</option>
                    <option value="piscina">Piscina Adulto / Infantil</option>
                    <option value="academia">Academia / Fitness</option>
                    <option value="quadra">Quadra Poliesportiva</option>
                    <option value="sauna">Sauna / SPA</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Capacidade Máxima (Pessoas) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={novaAreaCapacidade}
                    onChange={(e) => setNovaAreaCapacidade(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Horário de Funcionamento *</label>
                  <input
                    type="text"
                    required
                    value={novaAreaHorario}
                    onChange={(e) => setNovaAreaHorario(e.target.value)}
                    placeholder="08:00 às 22:00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Taxa de Reserva / Limpeza (R$)</label>
                  <input
                    type="number"
                    min="0"
                    value={novaAreaTaxa}
                    onChange={(e) => setNovaAreaTaxa(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="permiteReservaCheck"
                  checked={novaAreaPermiteReserva}
                  onChange={(e) => setNovaAreaPermiteReserva(e.target.checked)}
                  className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="permiteReservaCheck" className="text-slate-700 font-bold cursor-pointer">
                  Permitir agendamento e reserva antecipada pelos moradores
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddAreaModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
                >
                  Cadastrar Área
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR ÁREA DE LAZER */}
      {/* ========================================================================= */}
      {editingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Editar {editingArea.nome}</h3>
                  <p className="text-[11px] text-slate-500">Altere horários, taxas, capacidade e status</p>
                </div>
              </div>
              <button
                onClick={() => setEditingArea(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateArea} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome do Espaço *</label>
                <input
                  type="text"
                  required
                  value={editingArea.nome}
                  onChange={(e) => setEditingArea({ ...editingArea, nome: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Capacidade Máxima (Pessoas)</label>
                  <input
                    type="number"
                    value={editingArea.capacidade}
                    onChange={(e) => setEditingArea({ ...editingArea, capacidade: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Taxa de Reserva (R$)</label>
                  <input
                    type="number"
                    value={editingArea.taxaReserva || 0}
                    onChange={(e) => setEditingArea({ ...editingArea, taxaReserva: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Horário de Funcionamento</label>
                <input
                  type="text"
                  value={editingArea.horarioFuncionamento}
                  onChange={(e) => setEditingArea({ ...editingArea, horarioFuncionamento: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Aviso / Comunicado Atual</label>
                <input
                  type="text"
                  value={editingArea.aviso}
                  onChange={(e) => setEditingArea({ ...editingArea, aviso: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="permiteReservaEdit"
                  checked={editingArea.permiteReserva}
                  onChange={(e) => setEditingArea({ ...editingArea, permiteReserva: e.target.checked })}
                  className="accent-indigo-600 w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="permiteReservaEdit" className="text-slate-700 font-bold cursor-pointer">
                  Permitir agendamento e reserva antecipada
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingArea(null)}
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

      {/* ========================================================================= */}
      {/* MODAL: RESPONDER OCORRÊNCIA / ATUALIZAR STATUS */}
      {/* ========================================================================= */}
      {selectedOcorrencia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Responder Chamado #{selectedOcorrencia.id.slice(-4)}</h3>
                  <p className="text-[11px] text-slate-500">
                    {selectedOcorrencia.moradorNome} • {typeof selectedOcorrencia.unidade === 'object' ? `Bloco ${selectedOcorrencia.unidade?.bloco || '1'} - Apto ${selectedOcorrencia.unidade?.apto || '-'}` : selectedOcorrencia.unidade}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOcorrencia(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mb-4">
              <div className="text-[11px] font-bold text-slate-500 mb-1">Relato do Morador:</div>
              <div className="font-bold text-slate-900 text-xs mb-1">{selectedOcorrencia.titulo}</div>
              <p className="text-slate-600 text-xs">{selectedOcorrencia.descricao}</p>
            </div>

            <form onSubmit={handleResponderOcorrencia} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status da Ocorrência:</label>
                <select
                  value={respostaOcorrenciaStatus}
                  onChange={(e) => setRespostaOcorrenciaStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="em_andamento">⚙️ Em Andamento / Em Análise pela Manutenção</option>
                  <option value="resolvido">✅ Resolvido / Concluído com Sucesso</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mensagem de Resposta Oficial ao Morador *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Ex: A equipe de manutenção predial realizou a vistoria e o reparo foi concluído hoje pela manhã."
                  value={respostaOcorrenciaTexto}
                  onChange={(e) => setRespostaOcorrenciaTexto(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedOcorrencia(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Enviar Resposta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO LANÇAMENTO NO BALANCETE FINANCEIRO */}
      {/* ========================================================================= */}
      {showAddExtratoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Novo Lançamento Financeiro</h3>
                  <p className="text-[11px] text-slate-500">Adicione despesa ou receita ao balancete transparente</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddExtratoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExtratoItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipo de Lançamento:</label>
                  <select
                    value={novoExtratoTipo}
                    onChange={(e) => setNovoExtratoTipo(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="despesa">🔴 Despesa / Saída (-)</option>
                    <option value="receita">🟢 Receita / Entrada (+)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria:</label>
                  <select
                    value={novoExtratoCategoria}
                    onChange={(e) => setNovoExtratoCategoria(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="manutencao_predial">Manutenção Predial</option>
                    <option value="seguranca_portaria">Segurança & Portaria</option>
                    <option value="limpeza_conservacao">Limpeza & Conservação</option>
                    <option value="energia_eletrica">Energia Elétrica</option>
                    <option value="agua_esgoto">Água & Esgoto</option>
                    <option value="fundo_reserva">Fundo de Reserva</option>
                    <option value="taxa_condominial">Taxas Ordinárias</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição do Lançamento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Troca de lâmpadas de LED da garagem e sensores"
                  value={novoExtratoDescricao}
                  onChange={(e) => setNovoExtratoDescricao(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={novoExtratoValor}
                    onChange={(e) => setNovoExtratoValor(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data do Lançamento *</label>
                  <input
                    type="date"
                    required
                    value={novoExtratoData}
                    onChange={(e) => setNovoExtratoData(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddExtratoModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR NOVA ENQUETE OFICIAL */}
      {/* ========================================================================= */}
      {showAddEnqueteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Vote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Criar Nova Enquete Oficial</h3>
                  <p className="text-[11px] text-slate-500">Abra uma votação democrática entre todos os moradores</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddEnqueteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEnquete} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título da Enquete / Pergunta Principal *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aprovação da Instalação de Energia Solar nas Áreas Comuns"
                  value={novaEnqueteTitulo}
                  onChange={(e) => setNovaEnqueteTitulo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição / Contexto *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Projeto para instalar painéis solares no telhado das torres, com retorno previsto em 18 meses."
                  value={novaEnqueteDescricao}
                  onChange={(e) => setNovaEnqueteDescricao(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Opções de Resposta:</label>
                <div className="space-y-2 mb-2">
                  {novaEnqueteOpcoes.map((op, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-center font-bold text-slate-400">{idx + 1}.</span>
                      <input
                        type="text"
                        value={op}
                        onChange={(e) => {
                          const updated = [...novaEnqueteOpcoes];
                          updated[idx] = e.target.value;
                          setNovaEnqueteOpcoes(updated);
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                      />
                      {novaEnqueteOpcoes.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setNovaEnqueteOpcoes(novaEnqueteOpcoes.filter((_, i) => i !== idx))}
                          className="p-2 text-rose-500 hover:text-rose-700 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar outra opção..."
                    value={novaEnqueteNovaOpcao}
                    onChange={(e) => setNovaEnqueteNovaOpcao(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (novaEnqueteNovaOpcao.trim()) {
                        setNovaEnqueteOpcoes([...novaEnqueteOpcoes, novaEnqueteNovaOpcao.trim()]);
                        setNovaEnqueteNovaOpcao('');
                      }
                    }}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    + Opção
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddEnqueteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
                >
                  Publicar Enquete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PUBLICAR NOVO DOCUMENTO */}
      {/* ========================================================================= */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 text-xs text-slate-800 my-8">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Publicar Novo Documento</h3>
                  <p className="text-[11px] text-slate-500">Disponibilize atas, laudos ou normas para consulta dos moradores</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddDocModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocumento} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Título do Documento *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ata da Assembleia Geral Extraordinária (AGE 2026)"
                  value={novoDocTitulo}
                  onChange={(e) => setNovoDocTitulo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria:</label>
                  <select
                    value={novoDocCategoria}
                    onChange={(e) => setNovoDocCategoria(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="regulamento">Regulamento Interno</option>
                    <option value="convencao">Convenção Condominial</option>
                    <option value="ata">Ata de Assembleia</option>
                    <option value="laudo">Laudo Técnico / AVCB</option>
                    <option value="manual">Manual do Proprietário</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tamanho do Arquivo:</label>
                  <input
                    type="text"
                    value={novoDocTamanho}
                    onChange={(e) => setNovoDocTamanho(e.target.value)}
                    placeholder="Ex: 2.5 MB"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição / Resumo do Conteúdo *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Deliberação sobre aprovação de contas do exercício anterior e eleição do conselho fiscal."
                  value={novoDocDescricao}
                  onChange={(e) => setNovoDocDescricao(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddDocModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition active:scale-98 cursor-pointer"
                >
                  Publicar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Relatório Mensal Executivo para Assembleia */}
      <RelatorioMensalAssembleiaModal
        isOpen={showRelatorioModal}
        onClose={() => setShowRelatorioModal(false)}
        condominio={condominio}
      />
    </div>
  );
};
