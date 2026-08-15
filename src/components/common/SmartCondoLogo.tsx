import React from 'react';

interface SmartCondoLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showTagline?: boolean;
  textColor?: 'dark' | 'light';
  condoNome?: string;
  className?: string;
  id?: string;
}

export const SmartCondoLogo: React.FC<SmartCondoLogoProps> = ({
  size = 'md',
  showText = true,
  showTagline = false,
  textColor = 'dark',
  condoNome,
  className = '',
  id = 'smartcondo-logo',
}) => {
  // Dimension definitions for the logo icon
  const iconDimensions: Record<string, { box: string; svg: number }> = {
    xs: { box: 'w-7 h-7', svg: 28 },
    sm: { box: 'w-8 h-8 sm:w-9 sm:h-9', svg: 34 },
    md: { box: 'w-10 h-10 sm:w-11 sm:h-11', svg: 42 },
    lg: { box: 'w-12 h-12 sm:w-14 sm:h-14', svg: 54 },
    xl: { box: 'w-16 h-16 sm:w-20 sm:h-20', svg: 72 },
  };

  const textSizes: Record<string, { title: string; subtitle: string; badge: string }> = {
    xs: { title: 'text-sm font-extrabold', subtitle: 'text-[9px]', badge: 'text-[9px] px-1.5' },
    sm: { title: 'text-base sm:text-lg font-extrabold', subtitle: 'text-[10px]', badge: 'text-[10px] px-2 py-0.5' },
    md: { title: 'text-lg sm:text-xl font-black', subtitle: 'text-[11px]', badge: 'text-[11px] px-2 py-0.5' },
    lg: { title: 'text-2xl sm:text-3xl font-black', subtitle: 'text-xs sm:text-sm', badge: 'text-xs px-2.5 py-0.5' },
    xl: { title: 'text-3xl sm:text-4xl font-black', subtitle: 'text-sm sm:text-base', badge: 'text-xs px-3 py-1' },
  };

  const currentDim = iconDimensions[size] || iconDimensions.md;
  const currentText = textSizes[size] || textSizes.md;

  const isLight = textColor === 'light';

  return (
    <div id={id} className={`flex items-center gap-2.5 sm:gap-3.5 select-none ${className}`}>
      {/* Ícone Geométrico Moderno do SmartCondo */}
      <div
        className={`relative ${currentDim.box} shrink-0 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 p-[1.5px] shadow-md shadow-emerald-900/20 group`}
      >
        {/* Glow de fundo */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-2xl opacity-60 blur-xs group-hover:opacity-100 transition duration-500" />

        {/* Container interno do SVG */}
        <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950 rounded-[14px] flex items-center justify-center overflow-hidden p-1 sm:p-1.5">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-sm"
          >
            <defs>
              <linearGradient id="scGradBuilding" x1="6" y1="44" x2="30" y2="8" gradientUnits="userSpaceOnUse">
                <stop stopColor="#059669" />
                <stop offset="0.5" stopColor="#10B981" />
                <stop offset="1" stopColor="#34D399" />
              </linearGradient>

              <linearGradient id="scGradTower" x1="22" y1="44" x2="42" y2="4" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0D9488" />
                <stop offset="0.6" stopColor="#14B8A6" />
                <stop offset="1" stopColor="#2DD4BF" />
              </linearGradient>

              <linearGradient id="scGradAccent" x1="16" y1="36" x2="32" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F59E0B" />
                <stop offset="1" stopColor="#FBBF24" />
              </linearGradient>
            </defs>

            {/* Base Sombra / Fundação */}
            <path
              d="M6 42H42"
              stroke="#047857"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Torre Esquerda (Condomínio Inteligente) */}
            <path
              d="M10 41V18L24 10V41H10Z"
              fill="url(#scGradBuilding)"
              fillOpacity="0.9"
            />

            {/* Torre Direita Mais Alta (Prédio Moderno com Ângulo) */}
            <path
              d="M24 41V6L38 14V41H24Z"
              fill="url(#scGradTower)"
            />

            {/* Linha Divisória de Arquitetura */}
            <path
              d="M24 10V41"
              stroke="#064E3B"
              strokeWidth="1.5"
            />

            {/* Janelas Inteligentes e Conectadas (Torre Esquerda) */}
            <rect x="14" y="21" width="3" height="3" rx="0.75" fill="#ECFDF5" />
            <rect x="14" y="27" width="3" height="3" rx="0.75" fill="#ECFDF5" />
            <rect x="14" y="33" width="3" height="3" rx="0.75" fill="#ECFDF5" />

            {/* Janelas Inteligentes (Torre Direita) */}
            <rect x="28" y="16" width="3.5" height="3.5" rx="0.75" fill="#CCFBF1" />
            <rect x="28" y="23" width="3.5" height="3.5" rx="0.75" fill="#CCFBF1" />
            <rect x="28" y="30" width="3.5" height="3.5" rx="0.75" fill="#CCFBF1" />

            {/* Portal / Smart Key (Conexão e Segurança) */}
            <path
              d="M21 41V35C21 33.3431 22.3431 32 24 32C25.6569 32 27 33.3431 27 35V41"
              fill="#064E3B"
              stroke="url(#scGradAccent)"
              strokeWidth="1.5"
            />

            {/* Antena / Nó de Conexão IoT no Topo */}
            <circle cx="38" cy="14" r="2" fill="#34D399" />
            <path
              d="M34 10C36 8 40 8 42 10"
              stroke="#6EE7B7"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Tipografia da Marca (Visível em Celular e Computador) */}
      {showText && (
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`${currentText.title} tracking-tight leading-tight transition-colors ${
                isLight ? 'text-white' : 'text-slate-900'
              }`}
            >
              SMART<span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">CONDO</span>
            </span>

            {/* Badge de Plataforma */}
            <span
              className={`hidden sm:inline-flex items-center font-bold uppercase tracking-wider rounded-full border ${currentText.badge} ${
                isLight
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              PRO
            </span>
          </div>

          {/* Subtítulo ou Nome do Condomínio Atual */}
          {(showTagline || condoNome) && (
            <div className="flex items-center gap-1 truncate mt-0.5">
              <span
                className={`${currentText.subtitle} font-medium truncate ${
                  isLight ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {condoNome || 'Gestão Inteligente & Condomínio Digital'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
