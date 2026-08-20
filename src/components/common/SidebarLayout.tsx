import React, { useState, useEffect } from 'react';
import { Menu, X, LogOut, Building2 } from 'lucide-react';
import { UserRole, Condominio, AppNotification, UserAccount } from '../../types';
import { SmartCondoLogo } from './SmartCondoLogo';
import { ThemeToggleCompact } from '../../context/ThemeContext';
import { NotificationsDropdown } from './NotificationsDropdown';
import { NavSection, navSectionsByRole, defaultTabByRole } from './navConfig';

interface SidebarLayoutProps {
  currentUser: UserAccount;
  currentCondo: Condominio;
  condominios: Condominio[];
  setCondoId: (id: string) => void;
  notifications: AppNotification[];
  onLogout: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

const roleLabels: Record<UserRole, string> = {
  morador: 'Morador',
  portaria: 'Portaria',
  sindico: 'Síndico',
  super_admin: 'Super Admin',
};

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  currentUser,
  currentCondo,
  condominios,
  setCondoId,
  notifications,
  onLogout,
  activeTab,
  onSelectTab,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const sections: NavSection[] = navSectionsByRole[currentUser.role] || [];
  const allItems = sections.flatMap((s) => s.items);
  const activeLabel = allItems.find((m) => m.id === activeTab)?.label || 'Painel';

  // Close mobile sidebar on tab select
  const handleSelectTab = (tab: string) => {
    onSelectTab(tab);
    setIsOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <SmartCondoLogo size="sm" showText={true} condoNome={currentCondo.nome} showTagline={false} />
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden text-slate-500"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="mb-4">
              {section.title && (
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon
                        size={18}
                        className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}
                      />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge ? (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeType === 'danger'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                              : item.badgeType === 'warning'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser.nome.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {currentUser.nome}
              </p>
              <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {roleLabels[currentUser.role]}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut size={18} />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsOpen(true)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 lg:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base font-semibold text-slate-800 dark:text-slate-200 truncate">
              {activeLabel}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Condo selector (super admin) */}
            {currentUser.role === 'super_admin' && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                <Building2 className="w-4 h-4 text-slate-400" />
                <select
                  value={currentCondo.id}
                  onChange={(e) => setCondoId(e.target.value)}
                  className="bg-transparent text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
                  title="Alternar condomínio"
                >
                  {condominios.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-800 bg-white dark:bg-slate-800">
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status indicator */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>

            <ThemeToggleCompact />

            <NotificationsDropdown
              currentUser={currentUser}
              currentCondo={currentCondo}
              notifications={notifications}
            />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
