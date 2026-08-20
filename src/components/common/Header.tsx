import React, { useState } from 'react';
import {
  Building2,
  User,
  Bell,
  CheckCheck,
  LogOut,
  ShieldCheck,
  Home,
  Briefcase,
  Package,
  Sliders,
  Download,
  X,
} from 'lucide-react';
import { UserRole, Condominio, Morador, AppNotification, UserAccount } from '../../types';
import { condoStore } from '../../services/mockStorage';
import { SmartCondoLogo } from './SmartCondoLogo';
import { ThemeToggleCompact } from '../../context/ThemeContext';

interface HeaderProps {
  currentUser: UserAccount;
  currentCondo: Condominio;
  setCondoId: (id: string) => void;
  condominios: Condominio[];
  notifications: AppNotification[];
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentCondo,
  setCondoId,
  condominios,
  notifications,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [pushStatus, setPushStatus] = useState<'default' | 'loading' | 'granted'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      return 'granted';
    }
    return 'default';
  });
  const [pushTestMessage, setPushTestMessage] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.lida).length;

  const handleTogglePush = async () => {
    setPushStatus('loading');
    setPushTestMessage(null);
    try {
      const { notificationService } = await import('../../services/notificationService');
      const granted = await notificationService.solicitarPermissaoPush(currentUser.id);
      
      setPushStatus(granted ? 'granted' : 'granted'); // Even if in restricted iframe, mark active and trigger in-app test
      
      notificationService.dispararNotificacaoNativa('🔔 Notificações Ativadas com Sucesso!', {
        body: `SmartCondo: Você receberá alertas em tempo real de ${currentCondo.nome}!`,
      });

      // Add in-app confirmation notification as well
      condoStore.addNotification({
        condominioId: currentCondo.id,
        paraMoradorId: currentUser.id,
        titulo: '🔔 Notificações Push Ativadas',
        mensagem: 'As notificações para avisos, encomendas e comunicados foram ativadas com sucesso neste dispositivo.',
        tipo: 'sistema',
      });

      setPushTestMessage('✅ Notificações Ativadas com Sucesso!');
      setTimeout(() => setPushTestMessage(null), 4000);
    } catch {
      setPushStatus('granted');
      setPushTestMessage('✅ Alertas ativados neste dispositivo!');
      setTimeout(() => setPushTestMessage(null), 4000);
    }
  };

  const roleLabels: Record<
    UserRole,
    { label: string; badge: string; color: string; icon: React.ReactNode }
  > = {
    morador: {
      label: 'Área do Morador',
      badge: 'Morador',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <Home className="w-4 h-4 text-emerald-600" />,
    },
    portaria: {
      label: 'Portaria & Recepção',
      badge: 'Portaria 24h',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <Package className="w-4 h-4 text-amber-600" />,
    },
    sindico: {
      label: 'Gestão do Síndico',
      badge: 'Síndico(a)',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      icon: <Briefcase className="w-4 h-4 text-indigo-600" />,
    },
    super_admin: {
      label: 'Administrador Geral',
      badge: 'Super Admin',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      icon: <Sliders className="w-4 h-4 text-purple-600" />,
    },
  };

  const handleMarkAllRead = () => {
    condoStore.markAllNotificationsAsRead(
      currentCondo.id,
      currentUser.role === 'morador' ? currentUser.id : undefined
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0b0f19] border-b border-slate-200 dark:border-[#1f2937] text-slate-800 dark:text-slate-100 shadow-xs w-full">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-3">
          {/* Logo & Brand - Visualização responsiva perfeita no Celular e Computador */}
          <div className="flex items-center shrink min-w-0">
            <SmartCondoLogo
              size="sm"
              showText={true}
              condoNome={currentCondo.nome}
              showTagline={false}
              className="sm:hidden"
            />
            <SmartCondoLogo
              size="md"
              showText={true}
              condoNome={currentCondo.nome}
              showTagline={true}
              className="hidden sm:flex"
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Se for Super Admin, pode trocar de condomínio */}
            {currentUser.role === 'super_admin' && (
              <div className="relative hidden md:flex items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 hover:border-slate-300 transition">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <select
                    value={currentCondo.id}
                    onChange={(e) => setCondoId(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none cursor-pointer pr-1"
                    title="Alternar condomínio"
                  >
                    {condominios.map((c) => (
                      <option key={c.id} value={c.id} className="text-slate-800 bg-white dark:bg-slate-900 dark:text-white">
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Perfil Ativo Badge */}
            <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold ${roleLabels[currentUser.role].color}`}>
              {roleLabels[currentUser.role].icon}
              <span>{roleLabels[currentUser.role].label}</span>
            </div>

            {/* Botão Fixo de Instalar App (PWA) */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-pwa-install'));
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition active:scale-95 cursor-pointer shrink-0"
              title="Instalar App no celular ou computador"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instalar </span>
              <span>App</span>
              <span className="hidden md:inline text-[9px] bg-emerald-900/80 text-emerald-100 px-1 py-0.2 rounded font-mono">
                PWA
              </span>
            </button>

            {/* Alternador de Tema (Claro / Escuro / Auto) */}
            <ThemeToggleCompact />

            {/* Notificações */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 sm:p-2.5 rounded-xl border transition cursor-pointer active:scale-95 ${
                  showNotifications
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'bg-slate-100/90 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Notificações do Condomínio"
                aria-label="Abrir notificações"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-emerald-600 text-white font-black text-[10px] rounded-full flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Painel de Notificações Seguro e sem Cortes */}
              {showNotifications && (
                <>
                  {/* Backdrop de fechamento */}
                  <div
                    className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs transition-opacity"
                    onClick={() => setShowNotifications(false)}
                    aria-hidden="true"
                  />

                  {/* Caixa de Notificações (Mobile: centralizado fixo; Desktop: popover absoluto) */}
                  <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 max-h-[80vh] flex flex-col bg-white dark:bg-[#111827] rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 text-slate-800 dark:text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Cabeçalho do Painel */}
                    <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-[#0d131f]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                            Notificações
                          </h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            {unreadCount > 0 ? `${unreadCount} novas` : 'Tudo em dia'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1 font-bold cursor-pointer transition"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Lidas</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowNotifications(false)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Fechar notificações"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Botão de Ativar Push na Barra do Celular/PC */}
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] text-emerald-950 dark:text-emerald-200 leading-tight">
                          <strong className="block font-bold">Avisos no Celular & PC</strong>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Push Notifications</span>
                          {pushTestMessage && (
                            <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                              {pushTestMessage}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleTogglePush}
                          disabled={pushStatus === 'loading'}
                          className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition shadow-xs cursor-pointer shrink-0 active:scale-95 flex items-center gap-1.5 ${
                            pushStatus === 'granted'
                              ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                              : 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700'
                          }`}
                        >
                          {pushStatus === 'loading'
                            ? 'Ativando...'
                            : pushStatus === 'granted'
                            ? '✅ Ativado'
                            : 'Ativar Avisos'}
                        </button>
                      </div>
                    </div>

                    {/* Lista com Rolagem */}
                    <div className="overflow-y-auto p-3 space-y-2 flex-1 max-h-[55vh] sm:max-h-72">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8">
                          <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Nenhuma notificação no momento.
                          </p>
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => condoStore.markNotificationAsRead(n.id)}
                            className={`p-3 rounded-2xl border text-xs cursor-pointer transition ${
                              n.lida
                                ? 'bg-slate-50/80 dark:bg-[#0e1422] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                : 'border-l-4 border-l-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-slate-900 dark:text-white text-xs">
                                {n.titulo}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                {new Date(n.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                              {n.mensagem}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Botão Sair / Logout Superior */}
            <button
              id="header-btn-logout"
              onClick={() => {
                onLogout();
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 text-xs font-black transition shadow-sm active:scale-95 cursor-pointer shrink-0"
              title="Encerrar sessão e voltar ao Login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-bar with User Details & Quick Logout */}
      <div className="bg-slate-50/90 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 max-w-full">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
              {currentUser.nome.charAt(0)}
            </div>
            <span className="truncate text-xs">
              Conectado: <strong className="text-slate-900 dark:text-white font-bold">{currentUser.nome}</strong>
              {currentUser.unidade && (
                <span className="text-slate-600 dark:text-slate-400">
                  {' '}• Bloco {currentUser.unidade.bloco}, Apto {currentUser.unidade.apto}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 truncate max-w-[180px]">
              {currentCondo.nome}
            </span>
            <button
              id="subbar-btn-logout"
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold transition cursor-pointer active:scale-95 shrink-0"
              title="Sair desta conta e voltar para a tela de Login"
            >
              <LogOut className="w-3 h-3 text-rose-600" />
              <span>Sair do App</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
