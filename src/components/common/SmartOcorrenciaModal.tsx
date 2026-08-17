import React, { useState } from 'react';
import {
  X,
  Camera,
  Upload,
  AlertTriangle,
  MapPin,
  FileText,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  Flame,
  Zap,
  Droplets,
  Layers,
  Shield,
  Volume2,
} from 'lucide-react';
import { Condominio, Morador, Ocorrencia, OcorrenciaCategoria, OcorrenciaPrioridade } from '../../types';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';

interface SmartOcorrenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  condominio: Condominio;
  morador: Morador;
  onSuccess?: (ocorrencia: Ocorrencia) => void;
}

const LOCAIS_PREDEFINIDOS = [
  'Garagem Subsolo 1 (G1)',
  'Garagem Subsolo 2 (G2)',
  'Hall Social Torre A',
  'Hall Social Torre B',
  'Elevador Social Torre A',
  'Elevador de Serviço Torre A',
  'Elevador Social Torre B',
  'Piscina & Deck',
  'Academia & Espaço Fitness',
  'Salão de Festas',
  'Churrasqueira & Espaço Gourmet',
  'Parquinho Infantil',
  'Quadra Poliesportiva',
  'Portaria Principal & Eclusa',
  'Fachada & Jardins',
  'Escadaria de Emergência',
  'Bicicletário Compartilhado',
  'Outro Local',
];

const FOTOS_EXEMPLO = [
  {
    nome: 'Lâmpada / Iluminação',
    url: 'https://images.unsplash.com/photo-1517991104123-1d56a6e81ed9?auto=format&fit=crop&w=600&q=80',
  },
  {
    nome: 'Vazamento / Hidráulica',
    url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=600&q=80',
  },
  {
    nome: 'Elevador / Porta',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
  },
  {
    nome: 'Academia / Equipamento',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80',
  },
];

export const SmartOcorrenciaModal: React.FC<SmartOcorrenciaModalProps> = ({
  isOpen,
  onClose,
  condominio,
  morador,
  onSuccess,
}) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState<OcorrenciaCategoria>('manutencao');
  const [local, setLocal] = useState('Garagem Subsolo 1 (G1)');
  const [prioridade, setPrioridade] = useState<OcorrenciaPrioridade>('media');
  const [fotoUrl, setFotoUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setFotoUrl(reader.result as string);
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !descricao.trim()) return;

    const nova = condoStore.addOcorrencia(condominio.id, {
      moradorId: morador.id,
      titulo: titulo.trim(),
      descricao: `[Local: ${local}] ${descricao.trim()}`,
      categoria,
      prioridade,
      fotoUrl: fotoUrl || undefined,
    });

    confetti({ particleCount: 50, spread: 60 });
    if (onSuccess) onSuccess(nova);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                SmartOcorrências • Chamado de Manutenção
              </h3>
              <p className="text-xs text-slate-500">
                Relate problemas com fotos e localização para o síndico e zelador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Categoria do Chamado */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Categoria do Problema *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'manutencao', label: 'Manutenção', icon: Layers },
                { id: 'vazamento', label: 'Hidráulica', icon: Droplets },
                { id: 'elevador', label: 'Elevadores', icon: Zap },
                { id: 'garagem', label: 'Garagem', icon: MapPin },
                { id: 'limpeza', label: 'Limpeza', icon: CheckCircle2 },
                { id: 'barulho', label: 'Barulho / Som', icon: Volume2 },
                { id: 'seguranca', label: 'Segurança', icon: Shield },
                { id: 'outro', label: 'Outros', icon: AlertTriangle },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = categoria === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategoria(item.id as OcorrenciaCategoria)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Local do Condomínio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Local do Condomínio *
            </label>
            <select
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
            >
              {LOCAIS_PREDEFINIDOS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Título do Problema */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Título Curto do Chamado *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Lâmpada queimada no corredor do 3º andar"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
            />
          </div>

          {/* Descrição Detalhada */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descrição Detalhada do Problema *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Descreva o que está ocorrendo, quando começou e pontos de atenção para a equipe..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white resize-none"
            />
          </div>

          {/* Prioridade e Anexo de Foto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nível de Prioridade
              </label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value as OcorrenciaPrioridade)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
              >
                <option value="baixa">Baixa (Pode aguardar rotina)</option>
                <option value="media">Média (Atendimento em até 48h)</option>
                <option value="alta">Alta (Prioritário - 24h)</option>
                <option value="urgente">Urgente (Risco de dano imediato)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Foto do Problema (Celular / Câmera)
              </label>
              <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-900 text-xs font-bold transition cursor-pointer">
                <Camera className="w-4 h-4 text-amber-600" />
                <span>{fotoUrl ? 'Trocar Foto Selecionada' : 'Tirar Foto ou Fazer Upload'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Preview da Foto ou Seleção Rápida */}
          {fotoUrl ? (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={fotoUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-xl object-cover border border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">Foto Anexada ao Chamado</span>
                  <p className="text-[11px] text-emerald-600 font-semibold">
                    ✓ Pronta para envio à zeladoria
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFotoUrl('')}
                className="text-xs font-bold text-rose-600 hover:underline p-2 cursor-pointer"
              >
                Remover
              </button>
            </div>
          ) : (
            <div>
              <span className="text-[11px] text-slate-400 font-bold block mb-1.5">
                Ou selecione uma foto de demonstração rápida:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {FOTOS_EXEMPLO.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFotoUrl(item.url)}
                    className="flex flex-col items-center gap-1 p-1.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/50 transition cursor-pointer text-center"
                  >
                    <img
                      src={item.url}
                      alt={item.nome}
                      className="w-full h-12 rounded-lg object-cover"
                    />
                    <span className="text-[9px] font-bold text-slate-600 truncate w-full">
                      {item.nome}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rodapé e Botão de Envio */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-lg shadow-amber-600/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Registrar Chamado para o Síndico & Zelador</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
