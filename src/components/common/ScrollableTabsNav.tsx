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
      {/* Botão de Scroll para a Esquerda */}
      <button
        type="button"
        onClick={() => scroll('left')}
        aria-label="Rolar abas para a esquerda"
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-all duration-200 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 cursor-pointer ${
          canScrollLeft
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 -translate-x-3 pointer-events-none'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Sombra de esmaecimento à esquerda */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-2 w-10 bg-gradient-to-r from-slate-50 via-slate-50/70 to-transparent z-10 pointer-events-none" />
      )}

      {/* Container das Abas com scroll horizontal suave */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scroll-smooth no-scrollbar select-none"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {children}
      </div>

      {/* Sombra de esmaecimento à direita */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-slate-50 via-slate-50/70 to-transparent z-10 pointer-events-none" />
      )}

      {/* Botão de Scroll para a Direita */}
      <button
        type="button"
        onClick={() => scroll('right')}
        aria-label="Rolar abas para a direita"
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/95 text-slate-700 shadow-md border border-slate-200 flex items-center justify-center transition-all duration-200 hover:bg-slate-900 hover:text-white hover:scale-110 active:scale-95 cursor-pointer ${
          canScrollRight
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-3 pointer-events-none'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
