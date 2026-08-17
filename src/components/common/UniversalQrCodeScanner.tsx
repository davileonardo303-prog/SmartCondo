import React, { useState } from 'react';
import {
  X,
  Camera,
  QrCode,
  Sparkles,
  Package,
  Bike,
  Wrench,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Condominio } from '../../types';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';

interface UniversalQrCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  condominio?: Condominio;
  condominioId?: string;
  operadorNome?: string;
  onValidated?: (result: {
    tipo: 'encomenda' | 'bike' | 'item' | 'visitante';
    dados: any;
    mensagem: string;
  }) => void;
  onSuccess?: () => void;
}

export const UniversalQrCodeScanner: React.FC<UniversalQrCodeScannerProps> = ({
  isOpen,
  onClose,
  condominio,
  condominioId,
  operadorNome = 'Porteiro de Plantão',
  onValidated,
  onSuccess,
}) => {
  const [codigoManual, setCodigoManual] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const activeCondoId = condominio?.id || condominioId || 'condo_1';

  if (!isOpen) return null;

  const handleValidarCodigo = (codigoParaValidar: string) => {
    const raw = codigoParaValidar.trim().toUpperCase();
    if (!raw) return;

    // 1. Tentar Encomendas (6 dígitos ou código de resgate)
    const encomendas = condoStore.getEncomendas(activeCondoId);
    const encEncontrada = encomendas.find(
      (e) =>
        e.codigoResgate.toUpperCase() === raw ||
        e.codigoRastreio.toUpperCase() === raw ||
        e.id.toUpperCase() === raw
    );

    if (encEncontrada) {
      if (encEncontrada.status === 'entregue') {
        setErro(`Esta encomenda já foi entregue anteriormente para ${encEncontrada.entreguePara || 'o morador'}.`);
        return;
      }
      const res = condoStore.darBaixaEncomenda(activeCondoId, encEncontrada.id, operadorNome || 'Portaria Principal');
      confetti({ particleCount: 50, spread: 60 });
      if (onValidated) {
        onValidated({
          tipo: 'encomenda',
          dados: encEncontrada,
          mensagem: `Encomenda entregue com sucesso para ${encEncontrada.moradorNome} (Bloco ${encEncontrada.unidade.bloco} - Apto ${encEncontrada.unidade.apto})!`,
        });
      }
      if (onSuccess) onSuccess();
      onClose();
      return;
    }

    // 2. Tentar Visitantes / SmartPass (código VIS-XXXX ou 6 dígitos)
    const visitantes = condoStore.getVisitantes(activeCondoId);
    const visEncontrado = visitantes.find(
      (v) =>
        v.codigoAcesso.toUpperCase() === raw ||
        v.id.toUpperCase() === raw ||
        raw.includes(v.codigoAcesso.toUpperCase())
    );

    if (visEncontrado) {
      if (visEncontrado.status === 'pendente') {
        const res = condoStore.registrarEntradaPortaria(activeCondoId, visEncontrado.id, operadorNome || 'Portaria Principal');
        confetti({ particleCount: 50, spread: 60 });
        if (onValidated) {
          onValidated({
            tipo: 'visitante',
            dados: visEncontrado,
            mensagem: `Acesso liberado para ${visEncontrado.nomeVisitante} • Destino: Bloco ${visEncontrado.unidade.bloco} - Apto ${visEncontrado.unidade.apto}`,
          });
        }
        if (onSuccess) onSuccess();
        onClose();
        return;
      } else if (visEncontrado.status === 'dentro') {
        const res = condoStore.registrarSaidaPortaria(activeCondoId, visEncontrado.id);
        confetti({ particleCount: 40, spread: 50 });
        if (onValidated) {
          onValidated({
            tipo: 'visitante',
            dados: visEncontrado,
            mensagem: `Saída de ${visEncontrado.nomeVisitante} registrada com sucesso.`,
          });
        }
        if (onSuccess) onSuccess();
        onClose();
        return;
      } else {
        setErro('Este passe de visitante já foi finalizado ou expirou.');
        return;
      }
    }

    // 3. Tentar Itens Compartilhados SmartShare (código de resgate ou código FER-01)
    const itens = condoStore.getItensCompartilhados(activeCondoId);
    const itemPorReserva = itens.find(
      (i) =>
        i.reservaAtual?.codigoResgate.toUpperCase() === raw ||
        i.codigoIdentificador?.toUpperCase() === raw
    );

    if (itemPorReserva) {
      if (itemPorReserva.status === 'reservado' && itemPorReserva.reservaAtual) {
        const res = condoStore.liberarRetiradaItemPortaria(
          activeCondoId,
          itemPorReserva.id,
          operadorNome || 'Portaria Principal'
        );
        if (res.success) {
          confetti({ particleCount: 50, spread: 60 });
          if (onValidated) {
            onValidated({
              tipo: 'item',
              dados: itemPorReserva,
              mensagem: res.message,
            });
          }
          if (onSuccess) onSuccess();
          onClose();
          return;
        }
      } else if (itemPorReserva.status === 'em_uso') {
        const res = condoStore.receberDevolucaoItem(
          activeCondoId,
          itemPorReserva.id,
          {
            operadorNome: operadorNome || 'Portaria Principal',
            observacoes: 'Devolução validada via scanner',
          }
        );
        if (res.success) {
          confetti({ particleCount: 40, spread: 50 });
          if (onValidated) {
            onValidated({
              tipo: 'item',
              dados: itemPorReserva,
              mensagem: res.message,
            });
          }
          if (onSuccess) onSuccess();
          onClose();
          return;
        }
      }
    }

    // 4. Tentar Bicicletas (101, 102, QR_NOVOLAR_101 ou código BK-5MIN)
    const bikes = condoStore.getBikes(activeCondoId);
    const bikeEncontrada = bikes.find(
      (b) =>
        b.codigo.toUpperCase() === raw ||
        b.qrToken.toUpperCase() === raw ||
        b.reservaCodigo?.toUpperCase() === raw
    );

    if (bikeEncontrada) {
      if (bikeEncontrada.status === 'reservada_5min') {
        const res = condoStore.confirmarRetiradaPortaria(
          activeCondoId,
          bikeEncontrada.id,
          operadorNome || 'Portaria Principal'
        );
        if (res.success) {
          confetti({ particleCount: 50, spread: 60 });
          if (onValidated) {
            onValidated({
              tipo: 'bike',
              dados: bikeEncontrada,
              mensagem: res.message,
            });
          }
          if (onSuccess) onSuccess();
          onClose();
          return;
        }
      } else if (bikeEncontrada.status === 'em_uso') {
        if (onValidated) {
          onValidated({
            tipo: 'bike',
            dados: bikeEncontrada,
            mensagem: `Bicicleta #${bikeEncontrada.codigo} localizada. Abra o formulário de devolução com vistoria.`,
          });
        }
        if (onSuccess) onSuccess();
        onClose();
        return;
      }
    }

    setErro(`Código "${raw}" não encontrado no sistema. Verifique os dígitos.`);
  };

  const handleQuickClick = (exemplo: string) => {
    setCodigoManual(exemplo);
    handleValidarCodigo(exemplo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-900 text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Leitor Universal de QR & PIN</h3>
              <p className="text-xs text-slate-500">
                Valida Encomendas, SmartPass, SmartShare e Bikes
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

        <div className="p-6 space-y-4">
          {/* Câmera / Scanner Frame Animado */}
          <div className="relative aspect-video rounded-2xl bg-slate-950 border-2 border-emerald-500/50 flex flex-col items-center justify-center overflow-hidden shadow-inner">
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse top-1/2 -translate-y-1/2 shadow-lg shadow-emerald-400/80" />

            {/* Marcadores nos 4 cantos */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />

            <div className="flex flex-col items-center gap-2 text-center p-4 z-10 text-white">
              <Camera className="w-8 h-8 text-emerald-400 animate-bounce" />
              <p className="text-xs font-bold">Aponte a câmera para o QR Code</p>
              <p className="text-[10px] text-slate-400 max-w-xs">
                Reconhecimento instantâneo de visitantes, pacotes e equipamentos
              </p>
            </div>
          </div>

          {/* Erro se houver */}
          {erro && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{erro}</span>
              </div>
              <button onClick={() => setErro(null)} className="text-rose-600 underline text-xs">
                Fechar
              </button>
            </div>
          )}

          {/* Digitação Manual */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleValidarCodigo(codigoManual);
            }}
            className="space-y-2"
          >
            <label className="block text-xs font-bold text-slate-700">
              Ou digite o Código / PIN de 6 dígitos:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ex: 492815 / VIS-4921 / 101"
                  value={codigoManual}
                  onChange={(e) => {
                    setCodigoManual(e.target.value);
                    setErro(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold uppercase text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                Validar
              </button>
            </div>
          </form>

          {/* Atalhos Rápidos para Demonstração */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 block mb-2">
              Códigos ativos prontos para validação rápida:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickClick('492815')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition flex items-center gap-2"
              >
                <Package className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="truncate">
                  <div className="text-[11px] font-mono font-bold text-slate-800">492815</div>
                  <div className="text-[9px] text-slate-500 truncate">Encomenda Mercado Livre</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickClick('VIS-4921')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left transition flex items-center gap-2"
              >
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <div className="text-[11px] font-mono font-bold text-slate-800">VIS-4921</div>
                  <div className="text-[9px] text-slate-500 truncate">Visitante Roberto Silveira</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
