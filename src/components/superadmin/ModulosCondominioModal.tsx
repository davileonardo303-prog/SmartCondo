import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Bike,
  ShoppingBag,
  Package,
  PhoneCall,
  MessageSquare,
  Calendar,
  Wrench,
  Shield,
  Car,
  AlertTriangle,
  Radio,
  DollarSign,
  FileText,
  Sparkles,
  Save,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { condoStore, DEFAULT_MODULOS_CONDOMINIO, PRESET_BIKE_ONLY_MODULOS, PRESET_BIKE_FOOD_MODULOS } from '../../services/mockStorage';
import { Condominio, ModulosCondominioConfig, ModuloServicoId } from '../../types';

interface ModulosCondominioModalProps {
  condominio: Condominio;
  onClose: () => void;
  onSuccess: () => void;
}

interface ModuloInfo {
  id: ModuloServicoId;
  nome: string;
  descricao: string;
  icon: React.ReactNode;
  badge: string;
  cor: string;
}

const MODULOS_CATALOGO: ModuloInfo[] = [
  {
    id: 'bicicletario',
    nome: 'Bicicletário Compartilhado',
    descricao: 'Reservas de 5 minutos, liberação de cadeados digitais, controle de devoluções e vistorias.',
    icon: <Bike className="w-5 h-5 text-emerald-500" />,
    badge: 'Mobilidade',
    cor: 'emerald',
  },
  {
    id: 'comida_mercado',
    nome: 'Mercadinho Autônomo & Comida',
    descricao: 'Catálogo de bebidas geladas, lanches, salgados, conveniência e compras autônomas 24h.',
    icon: <ShoppingBag className="w-5 h-5 text-orange-500" />,
    badge: 'Alimentação',
    cor: 'orange',
  },
  {
    id: 'encomendas',
    nome: 'Portaria de Encomendas',
    descricao: 'Registro fotográfico, geração de PIN de resgate de 4 dígitos, baixa de entregas e avisos.',
    icon: <Package className="w-5 h-5 text-blue-500" />,
    badge: 'Logística',
    cor: 'blue',
  },
  {
    id: 'interfone',
    nome: 'Interfonia Digital WebRTC',
    descricao: 'Chamadas de interfone em áudio e vídeo em tempo real entre portaria e moradores.',
    icon: <PhoneCall className="w-5 h-5 text-indigo-500" />,
    badge: 'Comunicação',
    cor: 'indigo',
  },
  {
    id: 'portaria_whatsapp',
    nome: 'Portaria DropDesk WhatsApp',
    descricao: 'Atendimento oficial via WhatsApp, disparo de notificações e central de chamados.',
    icon: <MessageSquare className="w-5 h-5 text-emerald-600" />,
    badge: 'Atendimento',
    cor: 'emerald',
  },
  {
    id: 'lazer',
    nome: 'Áreas de Lazer & Reservas',
    descricao: 'Reserva do Salão de Festas, Churrasqueira, Piscina, Espaço Gourmet e Espaço Kids.',
    icon: <Calendar className="w-5 h-5 text-pink-500" />,
    badge: 'Lazer',
    cor: 'pink',
  },
  {
    id: 'equipamentos',
    nome: 'Ferramentas & Equipamentos',
    descricao: 'Empréstimo de furadeiras, escadas, aspiradores e itens compartilhados do condomínio.',
    icon: <Wrench className="w-5 h-5 text-amber-500" />,
    badge: 'Compartilhamento',
    cor: 'amber',
  },
  {
    id: 'seguranca',
    nome: 'Segurança & SmartPass Visitantes',
    descricao: 'Câmeras de monitoramento ao vivo e passes digitais com QR Code para visitantes.',
    icon: <Shield className="w-5 h-5 text-teal-500" />,
    badge: 'Segurança',
    cor: 'teal',
  },
  {
    id: 'garagem',
    nome: 'Garagem & Controle de Vagas',
    descricao: 'Cadastro de veículos, controle de vagas demarcadas e rotativas com placas.',
    icon: <Car className="w-5 h-5 text-cyan-500" />,
    badge: 'Veículos',
    cor: 'cyan',
  },
  {
    id: 'ocorrencias',
    nome: 'Ocorrências & Manutenção',
    descricao: 'Abertura de chamados com fotos, relatos de barulho, vazamentos e manutenções.',
    icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
    badge: 'Zeladoria',
    cor: 'rose',
  },
  {
    id: 'mural',
    nome: 'Mural, Comunidade & Enquetes',
    descricao: 'Publicações de avisos da administração, feed da comunidade e votações.',
    icon: <Radio className="w-5 h-5 text-violet-500" />,
    badge: 'Social',
    cor: 'violet',
  },
  {
    id: 'financeiro',
    nome: 'Financeiro, Boletos & Pix',
    descricao: '2ª via de boleto condominial, chave Pix instantânea e prestação de contas.',
    icon: <DollarSign className="w-5 h-5 text-green-500" />,
    badge: 'Financeiro',
    cor: 'green',
  },
  {
    id: 'documentos',
    nome: 'Atas, Regulamento & Documentos',
    descricao: 'Biblioteca digital com convenção, regimento interno e atas das assembleias.',
    icon: <FileText className="w-5 h-5 text-slate-500" />,
    badge: 'Gestão',
    cor: 'slate',
  },
];

