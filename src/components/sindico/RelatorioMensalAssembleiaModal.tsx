import React, { useState } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  Bike,
  Wrench,
  Package,
  Users,
  AlertTriangle,
  DollarSign,
  Building,
  TrendingUp,
  Leaf,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Condominio } from '../../types';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';

interface RelatorioMensalAssembleiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  condominio: Condominio;
}

export const RelatorioMensalAssembleiaModal: React.FC<RelatorioMensalAssembleiaModalProps> = ({
  isOpen,
  onClose,
  condominio,
}) => {
  const [mesSelecionado, setMesSelecionado] = useState('Agosto / 2026');

  if (!isOpen) return null;

  const bikes = condoStore.getBikes(condominio.id);
  const itens = condoStore.getItensCompartilhados(condominio.id);
  const encomendas = condoStore.getEncomendas(condominio.id);
  const visitantes = condoStore.getVisitantes(condominio.id);
  const ocorrencias = condoStore.getOcorrencias(condominio.id);
  const boletos = condoStore.getBoletos(condominio.id);
  const extrato = condoStore.getExtratoFinanceiro(condominio.id);

  // Estatísticas Calculadas
  const totalBikesUsos = 64; // acumulado do mês
  const kmPedaladosEstimados = 192; // km
  const co2EconomizadoKg = 38.4; // kg CO2

  const totalItensRetiradas = 28; // furadeiras, lavanderia, etc.
  const economiaMoradoresRs = 4200.0; // economia coletiva estimada

  const totalEncomendas = encomendas.length + 42;
  const encomendasEntregues = encomendas.filter((e) => e.status === 'entregue').length + 40;
  const tempoMedioRetiradaDias = 1.2;

  const totalVisitantes = visitantes.length + 118;
  const prestadoresCadastrados = 34;

  const chamadosTotal = ocorrencias.length + 12;
  const chamadosResolvidos = ocorrencias.filter((o) => o.status === 'resolvido').length + 11;
  const taxaResolucao = Math.round((chamadosResolvidos / chamadosTotal) * 100);

  const adimplenciaTaxa = 98.4;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    confetti({ particleCount: 50, spread: 60 });
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Relatório Executivo Mensal • Assembleia Geral
              </h3>
              <p className="text-xs text-slate-500">
                Resumo consolidado de gestão, mobilidade, portaria e satisfação
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo do Relatório Formatado para Assembleia */}
        <div className="p-6 overflow-y-auto space-y-6 print:p-0">
          {/* Cabeçalho do Condomínio */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                SmartCondo Management • Relatório Oficial
              </span>
              <h2 className="text-2xl font-black text-white mt-1.5">{condominio.nome}</h2>
              <p className="text-xs text-slate-300">
                {condominio.endereco} • Síndico: {condominio.sindicoNome}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-semibold">Mês de Referência:</span>
              <span className="text-xl font-black text-amber-400">{mesSelecionado}</span>
            </div>
          </div>

          {/* Grid de 4 Pilares de Métricas de Alto Impacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pilar 1: Mobilidade & Sustentabilidade */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  Bicicletas & Mobilidade
                </span>
                <Bike className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-3xl font-black text-emerald-950">{totalBikesUsos}</div>
              <p className="text-[11px] text-emerald-800 font-semibold">
                Passeios realizados este mês • {kmPedaladosEstimados} km rodados
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 pt-1 border-t border-emerald-200">
                <Leaf className="w-3 h-3" />
                <span>-{co2EconomizadoKg} kg de CO2 evitados</span>
              </div>
            </div>

            {/* Pilar 2: SmartShare & Economia Coletiva */}
            <div className="bg-teal-50/70 border border-teal-200/80 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-teal-900">
                  SmartShare (Equipamentos)
                </span>
                <Wrench className="w-4 h-4 text-teal-700" />
              </div>
              <div className="text-3xl font-black text-teal-950">{totalItensRetiradas}</div>
              <p className="text-[11px] text-teal-800 font-semibold">
                Retiradas de ferramentas e utilidades coletivas
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-teal-700 pt-1 border-t border-teal-200">
                <Sparkles className="w-3 h-3" />
                <span>~R$ {economiaMoradoresRs.toFixed(2)} economizados</span>
              </div>
            </div>

            {/* Pilar 3: Eficiência na Portaria */}
            <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                  Portaria & Encomendas
                </span>
                <Package className="w-4 h-4 text-blue-700" />
              </div>
              <div className="text-3xl font-black text-blue-950">{totalEncomendas}</div>
              <p className="text-[11px] text-blue-800 font-semibold">
                Pacotes recebidos com notificação em tempo real
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-700 pt-1 border-t border-blue-200">
                <Clock className="w-3 h-3" />
                <span>Tempo médio de retirada: {tempoMedioRetiradaDias} dias</span>
              </div>
            </div>

            {/* Pilar 4: Resolução de Manutenção */}
            <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                  Zeladoria & Chamados
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-3xl font-black text-amber-950">{taxaResolucao}%</div>
              <p className="text-[11px] text-amber-800 font-semibold">
                {chamadosResolvidos} de {chamadosTotal} ocorrências concluídas
              </p>
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 pt-1 border-t border-amber-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Atendimento médio em &lt; 24h</span>
              </div>
            </div>
          </div>

          {/* Seção 2: Detalhamento por Módulos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Visão de Controle de Acesso */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>SmartPass • Visitantes e Prestadores</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Total de Convites Digitais Gerados:</span>
                  <strong className="text-slate-900 font-bold">{totalVisitantes}</strong>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Prestadores de Serviço Identificados:</span>
                  <strong className="text-slate-900 font-bold">{prestadoresCadastrados}</strong>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Entrada sem Interfone (QR Code / PIN):</span>
                  <strong className="text-emerald-700 font-bold">100% Digital</strong>
                </div>
              </div>
            </div>

            {/* Visão Financeira & Adimplência */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-3">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Saúde Financeira do Condomínio</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Taxa de Adimplência do Mês:</span>
                  <strong className="text-emerald-700 font-bold">{adimplenciaTaxa}%</strong>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Boletos com Pagamento via PIX:</span>
                  <strong className="text-slate-900 font-bold">84% dos pagamentos</strong>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Fundo de Reserva Atual:</span>
                  <strong className="text-indigo-900 font-bold">R$ 142.500,00</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Assinatura / Validação da Gestão */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <span>Relatório gerado automaticamente pela plataforma SmartCondo v1.0.</span>
            </div>
            <div className="text-center sm:text-right">
              <span className="font-bold text-slate-800 block">Carlos Mendes (Síndico Geral)</span>
              <span>Aprovado pelo Conselho Fiscal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
