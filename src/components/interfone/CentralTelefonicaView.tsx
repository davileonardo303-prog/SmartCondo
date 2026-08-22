import React, { useState } from 'react';
import { Condominio, Morador, UserRole, Unidade } from '../../types';
import { condoStore } from '../../services/mockStorage';
import { callAudioService } from '../../utils/callAudio';
import { IntercomPTTView } from './IntercomPTTView';
import {
  Phone,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneMissed,
  PhoneOff,
  Video,
  Search,
  Building2,
  Shield,
  User,
  Clock,
  Radio,
  Sparkles,
  Delete,
  Headphones,
  Zap,
  Users,
  AlertTriangle,
  Flame,
  ShieldAlert,
} from 'lucide-react';

interface CentralTelefonicaViewProps {
  condominio: Condominio;
  currentUser: {
    id: string;
    nome: string;
    email: string;
    role: UserRole;
    condominioId: string;
    unidade?: Unidade;
    [key: string]: any;
  };
  currentMorador?: Morador | null;
}

export const CentralTelefonicaView: React.FC<CentralTelefonicaViewProps> = ({
  condominio,
  currentUser,
  currentMorador,
}) => {
  const [dialNumber, setDialNumber] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [blocoFilter, setBlocoFilter] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'teclado' | 'ptt' | 'diretorio' | 'historico'>('teclado');

  const moradores = condoStore.getMoradores(condominio.id).filter((m) => m.statusCadastro === 'ativo');
  const historicoChamadas = condoStore.getHistoricoChamadas(condominio.id, currentUser.id);

  // Determina o ramal do usuário atual
  const meuRamal =
    currentUser.role === 'portaria'
      ? 'Ramal 0 (Portaria Central)'
      : currentUser.role === 'sindico'
      ? 'Ramal 9 (Administração)'
      : currentUser.role === 'super_admin'
      ? 'Ramal 00 (Master)'
      : currentMorador
      ? `Ramal ${currentMorador.unidade.apto} • Bloco ${currentMorador.unidade.bloco}`
      : 'Morador';

  // Trata digitação no teclado DTMF
  const handleKeyClick = (key: string) => {
    callAudioService.playDtmfTone(key);
    setDialNumber((prev) => (prev.length < 12 ? prev + key : prev));
  };

  const handleBackspace = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDialNumber('');
  };

  // Identifica o morador destino discado
  const targetMorador = moradores.find((m) => {
    const apto = String(m.unidade.apto).trim();
    const bloco = String(m.unidade.bloco || '').trim();
    return (
      dialNumber === apto ||
      dialNumber === `${bloco}${apto}` ||
      dialNumber === `${bloco}-${apto}` ||
      m.telefone?.includes(dialNumber)
    );
  });

  // Discar chamada
  const handleMakeCall = (tipo: 'audio' | 'video' = 'audio') => {
    callAudioService.unlockAudio();

    if (!dialNumber) return;

    // Discagem para Portaria (0)
    if (dialNumber === '0' || dialNumber.toLowerCase() === 'portaria') {
      condoStore.iniciarChamada({
        condominioId: condominio.id,
        callerId: currentUser.id,
        callerName: currentUser.nome,
        callerRole: currentUser.role,
        callerUnidade: currentUser.unidade || currentMorador?.unidade,
        receiverId: 'portaria',
        receiverName: 'Portaria Central 24h',
        receiverRole: 'portaria',
        tipo,
      });
      return;
    }

    // Discagem para Síndico/Administração (9)
    if (dialNumber === '9' || dialNumber.toLowerCase() === 'sindico' || dialNumber.toLowerCase() === 'admin') {
      condoStore.iniciarChamada({
        condominioId: condominio.id,
        callerId: currentUser.id,
        callerName: currentUser.nome,
        callerRole: currentUser.role,
        callerUnidade: currentUser.unidade || currentMorador?.unidade,
        receiverId: 'sindico',
        receiverName: condominio.sindicoNome ? `Síndico (${condominio.sindicoNome})` : 'Síndico / Administração',
        receiverRole: 'sindico',
        tipo,
      });
      return;
    }

    // Discagem para Zeladoria / Portão (8)
    if (dialNumber === '8' || dialNumber.toLowerCase() === 'zeladoria') {
      condoStore.iniciarChamada({
        condominioId: condominio.id,
        callerId: currentUser.id,
        callerName: currentUser.nome,
        callerRole: currentUser.role,
        callerUnidade: currentUser.unidade || currentMorador?.unidade,
        receiverId: 'zeladoria',
        receiverName: 'Zeladoria & Manutenção',
        receiverRole: 'portaria',
        tipo,
      });
      return;
    }

    // Discagem para Morador específico
    if (targetMorador) {
      condoStore.iniciarChamada({
        condominioId: condominio.id,
        callerId: currentUser.id,
        callerName: currentUser.nome,
        callerRole: currentUser.role,
        callerUnidade: currentUser.unidade || currentMorador?.unidade,
        receiverId: targetMorador.id,
        receiverName: targetMorador.nome,
        receiverRole: 'morador',
        receiverUnidade: targetMorador.unidade,
        tipo,
      });
      return;
    }

    // Discagem genérica pelo número digitado
    condoStore.iniciarChamada({
      condominioId: condominio.id,
      callerId: currentUser.id,
      callerName: currentUser.nome,
      callerRole: currentUser.role,
      callerUnidade: currentUser.unidade || currentMorador?.unidade,
      receiverId: `ext_${dialNumber}`,
      receiverName: `Ramal ${dialNumber}`,
      receiverRole: 'morador',
      receiverUnidade: { bloco: '1', apto: dialNumber },
      tipo,
    });
  };

  // Discar diretamente para um morador
  const handleCallMorador = (m: Morador, tipo: 'audio' | 'video' = 'audio') => {
    callAudioService.unlockAudio();
    condoStore.iniciarChamada({
      condominioId: condominio.id,
      callerId: currentUser.id,
      callerName: currentUser.nome,
      callerRole: currentUser.role,
      callerUnidade: currentUser.unidade || currentMorador?.unidade,
      receiverId: m.id,
      receiverName: m.nome,
      receiverRole: 'morador',
      receiverUnidade: m.unidade,
      tipo,
    });
  };

  // Discar para Portaria
  const handleCallPortaria = (tipo: 'audio' | 'video' = 'audio') => {
    callAudioService.unlockAudio();
    condoStore.iniciarChamada({
      condominioId: condominio.id,
      callerId: currentUser.id,
      callerName: currentUser.nome,
      callerRole: currentUser.role,
      callerUnidade: currentUser.unidade || currentMorador?.unidade,
      receiverId: 'portaria',
      receiverName: 'Portaria Central 24h',
      receiverRole: 'portaria',
      tipo,
    });
  };

  // Discar para Síndico
  const handleCallSindico = (tipo: 'audio' | 'video' = 'audio') => {
    callAudioService.unlockAudio();
    condoStore.iniciarChamada({
      condominioId: condominio.id,
      callerId: currentUser.id,
      callerName: currentUser.nome,
      callerRole: currentUser.role,
      callerUnidade: currentUser.unidade || currentMorador?.unidade,
      receiverId: 'sindico',
      receiverName: condominio.sindicoNome ? `Síndico (${condominio.sindicoNome})` : 'Síndico / Administração',
      receiverRole: 'sindico',
      tipo,
    });
  };

  // Blocos únicos
  const blocosDisponiveis = Array.from(
    new Set(moradores.map((m) => m.unidade.bloco).filter(Boolean))
  );

  const filteredMoradores = moradores.filter((m) => {
    const q = searchFilter.toLowerCase();
    const matchSearch =
      m.nome.toLowerCase().includes(q) ||
      m.unidade.apto.toLowerCase().includes(q) ||
      (m.unidade.bloco && m.unidade.bloco.toLowerCase().includes(q));

    const matchBloco = blocoFilter === 'todos' || m.unidade.bloco === blocoFilter;
    return matchSearch && matchBloco;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* CABEÇALHO COMPACTO DA CENTRAL TELEFÔNICA */}
      <div className="bg-slate-900 text-white px-4 py-3.5 sm:px-6 sm:py-4 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black shrink-0">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white leading-tight">
                Central Telefônica & Interfonia
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                WebRTC Ativo
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Ligações full-duplex e áudio em tempo real com a portaria, administração e moradores.
            </p>
          </div>
        </div>

        {/* BADGE COMPACTO DO SEU RAMAL */}
        <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start shrink-0">
          <span className="text-slate-400 font-semibold text-[11px]">Seu Ramal:</span>
          <strong className="text-emerald-400 font-extrabold">{meuRamal}</strong>
        </div>
      </div>

      {/* SEGMENTED CONTROL / ABAS COMPACTAS */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('teclado')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-extrabold text-xs transition cursor-pointer ${
            activeTab === 'teclado'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Phone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Discador & Atalhos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ptt')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-extrabold text-xs transition cursor-pointer ${
            activeTab === 'ptt'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>Rádio PTT / Nextel</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diretorio')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-extrabold text-xs transition cursor-pointer ${
            activeTab === 'diretorio'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span>Diretório de Ramais ({moradores.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historico')}
          className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-extrabold text-xs transition cursor-pointer ${
            activeTab === 'historico'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>Histórico {historicoChamadas.length > 0 && `(${historicoChamadas.length})`}</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* ABA 1: DISCADOR ERGONÔMICO & ATALHOS RÁPIDOS                         */}
      {/* ==================================================================== */}
      {activeTab === 'teclado' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* COLUNA ESQUERDA: DISCADOR DTMF COMPACTO */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
            {/* DISPLAY DIGITAL DO DISCADOR */}
            <div className="w-full bg-slate-900 text-white rounded-xl px-4 py-3 mb-4 shadow-inner border border-slate-800 flex flex-col justify-center min-h-[76px] relative">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate pr-14">
                {targetMorador ? (
                  <span className="text-emerald-400">
                    {targetMorador.nome} (Bl. {targetMorador.unidade.bloco} - Apto {targetMorador.unidade.apto})
                  </span>
                ) : dialNumber === '0' ? (
                  <span className="text-amber-400">Portaria Central 24h</span>
                ) : dialNumber === '9' ? (
                  <span className="text-indigo-400">Síndico / Administração</span>
                ) : dialNumber === '8' ? (
                  <span className="text-blue-400">Zeladoria / Manutenção</span>
                ) : (
                  'Digite o ramal ou apto'
                )}
              </div>

              <div className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-emerald-400 mt-0.5">
                {dialNumber || <span className="text-slate-600 font-sans text-xl">---</span>}
              </div>

              {dialNumber && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Apagar último dígito"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* TECLADO DTMF COMPACTO (3x4) */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-xs mb-4">
              {[
                { k: '1', sub: '' },
                { k: '2', sub: 'ABC' },
                { k: '3', sub: 'DEF' },
                { k: '4', sub: 'GHI' },
                { k: '5', sub: 'JKL' },
                { k: '6', sub: 'MNO' },
                { k: '7', sub: 'PQRS' },
                { k: '8', sub: 'TUV' },
                { k: '9', sub: 'WXYZ' },
                { k: '*', sub: '' },
                { k: '0', sub: 'Portaria' },
                { k: '#', sub: '' },
              ].map(({ k, sub }) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKeyClick(k)}
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-200 active:bg-slate-300 text-slate-900 border border-slate-200 flex flex-col items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  <span className="text-lg font-black leading-none">{k}</span>
                  {sub && <span className="text-[8px] font-bold text-slate-400 uppercase">{sub}</span>}
                </button>
              ))}
            </div>

            {/* BOTÕES DE DISCAGEM */}
            <div className="flex items-center gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={() => handleMakeCall('audio')}
                disabled={!dialNumber}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Ligar Áudio</span>
              </button>

              <button
                type="button"
                onClick={() => handleMakeCall('video')}
                disabled={!dialNumber}
                className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer"
                title="Chamada com Vídeo"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Vídeo</span>
              </button>

              {dialNumber && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition cursor-pointer"
                  title="Limpar número"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: RAMAIS RÁPIDOS & EMERGÊNCIA */}
          <div className="lg:col-span-7 space-y-4">
            {/* SPEED DIAL CARDS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Ramais de Acesso Rápido (1 Toque)</span>
                </h2>
                <span className="text-[11px] text-slate-400 font-semibold">Linha Direta</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. PORTARIA */}
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase text-amber-900 tracking-wider">Ramal 0</div>
                      <div className="text-xs font-extrabold text-slate-900 truncate">Portaria Central 24h</div>
                      <span className="text-[10px] text-emerald-600 font-bold">● Atendimento Imediato</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCallPortaria('audio')}
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition active:scale-95 cursor-pointer"
                      title="Ligar Áudio para Portaria"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallPortaria('video')}
                      className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition active:scale-95 cursor-pointer"
                      title="Ligar Vídeo para Portaria"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 2. SÍNDICO / ADMIN */}
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">Ramal 9</div>
                      <div className="text-xs font-extrabold text-slate-900 truncate">Síndico / Admin</div>
                      <span className="text-[10px] text-slate-600 truncate block">
                        {condominio.sindicoNome || 'Administração'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCallSindico('audio')}
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition active:scale-95 cursor-pointer"
                      title="Ligar Áudio para Administração"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCallSindico('video')}
                      className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs transition active:scale-95 cursor-pointer"
                      title="Ligar Vídeo para Administração"
                    >
                      <Video className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BUSCADOR RÁPIDO DE APARTAMENTO PARA LIGAÇÃO DIRETA */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>Chamar Morador por Apto ou Nome</span>
                </h3>
                <span className="text-[11px] text-slate-400">{moradores.length} moradores cadastrados</span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ex: 101, 202, Carlos, Ana..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
                />
              </div>

              {/* LISTA RÁPIDA (MÁXIMO 3 ITENS FILTRADOS PARA NÃO ALONGAR A TELA) */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {filteredMoradores.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/80 transition flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 truncate">{m.nome}</div>
                      <div className="text-[11px] text-emerald-700 font-bold">
                        Bloco {m.unidade.bloco} • Apto {m.unidade.apto}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCallMorador(m, 'audio')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                        title="Ligar Áudio"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Ligar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCallMorador(m, 'video')}
                        className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                        title="Ligar Vídeo"
                      >
                        <Video className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredMoradores.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('diretorio')}
                    className="w-full text-center py-1.5 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    Ver todos os {filteredMoradores.length} moradores no Diretório →
                  </button>
                )}
              </div>
            </div>

            {/* TELEFONES DE EMERGÊNCIA COMPACTOS */}
            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                Emergências Externas:
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="tel:190"
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-rose-400 font-bold text-[11px] text-slate-800 flex items-center gap-1 shadow-2xs"
                >
                  <Shield className="w-3 h-3 text-blue-600" />
                  <span>Polícia 190</span>
                </a>
                <a
                  href="tel:193"
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-rose-400 font-bold text-[11px] text-slate-800 flex items-center gap-1 shadow-2xs"
                >
                  <Flame className="w-3 h-3 text-rose-600" />
                  <span>Bombeiros 193</span>
                </a>
                <a
                  href="tel:192"
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-rose-400 font-bold text-[11px] text-slate-800 flex items-center gap-1 shadow-2xs"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>SAMU 192</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 2: RÁDIO PTT & WALKIE-TALKIE (NEXTEL DTA)                        */}
      {/* ==================================================================== */}
      {activeTab === 'ptt' && (
        <IntercomPTTView
          condominio={condominio}
          currentUserRole={currentUser.role}
          currentMorador={currentMorador}
          currentUserName={currentUser.nome}
          initialTab="ptt"
        />
      )}

      {/* ==================================================================== */}
      {/* ABA 3: DIRETÓRIO COMPLETO DE MORADORES & RAMAIS                      */}
      {/* ==================================================================== */}
      {activeTab === 'diretorio' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Diretório de Ramais</h2>
              <p className="text-xs text-slate-500">
                Toque no botão para efetuar uma chamada de áudio ou vídeo direto pelo interfone.
              </p>
            </div>

            {/* FILTRO E PESQUISA */}
            <div className="flex items-center gap-2">
              {blocosDisponiveis.length > 1 && (
                <select
                  value={blocoFilter}
                  onChange={(e) => setBlocoFilter(e.target.value)}
                  className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="todos">Todos Blocos</option>
                  {blocosDisponiveis.map((b) => (
                    <option key={b} value={b}>
                      Bloco {b}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por morador ou apto..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* GRID DE RAMAIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* PORTARIA */}
            {(!searchFilter ||
              'portaria central seguranca recepcao 0'.includes(searchFilter.toLowerCase())) && (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:shadow-xs transition flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">Portaria Central 24h</div>
                    <div className="text-[11px] font-bold text-amber-800">Ramal 0 • Guarita</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCallPortaria('audio')}
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition active:scale-95 cursor-pointer"
                    title="Ligar Áudio"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCallPortaria('video')}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs transition active:scale-95 cursor-pointer"
                    title="Ligar Vídeo"
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* SÍNDICO */}
            {(!searchFilter ||
              'sindico administração gestao admin 9'.includes(searchFilter.toLowerCase()) ||
              (condominio.sindicoNome &&
                condominio.sindicoNome.toLowerCase().includes(searchFilter.toLowerCase()))) && (
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:shadow-xs transition flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {condominio.sindicoNome || 'Síndico Geral'}
                    </div>
                    <div className="text-[11px] font-bold text-indigo-700">Ramal 9 • Administração</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCallSindico('audio')}
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition active:scale-95 cursor-pointer"
                    title="Ligar Áudio"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCallSindico('video')}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs transition active:scale-95 cursor-pointer"
                    title="Ligar Vídeo"
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* LISTA DE MORADORES */}
            {filteredMoradores.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">
                    {m.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">{m.nome}</div>
                    <div className="text-[11px] font-bold text-emerald-700 truncate">
                      Bloco {m.unidade.bloco} • Apto {m.unidade.apto}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCallMorador(m, 'audio')}
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition active:scale-95 cursor-pointer"
                    title="Ligar Áudio"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCallMorador(m, 'video')}
                    className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs transition active:scale-95 cursor-pointer"
                    title="Ligar Vídeo"
                  >
                    <Video className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredMoradores.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              Nenhum morador encontrado para a pesquisa "{searchFilter}".
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* ABA 4: HISTÓRICO DE CHAMADAS                                         */}
      {/* ==================================================================== */}
      {activeTab === 'historico' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Histórico de Ligações</h2>
              <p className="text-xs text-slate-500">
                Registro das últimas chamadas realizadas e recebidas pelo interfone digital.
              </p>
            </div>
          </div>

          {historicoChamadas.length === 0 ? (
            <div className="text-center py-10 text-slate-500 space-y-1">
              <PhoneOff className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-xs text-slate-700">Nenhuma chamada registrada no histórico.</p>
              <p className="text-[11px] text-slate-400">As ligações efetuadas e recebidas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historicoChamadas.map((c) => {
                const isOut = c.callerId === currentUser.id;
                const contactName = isOut ? c.receiverName : c.callerName;
                const contactRole = isOut ? c.receiverRole : c.callerRole;

                return (
                  <div key={c.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          c.status === 'connected'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isOut ? (
                          <PhoneForwarded className="w-3.5 h-3.5 text-indigo-600" />
                        ) : c.status === 'connected' ? (
                          <PhoneIncoming className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <PhoneMissed className="w-3.5 h-3.5 text-rose-600" />
                        )}
                      </div>

                      <div>
                        <div className="font-extrabold text-slate-900">{contactName}</div>
                        <div className="text-[11px] text-slate-500">
                          {isOut ? 'Chamada efetuada' : 'Chamada recebida'} •{' '}
                          {new Date(c.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {c.duracaoSegundos ? ` • ${c.duracaoSegundos}s` : ''}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        condoStore.iniciarChamada({
                          condominioId: condominio.id,
                          callerId: currentUser.id,
                          callerName: currentUser.nome,
                          callerRole: currentUser.role,
                          callerUnidade: currentUser.unidade || currentMorador?.unidade,
                          receiverId: isOut ? c.receiverId : c.callerId,
                          receiverName: contactName,
                          receiverRole: (contactRole as any) || 'morador',
                          tipo: 'audio',
                        });
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                    >
                      <PhoneCall className="w-3 h-3" />
                      <span>Retornar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