export const ModulosCondominioModal: React.FC<ModulosCondominioModalProps> = ({
  condominio,
  onClose,
  onSuccess,
}) => {
  const modulosAtuais = condoStore.getModulosCondominio(condominio.id);
  const [modulos, setModulos] = useState<ModulosCondominioConfig>({ ...modulosAtuais });
  const [salvando, setSalvando] = useState(false);

  const toggleModulo = (id: ModuloServicoId) => {
    setModulos((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const aplicarPreset = (preset: ModulosCondominioConfig) => {
    setModulos({ ...preset });
  };

  const totalAtivos = Object.values(modulos).filter(Boolean).length;

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);

    const ok = condoStore.updateModulosCondominio(condominio.id, modulos);
    if (ok) {
      confetti({ particleCount: 50, spread: 60 });
      onSuccess();
    }
    setSalvando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 text-xs text-slate-800 my-6"
      >
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-100 text-purple-800 shadow-sm">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  Política de Serviços & Módulos
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                  {totalAtivos} de {MODULOS_CATALOGO.length} Ativos
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Condomínio: <strong className="text-slate-800">{condominio.nome}</strong> ({condominio.cidade}/{condominio.uf})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Banner Informativo sobre a Política de Permissões */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 flex items-start gap-3 text-slate-700 leading-relaxed">
          <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-purple-950 text-xs">
              Controle Granular por Condomínio
            </p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Marque com um <strong>"X"</strong> ou <strong>Checkbox</strong> os serviços que este condomínio contratou.
              Se o condomínio contratou apenas o serviço de <strong>Bicicletas</strong> ou <strong>Bicicletas + Comida</strong>, os moradores desse condomínio verão estritamente essas opções em seus painéis.
            </p>
          </div>
        </div>

        {/* Presets Rápidos com 1 Clique */}
        <div className="mt-4 space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
            Atalhos / Presets de Contratação Rápida
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => aplicarPreset(PRESET_BIKE_ONLY_MODULOS)}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-950 text-left transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Bike className="w-4 h-4 text-emerald-600" />
                <span>Apenas Bicicletas</span>
              </div>
              <span className="text-[10px] text-emerald-700 mt-1">Exclusivo reservas de bike</span>
            </button>

            <button
              type="button"
              onClick={() => aplicarPreset(PRESET_BIKE_FOOD_MODULOS)}
              className="p-2.5 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100/90 text-orange-950 text-left transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
                <span>Bicicleta + Comida</span>
              </div>
              <span className="text-[10px] text-orange-700 mt-1">Bikes & Mercadinho autônomo</span>
            </button>

            <button
              type="button"
              onClick={() =>
                aplicarPreset({
                  bicicletario: true,
                  comida_mercado: true,
                  encomendas: true,
                  interfone: true,
                  portaria_whatsapp: true,
                  lazer: false,
                  equipamentos: false,
                  seguranca: true,
                  garagem: true,
                  ocorrencias: true,
                  mural: false,
                  financeiro: false,
                  documentos: false,
                })
              }
              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/90 text-blue-950 text-left transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Portaria Smart</span>
              </div>
              <span className="text-[10px] text-blue-700 mt-1">Encomendas, Interfone & Zap</span>
            </button>

            <button
              type="button"
              onClick={() => aplicarPreset(DEFAULT_MODULOS_CONDOMINIO)}
              className="p-2.5 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100/90 text-purple-950 text-left transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Todos os Módulos</span>
              </div>
              <span className="text-[10px] text-purple-700 mt-1">Plataforma 100% Completa</span>
            </button>
          </div>
        </div>

        {/* Tabela Interativa de Módulos (Checkboxes com X / Visto) */}
        <form onSubmit={handleSalvar} className="mt-5 space-y-4">
          <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2 border border-slate-100 p-2 rounded-2xl bg-slate-50/50">
            {MODULOS_CATALOGO.map((mod) => {
              const isAtivo = !!modulos[mod.id];

              return (
                <div
                  key={mod.id}
                  onClick={() => toggleModulo(mod.id)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                    isAtivo
                      ? 'bg-white border-purple-500/40 shadow-sm ring-1 ring-purple-500/20'
                      : 'bg-slate-100/60 border-slate-200 opacity-60 hover:opacity-100 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isAtivo ? 'bg-purple-100 text-purple-800' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {mod.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-xs ${isAtivo ? 'text-slate-900' : 'text-slate-600'}`}>
                          {mod.nome}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {mod.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 max-w-lg">
                        {mod.descricao}
                      </p>
                    </div>
                  </div>

                  {/* Botão de Toggle Visual com X / Check */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                        isAtivo
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 scale-105'
                          : 'bg-rose-100 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {isAtivo ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4 stroke-[3]" />}
                    </div>
                    <span className="text-[11px] font-black w-14 text-right">
                      {isAtivo ? (
                        <span className="text-emerald-700">ATIVO</span>
                      ) : (
                        <span className="text-rose-600">INATIVO</span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer com Ações */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              Módulos liberados para moradores deste condomínio: <strong>{totalAtivos}</strong>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="flex-1 sm:flex-initial py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Permissões do Condomínio</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
