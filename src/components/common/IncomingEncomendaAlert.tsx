import React, { useState, useEffect } from 'react';
import {
  Package,
  Bell,
  CheckCircle2,
  Copy,
  Clock,
  X,
  Smartphone,
  ShieldCheck,
  Truck,
  ExternalLink,
  Lock,
  Volume2,
} from 'lucide-react';
import { Encomenda, Morador, Condominio } from '../../types';
import { notificationService, playNotificationSound } from '../../services/notificationService';

interface IncomingEncomendaAlertProps {
  currentMorador?: Morador | null;
  currentCondo: Condominio;
  encomendas: Encomenda[];
  onOpenEncomendasTab?: () => void;
}

export const IncomingEncomendaAlert: React.FC<IncomingEncomendaAlertProps> = ({
  currentMorador,
  currentCondo,
  encomendas,
  onOpenEncomendasTab,
}) => {
  const [activeAlert, setActiveAlert] = useState<{
    encomenda: Encomenda;
    moradorNome: string;
    isTest?: boolean;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [pushStatus, setPushStatus] = useState<NotificationPermission>('default');
  const [lockScreenCountdown, setLockScreenCountdown] = useState<number | null>(null);

  useEffect(() => {
    setPushStatus(notificationService.getPushPermissionStatus());
  }, []);

  // Escuta evento global de nova encomenda disparado pelo storage/backend
  useEffect(() => {
    const handleNovaEncomenda = (e: Event) => {
      const customEvent = e as CustomEvent<{
        encomenda: Encomenda;
        morador: Morador;
        condominio: Condominio;
      }>;

      if (!customEvent.detail) return;
      const { encomenda, morador } = customEvent.detail;

      // Verifica se a encomenda é para este morador ou para a mesma unidade
      if (currentMorador) {
        const isSameMorador = encomenda.moradorId === currentMorador.id;
        const isSameUnit =
          encomenda.unidade &&
          currentMorador.unidade &&
          String(encomenda.unidade.apto).trim().toLowerCase() ===
            String(currentMorador.unidade.apto).trim().toLowerCase() &&
          (!encomenda.unidade.bloco ||
            !currentMorador.unidade.bloco ||
            String(encomenda.unidade.bloco).trim().toLowerCase() ===
              String(currentMorador.unidade.bloco).trim().toLowerCase());

        if (isSameMorador || isSameUnit) {
          playNotificationSound('encomenda');
          setActiveAlert({
            encomenda,
            moradorNome: morador?.nome || currentMorador.nome,
          });
        }
      }
    };

    window.addEventListener('smartcondo:nova_encomenda', handleNovaEncomenda);
    return () => {
      window.removeEventListener('smartcondo:nova_encomenda', handleNovaEncomenda);
    };
  }, [currentMorador]);

  // Monitora novas encomendas pendentes na montagem inicial que ainda não foram visualizadas nesta sessão
  useEffect(() => {
    if (!currentMorador) return;

    try {
      const seenKey = `smartcondo_seen_enc_${currentMorador.id}`;
      const seenRaw = sessionStorage.getItem(seenKey);
      const seenIds: string[] = seenRaw ? JSON.parse(seenRaw) : [];

      // Procura a encomenda mais recente que ainda está na portaria e não foi vista nesta sessão
      const pendingEncomendas = encomendas.filter((e) => {
        if (e.status !== 'na_portaria') return false;
        const isDirect = e.moradorId === currentMorador.id;
        const isUnit =
          e.unidade &&
          currentMorador.unidade &&
          String(e.unidade.apto).trim().toLowerCase() ===
            String(currentMorador.unidade.apto).trim().toLowerCase();
        return (isDirect || isUnit) && !seenIds.includes(e.id);
      });

      if (pendingEncomendas.length > 0) {
        const newest = pendingEncomendas[0];
        // Registra como vista na sessão para não ficar reabrindo sem parar
        seenIds.push(newest.id);
        sessionStorage.setItem(seenKey, JSON.stringify(seenIds));

        // Dispara notificação nativa e abre o alerta
        notificationService.dispararNotificacaoNativa(
          `📦 Encomenda na Portaria — ${currentCondo.nome}`,
          {
            body: `Você possui pacote da ${newest.transportadora} aguardando retirada. Código PIN: ${newest.codigoResgate}.`,
            tag: `encomenda-alert-${newest.id}`,
            data: { url: '/', tab: 'encomendas', codigoResgate: newest.codigoResgate },
          }
        );

        setActiveAlert({
          encomenda: newest,
          moradorNome: currentMorador.nome,
        });
      }
    } catch {
      // ignore
    }
  }, [currentMorador?.id, encomendas.length]);

  const handleCopyPin = (pin: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopied(true);
      playNotificationSound('sucesso');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleEnablePush = async () => {
    const granted = await notificationService.solicitarPermissaoPush(currentMorador?.id);
    if (granted) {
      setPushStatus('granted');
      playNotificationSound('sucesso');
      notificationService.dispararNotificacaoNativa('✅ Notificações Ativadas no Celular!', {
        body: 'Agora você receberá avisos na barra do celular e com a tela bloqueada sempre que uma encomenda chegar!',
        tag: 'smartcondo-push-enabled',
      });
    } else {
      setPushStatus('denied');
    }
  };

  const handleTestLockScreenNotification = (encomenda?: Encomenda) => {
    if (pushStatus !== 'granted') {
      handleEnablePush();
      return;
    }

    setLockScreenCountdown(5);
    const enc = encomenda || activeAlert?.encomenda || {
      id: 'enc_teste',
      transportadora: 'Mercado Livre Express',
      codigoResgate: '739201',
      codigoRastreio: 'BR983210492',
    };

    let remaining = 5;
    const interval = setInterval(() => {
      remaining -= 1;
      setLockScreenCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setLockScreenCountdown(null);
        notificationService.agendarNotificacaoParaTelaBloqueada(0, {
          titulo: `📦 Encomenda Chegou! — ${currentCondo.nome}`,
          transportadora: enc.transportadora,
          codigoResgate: enc.codigoResgate,
          unidade: currentMorador ? `Apto ${currentMorador.unidade.apto}` : undefined,
        });
      }
    }, 1000);
  };

  if (!activeAlert) return null;

  const { encomenda } = activeAlert;
  const unitText = encomenda.unidade
    ? `${encomenda.unidade.bloco ? `Bloco ${encomenda.unidade.bloco} - ` : ''}Apto ${encomenda.unidade.apto}`
    : currentMorador
    ? `Apto ${currentMorador.unidade.apto}`
    : 'Sua Unidade';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Card Flutuante de Alerta na Tela do Celular */}
      <div className="bg-white dark:bg-[#0f172a] rounded-3xl border border-emerald-500/30 shadow-2xl max-w-md w-full overflow-hidden text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200">
        {/* Topo com Gradiente e Selo de Chegada */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
                <Package className="w-5 h-5 animate-bounce" />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-900/40 px-2.5 py-0.5 rounded-full inline-block">
                  Aviso na Tela do Celular
                </span>
                <h3 className="text-lg font-black leading-tight mt-0.5">
                  Encomenda na Portaria!
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveAlert(null)}
              className="p-1.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition cursor-pointer"
              title="Fechar alerta"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Corpo da Notificação com Detalhes e PIN de Resgate */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Informações da Transportadora e Unidade */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {encomenda.transportadora}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {unitText} • {encomenda.codigoRastreio || 'Volume Registrado'}
                </div>
              </div>
            </div>

            <span className="text-[10px] font-bold px-2 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-lg">
              Pronto
            </span>
          </div>

          {/* Destaque Gigante do Código PIN de 6 Dígitos */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 text-center relative overflow-hidden">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-1">
              Código de Resgate (Apresente na Portaria)
            </span>

            <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-emerald-700 dark:text-emerald-300 my-1">
              {encomenda.codigoResgate}
            </div>

            <div className="flex items-center justify-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleCopyPin(encomenda.codigoResgate)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>PIN Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Código PIN</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Banner de Ativação / Teste de Notificação com Celular Bloqueado */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Notificações com Tela Bloqueada
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  pushStatus === 'granted'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {pushStatus === 'granted' ? '✅ Ativado' : '⚠️ Não ativado'}
              </span>
            </div>

            {pushStatus !== 'granted' ? (
              <button
                type="button"
                onClick={handleEnablePush}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Ativar Notificações na Barra do Celular</span>
              </button>
            ) : (
              <div>
                {lockScreenCountdown !== null ? (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 text-amber-900 dark:text-amber-200 text-xs text-center font-bold animate-pulse">
                    ⏱️ Bloqueie o celular agora! A notificação chegará em{' '}
                    <span className="text-base font-black text-amber-700 dark:text-amber-400">
                      {lockScreenCountdown}s
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleTestLockScreenNotification(encomenda)}
                    className="w-full py-1.5 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Testar Notificação com Tela Bloqueada (5s)</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Ações Inferiores */}
          <div className="flex items-center gap-2 pt-1">
            {onOpenEncomendasTab && (
              <button
                type="button"
                onClick={() => {
                  setActiveAlert(null);
                  onOpenEncomendasTab();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Encomendas</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveAlert(null)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-98"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Entendido</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
