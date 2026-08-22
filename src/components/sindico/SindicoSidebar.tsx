import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Package,
  Bike,
  KeyRound,
  Wrench,
  Sparkles,
  Calendar,
  AlertCircle,
  DollarSign,
  Vote,
  FileText,
  PhoneCall,
  Settings,
  Search,
  X,
  Pin,
  PinOff,
  ChevronRight,
  Layers,
  Building2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Condominio, ModulosCondominioConfig } from '../../types';

export type SindicoTabType =
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
  | 'configuracoes';

interface NavItem {
  id: SindicoTabType;
  label: string;
  shortLabel?: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  badge?: number | string | null;
  badgeColor?: string;
  pulse?: boolean;
  active: boolean; // Se o condomínio possui esse módulo contratado
}

interface NavCategory {
  id: string;
  title: string;
  icon: React.FC<{ className?: string }>;
  items: NavItem[];
}

interface SindicoSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
  activeTab: SindicoTabType;
  onSelectTab: (tab: SindicoTabType) => void;
  condominio: Condominio;
  modulosAtivos: ModulosCondominioConfig;
  totalMoradores: number;
  moradoresPendentesCount: number;
  totalFuncionarios: number;
  totalBikes: number;
  bikesReservadasCount: number;
  totalAreasLazer: number;
  totalReservas: number;
  ocorrenciasAbertasCount: number;
  totalEnquetes: number;
  totalAvisos: number;
  totalDocumentos: number;
  diasEncomenda: number;
}

