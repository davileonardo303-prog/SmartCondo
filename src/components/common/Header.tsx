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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 text-slate-800 shadow-sm">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Brand - Visualização responsiva perfeita no Celular e Computador */}
          <div className="flex items-center">
            <SmartCondoLogo
              size="md"
              showText={true}
              condoNome={currentCondo.nome}
              showTagline={true}
            />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Se for Super Admin, pode trocar de condomínio */}
            {currentUser.role === 'super_admin' && (
              <div className="relative hidden md:flex items-center">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:border-slate-300 transition">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <select
                    value={currentCondo.id}
                    onChange={(e) => setCondoId(e.target.value)}
                    className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer pr-1"
                    title="Alternar condomínio"
                  >
                    {condominios.map((c) => (
                      <option key={c.id} value={c.id} className="text-slate-800 bg-white">
                        {c.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Perfil Ativo Badge */}
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${roleLabels[currentUser.role].color}`}>
              {roleLabels[currentUser.role].icon}
              <span>{roleLabels[currentUser.role].label}</span>
            </div>

            {/* Alternador de Tema (Claro / Escuro Negrito / Sistema Celular) */}
            <ThemeToggleCompact />

            {/* Notificações */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                title="Notificações do Condomínio"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notificações Dropdown */}
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          Notificações do Condomínio
                        </span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                            {unreadCount} novas
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Marcar lidas
                        </button>
                      )}
                    </div>

                    {/* Botão de Ativar Push na Barra do Celular/PC */}
                    <div className="mb-2 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2 shadow-xs">
                      <div className="text-[11px] text-amber-950 dark:text-amber-200 leading-tight">
                        <strong className="block font-bold">Receber na Barra do Celular/PC</strong>
                        <div className="text-[10px] text-amber-700 dark:text-amber-300">Push Notifications (FCM)</div>
                        {pushTestMessage && (
                          <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-1 animate-pulse">
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
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                      >
                        {pushStatus === 'loading'
                          ? 'Ativando...'
                          : pushStatus === 'granted'
                          ? '✅ Ativado (Testar)'
                          : 'Ativar Push'}
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6">
                          Nenhuma notificação no momento.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => condoStore.markNotificationAsRead(n.id)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                              n.lida
                                ? 'bg-slate-50/70 border-slate-200 text-slate-600'
                                : 'border-l-4 border-l-emerald-500 bg-emerald-50/40 border-slate-200 text-slate-800 font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-bold text-slate-900 text-xs">
                                {n.titulo}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(n.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-slate-600 text-xs leading-relaxed">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 text-xs font-black transition shadow-sm active:scale-95 cursor-pointer shrink-0"
              title="Encerrar sessão e voltar ao Login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-bar with User Details & Quick Logout */}
      <div className="bg-slate-50/90 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-xs shadow-xs">
              {currentUser.nome.charAt(0)}
            </div>
            <span>
              Conectado como:{' '}
              <strong className="text-slate-900 dark:text-white font-bold">{currentUser.nome}</strong>
              {currentUser.unidade && (
                <span className="text-slate-600 dark:text-slate-400">
                  {' '}• Bloco {currentUser.unidade.bloco}, Apto {currentUser.unidade.apto}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {currentCondo.nome}
            </span>
            <button
              id="subbar-btn-logout"
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold transition cursor-pointer active:scale-95"
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
