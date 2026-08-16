import React, { useState } from 'react';
import { X, QrCode, Camera, CheckCircle2, Bike, Sparkles } from 'lucide-react';
import { Bicicleta, Morador } from '../../types';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBikes: Bicicleta[];
  onScanSuccess: (bike: Bicicleta, lockPassword: string) => void;
  onScanError: (errorMessage: string) => void;
  currentMorador: Morador | undefined;
  onDirectCheckout: (bikeCodeOrToken: string) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  availableBikes,
  currentMorador,
  onDirectCheckout,
}) => {
  const [manualCode, setManualCode] = useState('');

  if (!isOpen) return null;

  const handleQuickSelect = (bike: Bicicleta) => {
    onDirectCheckout(bike.codigo);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onDirectCheckout(manualCode.trim().toUpperCase());
  };

  const availableBikesList = (availableBikes || []).filter((b) => b.status === 'disponivel');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Desbloqueio de Bicicleta</h3>
              <p className="text-xs text-slate-500">Aponte para o QR Code ou escolha a bike</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Câmera / Scanner Frame */}
        <div className="p-6 space-y-4">
          <div className="relative aspect-video rounded-xl bg-slate-900 border-2 border-emerald-500/40 flex flex-col items-center justify-center overflow-hidden">
            {/* Linha animada de leitura */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-lg shadow-emerald-400/50"></div>

            {/* Marcadores de canto */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>

            <div className="flex flex-col items-center gap-2 text-center p-4 z-10 text-white">
              <Camera className="w-7 h-7 text-emerald-400 animate-bounce" />
              <p className="text-xs font-bold">
                Aponte para o QR Code da bicicleta
              </p>
              <p className="text-[11px] text-slate-300">
                Ou clique em uma das bikes disponíveis abaixo
              </p>
            </div>
          </div>

          {/* Seleção Rápida de Bikes no Totem */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Bicicletas Prontas para Retirada no Totem:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableBikesList.length === 0 ? (
                <div className="col-span-2 text-center py-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl font-medium">
                  Nenhuma bicicleta livre no momento.
                </div>
              ) : (
                availableBikesList.slice(0, 4).map((bike) => (
                  <button
                    key={bike.id}
                    onClick={() => handleQuickSelect(bike)}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 transition text-left group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Bike className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800">
                          #{bike.codigo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[100px] mt-0.5">
                        {bike.modelo}
                      </p>
                    </div>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Pegar
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Digitação Manual do Código */}
          <form onSubmit={handleManualSubmit} className="pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Ou digite o código da bike (ex: BK-01):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: BK-01"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-semibold"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow active:scale-98"
              >
                Liberar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
