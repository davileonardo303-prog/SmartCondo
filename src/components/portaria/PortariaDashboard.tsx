import React, { useState } from 'react';
import {
  Package,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Search,
  Plus,
  Truck,
  User,
  Bike,
  Wrench,
  Shield,
  Clock,
  Send,
  Building,
  KeyRound,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Condominio, Morador, Encomenda, Bicicleta, HistoricoLocacao } from '../../types';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';

interface PortariaDashboardProps {
  condominio: Condominio;
  moradores: Morador[];
  encomendas: Encomenda[];
  bikes: Bicicleta[];
  historicoLocacoes: HistoricoLocacao[];
}

export const PortariaDashboard: React.FC<PortariaDashboardProps> = ({
  condominio,
  moradores,
  encomendas,
  bikes,
  historicoLocacoes,
}) => {
  const [activeTab, setActiveTab] = useState<'receber' | 'baixa' | 'bicicletario' | 'historico'>('receber');

  // Intake Form State
  const [selectedMoradorId, setSelectedMoradorId] = useState('');
  const [transportadora, setTransportadora] = useState('Amazon Prime');
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [recebidoPor, setRecebidoPor] = useState('Portaria Principal (Plantonista)');
  const [observacao, setObservacao] = useState('');

  // Baixa / Rescue Code Input
  const [inputRescueCode, setInputRescueCode] = useState('');
  const [baixaFeedback, setBaixaFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Common carriers quick select
  const commonCarriers = [
    'Amazon Prime',
    'Mercado Livre',
    'Correios Sedex',
    'Shopee Xpress',
    'Total Express',
    'FedEx / DHL',
    'iFood / Delivery',
  ];

  const handleRegisterPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMoradorId) {
      alert('Selecione o morador / unidade de destino.');
      return;
    }

    try {
      const nova = condoStore.addEncomenda(condominio.id, {
        moradorId: selectedMoradorId,
        transportadora,
        codigoRastreio,
        recebidoPor,
        observacao,
      });

      confetti({ particleCount: 50, spread: 60 });
      setCodigoRastreio('');
      setObservacao('');
      alert(`Encomenda cadastrada com sucesso!\nCódigo de Resgate gerado: ${nova.codigoResgate}\nO morador já foi notificado no aplicativo.`);
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar encomenda.');
    }
  };

  const handleBaixaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRescueCode.trim()) return;

    const res = condoStore.darBaixaEncomenda(
      condominio.id,
      inputRescueCode.trim(),
      recebidoPor
    );

    setBaixaFeedback(res);
    if (res.success) {
      setInputRescueCode('');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  const pendingPackages = encomendas.filter((e) => e.status === 'na_portaria');
  const maintenanceBikes = bikes.filter((b) => b.status === 'manutencao');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner Elegante */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Módulo de Recepção & Portaria
            </span>
            <span className="text-xs text-slate-500 font-medium">{condominio.nome}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Controle de Encomendas & Recepção
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Cadastro ágil com código de resgate de 6 dígitos e monitoramento do bicicletário.
          </p>
        </div>

        {/* Resumo Rápido */}
        <div className="flex items-center gap-3">
          <div className="bg-amber-50 px-4 py-2.5 rounded-xl border border-amber-200 text-center">
            <div className="text-2xl font-extrabold text-amber-900">{pendingPackages.length}</div>
            <div className="text-xs font-semibold text-amber-700">Na Portaria</div>
          </div>
          <div className="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 text-center">
            <div className="text-2xl font-extrabold text-slate-900">{bikes.filter(b => b.status === 'disponivel').length}</div>
            <div className="text-xs font-semibold text-slate-600">Bikes Livres</div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('receber')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'receber'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Receber Nova Encomenda</span>
        </button>

        <button
          onClick={() => setActiveTab('baixa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'baixa'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Entregar Pacote (Baixa de 6 Dígitos)</span>
        </button>

        <button
          onClick={() => setActiveTab('bicicletario')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'bicicletario'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>Conferência de Bicicletas</span>
          {maintenanceBikes.length > 0 && (
            <span className="text-xs bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
              {maintenanceBikes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeTab === 'historico'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Histórico Geral ({encomendas.length})</span>
        </button>
      </div>

      {/* ABA 1: RECEBER ENCOMENDA */}
      {activeTab === 'receber' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-amber-600" />
              Cadastrar Encomenda Recebida
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              O morador receberá automaticamente uma notificação com o código de resgate seguro de 6 dígitos.
            </p>

            <form onSubmit={handleRegisterPackage} className="space-y-4 text-xs">
              {/* Morador / Unidade */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Unidade e Morador de Destino:
                </label>
                <select
                  value={selectedMoradorId}
                  onChange={(e) => setSelectedMoradorId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="">Selecione o morador...</option>
                  {moradores.map((m) => (
                    <option key={m.id} value={m.id}>
                      Bloco {m.unidade.bloco} - Apto {m.unidade.apto} ({m.nome})
                    </option>
                  ))}
                </select>
              </div>

              {/* Transportadora */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Transportadora / Empresa Entregadora:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {commonCarriers.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTransportadora(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        transportadora === c
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={transportadora}
                  onChange={(e) => setTransportadora(e.target.value)}
                  required
                  placeholder="Nome da transportadora..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Código de Rastreio */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Código de Rastreio / Nota Fiscal:
                </label>
                <input
                  type="text"
                  value={codigoRastreio}
                  onChange={(e) => setCodigoRastreio(e.target.value)}
                  placeholder="Ex: BR892182901AZ ou NF 49102"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Observação */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Descrição do Volume / Observações:
                </label>
                <input
                  type="text"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Caixa média, lacre intacto, frágil..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition flex items-center justify-center gap-2 active:scale-98"
              >
                <Send className="w-4 h-4" />
                <span>Salvar Encomenda & Notificar Morador</span>
              </button>
            </form>
          </div>

          {/* Encomendas Aguardando Retirada */}
          <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-600" />
                Aguardando Retirada ({pendingPackages.length})
              </span>
            </h3>

            <div className="max-h-[480px] overflow-y-auto space-y-2.5 pr-1">
              {pendingPackages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">
                  Nenhuma encomenda estocada na portaria no momento.
                </p>
              ) : (
                pendingPackages.map((enc) => (
                  <div
                    key={enc.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{enc.moradorNome}</div>
                        <div className="text-amber-800 font-semibold text-xs mt-0.5">
                          Bloco {enc.unidade.bloco} - Apto {enc.unidade.apto}
                        </div>
                        <div className="text-slate-500 text-xs mt-1">
                          {enc.transportadora} • {enc.codigoRastreio}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 block">
                          {enc.codigoResgate}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setInputRescueCode(enc.codigoResgate);
                        setActiveTab('baixa');
                      }}
                      className="mt-3 w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center justify-center gap-1"
                    >
                      <span>Dar Baixa Direta</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: BAIXA DE ENCOMENDA */}
      {activeTab === 'baixa' && (
        <div className="max-w-md mx-auto bg-white border border-slate-200/80 rounded-2xl p-7 shadow-lg text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <KeyRound className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-bold text-slate-900">Baixa de Encomenda</h2>
          <p className="text-xs text-slate-500 mt-1">
            Digite o código numérico de 6 dígitos que o morador apresentar na portaria:
          </p>

          {baixaFeedback && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 text-left ${
                baixaFeedback.success
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 font-medium'
              }`}
            >
              {baixaFeedback.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{baixaFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handleBaixaSubmit} className="mt-5 space-y-4">
            <input
              type="text"
              maxLength={6}
              value={inputRescueCode}
              onChange={(e) => setInputRescueCode(e.target.value)}
              placeholder="000000"
              className="w-full text-center text-3xl font-mono font-extrabold tracking-widest bg-slate-50 border-2 border-amber-400 rounded-xl py-3 text-slate-900 focus:outline-none focus:border-amber-600"
              autoFocus
            />

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md shadow-amber-600/20 transition active:scale-98"
            >
              Validar Código & Entregar Pacote
            </button>
          </form>

          {/* Atalhos Rápidos */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-left">
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Pacotes Prontos para Retirada:
            </span>
            <div className="space-y-1.5">
              {pendingPackages.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => setInputRescueCode(p.codigoResgate)}
                  className="p-2 rounded-lg bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 cursor-pointer flex items-center justify-between text-xs transition"
                >
                  <span className="text-slate-800 font-medium">
                    {p.moradorNome} (Bl. {p.unidade.bloco} - Apto {p.unidade.apto})
                  </span>
                  <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    {p.codigoResgate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: CONFERÊNCIA DE BIKES */}
      {activeTab === 'bicicletario' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bike className="w-5 h-5 text-emerald-600" />
              Painel de Conferência do Bicicletário
            </h2>
            <p className="text-xs text-slate-500">
              Acompanhe a localização física, travas e avarias reportadas nas devoluções.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bikes.map((bike) => (
              <div
                key={bike.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between ${
                  bike.status === 'manutencao'
                    ? 'bg-rose-50/40 border-rose-200 shadow-sm'
                    : bike.status === 'em_uso'
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-white border-slate-200/80 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                      Bike #{bike.codigo}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        bike.status === 'disponivel'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : bike.status === 'em_uso'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {bike.status === 'disponivel' ? 'No Totem' : bike.status === 'em_uso' ? 'Em Uso' : 'Com Avaria'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{bike.modelo}</h3>
                  <p className="text-xs text-slate-600 mt-1">{bike.localizacaoAtual}</p>

                  <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <span className="block text-slate-500 text-[11px]">Senha do Cadeado Físico:</span>
                    <strong className="text-slate-900 font-mono text-sm">{bike.lockPassword}</strong>
                  </div>

                  {bike.avariasAtuais && bike.avariasAtuais.length > 0 && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                      ⚠️ Avarias: {bike.avariasAtuais.join(', ')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA 4: HISTÓRICO GERAL */}
      {activeTab === 'historico' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-600" />
            Histórico Completo de Encomendas
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Morador / Unidade</th>
                  <th className="py-3 px-4">Transportadora</th>
                  <th className="py-3 px-4">Código Resgate</th>
                  <th className="py-3 px-4">Recebido Em</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Entregue Em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {encomendas.map((enc) => (
                  <tr key={enc.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {enc.moradorNome} (Bl. {enc.unidade.bloco} - Apto {enc.unidade.apto})
                    </td>
                    <td className="py-3 px-4 text-slate-700">{enc.transportadora}</td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">{enc.codigoResgate}</td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(enc.recebidoEm).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          enc.status === 'entregue'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {enc.status === 'entregue' ? 'Entregue' : 'Na Portaria'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {enc.entregueEm ? new Date(enc.entregueEm).toLocaleString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
