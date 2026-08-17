import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Sparkles,
  Shirt,
  ShoppingBag,
  Bike,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Check,
  X,
  MapPin,
  FileText,
  Trash2,
  Edit,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Timer,
  CheckCircle,
} from 'lucide-react';
import { ItemCompartilhado, CategoriaItemCompartilhado, Morador, Condominio } from '../../types';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';

interface ItensCompartilhadosViewProps {
  condominio: Condominio;
  moradorAtual?: Morador | null;
  isStaff?: boolean; // Síndico, Porteiro ou Administrador
  operadorNome?: string;
}

export const ItensCompartilhadosView: React.FC<ItensCompartilhadosViewProps> = ({
  condominio,
  moradorAtual,
  isStaff = false,
  operadorNome = 'Portaria / Síndico',
}) => {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Modal Novo Item (Staff)
  const [showAddModal, setShowAddModal] = useState(false);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaItemCompartilhado>('ferramentas');
  const [codigoIdentificador, setCodigoIdentificador] = useState('');
  const [descricao, setDescricao] = useState('');
  const [localArmazenamento, setLocalArmazenamento] = useState('Portaria Principal');
  const [tempoMaximoHoras, setTempoMaximoHoras] = useState(4);
  const [instrucoesUso, setInstrucoesUso] = useState('');

  // Modal Reserva Confirmada (Morador)
  const [reservaConfirmada, setReservaConfirmada] = useState<{
    item: ItemCompartilhado;
    codigoResgate: string;
    expiraEmTimestamp: number;
  } | null>(null);

  // Modal Devolução de Item (Staff)
  const [itemDevolvendo, setItemDevolvendo] = useState<ItemCompartilhado | null>(null);
  const [obsDevolucao, setObsDevolucao] = useState('');

  // Modal Validação Rápida de Código (Staff)
  const [codigoValidacao, setCodigoValidacao] = useState('');
  const [showValidadorModal, setShowValidadorModal] = useState(false);

  // Reatividade
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const unsub = condoStore.subscribe(() => setTick((t) => t + 1));
    const timer = setInterval(() => setTick((t) => t + 1), 2000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, []);

  const itens = condoStore.getItensCompartilhados(condominio.id, categoriaAtiva);

  const showMsg = (texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') => {
    setFeedback({ tipo, texto });
    setTimeout(() => setFeedback(null), 5000);
  };

  // Filtragem
  const itensFiltrados = itens.filter((item) => {
    const term = busca.toLowerCase();
    return (
      item.nome.toLowerCase().includes(term) ||
      item.codigoIdentificador?.toLowerCase().includes(term) ||
      item.localArmazenamento.toLowerCase().includes(term) ||
      item.descricao?.toLowerCase().includes(term)
    );
  });

  // Categorias com contadores
  const todosItens = condoStore.getItensCompartilhados(condominio.id);
  const contadores = {
    todos: todosItens.length,
    ferramentas: todosItens.filter((i) => i.categoria === 'ferramentas').length,
    utilidades: todosItens.filter((i) => i.categoria === 'utilidades').length,
    lavanderia: todosItens.filter((i) => i.categoria === 'lavanderia').length,
    mobilidade: todosItens.filter((i) => i.categoria === 'mobilidade').length,
  };

  // Handler de Reserva (Morador)
  const handleReservar = (item: ItemCompartilhado) => {
    if (!moradorAtual && !isStaff) {
      showMsg('Faça login como morador para reservar este item.', 'erro');
      return;
    }

    const moradorId = moradorAtual ? moradorAtual.id : 'morador_demo_1';
    const res = condoStore.reservarItemCompartilhado(condominio.id, item.id, moradorId);

    if (res.success && res.codigoResgate) {
      confetti({ particleCount: 50, spread: 60 });
      setReservaConfirmada({
        item,
        codigoResgate: res.codigoResgate,
        expiraEmTimestamp: Date.now() + 5 * 60 * 1000,
      });
      showMsg(res.message, 'sucesso');
    } else {
      showMsg(res.message, 'erro');
    }
  };

  // Handler de Cancelamento
  const handleCancelarReserva = (item: ItemCompartilhado) => {
    const moradorId = moradorAtual ? moradorAtual.id : undefined;
    const res = condoStore.cancelarReservaItemCompartilhado(condominio.id, item.id, moradorId);
    if (res.success) {
      showMsg(res.message, 'sucesso');
      if (reservaConfirmada?.item.id === item.id) {
        setReservaConfirmada(null);
      }
    } else {
      showMsg(res.message, 'erro');
    }
  };

  // Handler de Liberação de Saída (Staff)
  const handleLiberarSaida = (codigoOuId: string) => {
    const res = condoStore.liberarRetiradaItemPortaria(condominio.id, codigoOuId, operadorNome);
    if (res.success) {
      confetti({ particleCount: 40, spread: 50 });
      showMsg(res.message, 'sucesso');
      setCodigoValidacao('');
      setShowValidadorModal(false);
    } else {
      showMsg(res.message, 'erro');
    }
  };

  // Handler de Devolução (Staff)
  const handleConfirmarDevolucao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDevolvendo) return;

    const res = condoStore.receberDevolucaoItem(condominio.id, itemDevolvendo.id, {
      operadorNome,
      observacoes: obsDevolucao,
    });

    if (res.success) {
      confetti({ particleCount: 40, spread: 50 });
      showMsg(res.message, 'sucesso');
      setItemDevolvendo(null);
      setObsDevolucao('');
    } else {
      showMsg(res.message, 'erro');
    }
  };

  // Handler de Adição de Item (Staff)
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !codigoIdentificador) {
      showMsg('Preencha o nome e o código de identificação do item.', 'erro');
      return;
    }

    condoStore.addItemCompartilhado(condominio.id, {
      nome,
      categoria,
      codigoIdentificador: codigoIdentificador.toUpperCase(),
      descricao,
      localArmazenamento,
      tempoMaximoUsoHoras: Number(tempoMaximoHoras),
      requerAprovacao: false,
      instrucoesUso,
      status: 'disponivel',
    });

    confetti({ particleCount: 50, spread: 60 });
    showMsg(`Item "${nome}" cadastrado com sucesso!`, 'sucesso');
    setShowAddModal(false);
    setNome('');
    setCodigoIdentificador('');
    setDescricao('');
    setInstrucoesUso('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Cabeçalho do Módulo */}
      <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl shadow-xl border border-teal-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Wrench className="w-6 h-6 text-teal-400" />
              <span>Itens & Equipamentos Compartilhados</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Ferramentas elétricas, carrinhos de compras, lavanderia e utilidades para empréstimo
              rápido entre moradores com tolerância de 5 minutos e controle de portaria.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isStaff && (
              <>
                <button
                  id="btn-abrir-validador-portaria"
                  onClick={() => setShowValidadorModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs transition shadow-lg flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Validar Código Morador</span>
                </button>

                <button
                  id="btn-cadastrar-novo-item-staff"
                  onClick={() => setShowAddModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/20 flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Novo Equipamento</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in ${
            feedback.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.texto}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-500 hover:text-slate-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barra de Filtros por Categoria e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Categorias Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setCategoriaAtiva('todos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              categoriaAtiva === 'todos'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({contadores.todos})
          </button>

          <button
            onClick={() => setCategoriaAtiva('ferramentas')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              categoriaAtiva === 'ferramentas'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Ferramentas ({contadores.ferramentas})</span>
          </button>

          <button
            onClick={() => setCategoriaAtiva('utilidades')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              categoriaAtiva === 'utilidades'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/60'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Utilidades & Carrinhos ({contadores.utilidades})</span>
          </button>

          <button
            onClick={() => setCategoriaAtiva('lavanderia')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              categoriaAtiva === 'lavanderia'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/60'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Lavanderia ({contadores.lavanderia})</span>
          </button>
        </div>

        {/* Input de Busca */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, código ou local..."
            className="w-full pl-9.5 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Grid de Itens e Equipamentos */}
      {itensFiltrados.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-3">
          <Wrench className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-700">Nenhum equipamento encontrado</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Não foram encontrados itens na categoria selecionada ou para os termos pesquisados.
          </p>
          {isStaff && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition cursor-pointer"
            >
              + Cadastrar Primeiro Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {itensFiltrados.map((item) => {
            const isDisponivel = item.status === 'disponivel';
            const isReservado = item.status === 'reservado';
            const isEmUso = item.status === 'em_uso';
            const isManutencao = item.status === 'manutencao';

            // Tempo restante da reserva de 5 minutos
            let tempoRestanteMin = 0;
            if (isReservado && item.reservaAtual) {
              const expiraTimestamp = item.reservaAtual.expiraEmTimestamp || item.reservaAtual.reservadoEm + 5 * 60 * 1000;
              tempoRestanteMin = Math.max(0, Math.ceil((expiraTimestamp - Date.now()) / 1000));
            }

            return (
              <div
                key={item.id}
                className={`p-5 rounded-3xl border transition flex flex-col justify-between ${
                  isDisponivel
                    ? 'bg-white border-slate-200/90 shadow-sm hover:border-teal-300 hover:shadow-md'
                    : isReservado
                    ? 'bg-amber-50/50 border-amber-200 shadow-sm ring-1 ring-amber-300/60'
                    : isEmUso
                    ? 'bg-blue-50/40 border-blue-200 shadow-sm'
                    : 'bg-rose-50/40 border-rose-200'
                }`}
              >
                <div>
                  {/* Tag Superior */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-xs text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                        {item.codigoIdentificador || 'ITEM'}
                      </span>
                      <span className="text-[11px] font-bold capitalize text-slate-600">
                        {item.categoria}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                        isDisponivel
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : isReservado
                          ? 'bg-amber-100 text-amber-900 border-amber-200 animate-pulse'
                          : isEmUso
                          ? 'bg-blue-100 text-blue-900 border-blue-200'
                          : 'bg-rose-100 text-rose-900 border-rose-200'
                      }`}
                    >
                      {isDisponivel
                        ? '🟢 Disponível'
                        : isReservado
                        ? '🟡 Reservado (5 min)'
                        : isEmUso
                        ? '🔵 Em Uso'
                        : '🔴 Manutenção'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {item.nome}
                  </h3>

                  {item.descricao && (
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {item.descricao}
                    </p>
                  )}

                  {/* Informações de Local & Prazo */}
                  <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span className="truncate">
                        Local: <strong>{item.localArmazenamento}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>
                        Prazo máx.: <strong>{item.tempoMaximoUsoHoras}h por empréstimo</strong>
                      </span>
                    </div>
                  </div>

                  {/* Alerta de Reserva Ativa (5 Min) */}
                  {isReservado && item.reservaAtual && (
                    <div className="mt-3 p-3 rounded-2xl bg-amber-100/80 border border-amber-300 text-amber-950 text-xs space-y-1">
                      <div className="flex items-center justify-between font-extrabold">
                        <span className="flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 text-amber-800" />
                          <span>Tolerância de Retirada:</span>
                        </span>
                        <span className="font-mono text-amber-900">
                          {Math.floor(tempoRestanteMin / 60)}:{(tempoRestanteMin % 60).toString().padStart(2, '0')} min
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900/90">
                        Morador: <strong>{item.reservaAtual.moradorNome}</strong> ({item.reservaAtual.unidade})
                      </p>
                      <div className="pt-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-amber-800">Código de Liberação:</span>
                        <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded-lg border border-amber-300 text-amber-950">
                          {item.reservaAtual.codigoResgate}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Alerta de Em Uso Atual */}
                  {isEmUso && item.usoAtual && (
                    <div className="mt-3 p-3 rounded-2xl bg-blue-100/80 border border-blue-300 text-blue-950 text-xs space-y-1">
                      <div className="flex items-center justify-between font-extrabold">
                        <span>Em uso por:</span>
                        <span className="text-blue-900 font-bold">{item.usoAtual.moradorNome}</span>
                      </div>
                      <p className="text-[11px] text-blue-800">
                        Unidade: <strong>{item.usoAtual.unidade}</strong>
                      </p>
                      <p className="text-[10px] text-blue-700">
                        Liberado por: {item.usoAtual.liberadoPor || 'Portaria'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Ações Inferiores */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-2">
                  {/* Morador: Reservar (5 Min) */}
                  {isDisponivel && (
                    <button
                      id={`btn-reservar-item-${item.id}`}
                      onClick={() => handleReservar(item)}
                      className="flex-1 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs transition shadow-sm shadow-teal-600/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <Timer className="w-3.5 h-3.5" />
                      <span>Reservar (5 Minutos)</span>
                    </button>
                  )}

                  {/* Staff: Liberar Saída na Portaria */}
                  {isStaff && isReservado && (
                    <button
                      onClick={() => handleLiberarSaida(item.id)}
                      className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Confirmar Saída</span>
                    </button>
                  )}

                  {/* Staff: Receber Devolução */}
                  {isStaff && isEmUso && (
                    <button
                      onClick={() => setItemDevolvendo(item)}
                      className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Registrar Devolução</span>
                    </button>
                  )}

                  {/* Cancelar Reserva (Morador que reservou ou Staff) */}
                  {isReservado && (
                    <button
                      onClick={() => handleCancelarReserva(item)}
                      className="px-3 py-2.5 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-bold text-xs transition border border-slate-200 cursor-pointer"
                      title="Cancelar Reserva"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Excluir Item (Staff) */}
                  {isStaff && isDisponivel && (
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir o equipamento "${item.nome}"?`)) {
                          condoStore.deleteItemCompartilhado(condominio.id, item.id);
                          showMsg('Item excluído com sucesso.');
                        }
                      }}
                      className="p-2.5 rounded-2xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Excluir Equipamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Código de Reserva Confirmada do Morador */}
      {reservaConfirmada && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-teal-100 text-teal-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Timer className="w-7 h-7 animate-pulse" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Reserva de 5 Minutos Confirmada!
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apresente o código abaixo na portaria ou zeladoria para retirar o equipamento:
              </p>
            </div>

            {/* Código em destaque */}
            <div className="bg-slate-900 text-teal-400 p-5 rounded-2xl text-center space-y-1 shadow-inner border border-teal-500/30">
              <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">
                Código de Liberação
              </span>
              <div className="text-4xl font-mono font-black tracking-widest text-teal-300 py-1">
                {reservaConfirmada.codigoResgate}
              </div>
              <span className="text-[10px] text-teal-400/80 font-medium">
                Válido por 5 minutos após a confirmação
              </span>
            </div>

            {/* Informações do Item */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <p>
                Item: <strong>{reservaConfirmada.item.nome}</strong> ({reservaConfirmada.item.codigoIdentificador})
              </p>
              <p>
                Local de Retirada: <strong>{reservaConfirmada.item.localArmazenamento}</strong>
              </p>
              <p>
                Prazo Máximo de Uso: <strong>{reservaConfirmada.item.tempoMaximoUsoHoras} horas</strong>
              </p>
            </div>

            <button
              onClick={() => setReservaConfirmada(null)}
              className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow transition active:scale-98 cursor-pointer"
            >
              Entendido, vou até a portaria retirar
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Validador de Código de Liberação da Portaria (Staff) */}
      {showValidadorModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-base text-slate-900">Validar Código de Retirada</h3>
              </div>
              <button
                onClick={() => setShowValidadorModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Digite o código de 6 dígitos gerado no app do morador ou o código do equipamento:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (codigoValidacao) handleLiberarSaida(codigoValidacao);
              }}
              className="space-y-4"
            >
              <input
                type="text"
                value={codigoValidacao}
                onChange={(e) => setCodigoValidacao(e.target.value.toUpperCase())}
                placeholder="Ex: 849201 ou FER-01"
                className="w-full text-center text-3xl font-mono font-black tracking-widest bg-slate-50 border-2 border-teal-400 rounded-2xl py-3 text-slate-900 focus:outline-none focus:border-teal-600 uppercase"
                autoFocus
              />

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md transition cursor-pointer active:scale-98"
              >
                Validar & Confirmar Saída do Equipamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Registrar Devolução de Equipamento (Staff) */}
      {itemDevolvendo && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base text-slate-900">Confirmar Devolução</h3>
              </div>
              <button onClick={() => setItemDevolvendo(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <p>
                Equipamento: <strong>{itemDevolvendo.nome}</strong> ({itemDevolvendo.codigoIdentificador})
              </p>
              <p>
                Morador: <strong>{itemDevolvendo.usoAtual?.moradorNome}</strong> ({itemDevolvendo.usoAtual?.unidade})
              </p>
            </div>

            <form onSubmit={handleConfirmarDevolucao} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações de Vistoria / Estado do Equipamento:
                </label>
                <textarea
                  value={obsDevolucao}
                  onChange={(e) => setObsDevolucao(e.target.value)}
                  placeholder="Ex: Devolvido limpo, peças completas e funcionando perfeitamente."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition cursor-pointer active:scale-98"
              >
                Concluir Devolução & Liberar Item
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Cadastrar Novo Item Compartilhado (Staff) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-base text-slate-900">Novo Item Compartilhado</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Equipamento / Item *</label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Furadeira Bosch 650W com brocas"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Categoria *</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as any)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="ferramentas">Ferramentas</option>
                    <option value="utilidades">Utilidades & Carrinhos</option>
                    <option value="lavanderia">Lavanderia</option>
                    <option value="mobilidade">Mobilidade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Código de Identificação *</label>
                  <input
                    type="text"
                    required
                    value={codigoIdentificador}
                    onChange={(e) => setCodigoIdentificador(e.target.value.toUpperCase())}
                    placeholder="Ex: FER-01, UTI-02"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Local de Armazenamento *</label>
                  <input
                    type="text"
                    required
                    value={localArmazenamento}
                    onChange={(e) => setLocalArmazenamento(e.target.value)}
                    placeholder="Ex: Portaria Principal, Zeladoria"
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tempo Máx. de Uso (Horas) *</label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={tempoMaximoHoras}
                    onChange={(e) => setTempoMaximoHoras(Number(e.target.value))}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Descrição / Especificações</label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Acompanha maleta plástica, 5 brocas de alvenaria e chave de mandril."
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instruções de Uso & Regras</label>
                  <textarea
                    value={instrucoesUso}
                    onChange={(e) => setInstrucoesUso(e.target.value)}
                    placeholder="Ex: Usar equipamentos de proteção. Devolver limpo e completo."
                    rows={2}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow cursor-pointer"
                >
                  Salvar Equipamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
