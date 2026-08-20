import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollableTabsNavProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollableTabsNav: React.FC<ScrollableTabsNavProps> = ({
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    el.addEventListener('scroll', checkScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      el.removeEventListener('scroll', checkScroll);
    };
  }, [checkScroll, children]);

  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const distance = Math.max(260, el.clientWidth * 0.6);
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  // Convert mouse wheel to horizontal scroll when hovering over the tabs bar
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {/* Botão de Scroll para a Esquerda (apenas em desktop no hover) */}
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="Rolar abas para a esquerda"
        className={`hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700 items-center justify-center transition-all duration-200 hover:bg-emerald-700 hover:text-white hover:scale-110 active:scale-95 cursor-pointer ${
          canScrollLeft
            ? 'opacity-0 group-hover:opacity-100 translate-x-0'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Container das Abas com scroll horizontal nativo suave */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="flex items-center gap-1.5 sm:gap-2 pb-1 overflow-x-auto scroll-smooth no-scrollbar select-none touch-pan-x"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>

      {/* Botão de Scroll para a Direita (apenas em desktop no hover) */}
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="Rolar abas para a direita"
        className={`hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md border border-slate-200 dark:border-slate-700 items-center justify-center transition-all duration-200 hover:bg-emerald-700 hover:text-white hover:scale-110 active:scale-95 cursor-pointer ${
          canScrollRight
            ? 'opacity-0 group-hover:opacity-100 translate-x-0'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
