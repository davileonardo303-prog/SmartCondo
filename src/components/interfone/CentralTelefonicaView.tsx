import React, { useState } from 'react';
import { Condominio, Morador, UserAccount, UserRole, ChamadaInterfone, Unidade } from '../../types';
import { condoStore } from '../../services/mockStorage';
import { callAudioService } from '../../utils/callAudio';
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
  CheckCircle2,
  Delete,
  Volume2,
  Headphones,
  Zap,
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
  const [activeTab, setActiveTab] = useState<'teclado' | 'diretorio' | 'historico'>('teclado');

  const moradores = condoStore.getMoradores(condominio.id).filter((m) => m.statusCadastro === 'ativo');
  const historicoChamadas = condoStore.getHistoricoChamadas(condominio.id, currentUser.id);

  // Determina o ramal do usuário atual
  const meuRamal =
    currentUser.role === 'portaria'
      ? '0 (Portaria Central)'
      : currentUser.role === 'sindico'
      ? '9 (Administração)'
      : currentUser.role === 'super_admin'
      ? '00 (Master)'
      : currentMorador
      ? `Bloco ${currentMorador.unidade.bloco} - Apto ${currentMorador.unidade.apto}`
      : 'Morador';

  // Trata digitação no teclado DTMF
  const handleKeyClick = (key: string) => {
    callAudioService.playDtmfTone(key);
    setDialNumber((prev) => (prev.length < 15 ? prev + key : prev));
  };

  const handleBackspace = () => {
    setDialNumber((prev) => prev.slice(0, -1));
  };

  // Identifica o alvo da chamada discada
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
        receiverName: 'Síndico / Administração',
        receiverRole: 'sindico',
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
      receiverUnidade: { bloco: 'A', apto: dialNumber },
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
      receiverName: 'Síndico / Administração',
      receiverRole: 'sindico',
      tipo,
    });
  };

  const filteredMoradores = moradores.filter((m) => {
    const q = searchFilter.toLowerCase();
    return (
      m.nome.toLowerCase().includes(q) ||
      m.unidade.apto.toLowerCase().includes(q) ||
      (m.unidade.bloco && m.unidade.bloco.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* CABEÇALHO DA CENTRAL TELEFÔNICA */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Central Telefônica & Interfonia WebRTC Ativa
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Headphones className="w-8 h-8 text-emerald-400" />
            <span>Central Telefônica Digital</span>
          </h1>
          <p className="text-sm text-slate-300">
            Comunicação direta em tempo real full-duplex entre Moradores, Portaria e Administração.
          </p>
        </div>

        {/* CARTÃO DO SEU RAMAL */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-4 z-10">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-black text-xl">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Seu Ramal Atual
            </span>
            <div className="text-base font-extrabold text-white">{meuRamal}</div>
            <span className="text-[10px] text-emerald-400 font-semibold">● Linha Pronta para Chamar</span>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('teclado')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition cursor-pointer ${
            activeTab === 'teclado'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Discador & Ramais Rápidos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('diretorio')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition cursor-pointer ${
            activeTab === 'diretorio'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Diretório de Moradores ({moradores.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historico')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition cursor-pointer ${
            activeTab === 'historico'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Histórico de Chamadas</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: TECLADO DISCADOR + ATALHOS RÁPIDOS */}
      {activeTab === 'teclado' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PAINEL DISCADOR (DIALPAD) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
            {/* DISPLAY DIGITAL DO DISCADOR */}
            <div className="w-full bg-slate-900 text-white rounded-2xl p-4 mb-6 shadow-inner border border-slate-800 flex flex-col items-center justify-center min-h-[90px] relative">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                {targetMorador
                  ? `Apartamento Localizado: ${targetMorador.nome} (Bloco ${targetMorador.unidade.bloco})`
                  : dialNumber === '0'
                  ? 'Portaria Central 24h'
                  : dialNumber === '9'
                  ? 'Síndico / Administração'
                  : 'Digite o Ramal ou Apartamento'}
              </span>

              <div className="text-3xl sm:text-4xl font-black tracking-widest text-emerald-400">
                {dialNumber || '---'}
              </div>

              {dialNumber && (
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="absolute right-4 p-2 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  title="Apagar"
                >
                  <Delete className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* TECLADO TELEFÔNICO DTMF */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-xs mb-6">
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
                  className="h-16 rounded-2xl bg-slate-50 hover:bg-slate-200 active:bg-slate-300 text-slate-900 border border-slate-200 flex flex-col items-center justify-center transition shadow-sm active:scale-95 cursor-pointer"
                >
                  <span className="text-2xl font-black leading-none">{k}</span>
                  {sub && <span className="text-[9px] font-bold text-slate-500 uppercase">{sub}</span>}
                </button>
              ))}
            </div>

            {/* BOTÕES DE DISCAGEM */}
            <div className="flex items-center gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => handleMakeCall('audio')}
                disabled={!dialNumber}
                className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-40 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Ligar Voz</span>
              </button>

              <button
                type="button"
                onClick={() => handleMakeCall('video')}
                disabled={!dialNumber}
                className="py-4 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-40 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                title="Chamada com Vídeo"
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ATALHOS RÁPIDOS & RAMAIS DE EMERGÊNCIA */}
          <div className="lg:col-span-7 space-y-6">
            {/* RAMAIS PRINCIPAIS EM 1 TOQUE */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <span>Ramais de Acesso Rápido (1 Toque)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* PORTARIA */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase text-amber-900">Ramal 0</div>
                      <div className="text-sm font-extrabold text-slate-900">Portaria Central 24h</div>
                      <span className="text-[11px] text-emerald-600 font-bold">● Atendimento Imediato</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCallPortaria('audio')}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                    title="Ligar para Portaria"
                  >
                    <PhoneCall className="w-5 h-5" />
                  </button>
                </div>

                {/* SÍNDICO / ADMIN */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase text-indigo-900">Ramal 9</div>
                      <div className="text-sm font-extrabold text-slate-900">Síndico / Admin</div>
                      <span className="text-[11px] text-slate-600 font-medium">{condominio.sindicoNome || 'Gestão'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCallSindico('audio')}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                    title="Ligar para Administração"
                  >
                    <PhoneCall className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* DICA DE COMO LIGAR PARA QUALQUER MORADOR */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-6 rounded-3xl border border-emerald-800 shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-white">Como Funciona a Telefonia do SmartCondo</h3>
                <p className="text-xs text-emerald-200 leading-relaxed">
                  Para ligar para qualquer apartamento, basta digitar o número do apartamento (ex: <strong>101</strong>, <strong>202</strong>) ou localizar o vizinho na aba <strong>Diretório</strong>. O áudio toca instantaneamente no celular ou computador com som em tempo real e sem atraso!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: DIRETÓRIO DE MORADORES */}
      {activeTab === 'diretorio' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900">Diretório de Ramais dos Moradores</h2>
              <p className="text-xs text-slate-500">
                Clique no botão verde para ligar diretamente para o apartamento desejado.
              </p>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar morador ou apto..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* GRID DE MORADORES */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMoradores.map((m) => (
              <div
                key={m.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 hover:shadow-md transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                    {m.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">{m.nome}</div>
                    <div className="text-xs font-bold text-emerald-700">
                      Bloco {m.unidade.bloco} • Apto {m.unidade.apto}
                    </div>
                    <span className="text-[10px] text-slate-500">Ramal: {m.unidade.apto}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCallMorador(m, 'audio')}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition active:scale-95 cursor-pointer"
                    title="Ligar Voz"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCallMorador(m, 'video')}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition active:scale-95 cursor-pointer"
                    title="Ligar Vídeo"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: HISTÓRICO DE CHAMADAS */}
      {activeTab === 'historico' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">Histórico de Ligações</h2>
            <p className="text-xs text-slate-500">
              Registro das últimas chamadas realizadas e recebidas pelo interfone digital.
            </p>
          </div>

          {historicoChamadas.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <PhoneOff className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold">Nenhuma chamada registrada no histórico.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historicoChamadas.map((c) => {
                const isOut = c.callerId === currentUser.id;
                const contactName = isOut ? c.receiverName : c.callerName;
                const contactRole = isOut ? c.receiverRole : c.callerRole;

                return (
                  <div key={c.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          c.status === 'connected'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isOut ? (
                          <PhoneForwarded className="w-4 h-4 text-indigo-600" />
                        ) : c.status === 'connected' ? (
                          <PhoneIncoming className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <PhoneMissed className="w-4 h-4 text-rose-600" />
                        )}
                      </div>

                      <div>
                        <div className="text-sm font-extrabold text-slate-900">{contactName}</div>
                        <div className="text-xs text-slate-500">
                          {isOut ? 'Chamada efetuada' : 'Chamada recebida'} • {new Date(c.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {c.duracaoSegundos ? ` • Duração: ${c.duracaoSegundos}s` : ''}
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
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
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
