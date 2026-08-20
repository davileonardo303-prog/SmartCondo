import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Tablet,
  Laptop,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  ArrowDown
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deviceType, setDeviceType] = useState<'iphone' | 'ipad' | 'android' | 'tablet' | 'desktop'>('desktop');
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // 1. Verifica se já está rodando como PWA instalado (Standalone)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(Boolean(isStandaloneMode));
    if (isStandaloneMode) return;

    // 2. Detecta tipo de dispositivo
    const ua = window.navigator.userAgent.toLowerCase();
    const isIpad = /ipad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isIphone = /iphone|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isMobile = /mobile/.test(ua);

    if (isIphone) {
      setIsIOS(true);
      setDeviceType('iphone');
    } else if (isIpad) {
      setIsIOS(true);
      setDeviceType('ipad');
    } else if (isAndroid && !isMobile) {
      setDeviceType('tablet');
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // 3. Captura evento nativo do PWA no Chrome, Edge, Samsung Internet, Android, etc.
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 4. Se for iOS Safari, mostra o prompt após 1.5s
    const dismissedKey = 'smartcondo_pwa_dismissed_session';
    const isDismissed = sessionStorage.getItem(dismissedKey);

    const timer = setTimeout(() => {
      if (!isStandaloneMode && !isDismissed) {
        setShowPrompt(true);
      }
    }, 1500);

    // 5. Escuta quando o app foi instalado com sucesso
    window.addEventListener('appinstalled', () => {
      setInstalledSuccess(true);
      setShowPrompt(false);
      setIsStandalone(true);
      setDeferredPrompt(null);
    });

    // 6. Escuta evento global disparado pelo botão fixo do Header
    const handleOpenCustomEvent = () => {
      setShowPrompt(true);
    };
    window.addEventListener('open-pwa-install', handleOpenCustomEvent);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleOpenCustomEvent);
      clearTimeout(timer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setInstalledSuccess(true);
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA install error:', err);
      }
    } else if (isIOS) {
      // Abre instrução visual para iOS Safari
      setShowPrompt(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('smartcondo_pwa_dismissed_session', 'true');
  };

  if (isStandalone && !installedSuccess) {
    return null;
  }

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'iphone':
      case 'android':
        return <Smartphone className="w-6 h-6 text-emerald-400" />;
      case 'ipad':
      case 'tablet':
        return <Tablet className="w-6 h-6 text-emerald-400" />;
      default:
        return <Laptop className="w-6 h-6 text-emerald-400" />;
    }
  };

  const getDeviceLabel = () => {
    switch (deviceType) {
      case 'iphone':
        return 'seu iPhone';
      case 'ipad':
        return 'seu iPad';
      case 'android':
        return 'seu Celular Android';
      case 'tablet':
        return 'seu Tablet';
      default:
        return 'seu Computador / Notebook';
    }
  };

  return (
    <>
      {/* MODAL / BANNER DE INSTALAÇÃO NA TELA INICIAL */}
      {showPrompt && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-5 transform transition-all"
            role="dialog"
            aria-modal="true"
          >
            {/* Header com Ícone e Fechar */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <img src="/icon-192.svg" alt="SmartCondo" className="w-10 h-10 rounded-xl object-contain" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> App Oficial
                    </span>
                  </div>
                  <h3 className="font-black text-lg text-white mt-1">Instalar SmartCondo</h3>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Texto de Pergunta amigável */}
            <div className="space-y-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
              <p className="font-bold text-white text-sm sm:text-base">
                Deseja instalar o SmartCondo no {getDeviceLabel()}?
              </p>
              <p className="text-slate-300 text-xs">
                O aplicativo será adicionado à sua <strong>Tela Inicial</strong> junto com seus outros aplicativos, com abertura rápida em tela cheia e notificações automáticas de encomendas e portaria.
              </p>
            </div>

            {/* Benefícios rápidos */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Ícone na Tela Inicial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Sem ocupar memória</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Abertura instantânea</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Notificações Push</span>
              </div>
            </div>

            {/* Instrução Específica para iOS / iPhone / iPad se aplicável */}
            {isIOS && !deferredPrompt ? (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-xs">
                  <Share className="w-4 h-4" />
                  <span>Como instalar no iPhone / iPad:</span>
                </div>
                <ol className="text-xs text-slate-200 space-y-2 pl-4 list-decimal">
                  <li>
                    Toque no botão <strong className="text-white">Compartilhar</strong> (ícone <Share className="w-3.5 h-3.5 inline mx-0.5 text-emerald-400" /> na barra do Safari).
                  </li>
                  <li>
                    Role para baixo e selecione <strong className="text-emerald-400 flex-inline items-center gap-1">Adicionar à Tela de Início <PlusSquare className="w-3.5 h-3.5 inline ml-1" /></strong>.
                  </li>
                  <li>
                    Confirme em <strong className="text-white">Adicionar</strong> no canto superior direito.
                  </li>
                </ol>
              </div>
            ) : null}

            {/* Botões de Ação */}
            <div className="space-y-2 pt-2">
              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Download className="w-5 h-5" />
                  <span>Instalar Aplicativo Agora</span>
                </button>
              ) : isIOS ? (
                <button
                  onClick={handleDismiss}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Entendi, Vou Adicionar à Tela de Início</span>
                </button>
              ) : (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-xl shadow-emerald-500/25 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Download className="w-5 h-5" />
                  <span>Instalar no Dispositivo</span>
                </button>
              )}

              <button
                onClick={handleDismiss}
                className="w-full py-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition"
              >
                Continuar usando pelo navegador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FEEDBACK DE INSTALAÇÃO CONCLUÍDA */}
      {installedSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <div>
            <div className="font-extrabold">SmartCondo Instalado com Sucesso!</div>
            <div className="text-[11px] text-emerald-100">O app agora está disponível na tela inicial do seu dispositivo.</div>
          </div>
        </div>
      )}
    </>
  );
};
