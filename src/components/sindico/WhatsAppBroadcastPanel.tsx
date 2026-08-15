import React, { useState, useEffect } from 'react';
import {
  Send,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Zap,
  Radio,
  Clock,
  Filter,
  Check,
  RotateCcw,
  Copy,
} from 'lucide-react';
import { Condominio, Morador, NoticeCategory, WhatsAppBroadcast, WhatsAppMessageLog } from '../../types';
import { whatsappService } from '../../services/whatsappService';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';

interface WhatsAppBroadcastPanelProps {
  condominio: Condominio;
  moradores: Morador[];
}

const TEMPLATES = [
  {
    id: 'agua',
    label: '🚨 Corte Emergencial de Água',
    titulo: 'Interrupção Temporária no Fornecimento de Água',
    categoria: 'urgente' as NoticeCategory,
    mensagem:
      'Informamos que, devido a uma manutenção emergencial no barrilete principal, o abastecimento de água será temporariamente interrompido hoje das 14h às 17h. Pedimos a compreensão de todos e o uso consciente das caixas d\'água.',
  },
  {
    id: 'elevador',
    label: '🛠️ Manutenção dos Elevadores',
    titulo: 'Manutenção Preventiva de Elevadores',
    categoria: 'manutencao' as NoticeCategory,
    mensagem:
      'A empresa responsável realizará a manutenção preventiva mensal nos elevadores amanhã a partir das 09h. Um dos elevadores permanecerá em operação alternada para minimizar o impacto.',
  },
  {
    id: 'assembleia',
    label: '🏛️ Convocação para Assembleia',
    titulo: 'Edital de Convocação: Assembleia Geral Ordinária',
    categoria: 'comunicado' as NoticeCategory,
    mensagem:
      'Ficam todos os condôminos convocados para a Assembleia Geral Ordinária que será realizada na próxima terça-feira às 19h30 no Salão de Festas. Pauta: Prestação de contas e melhorias na área de lazer.',
  },
  {
    id: 'lazer',
    label: '🏊 Interdição da Piscina / Salão',
    titulo: 'Tratamento Químico da Piscina',
    categoria: 'manutencao' as NoticeCategory,
    mensagem:
      'A piscina principal estará interditada hoje para tratamento químico de choque e aspiração. O acesso será reaberto normalmente amanhã a partir das 08h00.',
  },
  {
    id: 'garagem',
    label: '🚗 Lavagem e Limpeza da Garagem',
    titulo: 'Lavagem Periódica dos Pisos da Garagem',
    categoria: 'comunicado' as NoticeCategory,
    mensagem:
      'Nesta quinta-feira faremos a lavação do piso da garagem do subsolo. Favor atentar para não deixar objetos soltos nas vagas demarcadas durante o horário das 08h às 16h.',
  },
];

