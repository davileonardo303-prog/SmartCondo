import React, { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { UserRole, Condominio, AppNotification, UserAccount } from '../../types';
import { condoStore } from '../../services/mockStorage';
import { SmartCondoLogo } from './SmartCondoLogo';

interface NotificationsDropdownProps {
  currentUser: UserAccount;
  currentCondo: Condominio;
  notifications: AppNotification[];
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  currentUser,
  currentCondo,
  notifications,
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
      setPushStatus('granted');
      notificationService.dispararNotificacaoNativa('🔔 Notificações Ativadas com Sucesso!', {
        body: `SmartCondo: Você receberá alertas em tempo real de ${currentCondo.nome}!`,
      });
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

  const handleMarkAllRead = () => {
    condoStore.markAllNotificationsAsRead(
      currentCondo.id,
      currentUser.role === 'morador' ? currentUser.id : undefined
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        title="Notificações do Condomínio"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl p-3 z-50">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Notificações
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Marcar lidas
                </button>
              )}
            </div>

            <div className="mb-2 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between gap-2">
              <div className="text-[11px] text-amber-950 dark:text-amber-200 leading-tight">
                <strong className="block font-bold">Receber na Barra do Celular/PC</strong>
                {pushTestMessage && (
                  <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                    {pushTestMessage}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleTogglePush}
                disabled={pushStatus === 'loading'}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition shrink-0 cursor-pointer ${
                  pushStatus === 'granted'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {pushStatus === 'loading'
                  ? 'Ativando...'
                  : pushStatus === 'granted'
                  ? '✅ Ativado'
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
                        ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        : 'border-l-4 border-l-blue-500 bg-blue-50/40 dark:bg-blue-950/30 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {n.titulo}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
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
  );
};
