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

  const unreadCount = notifications.filter((n) => !n.lida).length;

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
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Marcar lidas
                        </button>
                      )}
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

            {/* Botão Sair / Logout */}
            <button
              id="header-btn-logout"
              onClick={() => {
                onLogout();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 text-xs font-bold transition shadow-sm active:scale-95 cursor-pointer"
              title="Encerrar sessão"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-bar with User Details */}
      <div className="bg-slate-50/80 border-t border-slate-200/80 px-4 py-2 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
              {currentUser.nome.charAt(0)}
            </div>
            <span>
              Conectado como:{' '}
              <strong className="text-slate-900 font-bold">{currentUser.nome}</strong>
              {currentUser.unidade && (
                <span className="text-slate-600">
                  {' '}• Bloco {currentUser.unidade.bloco}, Apto {currentUser.unidade.apto}
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {currentCondo.nome}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
