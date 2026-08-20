import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { UserRole, Condominio, Morador, UserAccount } from './types';
import { condoStore } from './services/mockStorage';
import { SidebarLayout } from './components/common/SidebarLayout';
import { defaultTabByRole } from './components/common/navConfig';
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
  const [activeTab, setActiveTab] = useState<string>(() => defaultTabByRole[currentUser?.role || 'morador'] || 'inicio');

  // Reset active tab when user role changes
  useEffect(() => {
    if (currentUser) {
      setActiveTab(defaultTabByRole[currentUser.role] || 'inicio');
    }
  }, [currentUser?.role]);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      <SidebarLayout
        currentUser={currentUser}
        currentCondo={currentCondo}
        condominios={condominios}
        setCondoId={setSelectedCondoId}
        notifications={notifications}
        onLogout={handleLogout}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      >
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
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}

          {currentUser.role === 'portaria' && (
            <PortariaDashboard
              condominio={currentCondo}
              moradores={moradores}
              encomendas={allEncomendasCondo}
              bikes={bikes}
              historicoLocacoes={historicoLocacoes}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
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
              activeTab={activeTab}
              setActiveTab={setActiveTab}
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
              activeTab={activeTab}
              setActiveTab={setActiveTab}
            />
          )}
        </ErrorBoundary>
      </SidebarLayout>

      {/* Modal de Chamada de Interfone em Tempo Real */}
      <LiveCallModal
        condominio={currentCondo}
        currentUser={currentUser}
        currentMorador={currentMorador}
      />

      {/* Modal / Prompt de Instalação PWA */}
      <PwaInstallPrompt />
    </div>
  );
}
