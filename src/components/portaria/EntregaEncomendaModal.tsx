import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Encomenda, Condominio } from '../../types';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';
import {
  KeyRound,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  User,
  ShieldCheck,
  RotateCcw,
  PenTool,
  Package,
  Eye,
  Building2,
  CheckSquare,
  Square,
} from 'lucide-react';

interface EntregaEncomendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  encomenda: Encomenda | null;
  condominio: Condominio;
  operadorNome?: string;
  onSuccess: (message: string) => void;
}

export const EntregaEncomendaModal: React.FC<EntregaEncomendaModalProps> = ({
  isOpen,
  onClose,
  encomenda,
  condominio,
  operadorNome = 'Portaria Plantão',
  onSuccess,
}) => {
  const [metodo, setMetodo] = useState<'pin' | 'documento'>('pin');

  // Estado PIN
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Estado Documento & Rúbrica
  const [nomeRetirante, setNomeRetirante] = useState('');
  const [documentoRetirante, setDocumentoRetirante] = useState('');
  const [parentesco, setParentesco] = useState('Titular da Unidade');
  const [motivoSemPin, setMotivoSemPin] = useState('Sem celular / Sem bateria no momento');
  const [termoConferido, setTermoConferido] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);

  // Seleção de Múltiplos Pacotes do Apartamento
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Visualizar foto da etiqueta
  const [previewFotoUrl, setPreviewFotoUrl] = useState<string | null>(null);

  // Canvas de Assinatura
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Buscar todos os pacotes pendentes para a mesma unidade (Bloco + Apto)
  const pacotesDaUnidade = useMemo(() => {
    if (!encomenda) return [];
    return condoStore.getEncomendasPendentesUnidade(
      condominio.id,
      encomenda.unidade.bloco,
      encomenda.unidade.apto
    );
  }, [encomenda, condominio.id, isOpen]);

  useEffect(() => {
    if (encomenda) {
      setPinInput('');
      setPinError(null);
      setNomeRetirante(encomenda.moradorNome || '');
      setDocumentoRetirante('');
      setParentesco('Titular da Unidade');
      setMotivoSemPin('Sem celular / Sem bateria no momento');
      setTermoConferido(false);
      setHasSignature(false);
      setDocError(null);
      setMetodo('pin');

      // Seleciona todos os pacotes daquela mesma unidade por padrão
      const pendentes = condoStore.getEncomendasPendentesUnidade(
        condominio.id,
        encomenda.unidade.bloco,
        encomenda.unidade.apto
      );
      if (pendentes.length > 0) {
        setSelectedIds(pendentes.map((p) => p.id));
      } else {
        setSelectedIds([encomenda.id]);
      }
    }
  }, [encomenda, isOpen, condominio.id]);

  // Inicializa o canvas para desenho
  useEffect(() => {
    if (metodo === 'documento' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [metodo]);

  if (!isOpen || !encomenda) return null;

  const toggleSelectPacote = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return; // Mantém pelo menos um
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    setSelectedIds(pacotesDaUnidade.map((p) => p.id));
  };

  // Funções do Canvas de Assinatura
  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasSignature(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Formatação de CPF/RG
  const handleDocChange = (val: string) => {
    const limpo = val.replace(/\D/g, '');
    if (limpo.length <= 11) {
      let formatado = limpo;
      if (limpo.length > 3) formatado = `${limpo.slice(0, 3)}.${limpo.slice(3)}`;
      if (limpo.length > 6) formatado = `${formatado.slice(0, 7)}.${limpo.slice(6)}`;
      if (limpo.length > 9) formatado = `${formatado.slice(0, 11)}-${limpo.slice(9, 11)}`;
      setDocumentoRetirante(formatado);
    } else {
      setDocumentoRetirante(val);
    }
  };

  // 1. Submeter com PIN Obrigatório
  const handleSubmitPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    const cleanPin = pinInput.trim();
    if (!cleanPin) {
      setPinError('Digite o código PIN de 6 dígitos apresentado pelo morador.');
      return;
    }

    if (cleanPin.length !== 6) {
      setPinError('O código PIN deve conter exatamente 6 dígitos numéricos.');
      return;
    }

    // Valida o PIN (darBaixaEncomenda entrega todos os pacotes daquele PIN ou da unidade)
    const res = condoStore.darBaixaEncomenda(condominio.id, cleanPin, operadorNome);
    if (res.success) {
      confetti({ particleCount: 70, spread: 70 });
      onSuccess(res.message);
      onClose();
    } else {
      setPinError(res.message);
    }
  };

  // 2. Submeter com Documento + Rúbrica Digital (Contingência / Em Lote)
  const handleSubmitDocumento = (e: React.FormEvent) => {
    e.preventDefault();
    setDocError(null);

    if (!nomeRetirante.trim()) {
      setDocError('Informe o nome completo de quem está retirando a encomenda.');
      return;
    }

    if (!documentoRetirante.trim() || documentoRetirante.trim().length < 5) {
      setDocError('Informe o documento (CPF ou RG) válido do retirante.');
      return;
    }

    if (!hasSignature) {
      setDocError('Por favor, solicite a rúbrica/assinatura do retirante no quadro abaixo.');
      return;
    }

    if (!termoConferido) {
      setDocError('Marque a confirmação de conferência física dos documentos.');
      return;
    }

    let assinaturaUrl = '';
    if (canvasRef.current) {
      assinaturaUrl = canvasRef.current.toDataURL('image/png');
    }

    const idsParaBaixa = selectedIds.length > 0 ? selectedIds : [encomenda.id];

    const res = condoStore.darBaixaMultiplasPorIds(condominio.id, idsParaBaixa, operadorNome, {
      nomeRetirante: `${nomeRetirante.trim()} (${parentesco})`,
      documentoRetirante: documentoRetirante.trim(),
      assinaturaRetiranteUrl: assinaturaUrl,
      motivoSemPin: motivoSemPin.trim(),
    });

    if (res.success) {
      confetti({ particleCount: 70, spread: 70 });
      onSuccess(res.message);
      onClose();
    } else {
      setDocError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="p-5 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-wider bg-white text-amber-900 px-2.5 py-0.5 rounded-full">
                  Controle por Apartamento
                </span>
                <span className="text-xs text-amber-100 font-bold">
                  Bloco {encomenda.unidade.bloco} - Apto {encomenda.unidade.apto}
                </span>
              </div>
              <h3 className="text-lg font-black leading-tight mt-0.5">
                {pacotesDaUnidade.length > 1
                  ? `Entregar ${pacotesDaUnidade.length} Encomendas do Apartamento`
                  : 'Entrega de Pacote'}
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                Morador Principal: {encomenda.moradorNome}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Encomendas do Apartamento Aguardando */}
        <div className="p-4 bg-amber-50/70 border-b border-amber-200/80 space-y-2 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-700" />
              <span>Pacotes da Unidade ({pacotesDaUnidade.length}):</span>
            </span>
            {pacotesDaUnidade.length > 1 && (
              <button
                type="button"
                onClick={selectAll}
                className="text-amber-800 font-bold hover:underline text-[11px]"
              >
                Selecionar Todos ({pacotesDaUnidade.length})
              </button>
            )}
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {pacotesDaUnidade.map((p) => {
              const isChecked = selectedIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggleSelectPacote(p.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition text-xs ${
                    isChecked
                      ? 'bg-amber-100/90 border-amber-400 text-amber-950 font-bold'
                      : 'bg-white/80 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-amber-700 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-slate-900 font-extrabold">
                        {p.moradorNome}{' '}
                        <span className="text-[11px] font-normal text-slate-600">
                          ({p.transportadora})
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Rastreio: {p.codigoRastreio || 'Sem rastreio'}
                      </div>
                    </div>
                  </div>

                  {p.fotoUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFotoUrl(p.fotoUrl!);
                      }}
                      className="px-2 py-1 bg-white hover:bg-amber-50 border border-amber-300 rounded-lg text-[10px] font-bold text-amber-800 flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Foto</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal de Foto em Tamanho Real */}
        {previewFotoUrl && (
          <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm p-4 flex flex-col items-center justify-center animate-in fade-in">
            <div className="bg-white rounded-3xl p-4 max-w-md w-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-600" />
                  Foto da Etiqueta / Selo de Entrega
                </span>
                <button
                  onClick={() => setPreviewFotoUrl(null)}
                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-[70vh] flex items-center justify-center">
                <img
                  src={previewFotoUrl}
                  alt="Selo da Encomenda"
                  className="max-h-[65vh] w-auto object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* Seletor de Método de Entrega */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setMetodo('pin')}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                metodo === 'pin'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Código PIN (6 Dígitos)</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodo('documento')}
              className={`py-2.5 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition ${
                metodo === 'documento'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Sem PIN: Doc + Rúbrica</span>
            </button>
          </div>

          {/* MÉTODO 1: VALIDAÇÃO COM PIN OBRIGATÓRIO */}
          {metodo === 'pin' && (
            <form onSubmit={handleSubmitPin} className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  Digite o PIN de 6 dígitos do apartamento
                </p>
                <p className="text-[11px] text-amber-900 font-medium">
                  Este PIN é único para todas as encomendas do Bloco {encomenda.unidade.bloco} - Apto {encomenda.unidade.apto}. Ao validar, todos os pacotes são liberados.
                </p>
              </div>

              {pinError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{pinError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold text-slate-700">
                  Digite o PIN de 6 Dígitos:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-mono font-black tracking-widest bg-slate-50 border-2 border-amber-400 focus:border-amber-600 rounded-2xl py-3 text-slate-900 focus:outline-none shadow-inner"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setMetodo('documento')}
                  className="text-amber-800 font-bold underline hover:text-amber-950"
                >
                  Morador sem celular ou sem PIN?
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-md shadow-amber-600/20 transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Validar PIN & Entregar ({selectedIds.length})</span>
                </button>
              </div>
            </form>
          )}

          {/* MÉTODO 2: RETIRADA POR DOCUMENTO & RÚBRICA (CONTINGÊNCIA) */}
          {metodo === 'documento' && (
            <form onSubmit={handleSubmitDocumento} className="space-y-3.5">
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-1 text-xs">
                <p className="font-extrabold flex items-center gap-1.5 text-amber-400">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  Protocolo de Segurança por Documento & Assinatura
                </p>
                <p className="text-[11px] text-slate-300">
                  Liberando {selectedIds.length} pacote(s) para Bloco {encomenda.unidade.bloco} - Apto {encomenda.unidade.apto}.
                </p>
              </div>

              {docError && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{docError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nome Completo do Retirante:</label>
                  <input
                    type="text"
                    value={nomeRetirante}
                    onChange={(e) => setNomeRetirante(e.target.value)}
                    placeholder="Nome de quem está recebendo"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Documento (CPF ou RG):</label>
                  <input
                    type="text"
                    value={documentoRetirante}
                    onChange={(e) => handleDocChange(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vínculo / Morador da Unidade:</label>
                  <select
                    value={parentesco}
                    onChange={(e) => setParentesco(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Titular da Unidade">Titular da Unidade</option>
                    <option value="Cônjuge / Parceiro(a)">Cônjuge / Parceiro(a)</option>
                    <option value="Filho(a) / Dependente">Filho(a) / Dependente</option>
                    <option value="Parente / Convidado">Parente / Convidado</option>
                    <option value="Funcionário(a) da Unidade">Funcionário(a) da Unidade</option>
                    <option value="Terceiro com Autorização">Terceiro com Autorização</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Motivo sem PIN:</label>
                  <select
                    value={motivoSemPin}
                    onChange={(e) => setMotivoSemPin(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Sem celular / Sem bateria no momento">Sem celular / Sem bateria</option>
                    <option value="Morador idoso / Dificuldade no app">Morador idoso / Dificuldade no app</option>
                    <option value="Autorizado pelo morador presencialmente">Autorizado presencialmente</option>
                    <option value="Aplicativo temporariamente indisponível">App temporariamente indisponível</option>
                    <option value="Outro motivo justificado">Outro motivo justificado</option>
                  </select>
                </div>
              </div>

              {/* Quadro de Assinatura / Rúbrica Digital (Canvas) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-amber-600" />
                    Rúbrica / Assinatura do Retirante:
                  </span>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Limpar</span>
                  </button>
                </div>

                <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-white overflow-hidden touch-none shadow-xs">
                  <canvas
                    ref={canvasRef}
                    width={440}
                    height={110}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[110px] cursor-crosshair block"
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-semibold">
                      ✍️ Desenhe ou assine a rúbrica com o dedo ou mouse aqui
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="termoConferido"
                  checked={termoConferido}
                  onChange={(e) => setTermoConferido(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 mt-0.5"
                  required
                />
                <label htmlFor="termoConferido" className="text-[11px] text-slate-600 font-medium leading-tight">
                  Confirmo que conferi o documento físico do retirante ({documentoRetirante || 'CPF/RG'}) e que o mesmo assinou a declaração de retirada de {selectedIds.length} pacote(s).
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-2 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Confirmar Entrega de {selectedIds.length} Pacote(s)</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

