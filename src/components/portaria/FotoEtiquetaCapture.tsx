import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check, RefreshCw, Eye, Sparkles, Image as ImageIcon } from 'lucide-react';

interface FotoEtiquetaCaptureProps {
  fotoUrl?: string;
  onFotoCapturada: (url: string | undefined) => void;
}

export const FotoEtiquetaCapture: React.FC<FotoEtiquetaCaptureProps> = ({
  fotoUrl,
  onFotoCapturada,
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Iniciar Câmera ao vivo
  const handleOpenLiveCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Câmera traseira em smartphones
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Erro ao acessar câmera:', err);
      setCameraError('Não foi possível abrir a câmera. Permita o acesso ou escolha o upload de imagem.');
    }
  };

  // Tirar foto do feed da câmera
  const handleCaptureSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onFotoCapturada(dataUrl);
      handleStopCamera();
    }
  };

  // Parar stream da câmera
  const handleStopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraError(null);
  };

  // Upload por arquivo ou câmera nativa do celular
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        // Redimensiona imagem se necessário via canvas para não sobrecarregar
        const img = new Image();
        img.onload = () => {
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            onFotoCapturada(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            onFotoCapturada(ev.target?.result as string);
          }
        };
        img.src = ev.target.result as string;
      }
    };
    reader.readAsDataURL(file);
    // Limpa o input
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5 text-amber-600" />
          <span>Foto do Selo / Etiqueta do Pacote (Com Endereço & Morador)</span>
        </label>
        <span className="text-[10px] text-amber-900 bg-amber-100 font-bold px-2 py-0.5 rounded-full">
          Visível ao Morador
        </span>
      </div>

      {/* Se já houver foto capturada */}
      {fotoUrl ? (
        <div className="p-3 bg-amber-50/70 border border-amber-300 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              onClick={() => setIsPreviewOpen(true)}
              className="relative w-16 h-14 rounded-xl overflow-hidden border border-amber-300 cursor-pointer bg-slate-900 shrink-0 group"
            >
              <img
                src={fotoUrl}
                alt="Selo da Encomenda"
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Foto do Selo Anexada!</span>
              </div>
              <p className="text-[11px] text-slate-600">
                O morador poderá conferir os dados da etiqueta no app.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="p-2 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Visualizar em tamanho grande"
            >
              <Eye className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Ver</span>
            </button>
            <button
              type="button"
              onClick={() => onFotoCapturada(undefined)}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Remover foto"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trocar</span>
            </button>
          </div>
        </div>
      ) : (
        /* Se ainda não tiver foto */
        <div className="border-2 border-dashed border-amber-300/80 bg-amber-50/40 rounded-2xl p-4 text-center space-y-3">
          <p className="text-xs text-slate-700 font-medium">
            Tire uma foto nítida da <strong>etiqueta com nome, bloco, apto e rastreio</strong> para o morador conferir se a encomenda está correta:
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {/* Botão Câmera ao Vivo */}
            <button
              type="button"
              onClick={handleOpenLiveCamera}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Abrir Câmera</span>
            </button>

            {/* Botão Upload de Arquivo / Foto do Celular */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span>Carregar Foto / Galeria</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Modal da Câmera Ao Vivo com WebRTC */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm p-4 flex flex-col items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4 p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Enquadrar Etiqueta do Pacote</h4>
                  <p className="text-[11px] text-slate-500">Mantenha o texto e endereço legíveis</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStopCamera}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {cameraError}
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border-2 border-amber-400">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Grid / Mira de enquadramento da etiqueta */}
                <div className="absolute inset-4 border-2 border-dashed border-amber-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-black/60 px-2 py-0.5 rounded self-start">
                    Posicione os dados do Morador aqui
                  </span>
                  <span className="text-[10px] font-bold text-amber-200 bg-black/60 px-2 py-0.5 rounded self-center">
                    Destinatário • Bloco • Apto
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleStopCamera}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleCaptureSnapshot}
                className="flex-1 py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 active:scale-95 transition"
              >
                <Camera className="w-4 h-4" />
                <span>Capturar Foto do Selo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pré-visualização da Foto em Alta Resolução */}
      {isPreviewOpen && fotoUrl && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm p-4 flex flex-col items-center justify-center animate-in fade-in">
          <div className="bg-white rounded-3xl p-4 max-w-md w-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                Foto da Etiqueta Anexada
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-[70vh] flex items-center justify-center">
              <img
                src={fotoUrl}
                alt="Foto da Etiqueta"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  onFotoCapturada(undefined);
                  setIsPreviewOpen(false);
                }}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Excluir e Tirar Outra
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