export const SindicoSidebar: React.FC<SindicoSidebarProps> = ({
  isOpen,
  onClose,
  isPinned,
  onTogglePin,
  activeTab,
  onSelectTab,
  condominio,
  modulosAtivos,
  totalMoradores,
  moradoresPendentesCount,
  totalFuncionarios,
  totalBikes,
  bikesReservadasCount,
  totalAreasLazer,
  totalReservas,
  ocorrenciasAbertasCount,
  totalEnquetes,
  totalAvisos,
  totalDocumentos,
  diasEncomenda,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fechar com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPinned) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPinned, onClose]);

  const categories: NavCategory[] = useMemo(() => [
    {
      id: 'pessoas',
      title: 'Pessoas & Acessos',
      icon: Users,
      items: [
        {
          id: 'moradores',
          label: 'Moradores & Cadastros',
          description: 'Gestão de unidades, cadastro e adimplência',
          icon: Users,
          color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400',
          badge: totalMoradores,
          active: true,
        },
        {
          id: 'equipe',
          label: 'Equipe & Permissões',
          description: 'Porteiros, zeladores e cargos administrativos',
          icon: ShieldCheck,
          color: 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300',
          badge: totalFuncionarios,
          active: true,
        },
        {
          id: 'aprovacoes',
          label: 'Aprovações Pendentes',
          description: 'Solicitações de novos moradores aguardando validação',
          icon: CheckCircle2,
          color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
          badge: moradoresPendentesCount > 0 ? moradoresPendentesCount : null,
          badgeColor: 'bg-rose-500 text-white',
          pulse: moradoresPendentesCount > 0,
          active: true,
        },
      ],
    },
    {
      id: 'portaria',
      title: 'Portaria & Operação',
      icon: Package,
      items: [
        {
          id: 'regras_encomendas',
          label: 'Regras de Encomendas',
          description: `Prazo de guarda (${diasEncomenda} dias) e logs de entrega`,
          icon: Package,
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
          active: !!modulosAtivos.encomendas,
        },
        {
          id: 'frota',
          label: 'Gestão da Frota de Bikes',
          description: 'Bicicletas compartilhadas, revisões e regras',
          icon: Bike,
          color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400',
          badge: totalBikes,
          active: !!modulosAtivos.bicicletario,
        },
        {
          id: 'liberacoes',
          label: 'Liberação & Senhas Digitais',
          description: 'Senhas de 5 minutos geradas para retirada',
          icon: KeyRound,
          color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
          badge: bikesReservadasCount > 0 ? bikesReservadasCount : null,
          badgeColor: 'bg-emerald-600 text-white',
          pulse: bikesReservadasCount > 0,
          active: !!modulosAtivos.bicicletario,
        },
        {
          id: 'equipamentos',
          label: 'Itens & Equipamentos',
          description: 'Ferramentas, aspiradores e itens de empréstimo',
          icon: Wrench,
          color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400',
          active: !!modulosAtivos.equipamentos,
        },
        {
          id: 'interfone',
          label: 'Central Telefônica & Interfone',
          description: 'Chamadas PTT e comunicação direta com portaria',
          icon: PhoneCall,
          color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
          active: !!modulosAtivos.interfone,
        },
        {
          id: 'whatsapp',
          label: 'Central WhatsApp (DropDesk)',
          description: 'Disparos em massa e atendimento da portaria',
          icon: PhoneCall,
          color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300',
          active: !!modulosAtivos.portaria_whatsapp,
        },
      ],
    },
    {
      id: 'lazer_estrutura',
      title: 'Estrutura & Convivência',
      icon: Sparkles,
      items: [
        {
          id: 'lazer',
          label: 'Áreas Comuns & Lazer',
          description: 'Salão de festas, churrasqueira, piscina e regras',
          icon: Sparkles,
          color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 dark:text-pink-400',
          badge: totalAreasLazer,
          active: !!modulosAtivos.lazer,
        },
        {
          id: 'reservas',
          label: 'Agenda & Reservas',
          description: 'Calendário de eventos e solicitações de espaços',
          icon: Calendar,
          color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400',
          badge: totalReservas,
          active: !!modulosAtivos.lazer,
        },
        {
          id: 'ocorrencias',
          label: 'Ocorrências & Chamados',
          description: 'Livro de ocorrências e solicitações de reparo',
          icon: AlertCircle,
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400',
          badge: ocorrenciasAbertasCount > 0 ? ocorrenciasAbertasCount : null,
          badgeColor: 'bg-amber-500 text-white',
          active: !!modulosAtivos.ocorrencias,
        },
      ],
    },
    {
      id: 'comunicacao_financas',
      title: 'Finanças & Comunicação',
      icon: DollarSign,
      items: [
        {
          id: 'financeiro',
          label: 'Financeiro & Prestação',
          description: 'Boletos, receitas, despesas e balancetes',
          icon: DollarSign,
          color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
          active: !!modulosAtivos.financeiro,
        },
        {
          id: 'documentos',
          label: 'Documentos & Atas',
          description: 'Regulamento interno, convenção e prestação',
          icon: FileText,
          color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
          badge: totalDocumentos,
          active: !!modulosAtivos.documentos,
        },
        {
          id: 'comunidade',
          label: 'Comunidade & Enquetes',
          description: 'Votações virtuais, assembleias e sugestões',
          icon: Vote,
          color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400',
          badge: totalEnquetes,
          active: !!modulosAtivos.mural,
        },
        {
          id: 'avisos',
          label: 'Mural de Comunicados',
          description: 'Avisos aos moradores e notificações push',
          icon: AlertCircle,
          color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400',
          badge: totalAvisos,
          active: !!modulosAtivos.mural,
        },
      ],
    },
    {
      id: 'sistema',
      title: 'Sistema & Configurações',
      icon: Settings,
      items: [
        {
          id: 'configuracoes',
          label: 'Configurações & Regras',
          description: 'Dados do condomínio, limites e parâmetros gerais',
          icon: Settings,
          color: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
          active: true,
        },
      ],
    },
  ], [
    modulosAtivos,
    totalMoradores,
    moradoresPendentesCount,
    totalFuncionarios,
    totalBikes,
    bikesReservadasCount,
    totalAreasLazer,
    totalReservas,
    ocorrenciasAbertasCount,
    totalEnquetes,
    totalAvisos,
    totalDocumentos,
    diasEncomenda,
  ]);

  // Filtra por módulos ativos e termo de pesquisa
  const filteredCategories = useMemo(() => {
    return categories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          if (!item.active) return false;
          if (!searchTerm.trim()) return true;
          const query = searchTerm.toLowerCase();
          return (
            item.label.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
          );
        }),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [categories, searchTerm]);

  if (!isOpen && !isPinned) {
    return null;
  }

  return (
    <>
      {/* Backdrop para quando a barra lateral estiver em modo Drawer flutuante (não fixado) */}
      {!isPinned && isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      {/* Conteúdo da Barra Lateral */}
      <aside
        id="sindico-sidebar-nav"
        className={`
          ${isPinned ? 'w-80 shrink-0 relative hidden lg:block' : 'fixed top-0 left-0 bottom-0 w-84 sm:w-96 z-50 shadow-2xl animate-in slide-in-from-left duration-250'}
          bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col h-full overflow-hidden
        `}
      >
        {/* Topo da Sidebar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-600/30 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Menu de Gestão
              </div>
              <div className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {condominio.nome}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onTogglePin}
              title={isPinned ? 'Desafixar menu' : 'Fixar menu na tela'}
              className={`p-2 rounded-lg transition text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                isPinned
                  ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </button>

            {!isPinned && (
              <button
                onClick={onClose}
                title="Fechar Menu (Esc)"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Campo de Busca Rápida de Módulo */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar serviço ou módulo..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Lista de Módulos Categorizados */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
              Nenhum serviço encontrado para "{searchTerm}".
            </div>
          ) : (
            filteredCategories.map((cat) => (
              <div key={cat.id} className="space-y-1">
                <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  <cat.icon className="w-3 h-3" />
                  <span>{cat.title}</span>
                </div>

                <div className="space-y-0.5">
                  {cat.items.map((item) => {
                    const isSelected = activeTab === item.id;
                    const ItemIcon = item.icon;

                    return (
                      <button
                        key={item.id}
                        id={`sidebar-item-${item.id}`}
                        onClick={() => {
                          onSelectTab(item.id);
                          if (!isPinned) {
                            onClose();
                          }
                        }}
                        className={`
                          w-full group text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 transition-all cursor-pointer
                          ${
                            isSelected
                              ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25 ring-1 ring-indigo-500'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900'
                          }
                        `}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`
                              w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                              ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : item.color
                              }
                            `}
                          >
                            <ItemIcon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className={`truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                              {item.label}
                            </div>
                            <div
                              className={`text-[10px] truncate leading-tight ${
                                isSelected
                                  ? 'text-indigo-100'
                                  : 'text-slate-400 dark:text-slate-500'
                              }`}
                            >
                              {item.description}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.badge !== undefined && item.badge !== null && (
                            <span
                              className={`
                                text-[10px] font-black px-2 py-0.5 rounded-full
                                ${item.pulse ? 'animate-pulse' : ''}
                                ${
                                  isSelected
                                    ? 'bg-white text-indigo-900 shadow-xs'
                                    : item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }
                              `}
                            >
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight
                            className={`w-3.5 h-3.5 transition-transform ${
                              isSelected
                                ? 'text-white translate-x-0.5'
                                : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-500'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Rodapé da Sidebar */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {condominio.totalUnidades} Unidades
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Plano {condominio.plano || 'Pro'}
          </span>
        </div>
      </aside>
    </>
  );
};
