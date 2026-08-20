import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { UserRole, Condominio, Morador, UserAccount } from './types';
import { condoStore } from './services/mockStorage';
import { Header } from './components/common/Header';
import { AuthScreen } from './components/auth/AuthScreen';
import { MoradorDashboard } from './components/morador/MoradorDashboard';
import { PortariaDashboard } from './components/portaria/PortariaDashboard';
import { SindicoDashboard } from './components/sindico/SindicoDashboard';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { LiveCallModal } from './components/interfone/LiveCallModal';
import { auth, testFirestoreConnection, logoutFirebase } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { APP_VERSION, APP_NAME } from './constants/version';

import { ErrorBoundary } from './components/common/ErrorBoundary';

export default function App() {
  // Subscribe to condoStore reactive updates
  useSyncExternalStore(
    (listener) => condoStore.subscribe(listener),
    () => condoStore.getVersion()
  );

  // Testa conexão com Firestore ao inicializar
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Sessão do usuário logado (null se não autenticado)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedSession = localStorage.getItem('smartcondo_session_v1');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.email) {
          return parsed;
        }
      }
    } catch {
      // Ignora erro de parsing
    }
    return null;
  });

  const [selectedCondoId, setSelectedCondoId] = useState<string>('condo_park_avenue');

  const condominios = condoStore.getCondominios();
  const effectiveCondoId = currentUser?.condominioId || selectedCondoId;
  const currentCondo =
    condominios.find((c) => c.id === effectiveCondoId) ||
    condominios[0] || {
      id: 'condo_park_avenue',
      nome: 'Residencial Park Avenue',
      cnpj: '34.892.110/0001-45',
      endereco: 'Av. Paulista, 2100',
      cidade: 'São Paulo',
      uf: 'SP',
      totalUnidades: 120,
      statusAssinatura: 'ativo',
      plano: 'Pro',
      sindicoNome: 'Carlos Eduardo Mendes',
      sindicoEmail: 'carlos.mendes@parkavenue.com.br',
      regras: {
        limiteTempoBikeMinutos: 180,
        limiteBikesPorMorador: 1,
        horarioBicicletario: '06:00 às 22:00',
        diasAntecedenciaReserva: 30,
        taxaReservaSalao: 150,
      },
    };

  const moradores = condoStore.getMoradores(currentCondo.id, false);
  const currentMorador: Morador = currentUser && currentUser.role === 'morador'
    ? {
        id: currentUser.id,
        condominioId: currentCondo.id,
        nome: currentUser.nome,
        email: currentUser.email,
        telefone: currentUser.telefone || '(11) 98765-4321',
        unidade: currentUser.unidade || { bloco: 'A', apto: '302' },
        statusAdimplencia: 'em_dia',
        statusCadastro: currentUser.statusCadastro,
      }
    : (moradores.find((m) => m.id === currentUser?.id) || moradores[0] || {
        id: 'morador_davi',
        condominioId: currentCondo.id,
        nome: 'Davi Leonardo',
        email: 'davileonardo303@gmail.com',
        telefone: '(11) 98765-4321',
        unidade: { bloco: 'A', apto: '302' },
        statusAdimplencia: 'em_dia',
        statusCadastro: 'ativo',
      });

  const bikes = condoStore.getBikes(currentCondo.id);
  const encomendas = condoStore.getEncomendas(
    currentCondo.id,
    currentUser?.role === 'morador' ? currentMorador : undefined
  );
  const allEncomendasCondo = condoStore.getEncomendas(currentCondo.id);
  const areasLazer = condoStore.getAreasLazer(currentCondo.id);
  const reservas = condoStore.getReservas(currentCondo.id);
  const avisos = condoStore.getAvisos(currentCondo.id);
  const historicoLocacoes = condoStore.getHistoricoLocacoes(currentCondo.id);
  const notifications = condoStore.getNotificacoes(
    currentCondo.id,
    currentUser?.role === 'morador' ? currentMorador.id : undefined
  );

  const handleLogout = async () => {
    try {
      localStorage.removeItem('smartcondo_session_v1');
    } catch {
      // ignore
    }
    try {
      await logoutFirebase();
    } catch (e) {
      console.warn('Logout Firebase error:', e);
    }
    setCurrentUser(null);
  };

  // Se não houver usuário conectado, exibe a tela de login / primeiro acesso
  if (!currentUser) {
    return (
      <ErrorBoundary fallbackTitle="Erro ao carregar a tela de login">
        <AuthScreen
          condominios={condominios}
          onLoginSuccess={(user) => {
            try {
              localStorage.setItem('smartcondo_session_v1', JSON.stringify(user));
            } catch {
              // ignore
            }
            setCurrentUser(user);
            setSelectedCondoId(user.condominioId);
          }}
        />
        <PwaInstallPrompt />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#F0F5F2] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Barra Superior de Navegação Limpa (Sem Menu Demonstração) */}
      <Header
        currentUser={currentUser}
        currentCondo={currentCondo}
        setCondoId={setSelectedCondoId}
        condominios={condominios}
        notifications={notifications}
        onLogout={handleLogout}
      />

      {/* Conteúdo Principal com base no Perfil Logado */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden pb-16">
        <ErrorBoundary fallbackTitle="Erro ao carregar o painel do usuário">
          {currentUser.role === 'morador' && (
            <MoradorDashboard
              condominio={currentCondo}
              morador={currentMorador}
              bikes={bikes}
              encomendas={encomendas}
              areasLazer={areasLazer}
              reservas={reservas}
              avisos={avisos}
              historicoLocacoes={historicoLocacoes}
            />
          )}

          {currentUser.role === 'portaria' && (
            <PortariaDashboard
              condominio={currentCondo}
              moradores={moradores}
              encomendas={allEncomendasCondo}
              bikes={bikes}
              historicoLocacoes={historicoLocacoes}
            />
          )}

          {currentUser.role === 'sindico' && (
            <SindicoDashboard
              condominio={currentCondo}
              moradores={moradores}
              bikes={bikes}
              areasLazer={areasLazer}
              reservas={reservas}
              avisos={avisos}
            />
          )}

          {currentUser.role === 'super_admin' && (
            <SuperAdminDashboard
              condominios={condominios}
              onSelectCondo={(id) => {
                setSelectedCondoId(id);
              }}
              setCurrentRole={(role) => {
                if (role !== 'super_admin') {
                  setCurrentUser((prev) => (prev ? { ...prev, role } : null));
                }
              }}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Rodapé do Sistema */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700">{APP_NAME}</span>
            <span className="text-slate-400">•</span>
            <span>Gestão Residencial 100% Integrada</span>
            <span className="bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
              v{APP_VERSION}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Condomínio: <strong className="text-slate-700">{currentCondo.nome}</strong></span>
            <span>•</span>
            <span>Perfil Ativo: <strong className="text-emerald-700 uppercase">{currentUser.role}</strong></span>
          </div>
        </div>
      </footer>

      {/* Modal de Chamada de Interfone em Tempo Real (Estilo WhatsApp / Instagram / Face) */}
      <LiveCallModal
        condominio={currentCondo}
        currentUser={currentUser}
        currentMorador={currentMorador}
      />

      {/* Modal / Prompt de Instalação PWA (Dispositivos Móveis, Tablets, Desktops, iPhones, iPads) */}
      <PwaInstallPrompt />
    </div>
  );
}
