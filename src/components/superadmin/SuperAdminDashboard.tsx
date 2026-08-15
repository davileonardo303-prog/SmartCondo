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
} from 'lucide-react';
import { Condominio, UserRole, UsuarioSistema } from '../../types';
import { condoStore } from '../../services/mockStorage';
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
  const [showNewCondoModal, setShowNewCondoModal] = useState(false);
  const [showNewSindicoModal, setShowNewSindicoModal] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominio | null>(null);

  // Form Novo Condomínio
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('RJ');
  const [totalUnidades, setTotalUnidades] = useState(100);
  const [plano, setPlano] = useState<'Pro' | 'Enterprise' | 'Smart'>('Pro');
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

  const [sindicoSuccessMsg, setSindicoSuccessMsg] = useState('');

  const handleCreateCondo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !sindicoNome || !sindicoEmail) return;

    const newCondo = condoStore.addCondominio({
      nome,
      cnpj: cnpj || '00.000.000/0001-00',
      endereco: endereco || 'Av. Principal, 100 - Centro',
      cidade: cidade || 'Rio de Janeiro',
      uf: uf || 'RJ',
      totalUnidades: Number(totalUnidades) || 80,
      statusAssinatura: 'ativo',
      plano,
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
    setSindicoSuccessMsg(`Condomínio "${newCondo.nome}" e Síndico "${sindicoNome}" cadastrados com sucesso!`);
    setTimeout(() => setSindicoSuccessMsg(''), 6000);
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
    setSindicoSuccessMsg(`Informações do condomínio "${editingCondo.nome}" atualizadas com sucesso!`);
    setTimeout(() => setSindicoSuccessMsg(''), 5000);
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
    setSindicoSuccessMsg(`Síndico ${sindicoNovoNome} cadastrado com sucesso!`);
    setSindicoNovoNome('');
    setSindicoNovoEmail('');
    setSindicoNovoTelefone('');
    setSindicoNovaSenha('');
    setTimeout(() => setSindicoSuccessMsg(''), 5000);
  };

  const totalUnits = condominios.reduce((acc, c) => acc + c.totalUnidades, 0);
  const allPendentes = condoStore.getMoradoresPendentes();
  const sindicosList = condoStore.getSindicos();

  const handleAdminAprovar = (condoId: string, moradorId: string, moradorNome: string) => {
    condoStore.aprovarMorador(condoId, moradorId, 'Davi Leonardo (Admin Geral)');
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleAdminRecusar = (condoId: string, moradorId: string, moradorNome: string) => {
    if (confirm(`Deseja recusar o cadastro de ${moradorNome}?`)) {
      condoStore.recusarMorador(condoId, moradorId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Super Admin Global Banner */}
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
            Gestão multi-condomínio, cadastro de novos empreendimentos, controle de síndicos e aprovações globais.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
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

      {sindicoSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{sindicoSuccessMsg}</span>
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
            <span>Síndicos Ativos</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{sindicosList.length}</div>
          <span className="text-xs font-medium text-blue-700 mt-1 block">
            {sindicosList.length === 0 ? 'Nenhum cadastrado' : 'Com acesso administrativo'}
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-bold">
            <span>Total de Unidades</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{totalUnits}</div>
          <span className="text-xs font-medium text-slate-500 mt-1 block">
            Apartamentos e casas
          </span>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-bold">
            <span>Solicitações Pendentes</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{allPendentes.length}</div>
          <span className="text-xs font-medium text-amber-700 mt-1 block">
            {allPendentes.length > 0 ? 'Requer aprovação' : 'Tudo em dia (0)'}
          </span>
        </div>
      </div>

      {/* Aprovações Pendentes Globais (Super Admin) */}
      {allPendentes.length > 0 && (
        <div className="bg-white border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Solicitações de Cadastro de Moradores ({allPendentes.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Moradores cadastrados pelo site aguardando aprovação para liberação de login e acesso ao condomínio.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full animate-pulse">
              Aprovação Pendente
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-50/50 text-amber-950 uppercase font-bold border-b border-amber-200">
                <tr>
                  <th className="py-3 px-4">Morador</th>
                  <th className="py-3 px-4">Condomínio</th>
                  <th className="py-3 px-4">Unidade</th>
                  <th className="py-3 px-4">WhatsApp / Tel</th>
                  <th className="py-3 px-4">E-mail</th>
                  <th className="py-3 px-4 text-right">Ação do Administrador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allPendentes.map((m) => {
                  const condo = condominios.find((c) => c.id === m.condominioId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{m.nome}</td>
                      <td className="py-3 px-4 font-semibold text-purple-700">{condo?.nome || m.condominioId}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        Bloco {m.unidade.bloco} - Apto {m.unidade.apto}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{m.telefone}</td>
                      <td className="py-3 px-4 text-slate-500">{m.email}</td>
                      <td className="py-3 px-4 text-right space-x-2">
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
        </div>
      )}

      {/* Tabela de Condomínios */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold text-slate-900">
              Condomínios Cadastrados na Plataforma ({condominios.length})
            </h3>
          </div>
          <button
            onClick={() => setShowNewCondoModal(true)}
            className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Condomínio</span>
          </button>
        </div>

        {condominios.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-800">Nenhum condomínio cadastrado</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              O banco de dados está zerado. Clique abaixo para cadastrar seu primeiro condomínio e criar as credenciais do síndico.
            </p>
            <button
              onClick={() => setShowNewCondoModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow transition active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Condomínio</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Condomínio</th>
                  <th className="py-3 px-4">Endereço Completo</th>
                  <th className="py-3 px-4">Cidade / UF</th>
                  <th className="py-3 px-4">Unidades</th>
                  <th className="py-3 px-4">Síndico Responsável</th>
                  <th className="py-3 px-4">Plano</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {condominios.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{c.nome}</div>
                      {c.cnpj && <div className="text-[10px] text-slate-400 font-mono">CNPJ: {c.cnpj}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={c.endereco}>
                      {c.endereco || 'Endereço não informado'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {c.cidade} - {c.uf}
                    </td>
                    <td className="py-3 px-4 font-semibold text-indigo-900">{c.totalUnidades}</td>
                    <td className="py-3 px-4 text-slate-700">
                      <div className="font-medium text-slate-900">{c.sindicoNome}</div>
                      <div className="text-[10px] text-slate-500">{c.sindicoEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        {c.plano}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setEditingCondo({ ...c })}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
                        title="Editar Informações do Condomínio"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          onSelectCondo(c.id);
                          setCurrentRole('sindico');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition cursor-pointer shadow-sm"
                      >
                        Acessar Gestão
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lista de Síndicos Cadastrados */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Síndicos Cadastrados e Credenciais de Acesso ({sindicosList.length})
            </h3>
          </div>
          <button
            onClick={() => {
              if (condominios.length === 0) {
                setShowNewCondoModal(true);
              } else {
                setSindicoTargetCondoId(condominios[0].id);
                setShowNewSindicoModal(true);
              }
            }}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Novo Síndico</span>
          </button>
        </div>

        {sindicosList.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <UserCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-slate-800">Nenhum síndico cadastrado</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Ao cadastrar um novo condomínio, a conta do síndico será gerada automaticamente e listada aqui com suas credenciais de login.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nome do Síndico</th>
                  <th className="py-3 px-4">E-mail de Login</th>
                  <th className="py-3 px-4">Senha</th>
                  <th className="py-3 px-4">Condomínio Vinculado</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sindicosList.map((s) => {
                  const condo = condominios.find((c) => c.id === s.condominioId);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{s.nome}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{s.email}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 bg-slate-50/50">
                        {s.senha || '••••••••'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-purple-700">
                        {condo?.nome || 'Não vinculado'}
                      </td>
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
                          Abrir Painel
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

      {/* Modal de Cadastrar Novo Síndico */}
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
                      {c.nome} ({c.cidade} - {c.uf})
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

      {/* Modal de Novo Condomínio */}
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
                  placeholder="Ex: Condomínio Residencial Flores do Brito"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Endereço Completo (Rua/Avenida, Número, Bairro, CEP) *</label>
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
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CNPJ (Opcional)</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
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

      {/* Modal de Editar Condomínio */}
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
                <label className="font-bold text-slate-700 block mb-1">Endereço Completo (Rua/Avenida, Número, Bairro, CEP) *</label>
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
    </div>
  );
};
