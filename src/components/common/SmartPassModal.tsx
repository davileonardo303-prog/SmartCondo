import React, { useState } from 'react';
import {
  X,
  QrCode,
  Share2,
  Copy,
  Check,
  Calendar,
  Clock,
  User,
  Building,
  ShieldCheck,
  Car,
  FileText,
  Phone,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Condominio, Morador, VisitanteLiberado } from '../../types';
import { condoStore } from '../../services/mockStorage';
import confetti from 'canvas-confetti';

interface SmartPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  condominio: Condominio;
  morador: Morador;
  onSuccess?: (visitante: VisitanteLiberado) => void;
}

export const SmartPassModal: React.FC<SmartPassModalProps> = ({
  isOpen,
  onClose,
  condominio,
  morador,
  onSuccess,
}) => {
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState<'visitante' | 'prestador' | 'entrega'>('visitante');
  const [empresa, setEmpresa] = useState('');
  const [dataVisita, setDataVisita] = useState(new Date().toISOString().split('T')[0]);
  const [periodo, setPeriodo] = useState('Dia Inteiro');
  const [observacoes, setObservacoes] = useState('');

  // Resultado do Passe Gerado
  const [passeGerado, setPasseGerado] = useState<VisitanteLiberado | null>(null);
  const [copiado, setCopiado] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const novo = condoStore.addVisitante(condominio.id, {
      moradorId: morador.id,
      nomeVisitante: nome.trim(),
      documento: documento.trim() || undefined,
      placaVeiculo: placa.trim().toUpperCase() || undefined,
      tipo,
      empresa: empresa.trim() || undefined,
      dataVisita,
      periodoPermitido: periodo,
      observacoes: observacoes.trim() || undefined,
    });

    setPasseGerado(novo);
    confetti({ particleCount: 60, spread: 70 });
    if (onSuccess) onSuccess(novo);
  };

  const linkConvite = passeGerado
    ? `https://smart-condo-eight.vercel.app/convite/${passeGerado.codigoAcesso}`
    : '';

  const mensagemWhatsApp = passeGerado
    ? `Olá ${passeGerado.nomeVisitante}! Seu acesso ao condomínio *${condominio.nome}* foi liberado por *${morador.nome}* (Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}).\n\n📅 *Data:* ${passeGerado.dataVisita}\n⏰ *Horário:* ${passeGerado.periodoPermitido || 'Livre'}\n🔑 *Código de Entrada:* ${passeGerado.codigoAcesso}\n\nAcesse seu passe digital com QR Code no link:\n${linkConvite}`
    : '';

  const handleCopiarLink = () => {
    if (!passeGerado) return;
    navigator.clipboard.writeText(mensagemWhatsApp);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleReset = () => {
    setNome('');
    setDocumento('');
    setPlaca('');
    setTipo('visitante');
    setEmpresa('');
    setObservacoes('');
    setPasseGerado(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden text-slate-800 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {passeGerado ? 'Passe Digital Liberado' : 'SmartPass • Liberação de Acesso'}
              </h3>
              <p className="text-xs text-slate-500">
                {passeGerado
                  ? 'Envie o convite para o visitante apresentar na portaria'
                  : 'Gere um passe com QR Code para visitantes ou prestadores'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {!passeGerado ? (
            /* Formulário de Criação */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Acesso */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tipo de Autorização
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('visitante')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      tipo === 'visitante'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Visitante</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('prestador')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      tipo === 'prestador'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Prestador</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('entrega')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      tipo === 'entrega'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Entregador</span>
                  </button>
                </div>
              </div>

              {/* Nome do Visitante */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo do Visitante / Prestador *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Silveira"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              {/* Empresa (se for prestador ou entrega) */}
              {(tipo === 'prestador' || tipo === 'entrega') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Empresa / Serviço
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Enel / Claro / Uber Eats / Ar Condicionado"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              )}

              {/* Documento e Placa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    RG ou CPF (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 12.345.678-9"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Placa do Veículo (Se houver)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: ABC-1234"
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 uppercase focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* Data e Período */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data da Visita *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataVisita}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDataVisita(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário / Período
                  </label>
                  <select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Dia Inteiro">Dia Inteiro (07h às 23h)</option>
                    <option value="Manhã (08h às 12h)">Manhã (08h às 12h)</option>
                    <option value="Tarde (12h às 18h)">Tarde (12h às 18h)</option>
                    <option value="Noite (18h às 23h)">Noite (18h às 23h)</option>
                    <option value="24 Horas">24 Horas</option>
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações para a Portaria (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pode subir direto / Autorizada vaga de visitante 02"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Passe Digital & Link de Acesso</span>
                </button>
              </div>
            </form>
          ) : (
            /* Cartão do Passe Gerado com QR Code e Compartilhamento */
            <div className="space-y-5 animate-in zoom-in-95">
              {/* Card Estilo Ticket / Cartão de Embarque */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden border border-slate-700">
                {/* Detalhe de fundo */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-start justify-between border-b border-slate-700/80 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      SmartPass Digital • {passeGerado.tipo.toUpperCase()}
                    </span>
                    <h4 className="text-xl font-black text-white mt-1.5">
                      {passeGerado.nomeVisitante}
                    </h4>
                    {passeGerado.empresa && (
                      <p className="text-xs text-slate-300 font-semibold">{passeGerado.empresa}</p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Destino
                    </span>
                    <span className="text-xs font-black text-white">
                      Bloco {morador.unidade.bloco} - Apto {morador.unidade.apto}
                    </span>
                  </div>
                </div>

                {/* QR Code e Código de Acesso */}
                <div className="flex flex-col sm:flex-row items-center gap-5 my-2">
                  <div className="bg-white p-3 rounded-2xl shadow-md shrink-0 flex items-center justify-center">
                    {/* Renderização visual do QR Code */}
                    <div className="w-28 h-28 bg-white flex flex-col items-center justify-center p-1 relative border border-slate-100 rounded-xl">
                      <QrCode className="w-24 h-24 text-slate-900" />
                      <span className="absolute bottom-0.5 text-[8px] font-mono font-bold text-slate-500">
                        {passeGerado.codigoAcesso}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <span className="text-[11px] text-slate-400 font-semibold">
                      Código de Liberação na Portaria:
                    </span>
                    <div className="font-mono text-3xl font-black tracking-widest text-emerald-400 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700 text-center sm:text-left inline-block">
                      {passeGerado.codigoAcesso}
                    </div>

                    <div className="text-xs text-slate-300 space-y-0.5 pt-1">
                      <p>
                        📅 <strong>Data:</strong> {passeGerado.dataVisita}
                      </p>
                      <p>
                        ⏰ <strong>Horário:</strong> {passeGerado.periodoPermitido}
                      </p>
                      {passeGerado.placaVeiculo && (
                        <p>
                          🚗 <strong>Veículo:</strong> {passeGerado.placaVeiculo}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/80 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Autorizado por: {morador.nome}</span>
                  <span className="text-emerald-400 font-bold">✓ Válido na Portaria</span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2.5">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemWhatsApp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar Convite Digital no WhatsApp</span>
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleCopiarLink}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copiado ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Mensagem Copiada!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>Copiar Mensagem</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleReset}
                    className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-slate-600" />
                    <span>Novo Passe</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
