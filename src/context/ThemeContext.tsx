import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export type AppTheme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: AppTheme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('smartcondo_theme_mode');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'system';
  });

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listener para mudanças no tema do sistema operacional (celular, computador, tablet)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemDark(e.matches);
    };

    setSystemDark(mediaQuery.matches);
    try {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch {
      // Suporte a navegadores mais antigos
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  // Atualiza classe no elemento html e body
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.classList.add('dark-mode-active');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.classList.remove('dark-mode-active');
    }
  }, [resolvedTheme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('smartcondo_theme_mode', newTheme);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// Componente elegante de alternância de tema para botões rápidos (totalmente responsivo)
export const ThemeToggleCompact: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <>
      {/* Versão Mobile (1 Botão Compacto Inteligente que não estoura a tela) */}
      <button
        type="button"
        onClick={toggleTheme}
        className={`sm:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition active:scale-95 shadow-xs shrink-0 ${className}`}
        title={`Tema atual: ${theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Automático'} (Toque para alternar)`}
        aria-label="Alternar tema"
      >
        {theme === 'light' ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : theme === 'dark' ? (
          <Moon className="w-4 h-4 text-indigo-400" />
        ) : (
          <Laptop className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        )}
      </button>

      {/* Versão Desktop / Tablet (Segmented Control Completo) */}
      <div
        className={`hidden sm:inline-flex items-center p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-inner shrink-0 ${className}`}
        role="group"
        aria-label="Selecionar tema do aplicativo"
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          title="Modo Claro (Dia)"
          className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer ${
            theme === 'light'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-400/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px]">Claro</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          title="Modo Escuro (Noite)"
          className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer ${
            theme === 'dark'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px]">Escuro</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          title="Automático (Acompanha o tema do Celular / Computador)"
          className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 cursor-pointer ${
            theme === 'system'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span className="hidden md:inline text-[11px]">Auto</span>
        </button>
      </div>
    </>
  );
};
