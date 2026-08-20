import React, { useState, useEffect, useMemo } from 'react';
import {
  Condominio,
  Morador,
  Encomenda,
  Bicicleta,
  HistoricoLocacao,
  VisitanteLiberado,
} from '../../types';
import { condoStore } from '../../services/mockStorage';
import { notificationService } from '../../services/notificationService';
import { whatsappService } from '../../services/whatsappService';
import { ItensCompartilhadosView } from '../compartilhados/ItensCompartilhadosView';
import { UniversalQrCodeScanner } from '../common/UniversalQrCodeScanner';
import { EntregaEncomendaModal } from './EntregaEncomendaModal';
import { FotoEtiquetaCapture } from './FotoEtiquetaCapture';
import { VisitantesAlertBanner } from './VisitantesAlertBanner';
import { IntercomPTTView } from '../interfone/IntercomPTTView';
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
  User,
  Car,
  Check,
  X,
  Camera,
  Layers,
  Phone,
  PhoneCall,
  Building2,
  AlertTriangle,
  Wrench,
  QrCode,
  Send,
  MessageSquare,
  Share2,
  Copy,
  ExternalLink,
  Bell,
  Mail,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PortariaDashboardProps {
  condominio: Condominio;
  moradores: Morador[];
  encomendas: Encomenda[];
  bikes: Bicicleta[];
  historicoLocacoes: HistoricoLocacao[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const PortariaDashboard: React.FC<PortariaDashboardProps> = ({
  condominio,
  moradores,
  encomendas,
  bikes,
  historicoLocacoes,
  activeTab,
  setActiveTab,
}) => {

  // Encomendas: Receber & Lote por Apartamento
  const [cadastroMode, setCadastroMode] = useState<'lista' | 'manual'>('manual');
  const [selectedMoradorId, setSelectedMoradorId] = useState('');
  const [manualBloco, setManualBloco] = useState('');
  const [manualApto, setManualApto] = useState('');
  const [manualNome, setManualNome] = useState('');
  const [manualTelefone, setManualTelefone] = useState('');
  const [searchMoradorInput, setSearchMoradorInput] = useState('');
  const [searchEncomendaQuery, setSearchEncomendaQuery] = useState('');
  const [manterUnidadeFixa, setManterUnidadeFixa] = useState(false);

  // Lista de Pacotes para o mesmo Apartamento
  const [pacotesLote, setPacotesLote] = useState<{
    id: string;
    destinatarioNome: string;
    transportadora: string;
    codigoRastreio: string;
    observacao: string;
    fotoUrl?: string;
  }[]>([
    {
      id: '1',
      destinatarioNome: '',
      transportadora: 'Mercado Livre',
      codigoRastreio: '',
      observacao: '',
      fotoUrl: undefined,
    },
  ]);

  // Encomendas: Modal de Entrega (PIN Obrigatório ou Doc + Rúbrica)
  const [selectedEncomendaForEntrega, setSelectedEncomendaForEntrega] = useState<Encomenda | null>(null);
  const [isEntregaModalOpen, setIsEntregaModalOpen] = useState(false);
  const [previewFotoUrl, setPreviewFotoUrl] = useState<string | null>(null);

  // Interfone & Comunicação Portaria <-> Morador
  const [interfoneBloco, setInterfoneBloco] = useState('');
  const [interfoneApto, setInterfoneApto] = useState('');
  const [interfoneMensagem, setInterfoneMensagem] = useState('');
  const [interfoneSelectedTipo, setInterfoneSelectedTipo] = useState<'delivery' | 'visitante' | 'veiculo' | 'geral'>('delivery');

  // Notificação Recente de Encomendas (Sucesso com PIN Único do Apartamento)
  const [recemCadastrada, setRecemCadastrada] = useState<{
    encomendas: Encomenda[];
    morador: Morador;
    codigoResgate: string;
  } | null>(null);
  const [isSubmittingPackage, setIsSubmittingPackage] = useState(false);
  const [inlineFormError, setInlineFormError] = useState<string | null>(null);
  const [inlineFormSuccess, setInlineFormSuccess] = useState<{
    encomendas: Encomenda[];
    morador: Morador;
    codigoResgate: string;
  } | null>(null);

  // Copiado feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  // Moradores cadastrados na unidade atualmente preenchida
  const moradoresDaUnidadeSelecionada = useMemo(() => {
    const b = (manualBloco || '1').trim().toLowerCase().replace(/bloco\s*/i, '');
    const a = (manualApto || '').trim().toLowerCase().replace(/apto\s*/i, '');
    if (!a) return [];
    return moradores.filter((m) => {
      const mb = (m.unidade?.bloco || '1').trim().toLowerCase().replace(/bloco\s*/i, '');
      const ma = (m.unidade?.apto || '').trim().toLowerCase().replace(/apto\s*/i, '');
      return ma === a && (!b || mb === b);
    });
  }, [moradores, manualBloco, manualApto]);

  // Manipuladores de Pacotes do Lote
  const handleAddPacoteItem = () => {
    setPacotesLote((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        destinatarioNome: prev[0]?.destinatarioNome || manualNome || '',
        transportadora: 'Shopee',
        codigoRastreio: '',
        observacao: '',
        fotoUrl: undefined,
      },
    ]);
  };

  const handleUpdatePacoteItem = (id: string, field: string, value: any) => {
    setPacotesLote((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemovePacoteItem = (id: string) => {
    if (pacotesLote.length <= 1) return;
    setPacotesLote((prev) => prev.filter((item) => item.id !== id));
  };

  // Registrar Encomendas (Suporta 1 ou Várias Encomendas para o Mesmo Apartamento - 100% Automático)
  const handleRegisterPackage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setInlineFormError(null);
    setIsSubmittingPackage(true);

    try {
      let morador: Morador | undefined;

      // 1. Se selecionou da lista
      if (selectedMoradorId) {
        morador = moradores.find((m) => m.id === selectedMoradorId);
      }

      // 2. Se informou Bloco/Apto manualmente ou digitou na busca
      if (!morador) {
        const blocoFinal = manualBloco.trim() || '1';
        const aptoFinal = manualApto.trim() || searchMoradorInput.trim();

        if (aptoFinal) {
          const blocoMatch = aptoFinal.match(/bloco\s*([0-9a-zA-Z]+)/i) || aptoFinal.match(/^([0-9a-zA-Z]+)\s+([0-9]+)$/i);
          const aptoMatch = aptoFinal.match(/apto\s*([0-9a-zA-Z]+)/i) || aptoFinal.match(/([0-9]+)$/);

          const blocoParsed = blocoMatch ? blocoMatch[1] : blocoFinal;
          const aptoParsed = aptoMatch ? aptoMatch[1] : aptoFinal;

          morador = condoStore.cadastrarOuObterMoradorRapido(condominio.id, {
            bloco: blocoParsed,
            apto: aptoParsed,
            nome: manualNome.trim() || undefined,
            telefone: manualTelefone.trim() || undefined,
          });
        } else if (moradores.length > 0) {
          morador = moradores[0];
          setSelectedMoradorId(morador.id);
        } else {
          morador = condoStore.cadastrarOuObterMoradorRapido(condominio.id, {
            bloco: '1',
            apto: '101',
            nome: 'Morador Portaria',
          });
        }
      }

      // Atualiza telefone ou nome caso tenha sido informado
      if (morador && (manualTelefone.trim() || manualNome.trim())) {
        if (manualTelefone.trim()) morador.telefone = manualTelefone.trim();
        if (manualNome.trim()) morador.nome = manualNome.trim();
      }

      if (!morador) {
        setInlineFormError('Por favor, selecione um morador ou informe o Bloco e Apartamento.');
        setIsSubmittingPackage(false);
        return;
      }

      // Prepara lista de pacotes a cadastrar
      const listaPacotesFinal = pacotesLote.map((p) => ({
        transportadora: p.transportadora.trim() || 'Mercado Livre',
        codigoRastreio: p.codigoRastreio.trim().toUpperCase(),
        observacao: p.observacao.trim(),
        fotoUrl: p.fotoUrl,
        destinatarioNome: p.destinatarioNome.trim() || morador!.nome,
      }));

      // Criação em lote com PIN ÚNICO por Unidade (Bloco + Apto)
      const resultadoLote = condoStore.addMultiplasEncomendas(condominio.id, {
        moradorId: morador.id,
        recebidoPor: 'Portaria Principal (Plantão)',
        pacotes: listaPacotesFinal,
      });

      const pinUnico = resultadoLote.codigoResgate;
      const novasEncomendas = resultadoLote.encomendas;

      // 1. Notificação In-App ao Morador
      const qtdText = novasEncomendas.length > 1 ? `${novasEncomendas.length} encomendas chegaram` : 'Uma encomenda chegou';
      condoStore.addNotification({
        condominioId: condominio.id,
        paraMoradorId: morador.id,
        titulo: `📦 ${novasEncomendas.length > 1 ? `${novasEncomendas.length} Novas Encomendas` : 'Nova Encomenda'} Recebida(s)`,
        mensagem: `${qtdText} para o Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}! Código PIN Único de Retirada: ${pinUnico}.`,
        tipo: 'encomenda',
      });

      // 2. Disparo Push no Navegador
      notificationService.dispararNotificacaoNativa(`📦 Encomenda(s) na Portaria! - ${condominio.nome}`, {
        body: `Olá ${morador.nome}! ${novasEncomendas.length} pacote(s) disponível(is) na portaria. PIN Único: ${pinUnico}.`,
        tag: `enc-lote-${pinUnico}`,
      });

      // 3. Disparo 100% Automático via WhatsApp Gateway
      if (novasEncomendas.length > 0) {
        whatsappService.notificarChegadaEncomendaAutomatica({
          condominio,
          morador,
          encomenda: novasEncomendas[0],
        }).catch((err) => console.warn('[WhatsApp Auto Dispatch]:', err));
      }

      const payloadSuccess = {
        encomendas: novasEncomendas,
        morador,
        codigoResgate: pinUnico,
      };

      setRecemCadastrada(payloadSuccess);
      setInlineFormSuccess(payloadSuccess);

      setActionAlert({
        type: 'success',
        text: `🚀 ${novasEncomendas.length} encomenda(s) cadastrada(s) com sucesso para Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}! PIN Único: [ ${pinUnico} ]`,
      });

      // Reset dos campos de pacotes
      setPacotesLote([
        {
          id: '1',
          destinatarioNome: '',
          transportadora: 'Mercado Livre',
          codigoRastreio: '',
          observacao: '',
          fotoUrl: undefined,
        },
      ]);

      // Se NÃO marcou para manter unidade fixa, limpa a identificação
      if (!manterUnidadeFixa) {
        setSelectedMoradorId('');
        setManualBloco('');
        setManualApto('');
        setManualNome('');
        setManualTelefone('');
        setSearchMoradorInput('');
      }

      confetti({ particleCount: 80, spread: 70 });
    } catch (err: any) {
      console.error('Erro ao cadastrar encomenda:', err);
      setInlineFormError('Ocorreu um erro ao processar. Tente novamente.');
    } finally {
      setIsSubmittingPackage(false);
    }
  };

  // Disparo de Interfone / Chamada Direta Portaria -> Morador
  const handleEnviarInterfone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interfoneApto.trim()) {
      setActionAlert({ type: 'error', text: 'Informe o apartamento de destino do interfone.' });
      return;
    }

    const morador = condoStore.cadastrarOuObterMoradorRapido(condominio.id, {
      bloco: interfoneBloco.trim() || '1',
      apto: interfoneApto.trim(),
    });

    const tipoLabels = {
      delivery: '🛵 Entregador / Delivery na Portaria',
      visitante: '👤 Visitante na Portaria Aguardando',
      veiculo: '🚗 Aviso sobre Veículo / Garagem',
      geral: '📢 Chamado da Portaria',
    };

    const titulo = tipoLabels[interfoneSelectedTipo];
    const mensagemFinal = interfoneMensagem.trim() || `Olá! A Portaria está chamando sua unidade (${morador.unidade.bloco ? `Bloco ${morador.unidade.bloco} - ` : ''}Apto ${morador.unidade.apto}).`;

    // 1. Notificação In-App
    condoStore.addNotification({
      condominioId: condominio.id,
      paraMoradorId: morador.id,
      titulo,
      mensagem: mensagemFinal,
      tipo: 'sistema',
    });

    // 2. Disparo Push Nativo na Barra
    notificationService.dispararNotificacaoNativa(`${titulo} - ${condominio.nome}`, {
      body: mensagemFinal,
      tag: `interfone-${Date.now()}`,
    });

    // 3. Disparo WhatsApp se tiver telefone
    if (morador.telefone) {
      whatsappService.notificarMorador({
        condominioId: condominio.id,
        condominioNome: condominio.nome,
        morador,
        tipo: 'aviso_urgente',
        titulo,
        corpoMensagem: `${titulo}\n\n${mensagemFinal}\n\n_Portaria do ${condominio.nome}_`,
      });
    }

    setActionAlert({
      type: 'success',
      text: `📞 Interfone acionado com sucesso para Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}! Morador notificado imediatamente.`,
    });

    setInterfoneMensagem('');
    confetti({ particleCount: 40, spread: 50 });
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
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

      {/* Banner de Notificação Gigante de Liberação de Visitantes Emitida pelos Moradores */}
      <VisitantesAlertBanner
        condominio={condominio}
        onOpenVisitantesTab={() => setActiveTab('visitantes')}
      />

      {/* Navegação de Abas */}

      {/* ABA 1: RECEBER ENCOMENDA */}
      {activeTab === 'receber' && (
        <div className="space-y-6">
          {/* Card de Notificação Recente de Encomenda */}
          {recemCadastrada && (
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-3xl p-6 sm:p-7 border-2 border-emerald-500/50 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
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
                  <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
                    <span>Total Cadastrado: <strong className="text-white">{recemCadastrada.encomendas.length} pacote(s)</strong></span>
                    <span>•</span>
                    <span>WhatsApp: <strong className="text-emerald-300">{recemCadastrada.morador.telefone || '(11) 98765-4321'}</strong></span>
                  </p>
                </div>

                <button
                  onClick={() => setRecemCadastrada(null)}
                  className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800/60 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Destaque do PIN ÚNICO de 6 Dígitos */}
              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider block">
                    🔐 Código PIN Único do Apartamento (Já enviado no WhatsApp e App):
                  </span>
                  <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-emerald-400">
                    {recemCadastrada.codigoResgate}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Este PIN único retira todas as {recemCadastrada.encomendas.length} encomenda(s) deste apartamento de uma só vez na portaria.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(recemCadastrada.codigoResgate);
                      setCopiedKey(`pin_lote_${recemCadastrada.codigoResgate}`);
                      setTimeout(() => setCopiedKey(null), 2500);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copiedKey === `pin_lote_${recemCadastrada.codigoResgate}` ? 'PIN Copiado!' : 'Copiar PIN'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      notificationService.dispararNotificacaoNativa(`📦 Encomenda(s) na Portaria! - ${condominio.nome}`, {
                        body: `Olá ${recemCadastrada.morador.nome}! ${recemCadastrada.encomendas.length} pacote(s) disponível(is) na portaria. PIN: ${recemCadastrada.codigoResgate}.`,
                        tag: `enc-lote-${recemCadastrada.codigoResgate}`,
                      });
                      setActionAlert({ type: 'success', text: '🔔 Notificação push na barra reenviada!' });
                    }}
                    className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                    title="Disparar Push no dispositivo"
                  >
                    <Bell className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              </div>

              {/* Lista dos Pacotes Cadastrados no Lote */}
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10 text-xs space-y-1.5">
                <span className="font-bold text-slate-300 text-[11px]">Pacotes Registrados nesta Remessa:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recemCadastrada.encomendas.map((enc, idx) => (
                    <div key={enc.id} className="bg-black/30 p-2 rounded-xl flex items-center justify-between text-slate-200">
                      <div>
                        <span className="font-bold text-emerald-300">#{idx + 1} {enc.moradorNome}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{enc.transportadora} {enc.codigoRastreio ? `• ${enc.codigoRastreio}` : ''}</div>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-bold">Estocado</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status do Envio Automático */}
              <div className="flex items-center justify-between text-xs text-emerald-200/90 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>Disparo de mensagem realizado sem redirecionamento (100% Automático via Gateway)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {new Date().toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulário de Cadastro */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-600" />
                    <span>Cadastrar Encomendas da Unidade</span>
                  </h2>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ⚡ WhatsApp 100% Automático
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Controle por Apartamento e Bloco. Você pode cadastrar 1 ou vários pacotes para os moradores da mesma unidade (ex: Davi, Thais, Alice) gerando 1 único PIN.
                </p>
              </div>

              <form onSubmit={handleRegisterPackage} className="space-y-4 text-xs">
                {/* Seletor de Modo de Identificação do Morador / Unidade */}
                <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCadastroMode('manual')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      cadastroMode === 'manual'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Digitar Bloco / Apto (Rápido)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCadastroMode('lista')}
                    className={`flex-1 py-2 px-3 rounded-xl font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      cadastroMode === 'lista'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-amber-600" />
                    <span>Selecionar da Lista ({moradores.length})</span>
                  </button>
                </div>

                {cadastroMode === 'manual' ? (
                  /* Modo 1: Digitação Direta Bloco e Apartamento */
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-amber-600" />
                        Identificação da Unidade de Destino
                      </span>
                      <span className="text-[10px] text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.5 rounded-full">
                        Controle por Apartamento
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Bloco / Torre:</label>
                        <input
                          type="text"
                          placeholder="Ex: 20 ou A"
                          value={manualBloco}
                          onChange={(e) => setManualBloco(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Apartamento / Unidade *:</label>
                        <input
                          type="text"
                          placeholder="Ex: 303"
                          value={manualApto}
                          onChange={(e) => setManualApto(e.target.value)}
                          required
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Moradores Cadastrados nesta Unidade (Sugestão de 1 Clique) */}
                    {moradoresDaUnidadeSelecionada.length > 0 && (
                      <div className="space-y-1 bg-white/70 p-2.5 rounded-xl border border-amber-200">
                        <span className="text-[11px] text-amber-900 font-bold block">
                          Moradores cadastrados neste apartamento:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {moradoresDaUnidadeSelecionada.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setManualNome(m.nome);
                                setManualTelefone(m.telefone || '');
                                // Preenche o destinatário do pacote atual
                                if (pacotesLote.length > 0 && !pacotesLote[0].destinatarioNome) {
                                  handleUpdatePacoteItem(pacotesLote[0].id, 'destinatarioNome', m.nome);
                                }
                              }}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg text-amber-950 font-bold text-[11px] flex items-center gap-1 transition"
                            >
                              <User className="w-3 h-3 text-amber-700" />
                              <span>{m.nome}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Nome Morador Principal (opcional):</label>
                        <input
                          type="text"
                          placeholder="Ex: Davi Leonardo"
                          value={manualNome}
                          onChange={(e) => setManualNome(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">WhatsApp de Notificação (opcional):</label>
                        <input
                          type="text"
                          placeholder="Ex: (11) 99999-8888"
                          value={manualTelefone}
                          onChange={(e) => setManualTelefone(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Modo 2: Busca e Seleção da Lista */
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 block">
                      Buscar Morador ou Unidade:
                    </label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Filtrar por nome, bloco ou apto (ex: bloco 20 303, Carlos, 101)..."
                        value={searchMoradorInput}
                        onChange={(e) => setSearchMoradorInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    {moradores.length > 0 ? (
                      <select
                        value={selectedMoradorId}
                        onChange={(e) => {
                          setSelectedMoradorId(e.target.value);
                          const m = moradores.find((mor) => mor.id === e.target.value);
                          if (m) {
                            setManualNome(m.nome);
                            setManualTelefone(m.telefone || '');
                            setManualBloco(m.unidade.bloco);
                            setManualApto(m.unidade.apto);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="">Selecione o morador na lista...</option>
                        {moradores
                          .filter((m) => {
                            if (!searchMoradorInput.trim()) return true;
                            const q = searchMoradorInput.toLowerCase();
                            return (
                              m.nome.toLowerCase().includes(q) ||
                              m.unidade.apto.toLowerCase().includes(q) ||
                              m.unidade.bloco.toLowerCase().includes(q) ||
                              `bloco ${m.unidade.bloco}`.toLowerCase().includes(q) ||
                              `apto ${m.unidade.apto}`.toLowerCase().includes(q) ||
                              `bloco ${m.unidade.bloco} ${m.unidade.apto}`.toLowerCase().includes(q) ||
                              `${m.unidade.bloco} ${m.unidade.apto}`.toLowerCase().includes(q)
                            );
                          })
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              Bloco {m.unidade.bloco} - Apto {m.unidade.apto} • {m.nome} ({m.telefone || 'sem tel'})
                            </option>
                          ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
                        <span>Nenhum morador pré-cadastrado no condomínio. Digite diretamente o Bloco e Apto!</span>
                      </div>
                    )}
                  </div>
                )}

                {/* PACOTES DO APARTAMENTO (1 OU MÚLTIPLOS) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-amber-600" />
                      <span>Pacotes da Remessa ({pacotesLote.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleAddPacoteItem}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-xs flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-700" />
                      <span>+ Outro Pacote neste Apartamento</span>
                    </button>
                  </div>

                  {pacotesLote.map((pacote, index) => (
                    <div
                      key={pacote.id}
                      className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-3 relative hover:border-amber-300 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-600 text-white font-black text-[11px]">
                          Pacote #{index + 1}
                        </span>
                        {pacotesLote.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePacoteItem(pacote.id)}
                            className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Remover</span>
                          </button>
                        )}
                      </div>

                      {/* Destinatário deste Pacote Específico */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700 text-[11px]">
                            Nome do Destinatário do Pacote:
                          </label>
                          {moradoresDaUnidadeSelecionada.length > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400">Atalhos:</span>
                              {moradoresDaUnidadeSelecionada.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleUpdatePacoteItem(pacote.id, 'destinatarioNome', m.nome)}
                                  className="px-1.5 py-0.5 bg-slate-200 hover:bg-amber-100 rounded text-[10px] font-bold text-slate-800"
                                >
                                  {m.nome.split(' ')[0]}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Ex: Davi, Thais, Alice..."
                          value={pacote.destinatarioNome}
                          onChange={(e) => handleUpdatePacoteItem(pacote.id, 'destinatarioNome', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      {/* Transportadora */}
                      <div>
                        <label className="font-bold text-slate-700 block mb-1 text-[11px]">
                          Transportadora / Entregador:
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {commonCarriers.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => handleUpdatePacoteItem(pacote.id, 'transportadora', c)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                pacote.transportadora === c
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Ou digite outra transportadora..."
                          value={pacote.transportadora}
                          onChange={(e) => handleUpdatePacoteItem(pacote.id, 'transportadora', e.target.value)}
                          required
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>

                      {/* Rastreio & Observação */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1 text-[11px]">Código de Rastreio / NFe:</label>
                          <input
                            type="text"
                            placeholder="Ex: BR123456789 (opcional)"
                            value={pacote.codigoRastreio}
                            onChange={(e) => handleUpdatePacoteItem(pacote.id, 'codigoRastreio', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1 text-[11px]">Local na Portaria / Detalhe:</label>
                          <input
                            type="text"
                            placeholder="Ex: Prateleira 3, Caixa grande"
                            value={pacote.observacao}
                            onChange={(e) => handleUpdatePacoteItem(pacote.id, 'observacao', e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Foto do Selo / Etiqueta */}
                      <div className="pt-0.5">
                        <FotoEtiquetaCapture
                          fotoUrl={pacote.fotoUrl}
                          onFotoCapturada={(url) => handleUpdatePacoteItem(pacote.id, 'fotoUrl', url)}
                        />
                      </div>
                    </div>
                  ))}

                  {/* Botão para Adicionar Mais um Pacote */}
                  <button
                    type="button"
                    onClick={handleAddPacoteItem}
                    className="w-full p-2.5 rounded-2xl bg-amber-50/60 hover:bg-amber-100 border border-dashed border-amber-300 font-extrabold text-xs text-amber-900 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-600" />
                    <span>Adicionar Outro Pacote para Este Mesmo Apartamento</span>
                  </button>
                </div>

                {/* Opção: Manter Bloco e Apartamento Fixos */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="manterUnidadeFixa"
                    checked={manterUnidadeFixa}
                    onChange={(e) => setManterUnidadeFixa(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <label htmlFor="manterUnidadeFixa" className="text-xs text-slate-700 font-semibold cursor-pointer select-none">
                    Manter Bloco e Apartamento fixos para continuar cadastrando pacotes
                  </label>
                </div>

                {/* Feedback de Erro Inline */}
                {inlineFormError && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-bold flex items-center gap-2 animate-bounce">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{inlineFormError}</span>
                  </div>
                )}

                {/* Feedback de Sucesso Inline (Com PIN Visível Diretamente Aqui) */}
                {inlineFormSuccess && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 to-teal-900 text-white border-2 border-emerald-400 shadow-xl space-y-2.5 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-black">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>✅ {inlineFormSuccess.encomendas.length} Encomenda(s) Cadastrada(s) com Sucesso!</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInlineFormSuccess(null)}
                        className="text-emerald-300 hover:text-white text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 p-3 rounded-xl border border-emerald-500/30">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                          🔐 PIN Único do Apartamento:
                        </span>
                        <span className="text-2xl sm:text-3xl font-mono font-black text-emerald-400 tracking-widest">
                          {inlineFormSuccess.codigoResgate}
                        </span>
                        <p className="text-[10px] text-emerald-200 mt-0.5">
                          Enviado ao WhatsApp de {inlineFormSuccess.morador.nome} e sincronizado no App.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(inlineFormSuccess.codigoResgate);
                          setActionAlert({ type: 'success', text: '🔐 PIN copiado!' });
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar PIN</span>
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingPackage}
                  onClick={(e) => {
                    handleRegisterPackage(e);
                  }}
                  className={`w-full py-4 rounded-2xl text-white font-black text-sm shadow-lg shadow-amber-600/30 transition active:scale-98 cursor-pointer flex flex-col items-center justify-center gap-1 border border-amber-500 ${
                    isSubmittingPackage
                      ? 'bg-amber-700 opacity-80 cursor-wait'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Send className={`w-4 h-4 ${isSubmittingPackage ? 'animate-spin' : ''}`} />
                    <span>
                      {isSubmittingPackage
                        ? '⏳ Cadastrando & Notificando Apartamento...'
                        : `⚡ Cadastrar ${pacotesLote.length} Pacote(s) & Notificar Apartamento`}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-amber-100">
                    📲 Disparo 100% Automático no WhatsApp e App • Sem redirecionamento de tela
                  </span>
                </button>
              </form>
            </div>

            {/* Lista de Encomendas Estocadas & Validação de PIN / Retirada com Documento */}
            <div className="lg:col-span-5 space-y-4">
              {/* Box 1: Entregar Pacote via PIN Único de 6 Dígitos ou Documento */}
              <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50/50 border-2 border-amber-300 rounded-3xl p-5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">
                        Entregar Pacote (PIN Único)
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Valida todas as encomendas do apartamento
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Segurança Ativa
                  </span>
                </div>

                {baixaFeedback && (
                  <div
                    className={`p-3 rounded-2xl text-xs flex items-center gap-2 font-bold animate-in fade-in ${
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
                    <span className="flex-1">{baixaFeedback.message}</span>
                    <button
                      onClick={() => setBaixaFeedback(null)}
                      className="p-1 hover:bg-black/5 rounded-lg text-slate-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleBaixaSubmit} className="space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={inputRescueCode}
                      onChange={(e) => setInputRescueCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="PIN 000000"
                      className="flex-1 text-center font-mono font-black text-xl tracking-widest bg-white border-2 border-amber-300 focus:border-amber-600 rounded-2xl py-2.5 text-slate-900 focus:outline-none shadow-xs"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Validar PIN</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-500">
                      O PIN de 6 dígitos é obrigatório.
                    </span>
                    {pendingPackages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEncomendaForEntrega(pendingPackages[0]);
                          setIsEntregaModalOpen(true);
                        }}
                        className="text-amber-800 font-bold hover:underline"
                      >
                        Sem PIN? Doc + Rúbrica &rarr;
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Box 2: Lista de Encomendas Estocadas */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-600" />
                    <span>Aguardando Retirada ({pendingPackages.length})</span>
                  </h3>
                </div>

                {/* Busca na lista de pendentes */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar morador, apto, bloco, rastreio..."
                    value={searchEncomendaQuery}
                    onChange={(e) => setSearchEncomendaQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                  {pendingPackages.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8">Nenhum pacote estocado na portaria.</p>
                  ) : (
                    pendingPackages
                      .filter((enc) => {
                        if (!searchEncomendaQuery.trim()) return true;
                        const q = searchEncomendaQuery.toLowerCase();
                        return (
                          enc.moradorNome.toLowerCase().includes(q) ||
                          enc.codigoResgate.includes(q) ||
                          enc.unidade.apto.toLowerCase().includes(q) ||
                          enc.unidade.bloco.toLowerCase().includes(q) ||
                          enc.transportadora.toLowerCase().includes(q)
                        );
                      })
                      .map((enc) => {
                        const m = moradores.find((x) => x.id === enc.moradorId) || {
                          id: enc.moradorId,
                          condominioId: condominio.id,
                          nome: enc.moradorNome,
                          email: '',
                          telefone: '',
                          unidade: enc.unidade,
                          statusAdimplencia: 'em_dia' as const,
                          statusCadastro: 'ativo' as const,
                        };

                        const outrosPacotesDoApto = condoStore.getEncomendasPendentesUnidade(
                          condominio.id,
                          enc.unidade.bloco,
                          enc.unidade.apto
                        );

                        return (
                          <div
                            key={enc.id}
                            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between space-y-2.5 hover:border-amber-300 transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
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
                                <div>
                                  <div className="font-extrabold text-slate-900">{enc.moradorNome}</div>
                                  <div className="text-amber-800 font-bold text-xs flex items-center gap-1.5">
                                    <span>Bloco {enc.unidade.bloco} - Apto {enc.unidade.apto}</span>
                                    {outrosPacotesDoApto.length > 1 && (
                                      <span className="px-1.5 py-0.2 bg-amber-200 text-amber-900 text-[10px] rounded-md font-extrabold">
                                        {outrosPacotesDoApto.length} pacotes neste apto
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-500 text-[11px]">
                                    {enc.transportadora} • {enc.codigoRastreio || 'Sem rastreio'}
                                  </div>
                                </div>
                              </div>
                              <span className="font-mono font-black text-amber-950 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-xl text-[11px] shrink-0 tracking-wide" title="PIN único gerado no cadastro">
                                PIN: ••••••
                              </span>
                            </div>

                            {/* Ações Rápidas por Encomenda */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-200/60">
                              {/* WhatsApp */}
                              <a
                                href={notificationService.gerarLinkWhatsApp(m, enc, condominio)}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="Notificar no WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3 text-emerald-700" />
                                <span>WhatsApp</span>
                              </a>

                              {/* Instagram Direct */}
                              <button
                                onClick={() => {
                                  const text = notificationService.gerarTextoInstagramDirect(m, enc, condominio);
                                  handleCopyText(text, `insta_list_${enc.id}`);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="Copiar texto para Instagram Direct"
                              >
                                <Send className="w-3 h-3 text-purple-700" />
                                <span>{copiedKey === `insta_list_${enc.id}` ? 'Copiado!' : 'Instagram'}</span>
                              </button>

                              {/* Botão de Validação Segura de Entrega */}
                              <button
                                onClick={() => {
                                  setSelectedEncomendaForEntrega(enc);
                                  setIsEntregaModalOpen(true);
                                }}
                                className="flex-1 py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>{outrosPacotesDoApto.length > 1 ? `Entregar ${outrosPacotesDoApto.length} Pacotes` : 'Validar Entrega'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>
          </div>
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
                        Morador: <strong>{bike.usuarioAtualNome || bike.reservaMoradorNome || 'Morador'}</strong>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <span>Controle de Visitantes & Prestadores Autorizados</span>
              </h3>
              <p className="text-xs text-slate-500">
                Autorizações emitidas pelos moradores pelo aplicativo com QR Code / Código de Acesso.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                {visitantes.length} registro(s)
              </span>
            </div>
          </div>

          {visitantes.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-slate-600 font-bold text-xs">Nenhum visitante autorizado no momento</div>
              <p className="text-[11px] text-slate-400">
                Assim que um morador liberar um convidado ou prestador pelo app, aparecerá aqui e no banner sonoro da portaria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visitantes.map((vis) => (
                <div key={vis.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        vis.tipo === 'prestador'
                          ? 'bg-blue-100 text-blue-900'
                          : vis.tipo === 'entrega'
                          ? 'bg-purple-100 text-purple-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {vis.tipo}
                      </span>
                      <span className="text-xs font-mono font-black bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 text-slate-800">
                        Cód: {vis.codigoAcesso}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{vis.nomeVisitante}</h4>
                      {vis.empresa && <p className="text-xs text-slate-600 font-semibold">{vis.empresa}</p>}
                      <p className="text-xs text-slate-600 mt-1">
                        Unidade: <strong>{vis.unidade ? `Bloco ${vis.unidade.bloco} - Apto ${vis.unidade.apto}` : 'Residencial'}</strong>
                      </p>
                      <p className="text-xs text-slate-500">
                        Morador: <strong>{vis.moradorNome}</strong>
                      </p>
                      {vis.placaVeiculo && (
                        <p className="text-xs text-slate-700 mt-1 flex items-center gap-1 font-semibold">
                          <Car className="w-3.5 h-3.5" /> Placa: {vis.placaVeiculo}
                        </p>
                      )}
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Data: {vis.dataVisita} • {vis.periodoPermitido || 'Dia Todo'}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">
                      Status: <strong className="uppercase">{vis.status}</strong>
                    </span>

                    {vis.status === 'pendente' ? (
                      <button
                        onClick={() => handleCheckinVisitante(vis.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow transition cursor-pointer"
                      >
                        Registrar Entrada
                      </button>
                    ) : vis.status === 'dentro' ? (
                      <button
                        onClick={() => handleCheckoutVisitante(vis.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition cursor-pointer"
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
          )}
        </div>
      )}

      {/* ABA 5: INTERFONE & WALKIE-TALKIE PTT (ESTILO ZELLO) */}
      {activeTab === 'interfone' && (
        <IntercomPTTView
          condominio={condominio}
          currentUserRole="portaria"
          currentUserName="Portaria Central"
        />
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
                  <strong className="text-slate-900">{selectedBikeForReturn.usuarioAtualNome || selectedBikeForReturn.reservaMoradorNome || 'Morador'}</strong>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-600" />
                <span>Histórico Completo de Encomendas & Entregas</span>
              </h3>
              <p className="text-xs text-slate-500">Consulta permanente para esclarecer dúvidas dos moradores com comprovante de PIN e Rúbrica.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                {deliveredPackages.length} entregue(s) arquivada(s)
              </span>
            </div>
          </div>

          {/* Busca e Filtros Rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por Morador, Apto, Bloco, Transportadora, Rastreio ou PIN..."
                value={searchEncomendaQuery}
                onChange={(e) => setSearchEncomendaQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50/50"
              />
            </div>
            <div className="sm:col-span-4 flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <span className="text-slate-500 text-[11px] px-2">Total: {encomendas.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">Destinatário</th>
                  <th className="p-3">Selo / Foto</th>
                  <th className="p-3">Transportadora</th>
                  <th className="p-3">Recebido Em</th>
                  <th className="p-3">Status & Método de Entrega</th>
                  <th className="p-3">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {encomendas
                  .filter((enc) => {
                    const q = searchEncomendaQuery.toLowerCase().trim();
                    if (!q) return true;
                    return (
                      (enc.moradorNome || '').toLowerCase().includes(q) ||
                      (enc.unidade?.apto || '').toLowerCase().includes(q) ||
                      (enc.unidade?.bloco || '').toLowerCase().includes(q) ||
                      (enc.transportadora || '').toLowerCase().includes(q) ||
                      (enc.codigoRastreio || '').toLowerCase().includes(q) ||
                      (enc.codigoResgate || '').toLowerCase().includes(q) ||
                      (enc.nomeRetirante || '').toLowerCase().includes(q)
                    );
                  })
                  .map((enc) => (
                  <tr key={enc.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{enc.moradorNome}</div>
                      <div className="text-amber-800 text-[11px] font-semibold">
                        Bloco {enc.unidade?.bloco || '1'} - Apto {enc.unidade?.apto || '-'}
                      </div>
                    </td>
                    <td className="p-3">
                      {enc.fotoUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewFotoUrl(enc.fotoUrl!)}
                          className="flex items-center gap-1.5 text-amber-800 hover:text-amber-950 font-bold bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg transition cursor-pointer"
                          title="Clique para ver a foto do selo"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-600" />
                          <span>Ver Foto</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Sem foto</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700">
                      <div className="font-bold">{enc.transportadora}</div>
                      <div className="font-mono text-[10px] text-slate-400">{enc.codigoRastreio || 'Sem rastreio'}</div>
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(enc.recebidoEm).toLocaleDateString('pt-BR')} {new Date(enc.recebidoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      {enc.status === 'na_portaria' ? (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                          📦 Aguardando Retirada (PIN: {enc.codigoResgate})
                        </span>
                      ) : enc.status === 'encaminhada_administracao' ? (
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-rose-100 text-rose-900 border border-rose-300">
                          🏛️ Na Administração
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
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
                      )}
                    </td>
                    <td className="p-3">
                      {enc.status === 'entregue' ? (
                        <div className="text-[11px] text-slate-700 space-y-0.5">
                          <div>Para: <strong>{enc.nomeRetirante || enc.entreguePara || 'Morador'}</strong></div>
                          {enc.documentoRetirante && (
                            <div className="font-mono text-[10px] text-slate-500">Doc: {enc.documentoRetirante}</div>
                          )}
                          {enc.entregueEm && (
                            <div className="text-[10px] text-emerald-700">
                              Em: {new Date(enc.entregueEm).toLocaleDateString('pt-BR')} {new Date(enc.entregueEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                          {enc.assinaturaRetiranteUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewFotoUrl(enc.assinaturaRetiranteUrl!)}
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
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
                        >
                          Entregar Agora
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Validação Segura de Entrega de Encomenda */}
      <EntregaEncomendaModal
        isOpen={isEntregaModalOpen}
        onClose={() => {
          setIsEntregaModalOpen(false);
          setSelectedEncomendaForEntrega(null);
        }}
        encomenda={selectedEncomendaForEntrega}
        condominio={condominio}
        operadorNome="Porteiro de Plantão"
        onSuccess={(msg) => {
          setActionAlert({ type: 'success', text: msg });
        }}
      />

      {/* Modal: Pré-visualização de Foto do Selo ou Assinatura em Alta Resolução */}
      {previewFotoUrl && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm p-4 flex flex-col items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl p-4 max-w-lg w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-600" />
                Imagem Registrada na Portaria
              </span>
              <button
                type="button"
                onClick={() => setPreviewFotoUrl(null)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-[70vh] flex items-center justify-center">
              <img
                src={previewFotoUrl}
                alt="Foto Registrada"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewFotoUrl(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold"
              >
                Fechar Visualização
              </button>
            </div>
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
