import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Clock,
  KeyRound,
  Package,
  Bike,
  Wrench,
  UserCheck,
  Bell,
  DollarSign,
  Briefcase,
  Smartphone,
  Check,
} from 'lucide-react';
import { Condominio, FuncionarioEquipe, CargoFuncionario, PermissoesFuncionario } from '../../types';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';

interface GestaoEquipePermissoesProps {
  condominio: Condominio;
}

const CARGOS_CONFIG: Record<
  CargoFuncionario,
  { label: string; badgeClass: string; defaultPermissoes: PermissoesFuncionario }
> = {
  porteiro: {
    label: 'Porteiro / Recepcionista',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    defaultPermissoes: {
      receber_encomendas: true,
      liberar_bicicletas: true,
      gerenciar_equipamentos: true,
      autorizar_visitantes: true,
      enviar_avisos: false,
      acesso_financeiro: false,
      administracao_geral: false,
    },
  },
  zelador: {
    label: 'Zelador Predial',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    defaultPermissoes: {
      receber_encomendas: true,
      liberar_bicicletas: true,
      gerenciar_equipamentos: true,
      autorizar_visitantes: true,
      enviar_avisos: true,
      acesso_financeiro: false,
      administracao_geral: false,
    },
  },
  administracao: {
    label: 'Administração / Secretaria',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    defaultPermissoes: {
      receber_encomendas: true,
      liberar_bicicletas: true,
      gerenciar_equipamentos: true,
      autorizar_visitantes: true,
      enviar_avisos: true,
      acesso_financeiro: true,
      administracao_geral: true,
    },
  },
  gerente_predial: {
    label: 'Gerente Predial',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    defaultPermissoes: {
      receber_encomendas: true,
      liberar_bicicletas: true,
      gerenciar_equipamentos: true,
      autorizar_visitantes: true,
      enviar_avisos: true,
      acesso_financeiro: true,
      administracao_geral: true,
    },
  },
  vigilante: {
    label: 'Vigilante / Segurança',
    badgeClass: 'bg-slate-200 text-slate-900 border-slate-400',
    defaultPermissoes: {
      receber_encomendas: true,
      liberar_bicicletas: false,
      gerenciar_equipamentos: false,
      autorizar_visitantes: true,
      enviar_avisos: false,
      acesso_financeiro: false,
      administracao_geral: false,
    },
  },
  auxiliar_servicos: {
    label: 'Auxiliar de Serviços Gerais',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    defaultPermissoes: {
      receber_encomendas: false,
      liberar_bicicletas: false,
      gerenciar_equipamentos: true,
      autorizar_visitantes: false,
      enviar_avisos: false,
      acesso_financeiro: false,
      administracao_geral: false,
    },
  },
};

const PERMISSOES_INFO: {
  key: keyof PermissoesFuncionario;
  label: string;
  descricao: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'receber_encomendas',
    label: 'Receber Encomendas & Entregas',
    descricao: 'Permite lançar pacotes, gerar PIN de resgate e notificar morador por Push/WhatsApp/Email',
    icon: <Package className="w-4 h-4 text-amber-600" />,
  },
  {
    key: 'liberar_bicicletas',
    label: 'Liberar Bicicletas (Totem Novolar)',
    descricao: 'Permite validar senhas de 5 minutos e vistoriar devoluções de bikes',
    icon: <Bike className="w-4 h-4 text-emerald-600" />,
  },
  {
    key: 'gerenciar_equipamentos',
    label: 'Empréstimo de Equipamentos & Ferramentas',
    descricao: 'Permite liberar furadeiras, escadas e itens compartilhados aos moradores',
    icon: <Wrench className="w-4 h-4 text-teal-600" />,
  },
  {
    key: 'autorizar_visitantes',
    label: 'Portaria & Visitantes',
    descricao: 'Permite realizar check-in, check-out e conferência de prestadores de serviço',
    icon: <UserCheck className="w-4 h-4 text-blue-600" />,
  },
  {
    key: 'enviar_avisos',
    label: 'Publicar Comunicados & Mural',
    descricao: 'Permite postar avisos urgentes e comunicados oficiais do condomínio',
    icon: <Bell className="w-4 h-4 text-indigo-600" />,
  },
  {
    key: 'acesso_financeiro',
    label: 'Acesso Financeiro & Boletos',
    descricao: 'Visualizar status de mensalidades, balancetes e inadimplência do condomínio',
    icon: <DollarSign className="w-4 h-4 text-emerald-700" />,
  },
  {
    key: 'administracao_geral',
    label: 'Administração Geral & Ocorrências',
    descricao: 'Encaminhar encomendas guardadas, responder chamados e gerenciar áreas comuns',
    icon: <Briefcase className="w-4 h-4 text-purple-700" />,
  },
];