export const WhatsAppBroadcastPanel: React.FC<WhatsAppBroadcastPanelProps> = ({
  condominio,
  moradores,
}) => {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<NoticeCategory>('comunicado');
  const [mensagem, setMensagem] = useState('');
  const [filtroBloco, setFiltroBloco] = useState<string>('todos');
  const [incluirContato, setIncluirContato] = useState(true);
  const [tambemCriarAviso, setTambemCriarAviso] = useState(true);

  // Status de disparo e animação
  const [isDisparando, setIsDisparando] = useState(false);
  const [progressoEnvio, setProgressoEnvio] = useState(0);
  const [ultimoBroadcast, setUltimoBroadcast] = useState<WhatsAppBroadcast | null>(null);
  const [copiedLinkIndex, setCopiedLinkIndex] = useState<number | null>(null);

  // Logs e histórico
  const [broadcastHistory, setBroadcastHistory] = useState<WhatsAppBroadcast[]>([]);
  const [recentLogs, setRecentLogs] = useState<WhatsAppMessageLog[]>([]);
  const [abaExibicao, setAbaExibicao] = useState<'novo_disparo' | 'historico_disparos' | 'logs_individuais'>('novo_disparo');

  useEffect(() => {
    const carregar = () => {
      setBroadcastHistory(whatsappService.getBroadcasts(condominio.id));
      setRecentLogs(whatsappService.getLogs(condominio.id).slice(0, 30));
    };

    carregar();
    const unsubscribe = whatsappService.subscribe(carregar);
    return () => unsubscribe();
  }, [condominio.id]);

  const moradoresAtivos = moradores.filter((m) => m.statusCadastro === 'ativo');

  // Blocos únicos
  const blocosUnicos = Array.from(new Set(moradoresAtivos.map((m) => m.unidade.bloco))).filter(Boolean);

  // Destinatários filtrados
  const destinatariosFiltrados = moradoresAtivos.filter((m) => {
    if (filtroBloco === 'todos') return true;
    return m.unidade.bloco === filtroBloco;
  });

  const aplicarTemplate = (tpl: typeof TEMPLATES[0]) => {
    setTitulo(tpl.titulo);
    setCategoria(tpl.categoria);
    setMensagem(tpl.mensagem);
  };

  const handleDispararWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !mensagem.trim()) {
      alert('Por favor, preencha o título e a mensagem antes de disparar.');
      return;
    }

    if (destinatariosFiltrados.length === 0) {
      alert('Nenhum morador selecionado para envio.');
      return;
    }

    setIsDisparando(true);
    setProgressoEnvio(15);

    // Simula fila progressiva de disparo para todos
    setTimeout(() => setProgressoEnvio(45), 300);
    setTimeout(() => setProgressoEnvio(80), 600);

    setTimeout(() => {
      const broadcast = whatsappService.dispararParaTodos({
        condominio,
        moradores: destinatariosFiltrados,
        titulo: titulo.trim(),
        categoria,
        mensagem: mensagem.trim(),
        enviadoPor: condominio.sindicoNome,
        incluirContatoAdmin: incluirContato,
      });

      // Também sincroniza como aviso oficial no mural do condomínio
      if (tambemCriarAviso) {
        condoStore.addAviso(condominio.id, {
          titulo: titulo.trim(),
          mensagem: mensagem.trim(),
          categoria,
          prioritario: categoria === 'urgente',
          autor: condominio.sindicoNome,
          autorCargo: 'Síndico Geral',
        });
      }

      setProgressoEnvio(100);
      setUltimoBroadcast(broadcast);
      setIsDisparando(false);
      confetti({ particleCount: 70, spread: 80 });
    }, 900);
  };

  const handleCopiarTexto = (texto: string, index: number) => {
    navigator.clipboard.writeText(texto);
    setCopiedLinkIndex(index);
    setTimeout(() => setCopiedLinkIndex(null), 2000);
  };

  const dataHoraSimulada = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6">
      {/* Header Principal do Módulo de WhatsApp */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-bold uppercase tracking-wider border border-white/25">
              <Radio className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
              <span>Transmissão Simultânea WhatsApp</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Disparo em Massa para Todos os Moradores
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Envie alertas urgentes, informativos de manutenção e convocações direto para o WhatsApp de todos os condôminos cadastrados instantaneamente.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
              <div className="text-2xl font-black">{destinatariosFiltrados.length}</div>
              <div className="text-[11px] text-emerald-100 font-semibold uppercase">Destinatários Ativos</div>
            </div>
            <div className="bg-white/15 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-center">
              <div className="text-2xl font-black">{broadcastHistory.length}</div>
              <div className="text-[11px] text-emerald-100 font-semibold uppercase">Disparos Feitos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação entre Abas do Painel de WhatsApp */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setAbaExibicao('novo_disparo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            abaExibicao === 'novo_disparo'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Novo Disparo em Massa</span>
        </button>

        <button
          onClick={() => setAbaExibicao('historico_disparos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            abaExibicao === 'historico_disparos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Histórico de Transmissões ({broadcastHistory.length})</span>
        </button>

        <button
          onClick={() => setAbaExibicao('logs_individuais')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            abaExibicao === 'logs_individuais'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Auditoria de Mensagens Automáticas ({recentLogs.length})</span>
        </button>
      </div>

      {/* ABA 1: FORMULÁRIO DE NOVO DISPARO & PREVIEW */}
      {abaExibicao === 'novo_disparo' && (
        <div className="space-y-6">
          {/* Modelos Rápidos de Mensagem */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Modelos Rápidos Pré-configurados (Clique para carregar):
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => aplicarTemplate(tpl)}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-xs font-semibold text-slate-800 transition active:scale-98 text-left cursor-pointer"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Esquerda: Formulário de Configuração */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Redigir Comunicado para o WhatsApp
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {destinatariosFiltrados.length} Moradores
                </span>
              </div>

              <form onSubmit={handleDispararWhatsApp} className="space-y-4">
                {/* Título */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título / Assunto do Comunicado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Interrupção no Abastecimento de Água"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Categoria e Filtro de Destinatários */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Categoria / Nível de Alerta *
                    </label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value as NoticeCategory)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="urgente">🚨 Emergência / Urgente</option>
                      <option value="manutencao">🛠️ Manutenção Predial</option>
                      <option value="comunicado">📢 Comunicado Oficial</option>
                      <option value="social">🎉 Eventos & Convivência</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Destinatários Alvo *
                    </label>
                    <div className="relative">
                      <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <select
                        value={filtroBloco}
                        onChange={(e) => setFiltroBloco(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="todos">Todos os Moradores Ativos ({moradoresAtivos.length})</option>
                        {blocosUnicos.map((bloco) => {
                          const count = moradoresAtivos.filter((m) => m.unidade.bloco === bloco).length;
                          return (
                            <option key={bloco} value={bloco}>
                              Apenas Bloco/Torre {bloco} ({count} moradores)
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Corpo da Mensagem */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Mensagem Completa *
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {mensagem.length} caracteres
                    </span>
                  </div>
                  <textarea
                    required
                    rows={6}
                    placeholder="Digite aqui o texto do aviso que será enviado diretamente para o celular de cada morador..."
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-emerald-500 resize-none font-normal"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    💡 Dica: A mensagem será personalizada automaticamente com o nome e o número de apartamento de cada morador.
                  </p>
                </div>

                {/* Checkboxes de Controle */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirContato}
                      onChange={(e) => setIncluirContato(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Incluir assinatura do Síndico ({condominio.sindicoNome}) e e-mail no rodapé</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tambemCriarAviso}
                      onChange={(e) => setTambemCriarAviso(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Publicar também no Mural Digital de Avisos do Aplicativo</span>
                  </label>
                </div>

                {/* Barra de Progresso de Envio */}
                {isDisparando && (
                  <div className="space-y-2 pt-2 animate-in fade-in">
                    <div className="flex justify-between text-xs font-bold text-emerald-800">
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                        Disparando para {destinatariosFiltrados.length} números de WhatsApp...
                      </span>
                      <span>{progressoEnvio}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${progressoEnvio}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Botão de Disparo Principal */}
                <button
                  type="submit"
                  disabled={isDisparando || destinatariosFiltrados.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isDisparando
                      ? 'Processando Envio Simultâneo...'
                      : `Disparar para Todos os Moradores (${destinatariosFiltrados.length} destinatários)`}
                  </span>
                </button>
              </form>
            </div>

            {/* Coluna Direita: Preview Realista do WhatsApp */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Pré-visualização no WhatsApp
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Formato Oficial</span>
                </div>

                {/* Interface Simulada de Chat do WhatsApp */}
                <div className="bg-[#0b141a] rounded-2xl p-4 border border-slate-800 relative overflow-hidden">
                  {/* Top Bar do Chat */}
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80 mb-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-xs text-white">
                      🏢
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100">{condominio.nome}</div>
                      <div className="text-[10px] text-emerald-400">Canal Oficial de Notificações</div>
                    </div>
                  </div>

                  {/* Balão de Mensagem do WhatsApp */}
                  <div className="bg-[#005c4b] text-white rounded-2xl rounded-tr-none p-3.5 text-xs shadow-md space-y-2 relative max-w-[95%] ml-auto">
                    <div className="text-[11px] font-bold text-emerald-200 border-b border-emerald-600/60 pb-1 flex items-center justify-between">
                      <span>🏢 {condominio.nome.toUpperCase()}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 bg-emerald-800/60 rounded">
                        {categoria}
                      </span>
                    </div>

                    <p className="text-[11px] text-emerald-100">
                      Olá, <strong>[Nome do Morador]</strong>! (Bl. [Bloco] - Apto [Apto])
                    </p>

                    <div className="font-bold text-xs text-white uppercase tracking-wide">
                      📌 {titulo || 'TÍTULO DO SEU COMUNICADO'}
                    </div>

                    <p className="text-[11px] text-slate-100 leading-relaxed whitespace-pre-wrap">
                      {mensagem ||
                        'A mensagem digitada no formulário aparecerá aqui com emojis, quebras de linha e dados individuais de cada morador.'}
                    </p>

                    {incluirContato && (
                      <div className="pt-2 border-t border-emerald-600/50 text-[10px] text-emerald-200">
                        👤 Emitido por: {condominio.sindicoNome} ({condominio.sindicoEmail})
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-300 pt-1">
                      <span>{dataHoraSimulada}</span>
                      <span className="text-sky-300">✓✓</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 mt-3 text-center">
                  📱 Cada condômino recebe a notificação instantaneamente no seu próprio WhatsApp cadastrado.
                </p>
              </div>

              {/* Card de Informações da Frota & Unidades */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5">
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Notificações Automáticas em Tempo Real
                </h4>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Além dos comunicados em massa, o sistema dispara notificações no WhatsApp automaticamente sempre que:
                </p>
                <ul className="text-xs text-emerald-900 mt-2 space-y-1.5 list-disc list-inside">
                  <li>Uma <strong>bicicleta</strong> for destravada (com a senha do cadeado).</li>
                  <li>Uma <strong>encomenda</strong> chegar na portaria (com o código de 6 dígitos).</li>
                  <li>Uma <strong>reserva de salão/churrasqueira</strong> for confirmada.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Modal / Card de Confirmação do Último Disparo */}
          {ultimoBroadcast && (
            <div className="bg-white border-2 border-emerald-500/80 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Disparo Realizado com Sucesso!
                    </h3>
                    <p className="text-xs text-slate-500">
                      Comunicado "{ultimoBroadcast.titulo}" processado para {ultimoBroadcast.totalDestinatarios} moradores.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setUltimoBroadcast(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                >
                  Fechar Relatório
                </button>
              </div>

              {/* Lista dos Destinatários com Botões de Teste */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Lista de Moradores Notificados (Clique para abrir a conversa no WhatsApp):
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-2xl">
                  {ultimoBroadcast.destinatarios.map((dest, idx) => (
                    <div
                      key={dest.moradorId}
                      className="p-3 bg-white hover:bg-emerald-50/50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{dest.nome}</span>
                        <span className="text-slate-500 ml-2 font-medium">({dest.unidade})</span>
                        <div className="text-[11px] text-emerald-700 font-semibold">{dest.telefone}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Enviado
                        </span>

                        <a
                          href={dest.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] inline-flex items-center gap-1.5 transition active:scale-95"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 2: HISTÓRICO DE TRANSMISSÕES EM MASSA */}
      {abaExibicao === 'historico_disparos' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600" />
                Histórico de Comunicados em Massa
              </h3>
              <p className="text-xs text-slate-500">
                Registro de todos os avisos enviados pelo síndico via WhatsApp.
              </p>
            </div>
          </div>

          {broadcastHistory.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Nenhum disparo realizado ainda</h4>
              <p className="text-xs text-slate-500">
                Utilize a aba "Novo Disparo em Massa" para enviar seu primeiro comunicado.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {broadcastHistory.map((bc) => (
                <div
                  key={bc.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {bc.categoria}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900">{bc.titulo}</h4>
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {new Date(bc.timestamp).toLocaleString('pt-BR')} • {bc.totalDestinatarios} moradores notificados
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {bc.mensagem}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Enviado por: <strong>{bc.enviadoPor}</strong>
                    </span>

                    <button
                      onClick={() => setUltimoBroadcast(bc)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Ver Destinatários e Links WhatsApp</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: AUDITORIA DE MENSAGENS AUTOMÁTICAS */}
      {abaExibicao === 'logs_individuais' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Auditoria de Mensagens Individuais Enviadas pelo Sistema
            </h3>
            <p className="text-xs text-slate-500">
              Notificações de retirada de bikes, encomendas na portaria e confirmações de reservas.
            </p>
          </div>

          {recentLogs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Sem logs recentes</h4>
              <p className="text-xs text-slate-500">
                As notificações aparecerão aqui conforme os moradores retirarem bikes, receberem encomendas ou reservarem áreas de lazer.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Morador</th>
                    <th className="py-3 px-4">Unidade</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4">Assunto</th>
                    <th className="py-3 px-4">Data/Hora</th>
                    <th className="py-3 px-4">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                          {log.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{log.moradorNome}</td>
                      <td className="py-3 px-4 text-slate-700">{log.moradorUnidade || 'N/D'}</td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">{log.moradorTelefone}</td>
                      <td className="py-3 px-4 text-slate-800 font-medium">{log.titulo}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(log.timestamp).toLocaleString('pt-BR')}</td>
                      <td className="py-3 px-4">
                        <a
                          href={log.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg inline-flex items-center gap-1 font-bold text-[11px]"
                          title="Abrir no WhatsApp"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
