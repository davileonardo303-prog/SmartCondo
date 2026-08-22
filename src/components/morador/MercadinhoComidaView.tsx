import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  QrCode,
  CreditCard,
  Building,
  CheckCircle,
  Search,
  Coffee,
  Sparkles,
  ArrowRight,
  Package,
  Receipt,
  X,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { condoStore } from '../../services/mockStorage';
import { Morador, Condominio, ProdutoMercadinho, ItemCarrinhoMercadinho, PedidoMercadinho, CategoriaProdutoMercado } from '../../types';

interface MercadinhoComidaViewProps {
  morador: Morador;
  condominio: Condominio;
}

const CATEGORIAS: { id: string; label: string; icon: string }[] = [
  { id: 'todos', label: 'Todos os Itens', icon: '✨' },
  { id: 'bebidas', label: 'Bebidas & Sucos', icon: '🥤' },
  { id: 'lanches', label: 'Lanches & Snacks', icon: '🥪' },
  { id: 'padaria', label: 'Padaria & Assados', icon: '🥐' },
  { id: 'doces', label: 'Doces & Chocolates', icon: '🍫' },
  { id: 'mercearia', label: 'Cafés & Mercearia', icon: '☕' },
];

export const MercadinhoComidaView: React.FC<MercadinhoComidaViewProps> = ({ morador, condominio }) => {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');
  const [busca, setBusca] = useState<string>('');
  const [produtos, setProdutos] = useState<ProdutoMercadinho[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinhoMercadinho[]>([]);
  const [drawerCarrinhoAberto, setDrawerCarrinhoAberto] = useState<boolean>(false);
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'taxa_condominio' | 'cartao_app'>('pix');
  const [sucessoModal, setSucessoModal] = useState<PedidoMercadinho | null>(null);
  const [erroMsg, setErroMsg] = useState<string | null>(null);
  const [abaHistorico, setAbaHistorico] = useState<boolean>(false);
  const [pedidos, setPedidos] = useState<PedidoMercadinho[]>([]);

  const carregarDados = () => {
    const prods = condoStore.getProdutosMercadinho(condominio.id, categoriaAtiva);
    setProdutos(prods);
    const historico = condoStore.getPedidosMercadinho(condominio.id, morador.id);
    setPedidos(historico);
  };

  useEffect(() => {
    carregarDados();
    const unsub = condoStore.subscribe(() => {
      carregarDados();
    });
    return () => unsub();
  }, [condominio.id, categoriaAtiva, morador.id]);

  const produtosFiltrados = produtos.filter((p) => {
    const matchBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchBusca;
  });

  const adicionarAoCarrinho = (produto: ProdutoMercadinho) => {
    if (produto.estoque <= 0) return;
    setCarrinho((prev) => {
      const idx = prev.findIndex((item) => item.produto.id === produto.id);
      if (idx >= 0) {
        if (prev[idx].quantidade >= produto.estoque) return prev;
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantidade: copy[idx].quantidade + 1 };
        return copy;
      } else {
        return [...prev, { produto, quantidade: 1 }];
      }
    });
    setErroMsg(null);
  };

  const alterarQuantidade = (produtoId: string, delta: number) => {
    setCarrinho((prev) => {
      const copy = [...prev];
      const idx = copy.findIndex((item) => item.produto.id === produtoId);
      if (idx === -1) return prev;

      const novoQtd = copy[idx].quantidade + delta;
      if (novoQtd <= 0) {
        return copy.filter((item) => item.produto.id !== produtoId);
      }
      if (novoQtd > copy[idx].produto.estoque) return prev;

      copy[idx] = { ...copy[idx], quantidade: novoQtd };
      return copy;
    });
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho((prev) => prev.filter((item) => item.produto.id !== produtoId));
  };

  const totalCarrinho = carrinho.reduce(
    (acc, item) => acc + item.produto.preco * item.quantidade,
    0
  );

  const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  const finalizarCompra = () => {
    if (carrinho.length === 0) return;

    const res = condoStore.realizarPedidoMercadinho(
      condominio.id,
      morador,
      carrinho,
      formaPagamento
    );

    if (res.success && res.pedido) {
      setSucessoModal(res.pedido);
      setCarrinho([]);
      setDrawerCarrinhoAberto(false);
      setErroMsg(null);
    } else {
      setErroMsg(res.message || 'Erro ao processar compra.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Banner Promocional do Mercadinho */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
          <ShoppingBag className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            Mercadinho & Conveniência Autônoma 24h
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Comida & Bebidas no seu Condomínio
          </h2>
          <p className="text-amber-100 text-sm sm:text-base leading-relaxed">
            Pegue o que quiser na geladeira ou prateleira do condomínio e registre sua compra
            com pagamento instantâneo por Pix ou inclusão na taxa condominial.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setAbaHistorico(false)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                !abaHistorico
                  ? 'bg-white text-orange-700 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              🛒 Ver Catálogo de Produtos
            </button>
            <button
              onClick={() => setAbaHistorico(true)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                abaHistorico
                  ? 'bg-white text-orange-700 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Receipt className="w-4 h-4" /> Minhas Compras ({pedidos.length})
            </button>
          </div>
        </div>
      </div>

      {/* Seção Principal: Catálogo ou Histórico */}
      {!abaHistorico ? (
        <div className="space-y-6">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
            {/* Categorias Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    categoriaAtiva === cat.id
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Busca & Botão Carrinho */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>

              {/* Botão Flutuante / Header de Sacola */}
              <button
                onClick={() => setDrawerCarrinhoAberto(true)}
                className="relative bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Sacola</span>
                {totalItens > 0 && (
                  <span className="bg-white text-orange-600 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                    {totalItens}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Grid de Produtos */}
          {produtosFiltrados.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-slate-300">Nenhum produto encontrado nesta categoria.</p>
              <p className="text-xs mt-1 text-slate-500">Tente buscar por outro termo ou categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {produtosFiltrados.map((produto) => {
                const itemNoCarrinho = carrinho.find((it) => it.produto.id === produto.id);
                const qtdNoCarrinho = itemNoCarrinho?.quantidade || 0;

                return (
                  <motion.div
                    key={produto.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-orange-500/40 transition-all flex flex-col group shadow-lg"
                  >
                    {/* Imagem do Produto */}
                    <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                      <img
                        src={produto.imagemUrl}
                        alt={produto.nome}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-amber-400 border border-amber-500/20">
                        R$ {produto.preco.toFixed(2).replace('.', ',')}
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-300 uppercase tracking-wider">
                        {produto.categoria}
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-white text-sm line-clamp-1 group-hover:text-amber-400 transition-colors">
                          {produto.nome}
                        </h4>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                          {produto.descricao}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                        <div className="text-[11px] text-slate-400">
                          Estoque: <span className="font-semibold text-slate-200">{produto.estoque} un</span>
                        </div>

                        {qtdNoCarrinho > 0 ? (
                          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-orange-500/30">
                            <button
                              onClick={() => alterarQuantidade(produto.id, -1)}
                              className="w-6 h-6 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-orange-400">
                              {qtdNoCarrinho}
                            </span>
                            <button
                              onClick={() => alterarQuantidade(produto.id, 1)}
                              disabled={qtdNoCarrinho >= produto.estoque}
                              className="w-6 h-6 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => adicionarAoCarrinho(produto)}
                            disabled={produto.estoque <= 0}
                            className="px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Pegar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Histórico de Compras */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-400" />
                Histórico de Compras no Condomínio
              </h3>
              <p className="text-xs text-slate-400">
                Extrato detalhado de todos os alimentos e bebidas consumidos
              </p>
            </div>
            <button
              onClick={() => setAbaHistorico(false)}
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 underline"
            >
              Voltar ao Catálogo
            </button>
          </div>

          {pedidos.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-slate-300">Você ainda não realizou compras no mercadinho.</p>
              <p className="text-xs mt-1 text-slate-500">
                Selecione seus itens na geladeira ou prateleira e registre sua compra.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidos.map((ped) => (
                <div
                  key={ped.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4.5 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                        Pedido #{ped.id.slice(-6)}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">
                        {new Date(ped.criadoEm).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Concluído
                      </span>
                      <span className="text-sm font-black text-white">
                        R$ {ped.valorTotal.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    {ped.itens.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-300">
                        <span>
                          {it.quantidade}x {it.nome}
                        </span>
                        <span className="text-slate-400 font-mono">
                          R$ {it.subtotal.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      Forma de Pagamento:{' '}
                      <strong className="text-slate-200 uppercase font-semibold">
                        {ped.formaPagamento === 'pix'
                          ? '⚡ Pix Instantâneo'
                          : ped.formaPagamento === 'taxa_condominio'
                          ? '🏢 Débito na Taxa do Condomínio'
                          : '💳 Cartão App'}
                      </strong>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Unidade: Bloco {ped.moradorUnidade.bloco} - Apto {ped.moradorUnidade.apto}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Drawer / Gaveta do Carrinho de Compras */}
      <AnimatePresence>
        {drawerCarrinhoAberto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerCarrinhoAberto(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 z-50 flex flex-col shadow-2xl"
            >
              {/* Header Drawer */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-400" />
                  <h3 className="font-bold text-white text-base">Minha Sacola de Compras</h3>
                </div>
                <button
                  onClick={() => setDrawerCarrinhoAberto(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Lista de Itens no Carrinho */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {carrinho.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 space-y-2">
                    <ShoppingBag className="w-12 h-12 mx-auto text-slate-600" />
                    <p className="font-semibold text-slate-300">Sua sacola está vazia</p>
                    <p className="text-xs text-slate-500">
                      Adicione itens do mercadinho para finalizar seu pedido.
                    </p>
                  </div>
                ) : (
                  carrinho.map((item) => (
                    <div
                      key={item.produto.id}
                      className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between gap-3"
                    >
                      <img
                        src={item.produto.imagemUrl}
                        alt={item.produto.nome}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-lg object-cover bg-slate-950 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-white text-xs truncate">
                          {item.produto.nome}
                        </h5>
                        <p className="text-amber-400 text-xs font-semibold mt-0.5">
                          R$ {item.produto.preco.toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-1 rounded-lg border border-slate-700">
                          <button
                            onClick={() => alterarQuantidade(item.produto.id, -1)}
                            className="w-5 h-5 rounded text-slate-300 hover:text-white flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-white">
                            {item.quantidade}
                          </span>
                          <button
                            onClick={() => alterarQuantidade(item.produto.id, 1)}
                            disabled={item.quantidade >= item.produto.estoque}
                            className="w-5 h-5 rounded text-slate-300 hover:text-white disabled:opacity-30 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removerDoCarrinho(item.produto.id)}
                          className="text-rose-400 hover:text-rose-300 p-1 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer e Finalização */}
              {carrinho.length > 0 && (
                <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-4">
                  {erroMsg && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{erroMsg}</span>
                    </div>
                  )}

                  {/* Seleção de Forma de Pagamento */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setFormaPagamento('pix')}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1 ${
                          formaPagamento === 'pix'
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400 font-bold'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="text-[11px]">Pix Rápido</span>
                      </button>

                      <button
                        onClick={() => setFormaPagamento('taxa_condominio')}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1 ${
                          formaPagamento === 'taxa_condominio'
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400 font-bold'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Building className="w-4 h-4" />
                        <span className="text-[11px] text-center">Taxa Condomínio</span>
                      </button>

                      <button
                        onClick={() => setFormaPagamento('cartao_app')}
                        className={`p-2.5 rounded-xl border text-left transition-all flex flex-col items-center justify-center gap-1 ${
                          formaPagamento === 'cartao_app'
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400 font-bold'
                            : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-[11px]">Cartão App</span>
                      </button>
                    </div>
                  </div>

                  {/* Resumo do Total */}
                  <div className="bg-slate-800/70 p-3 rounded-xl space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Subtotal ({totalItens} itens)</span>
                      <span>R$ {totalCarrinho.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-white pt-1 border-t border-slate-700">
                      <span>Total a Pagar</span>
                      <span className="text-amber-400">
                        R$ {totalCarrinho.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  {/* Botão Confirmar Compra */}
                  <button
                    onClick={finalizarCompra}
                    className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Confirmar e Finalizar Compra</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal de Sucesso da Compra */}
      <AnimatePresence>
        {sucessoModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-center space-y-5 shadow-2xl relative"
            >
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">Compra Concluída com Sucesso!</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Pedido #{sucessoModal.id.slice(-6)} registrado no mercadinho do condomínio.
                </p>
              </div>

              {sucessoModal.formaPagamento === 'pix' ? (
                <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
                    <QrCode className="w-4 h-4" />
                    <span>Pagamento via Chave Pix do Condomínio</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl inline-block">
                    {/* QR Code Simulado SVG */}
                    <div className="w-32 h-32 bg-slate-950 rounded-lg flex items-center justify-center text-white font-mono text-xs">
                      [ QR CODE PIX ]
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 font-mono bg-slate-900 p-2 rounded-lg break-all border border-slate-800">
                    {condominio.chavePix || 'financeiro@smartcondo.com.br'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Valor total: <strong>R$ {sucessoModal.valorTotal.toFixed(2).replace('.', ',')}</strong>
                  </p>
                </div>
              ) : sucessoModal.formaPagamento === 'taxa_condominio' ? (
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl text-xs text-blue-300 text-left space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Building className="w-4 h-4" /> Lançamento em Taxa Condominial
                  </p>
                  <p className="text-slate-400">
                    O valor de R$ {sucessoModal.valorTotal.toFixed(2).replace('.', ',')} foi incluído
                    no boleto da sua unidade (Bloco {morador.unidade.bloco} - Apto {morador.unidade.apto}).
                  </p>
                </div>
              ) : (
                <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-2xl text-xs text-purple-300 text-left space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" /> Pagamento com Cartão no App
                  </p>
                  <p className="text-slate-400">
                    Transação autorizada no valor de R$ {sucessoModal.valorTotal.toFixed(2).replace('.', ',')}.
                  </p>
                </div>
              )}

              <button
                onClick={() => setSucessoModal(null)}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-sm"
              >
                Entendido, Bom Apetite!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