export const GestaoEquipePermissoes: React.FC<GestaoEquipePermissoesProps> = ({ condominio }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingFunc, setEditingFunc] = useState<FuncionarioEquipe | null>(null);
  const [filtroCargo, setFiltroCargo] = useState<string>('todos');

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cargo, setCargo] = useState<CargoFuncionario>('porteiro');
  const [turno, setTurno] = useState('07:00 às 19:00 (12x36)');
  const [senha, setSenha] = useState('equipe123');
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'ferias'>('ativo');
  const [permissoes, setPermissoes] = useState<PermissoesFuncionario>(
    CARGOS_CONFIG.porteiro.defaultPermissoes
  );

  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const funcionarios = condoStore.getFuncionarios(condominio.id);

  const openNewModal = () => {
    setEditingFunc(null);
    setNome('');
    setEmail('');
    setTelefone('');
    setCargo('porteiro');
    setTurno('07:00 às 19:00 (12x36)');
    setSenha('equipe123');
    setStatus('ativo');
    setPermissoes(CARGOS_CONFIG.porteiro.defaultPermissoes);
    setShowModal(true);
  };

  const openEditModal = (func: FuncionarioEquipe) => {
    setEditingFunc(func);
    setNome(func.nome);
    setEmail(func.email);
    setTelefone(func.telefone);
    setCargo(func.cargo);
    setTurno(func.turnoTrabalho || '');
    setSenha(func.senha || 'equipe123');
    setStatus(func.status);
    setPermissoes({ ...func.permissoes });
    setShowModal(true);
  };

  const handleCargoChange = (newCargo: CargoFuncionario) => {
    setCargo(newCargo);
    // Sugere as permissões padrão do cargo caso esteja criando novo
    if (!editingFunc) {
      setPermissoes(CARGOS_CONFIG[newCargo].defaultPermissoes);
    }
  };

  const handleTogglePermissao = (key: keyof PermissoesFuncionario) => {
    setPermissoes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      setFeedbackMsg({ tipo: 'erro', texto: 'Preencha o nome e e-mail do funcionário.' });
      return;
    }

    if (editingFunc) {
      condoStore.updateFuncionario(condominio.id, editingFunc.id, {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        cargo,
        turnoTrabalho: turno.trim(),
        senha: senha.trim(),
        status,
        permissoes,
      });
      setFeedbackMsg({ tipo: 'sucesso', texto: `Cadastro de "${nome}" atualizado com sucesso!` });
    } else {
      condoStore.addFuncionario(condominio.id, {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim(),
        cargo,
        turnoTrabalho: turno.trim(),
        senha: senha.trim(),
        status,
        permissoes,
      });
      setFeedbackMsg({ tipo: 'sucesso', texto: `Novo funcionário "${nome}" cadastrado com sucesso!` });
      confetti({ particleCount: 60, spread: 60 });
    }

    setShowModal(false);
  };

  const handleDelete = (func: FuncionarioEquipe) => {
    if (window.confirm(`Deseja realmente remover o acesso de ${func.nome}?`)) {
      condoStore.deleteFuncionario(condominio.id, func.id);
      setFeedbackMsg({ tipo: 'sucesso', texto: `Funcionário ${func.nome} removido da equipe.` });
    }
  };

  const filteredList = funcionarios.filter((f) => {
    if (filtroCargo === 'todos') return true;
    return f.cargo === filtroCargo;
  });

  return (
    <div className="space-y-6">
      {/* Banner Superior com Explicação e Regras */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 sm:p-7 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Controle de Acessos & Equipe do Síndico</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Equipe do Condomínio & Permissões no App
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Cadastre porteiros, zeladores e equipe da administração predial. Defina com precisão quais módulos e funcionalidades cada funcionário pode acessar pelo celular, tablet ou computador.
            </p>
          </div>

          <button
            onClick={openNewModal}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Funcionário</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold ${
            feedbackMsg.tipo === 'sucesso'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.tipo === 'sucesso' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.texto}</span>
          </div>
          <button
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-500 hover:text-slate-800 text-xs underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Filtro por Cargo */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-extrabold text-slate-800">
            Total de Funcionários: {funcionarios.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-slate-500 font-bold mr-1">Filtrar cargo:</span>
          {['todos', 'porteiro', 'zelador', 'administracao', 'gerente_predial', 'vigilante'].map((c) => (
            <button
              key={c}
              onClick={() => setFiltroCargo(c)}
              className={`px-3 py-1 rounded-xl font-bold transition cursor-pointer ${
                filtroCargo === c
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c === 'todos' ? 'Todos' : CARGOS_CONFIG[c as CargoFuncionario]?.label || c}
            </button>
          ))}
        </div>
      </div>

      {/* Cards de Funcionários */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredList.map((func) => {
          const cargoInfo = CARGOS_CONFIG[func.cargo] || CARGOS_CONFIG.porteiro;
          const permissoesAtivasCount = Object.values(func.permissoes).filter(Boolean).length;

          return (
            <div
              key={func.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${cargoInfo.badgeClass}`}
                    >
                      {cargoInfo.label}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                      {func.nome}
                    </h3>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      func.status === 'ativo'
                        ? 'bg-emerald-100 text-emerald-800'
                        : func.status === 'ferias'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {func.status === 'ativo' ? '🟢 Ativo' : func.status === 'ferias' ? '🏖️ Férias' : '⚪ Inativo'}
                  </span>
                </div>

                {/* Contatos & Turno */}
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{func.email}</span>
                  </div>
                  {func.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{func.telefone}</span>
                    </div>
                  )}
                  {func.turnoTrabalho && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-500">{func.turnoTrabalho}</span>
                    </div>
                  )}
                </div>

                {/* Resumo de Permissões */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700">
                    <span>Permissões Habilitadas:</span>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                      {permissoesAtivasCount} de 7
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {PERMISSOES_INFO.map((p) => {
                      const ativo = func.permissoes[p.key];
                      return (
                        <div
                          key={p.key}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border font-medium ${
                            ativo
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                              : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
                          }`}
                        >
                          {ativo ? (
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          ) : (
                            <X className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{p.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(func)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-600" />
                  <span>Editar Permissões</span>
                </button>

                <button
                  onClick={() => handleDelete(func)}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                  title="Remover funcionário"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL DE CADASTRO / EDIÇÃO DE FUNCIONÁRIO E PERMISSÕES */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95">
            {/* Header Modal */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold">
                  {editingFunc ? `Editar ${editingFunc.nome}` : 'Cadastrar Novo Funcionário na Equipe'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 sm:p-7 space-y-5 text-xs">
              {/* Dados Básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">
                    Nome Completo do Funcionário: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: João da Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">
                    Cargo / Função: *
                  </label>
                  <select
                    value={cargo}
                    onChange={(e) => handleCargoChange(e.target.value as CargoFuncionario)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="porteiro">Porteiro / Recepcionista</option>
                    <option value="zelador">Zelador Predial</option>
                    <option value="administracao">Administração / Secretaria</option>
                    <option value="gerente_predial">Gerente Predial</option>
                    <option value="vigilante">Vigilante / Segurança</option>
                    <option value="auxiliar_servicos">Auxiliar de Serviços Gerais</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">
                    E-mail de Login no App: *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Ex: porteiro@smartcondo.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">
                    Telefone / WhatsApp:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">
                    Turno / Escala de Trabalho:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 07:00 às 19:00 (Escala 12x36)"
                    value={turno}
                    onChange={(e) => setTurno(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">
                    Senha de Acesso:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: equipe123"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* SELEÇÃO DETALHADA DE PERMISSÕES DO FUNCIONÁRIO */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-indigo-600" />
                      <span>Permissões de Acesso no Aplicativo</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Marque o que este funcionário pode visualizar e operar:
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPermissoes(CARGOS_CONFIG[cargo].defaultPermissoes)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                  >
                    Restaurar Padrão do Cargo
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {PERMISSOES_INFO.map((p) => {
                    const ativo = permissoes[p.key];
                    return (
                      <div
                        key={p.key}
                        onClick={() => handleTogglePermissao(p.key)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 select-none ${
                          ativo
                            ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 shrink-0 transition ${
                            ativo ? 'bg-indigo-600 text-white' : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {ativo && <Check className="w-3.5 h-3.5" />}
                        </div>

                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            {p.icon}
                            <span className="font-extrabold text-xs">{p.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {p.descricao}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
                >
                  {editingFunc ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
