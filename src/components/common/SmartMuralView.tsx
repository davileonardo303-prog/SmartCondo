import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Plus,
  Heart,
  Share2,
  Phone,
  Tag,
  Gift,
  Briefcase,
  HelpCircle,
  Clock,
  Send,
  User,
  Vote,
  CheckCircle2,
  Sparkles,
  Camera,
  X,
  Smile,
} from 'lucide-react';
import { Condominio, Morador, MuralPost, MuralTipo, EnqueteCondominio } from '../../types';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';

interface SmartMuralViewProps {
  condominio: Condominio;
  moradorAtual?: Morador | null;
}

export const SmartMuralView: React.FC<SmartMuralViewProps> = ({
  condominio,
  moradorAtual,
}) => {
  const [activeTab, setActiveTab] = useState<'mural' | 'enquetes'>('mural');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [busca, setBusca] = useState('');

  // Modal Novo Post
  const [showNovoPostModal, setShowNovoPostModal] = useState(false);
  const [postTipo, setPostTipo] = useState<MuralTipo>('troca_venda');
  const [postTitulo, setPostTitulo] = useState('');
  const [postConteudo, setPostConteudo] = useState('');
  const [postValor, setPostValor] = useState('');
  const [postContato, setPostContato] = useState(moradorAtual?.telefone || '');
  const [postFotoUrl, setPostFotoUrl] = useState('');

  // Comentários por post
  const [comentarioInputs, setComentarioInputs] = useState<{ [postId: string]: string }>({});

  const muralPosts = condoStore.getMuralPosts(condominio.id);
  const enquetes = condoStore.getEnquetes(condominio.id);

  // Filtragem de Posts
  const postsFiltrados = muralPosts.filter((post) => {
    const matchCat = categoriaFiltro === 'todos' || post.tipo === categoriaFiltro;
    const term = busca.toLowerCase();
    const matchBusca =
      post.titulo.toLowerCase().includes(term) ||
      post.conteudo.toLowerCase().includes(term) ||
      post.autorNome.toLowerCase().includes(term) ||
      post.autorUnidade.toLowerCase().includes(term);
    return matchCat && matchBusca;
  });

  const handleCriarPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitulo.trim() || !postConteudo.trim()) return;

    const autorId = moradorAtual ? moradorAtual.id : 'morador_demo_1';

    condoStore.addMuralPost(condominio.id, {
      autorId,
      tipo: postTipo,
      titulo: postTitulo.trim(),
      conteudo: postConteudo.trim(),
      contatoTelefone: postContato.trim() || undefined,
      valor: postValor ? Number(postValor) : undefined,
      fotoUrl: postFotoUrl || undefined,
    });

    confetti({ particleCount: 50, spread: 60 });
    setShowNovoPostModal(false);
    setPostTitulo('');
    setPostConteudo('');
    setPostValor('');
    setPostFotoUrl('');
  };

  const handleCurtir = (postId: string) => {
    const moradorId = moradorAtual ? moradorAtual.id : 'morador_demo_1';
    condoStore.curtirMuralPost(condominio.id, postId, moradorId);
  };

  const handleEnviarComentario = (postId: string) => {
    const texto = comentarioInputs[postId]?.trim();
    if (!texto) return;

    const autorNome = moradorAtual ? moradorAtual.nome : 'Morador SmartCondo';
    const autorUnidade = moradorAtual
      ? `Bloco ${moradorAtual.unidade.bloco} - Apto ${moradorAtual.unidade.apto}`
      : 'Unidade 302';

    condoStore.addComentarioMural(condominio.id, postId, {
      autorNome,
      autorUnidade,
      texto,
    });
    setComentarioInputs((prev) => ({ ...prev, [postId]: '' }));
    confetti({ particleCount: 20, spread: 30 });
  };

  const handleVotarEnquete = (enqueteId: string, opcaoId: string) => {
    const moradorId = moradorAtual ? moradorAtual.id : 'morador_demo_1';
    condoStore.votarEnquete(condominio.id, enqueteId, opcaoId, moradorId);
    confetti({ particleCount: 40, spread: 50 });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">
            Mural Comunitário & Votações
          </h3>
          <p className="text-xs text-slate-500">
            Conecte-se com vizinhos, encontre itens perdidos, indique serviços e vote em enquetes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Alternador Mural / Enquetes */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('mural')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'mural'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Mural ({muralPosts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('enquetes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'enquetes'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Enquetes ({enquetes.length})</span>
            </button>
          </div>

          {activeTab === 'mural' && (
            <button
              onClick={() => setShowNovoPostModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Publicação</span>
            </button>
          )}
        </div>
      </div>

      {/* ABA 1: MURAL DE POSTS */}
      {activeTab === 'mural' && (
        <div className="space-y-5">
          {/* Filtros por Categorias Chave */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'todos', label: 'Todos os Posts', icon: MessageSquare },
                { id: 'perdi_achei', label: '🔍 Achados & Perdidos', icon: HelpCircle },
                { id: 'indicacao', label: '💼 Indicação de Serviços', icon: Briefcase },
                { id: 'troca_venda', label: '🎁 Desapego & Doações', icon: Gift },
              ].map((cat) => {
                const isSelected = categoriaFiltro === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoriaFiltro(cat.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar no mural..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Lista de Publicações */}
          {postsFiltrados.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">Nenhuma publicação encontrada</h4>
              <p className="text-xs max-w-sm mx-auto">
                Seja o primeiro a publicar um desapego, indicação de profissional ou item encontrado!
              </p>
              <button
                onClick={() => setShowNovoPostModal(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow"
              >
                + Criar Primeira Publicação
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {postsFiltrados.map((post) => {
                const isLiked = moradorAtual && post.curtidas.includes(moradorAtual.id);
                const msgWhatsapp = `Olá ${post.autorNome}! Vi sua publicação no SmartCondo sobre "${post.titulo}" e gostaria de mais informações.`;

                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-3.5">
                      {/* Topo do Card com Autor e Tag */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center">
                            {post.autorNome.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block leading-tight">
                              {post.autorNome}
                            </strong>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {post.autorUnidade} • {new Date(post.criadoEm).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            post.tipo === 'perdi_achei'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : post.tipo === 'indicacao'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {post.tipo === 'perdi_achei'
                            ? 'Achados & Perdidos'
                            : post.tipo === 'indicacao'
                            ? 'Indicação'
                            : 'Desapego / Doação'}
                        </span>
                      </div>

                      {/* Conteúdo */}
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 leading-snug">
                          {post.titulo}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 whitespace-pre-line">
                          {post.conteudo}
                        </p>
                      </div>

                      {/* Foto se houver */}
                      {post.fotoUrl && (
                        <div className="rounded-2xl overflow-hidden border border-slate-100 max-h-48">
                          <img
                            src={post.fotoUrl}
                            alt={post.titulo}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {/* Valor se for desapego */}
                      {post.valor !== undefined && (
                        <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl font-black text-xs w-fit border border-emerald-200">
                          <span>Valor:</span>
                          <span>
                            {post.valor === 0 ? 'Gratuito / Doação' : `R$ ${post.valor.toFixed(2)}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rodapé de Interações & WhatsApp */}
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {/* Curtir */}
                        <button
                          onClick={() => handleCurtir(post.id)}
                          className={`flex items-center gap-1.5 text-xs font-bold transition px-2.5 py-1 rounded-xl cursor-pointer ${
                            isLiked
                              ? 'text-rose-600 bg-rose-50'
                              : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`}
                          />
                          <span>{post.curtidas.length}</span>
                        </button>

                        {/* Botão Conversar no WhatsApp */}
                        {post.contatoTelefone && (
                          <a
                            href={`https://api.whatsapp.com/send?phone=55${post.contatoTelefone.replace(/\D/g, '')}&text=${encodeURIComponent(msgWhatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition active:scale-98"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Conversar no WhatsApp</span>
                          </a>
                        )}
                      </div>

                      {/* Comentários Recentes */}
                      {post.comentarios.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/60 max-h-32 overflow-y-auto">
                          {post.comentarios.map((c) => (
                            <div
                              key={c.id}
                              className="text-[11px] bg-white p-2 rounded-xl border border-slate-200/80"
                            >
                              <strong className="text-slate-800 font-bold">{c.autorNome}</strong>{' '}
                              <span className="text-slate-400 text-[10px]">({c.autorUnidade})</span>:
                              <p className="text-slate-600 mt-0.5">{c.texto}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Input de Novo Comentário */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Escreva um comentário..."
                          value={comentarioInputs[post.id] || ''}
                          onChange={(e) =>
                            setComentarioInputs({ ...comentarioInputs, [post.id]: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEnviarComentario(post.id);
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => handleEnviarComentario(post.id)}
                          className="p-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: ENQUETES E VOTAÇÕES RÁPIDAS */}
      {activeTab === 'enquetes' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {enquetes.map((enq) => {
              const moradorId = moradorAtual ? moradorAtual.id : 'morador_demo_1';
              const jaVotou = enq.opcoes.some((op) => op.votantesIds.includes(moradorId));

              return (
                <div
                  key={enq.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      Enquete Condominial
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">
                      Total de Votos: <strong>{enq.totalVotos}</strong>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{enq.titulo}</h4>
                    <p className="text-xs text-slate-600 mt-1">{enq.descricao}</p>
                  </div>

                  {/* Opções de Voto com Barras de Progresso */}
                  <div className="space-y-2.5 pt-2">
                    {enq.opcoes.map((opcao) => {
                      const percentual =
                        enq.totalVotos > 0
                          ? Math.round((opcao.votosCount / enq.totalVotos) * 100)
                          : 0;
                      const meuVoto = opcao.votantesIds.includes(moradorId);

                      return (
                        <div
                          key={opcao.id}
                          onClick={() => !jaVotou && handleVotarEnquete(enq.id, opcao.id)}
                          className={`relative p-3.5 rounded-2xl border transition cursor-pointer overflow-hidden ${
                            meuVoto
                              ? 'border-indigo-500 bg-indigo-50/70 ring-2 ring-indigo-500/50'
                              : jaVotou
                              ? 'border-slate-200 bg-slate-50 opacity-90'
                              : 'border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30'
                          }`}
                        >
                          {/* Barra de Progresso Fundo */}
                          <div
                            className="absolute inset-y-0 left-0 bg-indigo-200/40 transition-all duration-500"
                            style={{ width: `${percentual}%` }}
                          />

                          <div className="relative z-10 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 font-bold text-slate-800">
                              {meuVoto && (
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                              )}
                              <span>{opcao.texto}</span>
                            </div>

                            <span className="font-mono font-black text-indigo-900">
                              {percentual}% ({opcao.votosCount})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Prazo: até {enq.dataLimite}</span>
                    {jaVotou ? (
                      <span className="text-indigo-600 font-bold">✓ Seu voto foi registrado</span>
                    ) : (
                      <span className="text-amber-600 font-bold">Toque em uma opção para votar</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Criação de Post */}
      {showNovoPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Nova Publicação no Mural</h3>
                  <p className="text-xs text-slate-500">Compartilhe informações com os moradores</p>
                </div>
              </div>
              <button
                onClick={() => setShowNovoPostModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCriarPost} className="p-6 overflow-y-auto space-y-4">
              {/* Tipo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria da Mensagem *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPostTipo('troca_venda')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      postTipo === 'troca_venda'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Desapego</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostTipo('indicacao')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      postTipo === 'indicacao'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Indicação</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostTipo('perdi_achei')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      postTipo === 'perdi_achei'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Achados</span>
                  </button>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Chave com fita azul encontrada na quadra"
                  value={postTitulo}
                  onChange={(e) => setPostTitulo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Conteúdo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mensagem / Descrição *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Descreva os detalhes..."
                  value={postConteudo}
                  onChange={(e) => setPostConteudo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none"
                />
              </div>

              {/* Valor se for desapego */}
              {postTipo === 'troca_venda' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor (R$) - Deixe 0 para Gratuito/Doação
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={postValor}
                    onChange={(e) => setPostValor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Telefone / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seu WhatsApp para Contato
                </label>
                <input
                  type="text"
                  placeholder="(21) 99999-9999"
                  value={postContato}
                  onChange={(e) => setPostContato(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Publicar no Mural</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
