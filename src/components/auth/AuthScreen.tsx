import React, { useState } from 'react';
import {
  Building2,
  Lock,
  Mail,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus,
  LogIn,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { Condominio, UserAccount } from '../../types';
import { condoStore } from '../../services/mockStorage';
import { auth, googleProvider, syncMoradorToFirestore } from '../../services/firebase';
import { signInWithPopup } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { SmartCondoLogo } from '../common/SmartCondoLogo';

interface AuthScreenProps {
  condominios: Condominio[];
  onLoginSuccess: (user: UserAccount) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  condominios,
  onLoginSuccess,
}) => {
  const [tabMode, setTabMode] = useState<'login' | 'cadastro'>('login');
  const [cadastroTipo, setCadastroTipo] = useState<'email' | 'google'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Cadastro form state
  const [regNome, setRegNome] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regSenha, setRegSenha] = useState('');
  const [regSenhaConfirma, setRegSenhaConfirma] = useState('');
  const [regTelefone, setRegTelefone] = useState('');
  const [regCondoId, setRegCondoId] = useState(condominios[0]?.id || 'condo_park_avenue');
  const [regBloco, setRegBloco] = useState('');
  const [regApto, setRegApto] = useState('');

  // Google Onboarding State
  const [stepGoogleOnboarding, setStepGoogleOnboarding] = useState(false);
  const [onboardingGoogleData, setOnboardingGoogleData] = useState<{
    nome: string;
    email: string;
    avatarUrl: string;
  }>({
    nome: '',
    email: '',
    avatarUrl: '',
  });

  // Tela de aprovação pendente
  const [pendingMorador, setPendingMorador] = useState<{
    nome: string;
    condoNome: string;
    unidade: string;
    telefone: string;
    email: string;
  } | null>(null);

  // Formata telefone (XX) XXXXX-XXXX
  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 6) {
      val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    } else if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    setRegTelefone(val);
  };

  // 1. LOGIN COM E-MAIL E SENHA (VALIDAÇÃO RIGOROSA NO BANCO DE DADOS E FIRESTORE)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanSenha = loginSenha.trim();

    if (!cleanEmail) {
      setErrorMsg('Informe seu e-mail cadastrado.');
      return;
    }
    if (!cleanSenha) {
      setErrorMsg('Informe sua senha.');
      return;
    }

    setIsLoading(true);
    try {
      // Chama o autenticador do banco de dados (com sincronização Firestore em nuvem)
      const result = await condoStore.autenticarUsuarioAsync(cleanEmail, cleanSenha);

      if (!result.success) {
        if (result.status === 'pendente' && result.moradorData) {
          const m = result.moradorData;
          const condo = condoStore.getCondominio(m.condominioId);
          setPendingMorador({
            nome: m.nome,
            condoNome: condo?.nome || 'Condomínio',
            unidade: `Bloco ${m.unidade.bloco} - Apto ${m.unidade.apto}`,
            telefone: m.telefone,
            email: m.email,
          });
          return;
        }
        setErrorMsg(result.error || 'Credenciais inválidas. Verifique os dados digitados.');
        return;
      }

      // Login com sucesso
      if (result.user) {
        confetti({ particleCount: 40, spread: 60 });
        onLoginSuccess(result.user);
      }
    } catch {
      setErrorMsg('Erro de conexão ao validar credenciais. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. CADASTRO DE MORADOR COM E-MAIL E SENHA
  const handleCadastroEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regNome.trim() || !regEmail.trim() || !regSenha || !regTelefone.trim() || !regApto.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (regSenha.length < 6) {
      setErrorMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (regSenha !== regSenhaConfirma) {
      setErrorMsg('As senhas digitadas não coincidem.');
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();

    // Verifica se o e-mail já existe
    const existing = condoStore.findMoradorByEmail(cleanEmail);
    if (existing) {
      setErrorMsg('Este e-mail já está cadastrado. Tente entrar na sua conta na aba "Entrar".');
      return;
    }

    setIsLoading(true);
    try {
      const createdMorador = condoStore.solicitarCadastroMorador({
        condominioId: regCondoId,
        nome: regNome.trim(),
        email: cleanEmail,
        senha: regSenha.trim(),
        telefone: regTelefone.trim(),
        unidade: {
          bloco: regBloco.trim(),
          apto: regApto.trim(),
        },
        authProvider: 'email',
      });

      // Salva no Firestore
      try {
        await syncMoradorToFirestore(createdMorador);
      } catch (err) {
        console.warn('Sync Firestore aviso:', err);
      }

      const condo = condoStore.getCondominio(regCondoId);
      confetti({ particleCount: 70, spread: 70 });

      setPendingMorador({
        nome: createdMorador.nome,
        condoNome: condo?.nome || 'Condomínio',
        unidade: `Bloco ${createdMorador.unidade.bloco} - Apto ${createdMorador.unidade.apto}`,
        telefone: createdMorador.telefone,
        email: createdMorador.email,
      });
    } catch (err: any) {
      setErrorMsg('Erro ao registrar: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. FLUXO GOOGLE (LOGIN E CADASTRO REAL)
  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsLoading(true);

    try {
      let googleUser: { nome: string; email: string; avatarUrl: string } | null = null;

      try {
        const result = await signInWithPopup(auth, googleProvider);
        if (result.user && result.user.email) {
          googleUser = {
            nome: result.user.displayName || result.user.email.split('@')[0],
            email: result.user.email.trim().toLowerCase(),
            avatarUrl: result.user.photoURL || '',
          };
        }
      } catch (authErr: any) {
        if (
          authErr?.code === 'auth/popup-closed-by-user' ||
          authErr?.code === 'auth/cancelled-popup-request' ||
          authErr?.message?.includes('closed')
        ) {
          setErrorMsg('A janela de login com o Google foi fechada. Selecione sua conta Google para prosseguir ou use o login com e-mail e senha.');
        } else if (authErr?.code === 'auth/popup-blocked') {
          setErrorMsg('O popup do Google foi bloqueado pelo seu navegador. Por favor, permita popups para este site ou entre com e-mail e senha.');
        } else {
          setErrorMsg('Não foi possível conectar com o Google (' + (authErr?.message || 'Tente novamente') + '). Se preferir, utilize seu e-mail e senha cadastrados.');
        }
        setIsLoading(false);
        return;
      }

      if (!googleUser || !googleUser.email) {
        setErrorMsg('Nenhuma conta Google foi selecionada ou confirmada.');
        setIsLoading(false);
        return;
      }

      const userEmail = googleUser.email.toLowerCase();

      // 1. Se for o Super Admin Geral (Davi Leonardo)
      if (userEmail === 'davileonardo303@gmail.com') {
        onLoginSuccess({
          id: 'super_admin_davi',
          nome: googleUser.nome || 'Davi Leonardo',
          email: 'davileonardo303@gmail.com',
          role: 'super_admin',
          condominioId: condominios[0]?.id || '',
          statusCadastro: 'ativo',
          avatarUrl: googleUser.avatarUrl,
          authProvider: 'google',
        });
        setIsLoading(false);
        return;
      }

      // 2. Se for Síndico ou Portaria cadastrado no sistema
      const sysUser = condoStore.getUsuariosSistema().find(
        (u) => u.email.toLowerCase() === userEmail
      );
      if (sysUser) {
        onLoginSuccess({
          id: sysUser.id,
          nome: sysUser.nome,
          email: sysUser.email,
          telefone: sysUser.telefone,
          role: sysUser.role,
          condominioId: sysUser.condominioId,
          unidade: sysUser.unidade,
          statusCadastro: sysUser.statusCadastro,
          avatarUrl: googleUser.avatarUrl || sysUser.avatarUrl,
          authProvider: 'google',
        });
        setIsLoading(false);
        return;
      }

      // 3. Verifica se já é um morador cadastrado no condomínio
      const existing = condoStore.findMoradorByEmail(userEmail);
      if (existing) {
        if (existing.statusCadastro === 'pendente_aprovacao') {
          const condo = condoStore.getCondominio(existing.condominioId);
          setPendingMorador({
            nome: existing.nome,
            condoNome: condo?.nome || 'Condomínio',
            unidade: `Bloco ${existing.unidade.bloco} - Apto ${existing.unidade.apto}`,
            telefone: existing.telefone,
            email: existing.email,
          });
          setIsLoading(false);
          return;
        }

        if (existing.statusCadastro === 'recusado') {
          setErrorMsg('Seu cadastro neste condomínio foi recusado pela administração. Entre em contato com a portaria ou síndico.');
          setIsLoading(false);
          return;
        }

        if (existing.statusCadastro === 'ativo') {
          onLoginSuccess({
            id: existing.id,
            nome: existing.nome,
            email: existing.email,
            telefone: existing.telefone,
            role: 'morador',
            condominioId: existing.condominioId,
            unidade: existing.unidade,
            statusCadastro: 'ativo',
            avatarUrl: existing.avatarUrl || googleUser.avatarUrl,
            authProvider: 'google',
          });
          setIsLoading(false);
          return;
        }
      }

      // 4. Se for primeiro acesso via Google deste usuário (novo morador), abre o formulário de cadastro de unidade
      setOnboardingGoogleData(googleUser);
      setRegNome(googleUser.nome);
      setRegEmail(googleUser.email);
      setStepGoogleOnboarding(true);
    } catch (err: any) {
      setErrorMsg('Erro ao conectar com Google: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Submissão do onboarding Google
  const handleSubmitGoogleOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regNome.trim() || !regEmail.trim() || !regTelefone.trim() || !regApto.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const createdMorador = condoStore.solicitarCadastroMorador({
      condominioId: regCondoId,
      nome: regNome.trim(),
      email: regEmail.trim(),
      senha: 'google_authenticated',
      telefone: regTelefone.trim(),
      unidade: {
        bloco: regBloco.trim(),
        apto: regApto.trim(),
      },
      avatarUrl: onboardingGoogleData.avatarUrl,
      authProvider: 'google',
    });

    try {
      await syncMoradorToFirestore(createdMorador);
    } catch (err) {
      console.warn('Sync Firestore aviso:', err);
    }

    const condo = condoStore.getCondominio(regCondoId);
    confetti({ particleCount: 60, spread: 70 });

    setPendingMorador({
      nome: createdMorador.nome,
      condoNome: condo?.nome || 'Condomínio',
      unidade: `Bloco ${createdMorador.unidade.bloco} - Apto ${createdMorador.unidade.apto}`,
      telefone: createdMorador.telefone,
      email: createdMorador.email,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 selection:bg-emerald-600 selection:text-white">
      {/* Background Decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-600/30 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header do Card com a Logo Oficial do SmartCondo */}
        <div className="bg-slate-900 px-6 py-5 text-white border-b border-slate-800">
          <div className="flex items-center justify-between">
            <SmartCondoLogo
              size="lg"
              showText={true}
              showTagline={true}
              textColor="light"
            />
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-slate-800 text-emerald-300 border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5" />
              Firebase Conectado
            </span>
          </div>
        </div>

        {/* Corpo do Login / Cadastro */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* TELA 1: CADASTRO ENVIADO / PENDENTE DE APROVAÇÃO */}
          {pendingMorador ? (
            <div className="space-y-6 text-center py-2 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 border-2 border-amber-200 text-amber-600 flex items-center justify-center shadow-sm">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                  Aguardando Aprovação do Síndico
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-3">
                  Cadastro Enviado com Sucesso!
                </h2>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                  Olá, <strong className="text-slate-900">{pendingMorador.nome}</strong>. Sua solicitação de acesso foi salva no banco de dados e enviada para aprovação do Síndico e da Administração.
                </p>
              </div>

              {/* Card com os dados cadastrados */}
              <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Condomínio:</span>
                  <span className="font-bold text-slate-900">{pendingMorador.condoNome}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Unidade:</span>
                  <span className="font-bold text-slate-900">{pendingMorador.unidade}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">WhatsApp:</span>
                  <span className="font-bold text-slate-900">{pendingMorador.telefone}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-semibold">E-mail:</span>
                  <span className="font-bold text-slate-900">{pendingMorador.email}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Assim que o síndico autorizar, você poderá logar com sua senha normalmente.</span>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setPendingMorador(null);
                    setStepGoogleOnboarding(false);
                    setTabMode('login');
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  Voltar para Tela de Login
                </button>
              </div>
            </div>
          ) : stepGoogleOnboarding ? (
            /* TELA 2: COMPLEMENTAÇÃO DE CADASTRO GOOGLE */
            <form onSubmit={handleSubmitGoogleOnboarding} className="space-y-4 animate-in fade-in">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0">
                  {onboardingGoogleData.nome.charAt(0) || 'G'}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-emerald-950">
                    Primeiro Acesso Google: {onboardingGoogleData.nome}
                  </h3>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    {onboardingGoogleData.email} • Informe sua unidade no condomínio:
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Seleção do Condomínio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Qual é o seu Condomínio? *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <select
                    value={regCondoId}
                    onChange={(e) => setRegCondoId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {condominios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} — {c.endereco ? `${c.endereco}, ` : ''}{c.cidade}/{c.uf}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bloco e Apartamento */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bloco / Torre *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Torre 1, Bloco B..."
                    value={regBloco}
                    onChange={(e) => setRegBloco(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Apartamento / Unidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 302, 14B"
                    value={regApto}
                    onChange={(e) => setRegApto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp / Celular para Notificações *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={regTelefone}
                    onChange={handleTelefoneChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                  <span>📲</span> Você receberá no seu WhatsApp avisos de encomendas, senha de bikes, reservas e comunicados.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStepGoogleOnboarding(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  <span>Enviar para Aprovação</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* TELA PRINCIPAL: SELETOR DE ABAS (ENTRAR / CRIAR CONTA) */
            <div className="space-y-5">
              {/* Abas de Navegação */}
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                <button
                  id="tab-login-btn"
                  type="button"
                  onClick={() => {
                    setTabMode('login');
                    setErrorMsg('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                    tabMode === 'login'
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar no Sistema</span>
                </button>

                <button
                  id="tab-cadastro-btn"
                  type="button"
                  onClick={() => {
                    setTabMode('cadastro');
                    setErrorMsg('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                    tabMode === 'cadastro'
                      ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Cadastrar-se</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span className="font-medium">{errorMsg}</span>
                </div>
              )}

              {/* ABA 1: ENTRAR NO SISTEMA */}
              {tabMode === 'login' ? (
                <div className="space-y-4">
                  {/* Botão Conectar com Google */}
                  <button
                    id="btn-google-login"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm transition active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Entrar com a Conta Google</span>
                  </button>

                  {/* Divisor */}
                  <div className="relative flex py-0.5 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      ou entre com e-mail e senha
                    </span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  {/* Formulário de Login */}
                  <form onSubmit={handleEmailLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail de Acesso
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          id="input-login-email"
                          type="email"
                          required
                          placeholder="ex: davileonardo303@gmail.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-slate-700">
                          Senha
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1"
                        >
                          {showPassword ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Ocultar</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Mostrar</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          id="input-login-senha"
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Digite sua senha cadastrada"
                          value={loginSenha}
                          onChange={(e) => setLoginSenha(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <button
                      id="btn-submit-login"
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Acessar o Sistema</span>
                    </button>
                  </form>
                </div>
              ) : (
                /* ABA 2: CADASTRAR-SE / SOLICITAR ACESSO */
                <form onSubmit={handleCadastroEmail} className="space-y-3.5 animate-in fade-in">
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 text-xs text-emerald-900">
                    <p className="font-semibold">
                      Cadastre seus dados para solicitar acesso ao condomínio. O síndico fará a aprovação da sua unidade.
                    </p>
                  </div>

                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        placeholder="Ex: João da Silva"
                        value={regNome}
                        onChange={(e) => setRegNome(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* E-mail e Telefone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        E-mail *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          required
                          placeholder="seu.email@exemplo.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        WhatsApp / Celular *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          placeholder="(11) 98765-4321"
                          value={regTelefone}
                          onChange={handleTelefoneChange}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Senha e Confirmação */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Criar Senha *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="password"
                          required
                          placeholder="Mínimo 6 dígitos"
                          value={regSenha}
                          onChange={(e) => setRegSenha(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirmar Senha *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="password"
                          required
                          placeholder="Repita sua senha"
                          value={regSenhaConfirma}
                          onChange={(e) => setRegSenhaConfirma(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Condomínio */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Selecione seu Condomínio *
                    </label>
                    {condominios.length > 0 ? (
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <select
                          value={regCondoId}
                          onChange={(e) => setRegCondoId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          {condominios.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nome} — {c.endereco ? `${c.endereco}, ` : ''}{c.cidade}/{c.uf}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                        Nenhum condomínio cadastrado no momento. O Administrador Geral (Davi Leonardo) deve cadastrar o primeiro condomínio no painel administrativo antes de novos cadastros de moradores.
                      </div>
                    )}
                  </div>

                  {/* Bloco e Apto */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Bloco / Torre *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={condominios.length === 0}
                        placeholder="Ex: Torre 1, Bloco B..."
                        value={regBloco}
                        onChange={(e) => setRegBloco(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Apartamento / Unidade *
                      </label>
                      <input
                        type="text"
                        required
                        disabled={condominios.length === 0}
                        placeholder="Ex: 302, 14B"
                        value={regApto}
                        onChange={(e) => setRegApto(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || condominios.length === 0}
                    className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <span>{isLoading ? 'Cadastrando...' : 'Cadastrar e Enviar para Aprovação'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
