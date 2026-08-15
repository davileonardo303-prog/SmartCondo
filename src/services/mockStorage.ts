import {
  Condominio,
  Morador,
  Bicicleta,
  HistoricoLocacao,
  Encomenda,
  AreaLazer,
  Reserva,
  Aviso,
  AppNotification,
  Unidade,
  UsuarioSistema,
  UserAccount,
} from '../types';
import { whatsappService } from './whatsappService';

const STORAGE_KEY_PREFIX = 'smartcondo_clean_v6';

// Credenciais Únicas de Acesso Global (Super Administrador)
const INITIAL_USUARIOS_SISTEMA: UsuarioSistema[] = [
  {
    id: 'super_admin_davi',
    nome: 'Davi Leonardo',
    email: 'davileonardo303@gmail.com',
    senha: 'Perfumaria20',
    role: 'super_admin',
    condominioId: '',
    statusCadastro: 'ativo',
    authProvider: 'email',
  },
];

// Banco de Dados Limpo / Zerado
const INITIAL_CONDOMINIOS: Condominio[] = [];
const INITIAL_MORADORES: Record<string, Morador[]> = {};
const INITIAL_BIKES: Record<string, Bicicleta[]> = {};
const INITIAL_HISTORICO_LOCACOES: Record<string, HistoricoLocacao[]> = {};
const INITIAL_ENCOMENDAS: Record<string, Encomenda[]> = {};
const INITIAL_AREAS_LAZER: Record<string, AreaLazer[]> = {};
const INITIAL_RESERVAS: Record<string, Reserva[]> = {};
const INITIAL_AVISOS: Record<string, Aviso[]> = {};
const INITIAL_NOTIFICACOES: AppNotification[] = [];

type Listener = () => void;

class MockCondoStore {
  private condominios: Condominio[] = [];
  private moradores: Record<string, Morador[]> = {};
  private usuariosSistema: UsuarioSistema[] = [];
  private bikes: Record<string, Bicicleta[]> = {};
  private historicoLocacoes: Record<string, HistoricoLocacao[]> = {};
  private encomendas: Record<string, Encomenda[]> = {};
  private areasLazer: Record<string, AreaLazer[]> = {};
  private reservas: Record<string, Reserva[]> = {};
  private avisos: Record<string, Aviso[]> = {};
  private notificacoes: AppNotification[] = [];
  private listeners: Set<Listener> = new Set();
  private version = 0;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.condominios = parsed.condominios || [];
        this.moradores = parsed.moradores || {};
        this.bikes = parsed.bikes || {};
        this.historicoLocacoes = parsed.historicoLocacoes || {};
        this.encomendas = parsed.encomendas || {};
        this.areasLazer = parsed.areasLazer || {};
        this.reservas = parsed.reservas || {};
        this.avisos = parsed.avisos || {};
        this.notificacoes = parsed.notificacoes || [];

        // Garante que o Super Admin Davi Leonardo sempre existe com a senha correta
        const savedUsers: UsuarioSistema[] = parsed.usuariosSistema || [];
        const superAdminIndex = savedUsers.findIndex(
          (u) => u.email.toLowerCase() === 'davileonardo303@gmail.com'
        );
        if (superAdminIndex >= 0) {
          savedUsers[superAdminIndex].senha = 'Perfumaria20';
          savedUsers[superAdminIndex].role = 'super_admin';
        } else {
          savedUsers.unshift(INITIAL_USUARIOS_SISTEMA[0]);
        }

        this.usuariosSistema = savedUsers;
        return;
      }
    } catch {
      // fallback to initial
    }

    this.condominios = [];
    this.moradores = {};
    this.usuariosSistema = [...INITIAL_USUARIOS_SISTEMA];
    this.bikes = {};
    this.historicoLocacoes = {};
    this.encomendas = {};
    this.areasLazer = {};
    this.reservas = {};
    this.avisos = {};
    this.notificacoes = [];
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      const data = {
        condominios: this.condominios,
        moradores: this.moradores,
        usuariosSistema: this.usuariosSistema,
        bikes: this.bikes,
        historicoLocacoes: this.historicoLocacoes,
        encomendas: this.encomendas,
        areasLazer: this.areasLazer,
        reservas: this.reservas,
        avisos: this.avisos,
        notificacoes: this.notificacoes,
      };
      localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(data));
    } catch {
      // Storage limits or sandbox exception
    }
  }

  public zerarBancoDados() {
    this.condominios = [];
    this.moradores = {};
    this.usuariosSistema = [
      {
        id: 'super_admin_davi',
        nome: 'Davi Leonardo',
        email: 'davileonardo303@gmail.com',
        senha: 'Perfumaria20',
        role: 'super_admin',
        condominioId: '',
        statusCadastro: 'ativo',
        authProvider: 'email',
      },
    ];
    this.bikes = {};
    this.historicoLocacoes = {};
    this.encomendas = {};
    this.areasLazer = {};
    this.reservas = {};
    this.avisos = {};
    this.notificacoes = [];
    whatsappService.limparHistorico();
    this.saveToStorage();
    this.notify();
  }

  public getVersion(): number {
    return this.version;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.version++;
    this.saveToStorage();
    this.listeners.forEach((listener) => listener());
  }

  public resetToDefault() {
    localStorage.removeItem(STORAGE_KEY_PREFIX);
    this.loadFromStorage();
    this.notify();
  }

  // --- Condomínios / Super Admin ---
  public getCondominios(): Condominio[] {
    return [...this.condominios];
  }

  public getCondominio(id: string): Condominio | undefined {
    return this.condominios.find((c) => c.id === id);
  }

  public addCondominio(condo: Omit<Condominio, 'id'>): Condominio {
    const newId = `condo_${Date.now()}`;
    const newCondo: Condominio = { ...condo, id: newId };
    this.condominios.push(newCondo);
    this.moradores[newId] = [];
    this.bikes[newId] = [];
    this.historicoLocacoes[newId] = [];
    this.encomendas[newId] = [];
    this.areasLazer[newId] = [
      {
        id: `area_pisc_${Date.now()}`,
        condominioId: newId,
        nome: 'Piscina Principal',
        tipo: 'piscina',
        status: 'aberto',
        aviso: 'Liberada para uso normal.',
        atualizadoEm: Date.now(),
        capacidade: 30,
        permiteReserva: false,
        taxaReserva: 0,
        horarioFuncionamento: '07:00 às 22:00',
      },
    ];
    this.reservas[newId] = [];
    this.avisos[newId] = [];
    this.notify();
    return newCondo;
  }

  public updateCondominioStatus(id: string, status: 'ativo' | 'suspenso' | 'em_teste') {
    const condo = this.condominios.find((c) => c.id === id);
    if (condo) {
      condo.statusAssinatura = status;
      this.notify();
    }
  }

  public updateCondominio(id: string, data: Partial<Condominio>) {
    const condo = this.condominios.find((c) => c.id === id);
    if (condo) {
      Object.assign(condo, data);
      this.notify();
    }
  }

  // --- Autenticação e Gestão de Usuários / Síndicos ---
  public autenticarUsuario(
    email: string,
    senha: string
  ): {
    success: boolean;
    user?: UserAccount;
    error?: string;
    status?: 'pendente' | 'recusado';
    moradorData?: Morador;
  } {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanSenha = senha.trim();

    if (!normalizedEmail) {
      return { success: false, error: 'Por favor, informe seu e-mail.' };
    }
    if (!cleanSenha) {
      return { success: false, error: 'Por favor, informe sua senha.' };
    }

    // 1. Procura em Usuários Administrativos (Super Admin, Síndicos, Portaria)
    const sysUser = this.usuariosSistema.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    );

    if (sysUser) {
      if (sysUser.senha !== cleanSenha) {
        return {
          success: false,
          error:
            sysUser.role === 'super_admin'
              ? 'Senha incorreta para a conta de Administrador Geral.'
              : sysUser.role === 'sindico'
              ? 'Senha incorreta para esta conta de Síndico.'
              : 'Senha incorreta para esta conta da Portaria.',
        };
      }

      return {
        success: true,
        user: {
          id: sysUser.id,
          nome: sysUser.nome,
          email: sysUser.email,
          telefone: sysUser.telefone,
          role: sysUser.role,
          condominioId: sysUser.condominioId,
          unidade: sysUser.unidade,
          statusCadastro: 'ativo',
          avatarUrl: sysUser.avatarUrl,
          authProvider: 'email',
        },
      };
    }

    // 2. Procura em Moradores
    const morador = this.findMoradorByEmail(normalizedEmail);
    if (morador) {
      if (morador.statusCadastro === 'pendente_aprovacao') {
        return {
          success: false,
          status: 'pendente',
          error: 'Seu cadastro ainda está em análise aguardando aprovação do síndico.',
          moradorData: morador,
        };
      }

      if (morador.statusCadastro === 'recusado') {
        return {
          success: false,
          status: 'recusado',
          error: 'Seu cadastro foi recusado pela administração do condomínio.',
          moradorData: morador,
        };
      }

      // Validação de senha do morador
      const expectedSenha = morador.senha || 'morador123';
      if (cleanSenha !== expectedSenha) {
        return {
          success: false,
          error: 'Senha incorreta. Verifique suas credenciais e tente novamente.',
        };
      }

      return {
        success: true,
        user: {
          id: morador.id,
          nome: morador.nome,
          email: morador.email,
          telefone: morador.telefone,
          role: 'morador',
          condominioId: morador.condominioId,
          unidade: morador.unidade,
          statusCadastro: 'ativo',
          avatarUrl: morador.avatarUrl,
          authProvider: morador.authProvider || 'email',
        },
      };
    }

    // 3. Se não existe no banco de dados
    return {
      success: false,
      error:
        'E-mail não cadastrado no banco de dados. Clique na aba "Criar Conta" para solicitar sua entrada no condomínio.',
    };
  }

  public cadastrarSindico(dados: {
    nome: string;
    email: string;
    senha: string;
    condominioId: string;
    telefone?: string;
  }): UsuarioSistema {
    const newId = `sindico_${Date.now()}`;
    const newSindico: UsuarioSistema = {
      id: newId,
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      senha: dados.senha.trim(),
      telefone: dados.telefone?.trim() || '',
      role: 'sindico',
      condominioId: dados.condominioId,
      statusCadastro: 'ativo',
      authProvider: 'email',
    };

    // Remove eventual registro anterior com mesmo e-mail
    this.usuariosSistema = this.usuariosSistema.filter(
      (u) => u.email.toLowerCase() !== newSindico.email
    );
    this.usuariosSistema.push(newSindico);

    // Atualiza dados no condomínio
    const condo = this.condominios.find((c) => c.id === dados.condominioId);
    if (condo) {
      condo.sindicoNome = newSindico.nome;
      condo.sindicoEmail = newSindico.email;
    }

    this.notify();
    return newSindico;
  }

  public getSindicos(): UsuarioSistema[] {
    return this.usuariosSistema.filter((u) => u.role === 'sindico');
  }

  public getUsuariosSistema(): UsuarioSistema[] {
    return [...this.usuariosSistema];
  }

  public removerSindico(sindicoId: string) {
    this.usuariosSistema = this.usuariosSistema.filter((u) => u.id !== sindicoId);
    this.notify();
  }

  // --- Moradores & Aprovações ---
  public getMoradores(condoId: string, onlyActive = true): Morador[] {
    const list = this.moradores[condoId] || [];
    if (!onlyActive) return [...list];
    return list.filter((m) => m.statusCadastro === 'ativo');
  }

  public getMoradoresPendentes(condoId?: string): Morador[] {
    if (condoId) {
      return (this.moradores[condoId] || []).filter((m) => m.statusCadastro === 'pendente_aprovacao');
    }
    const all: Morador[] = [];
    Object.values(this.moradores).forEach((list) => {
      list.forEach((m) => {
        if (m.statusCadastro === 'pendente_aprovacao') all.push(m);
      });
    });
    return all;
  }

  public getMorador(condoId: string, moradorId: string): Morador | undefined {
    return (this.moradores[condoId] || []).find((m) => m.id === moradorId);
  }

  public findMoradorByEmail(email: string): Morador | undefined {
    const normalized = email.trim().toLowerCase();
    for (const list of Object.values(this.moradores)) {
      const found = list.find((m) => m.email.trim().toLowerCase() === normalized);
      if (found) return found;
    }
    return undefined;
  }

  public solicitarCadastroMorador(data: {
    condominioId: string;
    nome: string;
    email: string;
    senha?: string;
    telefone: string;
    unidade: Unidade;
    avatarUrl?: string;
    authProvider?: 'google' | 'email';
  }): Morador {
    const newId = `morador_${Date.now()}`;
    const newMorador: Morador = {
      id: newId,
      condominioId: data.condominioId,
      nome: data.nome,
      email: data.email.trim().toLowerCase(),
      senha: data.senha || 'morador123',
      telefone: data.telefone,
      unidade: data.unidade,
      statusAdimplencia: 'em_dia',
      statusCadastro: 'pendente_aprovacao',
      avatarUrl: data.avatarUrl,
      solicitadoEm: Date.now(),
      authProvider: data.authProvider || 'email',
    };

    if (!this.moradores[data.condominioId]) {
      this.moradores[data.condominioId] = [];
    }
    this.moradores[data.condominioId].push(newMorador);

    // Cria notificação para o síndico
    this.addNotification({
      condominioId: data.condominioId,
      titulo: 'Novo Cadastro de Morador',
      mensagem: `${data.nome} (Bl. ${data.unidade.bloco} - Apto ${data.unidade.apto}) solicitou acesso ao condomínio.`,
      tipo: 'sistema',
    });

    this.notify();
    return newMorador;
  }

  public aprovarMorador(condoId: string, moradorId: string, aprovadorNome: string): boolean {
    const list = this.moradores[condoId] || [];
    const morador = list.find((m) => m.id === moradorId);
    if (!morador) return false;

    morador.statusCadastro = 'ativo';
    morador.aprovadoPor = aprovadorNome;
    morador.aprovadoEm = Date.now();

    this.addNotification({
      condominioId: condoId,
      paraMoradorId: morador.id,
      titulo: 'Cadastro Aprovado!',
      mensagem: `Bem-vindo(a) ao condomínio! Seu acesso ao bicicletário e áreas comuns foi liberado por ${aprovadorNome}.`,
      tipo: 'sistema',
    });

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'cadastro',
      titulo: '🎉 Cadastro Aprovado no Condomínio',
      corpoMensagem: `Seu cadastro no condomínio foi *APROVADO* por ${aprovadorNome}!\n\nAgora você já pode acessar o sistema para:\n🚲 Destravar bicicletas do bicicletário\n📦 Acompanhar encomendas na portaria\n🏊 Agendar áreas comuns e salão de festas`,
    });

    this.notify();
    return true;
  }

  public recusarMorador(condoId: string, moradorId: string): boolean {
    const list = this.moradores[condoId] || [];
    const morador = list.find((m) => m.id === moradorId);
    if (!morador) return false;

    morador.statusCadastro = 'recusado';

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'cadastro',
      titulo: '⚠️ Solicitação de Cadastro',
      corpoMensagem: `Informamos que sua solicitação de acesso não pôde ser aprovada no momento. Por favor, entre em contato com a administração do condomínio para conferência da documentação da unidade.`,
    });

    this.notify();
    return true;
  }

  public addMorador(condoId: string, morador: Omit<Morador, 'id' | 'condominioId'>): Morador {
    const newId = `morador_${Date.now()}`;
    const newM: Morador = {
      ...morador,
      id: newId,
      condominioId: condoId,
      statusCadastro: morador.statusCadastro || 'ativo',
      senha: morador.senha || 'morador123',
    };
    if (!this.moradores[condoId]) this.moradores[condoId] = [];
    this.moradores[condoId].push(newM);
    this.notify();
    return newM;
  }

  public updateMorador(condoId: string, moradorId: string, data: Partial<Morador>) {
    const list = this.moradores[condoId] || [];
    const m = list.find((x) => x.id === moradorId);
    if (m) {
      Object.assign(m, data);
      this.notify();
    }
  }

  public deleteMorador(condoId: string, moradorId: string) {
    if (this.moradores[condoId]) {
      this.moradores[condoId] = this.moradores[condoId].filter((m) => m.id !== moradorId);
      this.notify();
    }
  }

  public updateMoradorAdimplencia(condoId: string, moradorId: string, status: 'em_dia' | 'com_pendencia') {
    const list = this.moradores[condoId] || [];
    const m = list.find((x) => x.id === moradorId);
    if (m) {
      m.statusAdimplencia = status;
      this.notify();
    }
  }

  // --- Bicicletas (Core Module) ---
  public getBikes(condoId: string): Bicicleta[] {
    return [...(this.bikes[condoId] || [])];
  }

  public getBike(condoId: string, bikeId: string): Bicicleta | undefined {
    return (this.bikes[condoId] || []).find((b) => b.id === bikeId || b.codigo === bikeId || b.qrToken === bikeId);
  }

  public addBike(condoId: string, bike: Omit<Bicicleta, 'id' | 'condominioId'>): Bicicleta {
    const newId = `bike_${Date.now()}`;
    const newB: Bicicleta = { ...bike, id: newId, condominioId: condoId };
    if (!this.bikes[condoId]) this.bikes[condoId] = [];
    this.bikes[condoId].push(newB);
    this.notify();
    return newB;
  }

  public updateBike(condoId: string, bikeId: string, data: Partial<Bicicleta>) {
    const bike = this.getBike(condoId, bikeId);
    if (bike) {
      Object.assign(bike, data);
      this.notify();
    }
  }

  public deleteBike(condoId: string, bikeId: string) {
    if (this.bikes[condoId]) {
      this.bikes[condoId] = this.bikes[condoId].filter((b) => b.id !== bikeId);
      this.notify();
    }
  }

  public updateBikeStatus(
    condoId: string,
    bikeId: string,
    status: 'disponivel' | 'em_uso' | 'manutencao',
    avarias?: string[]
  ) {
    const bike = this.getBike(condoId, bikeId);
    if (bike) {
      bike.status = status;
      if (status === 'disponivel') {
        bike.usuarioAtualId = null;
        bike.usuarioAtualNome = null;
        bike.usuarioAtualUnidade = null;
        bike.inicioUsoTimestamp = null;
      }
      if (avarias) {
        bike.avariasAtuais = avarias;
      }
      this.notify();
    }
  }

  // Checkout / Retirada
  public checkoutBike(
    condoId: string,
    bikeIdOrCode: string,
    moradorId: string
  ): { success: boolean; message: string; bike?: Bicicleta; lockPassword?: string } {
    const morador = this.getMorador(condoId, moradorId);
    if (!morador) {
      return { success: false, message: 'Morador não encontrado no sistema.' };
    }

    if (morador.statusAdimplencia === 'com_pendencia') {
      return {
        success: false,
        message: 'Acesso bloqueado: Unidade com pendências cadastrais/financeiras. Procure a administração.',
      };
    }

    // Regra: Limite de 1 bike ativa por morador
    const allBikes = this.getBikes(condoId);
    const hasActiveBike = allBikes.some((b) => b.status === 'em_uso' && b.usuarioAtualId === moradorId);
    if (hasActiveBike) {
      return {
        success: false,
        message: 'Você já possui uma bicicleta ativa em uso. Finalize a viagem atual antes de retirar outra.',
      };
    }

    const bike = this.getBike(condoId, bikeIdOrCode);
    if (!bike) {
      return { success: false, message: 'Bicicleta ou código QR não localizado no condomínio.' };
    }

    if (bike.status === 'em_uso') {
      return { success: false, message: `A bicicleta ${bike.codigo} já está em uso por outro morador.` };
    }

    if (bike.status === 'manutencao') {
      return { success: false, message: `A bicicleta ${bike.codigo} está interditada para manutenção.` };
    }

    // Process checkout
    bike.status = 'em_uso';
    bike.usuarioAtualId = morador.id;
    bike.usuarioAtualNome = morador.nome;
    bike.usuarioAtualUnidade = `Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}`;
    bike.inicioUsoTimestamp = Date.now();
    bike.localizacaoAtual = 'Em trânsito com morador';

    // Log notification
    this.addNotification({
      condominioId: condoId,
      paraMoradorId: morador.id,
      titulo: `🚲 Desbloqueio Liberado: ${bike.codigo}`,
      mensagem: `Senha do cadeado: ${bike.lockPassword}. Use com responsabilidade e respeite o limite de tempo.`,
      tipo: 'bike',
    });

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'bike_retirada',
      titulo: `🚲 Retirada de Bike: ${bike.codigo}`,
      corpoMensagem: `Você acabou de destravar a bicicleta *${bike.codigo}* (${bike.modelo}).\n\n🔑 *Senha do Cadeado:* \`${bike.lockPassword}\`\n⏱️ *Limite de Uso:* 60 minutos\n📍 *Local de Saída:* Totem Principal\n\nPor favor, use com cuidado e tranque o cadeado ao estacionar.`,
    });

    this.notify();
    return {
      success: true,
      message: `Bicicleta ${bike.codigo} desbloqueada com sucesso!`,
      bike,
      lockPassword: bike.lockPassword,
    };
  }

  // Check-in / Devolução com Checklist
  public checkinBike(
    condoId: string,
    bikeId: string,
    moradorId: string,
    data: {
      localDevolucao: string;
      freiosOk: boolean;
      correnteOk: boolean;
      pneusOk: boolean;
      quadroOk: boolean;
      observacoes?: string;
    }
  ): { success: boolean; message: string; emManutencao: boolean } {
    const bike = this.getBike(condoId, bikeId);
    const morador = this.getMorador(condoId, moradorId);
    if (!bike || !morador) {
      return { success: false, message: 'Dados da devolução inválidos.', emManutencao: false };
    }

    const hasDefect = !data.freiosOk || !data.correnteOk || !data.pneusOk || !data.quadroOk;
    const avarias: string[] = [];
    if (!data.freiosOk) avarias.push('Freios com folga ou ruído');
    if (!data.correnteOk) avarias.push('Corrente frouxa/desregulada');
    if (!data.pneusOk) avarias.push('Pneu esvaziando ou furado');
    if (!data.quadroOk) avarias.push('Estrutura/Luzes/Pedal com avaria');

    const retiradaTimestamp = bike.inicioUsoTimestamp || Date.now() - 30 * 60 * 1000;
    const agora = Date.now();

    // Salva histórico
    const historicoId = `loc_${Date.now()}`;
    const novoHist: HistoricoLocacao = {
      id: historicoId,
      condominioId: condoId,
      bikeId: bike.id,
      bikeCodigo: bike.codigo,
      moradorId: morador.id,
      moradorNome: morador.nome,
      moradorUnidade: `Bloco ${morador.unidade.bloco} - ${morador.unidade.apto}`,
      retiradaEm: retiradaTimestamp,
      devolucaoEm: agora,
      localDevolucao: data.localDevolucao,
      avariasReportadas: avarias,
      checklistStatus: {
        freiosOk: data.freiosOk,
        correnteOk: data.correnteOk,
        pneusOk: data.pneusOk,
        quadroOk: data.quadroOk,
      },
      observacoes: data.observacoes || '',
    };

    if (!this.historicoLocacoes[condoId]) this.historicoLocacoes[condoId] = [];
    this.historicoLocacoes[condoId].unshift(novoHist);

    // Roteamento de Manutenção
    if (hasDefect) {
      bike.status = 'manutencao';
      bike.avariasAtuais = avarias;
      bike.localizacaoAtual = `Devolvida em: ${data.localDevolucao} (Aguardando Reparo)`;

      // Alerta para o síndico e portaria
      this.addNotification({
        condominioId: condoId,
        titulo: `⚠️ Avaria Reportada na Bike ${bike.codigo}`,
        mensagem: `Devolvida por ${morador.nome} (${novoHist.moradorUnidade}). Avarias: ${avarias.join(', ')}. Status comutado para manutenção.`,
        tipo: 'bike',
      });
    } else {
      bike.status = 'disponivel';
      bike.avariasAtuais = [];
      bike.localizacaoAtual = data.localDevolucao;
    }

    bike.usuarioAtualId = null;
    bike.usuarioAtualNome = null;
    bike.usuarioAtualUnidade = null;
    bike.inicioUsoTimestamp = null;

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'bike_devolucao',
      titulo: `✅ Devolução de Bike: ${bike.codigo}`,
      corpoMensagem: `Devolução da bike *${bike.codigo}* confirmada no local: *${data.localDevolucao}*.\n\n${hasDefect ? `⚠️ *Checklist:* Foram reportadas avarias (${avarias.join(', ')}). A manutenção foi acionada.` : '✨ *Checklist:* Bicicleta devolvida em perfeito estado. 100%!'}\n\nObrigado por utilizar nosso bicicletário compartilhado!`,
    });

    this.notify();
    return {
      success: true,
      message: hasDefect
        ? `Devolução registrada. Avarias foram encaminhadas automaticamente para a manutenção do síndico.`
        : `Devolução da bike ${bike.codigo} concluída com sucesso! Obrigado pelo cuidado.`,
      emManutencao: hasDefect,
    };
  }

  public getHistoricoLocacoes(condoId: string): HistoricoLocacao[] {
    return [...(this.historicoLocacoes[condoId] || [])];
  }

  // --- Encomendas & Portaria ---
  public getEncomendas(condoId: string, moradorId?: string): Encomenda[] {
    const list = this.encomendas[condoId] || [];
    if (moradorId) {
      return list.filter((e) => e.moradorId === moradorId);
    }
    return [...list];
  }

  public addEncomenda(
    condoId: string,
    data: {
      moradorId: string;
      transportadora: string;
      codigoRastreio: string;
      recebidoPor: string;
      observacao?: string;
    }
  ): Encomenda {
    const morador = this.getMorador(condoId, data.moradorId);
    if (!morador) throw new Error('Morador não encontrado');

    // Gerar código de 6 dígitos numéricos aleatório
    const codigo6Digitos = Math.floor(100000 + Math.random() * 900000).toString();

    const novaEnc: Encomenda = {
      id: `enc_${Date.now()}`,
      condominioId: condoId,
      moradorId: morador.id,
      moradorNome: morador.nome,
      unidade: morador.unidade,
      transportadora: data.transportadora,
      codigoRastreio: data.codigoRastreio || `BR${Math.floor(100000000 + Math.random() * 900000000)}`,
      codigoResgate: codigo6Digitos,
      status: 'na_portaria',
      recebidoEm: Date.now(),
      recebidoPor: data.recebidoPor,
      observacao: data.observacao || '',
    };

    if (!this.encomendas[condoId]) this.encomendas[condoId] = [];
    this.encomendas[condoId].unshift(novaEnc);

    // Disparo imediato de Push Notification para o morador
    this.addNotification({
      condominioId: condoId,
      paraMoradorId: morador.id,
      titulo: '📦 Nova Encomenda na Portaria',
      mensagem: `${data.transportadora} entregou um pacote para sua unidade (Bloco ${morador.unidade.bloco} - Apto ${morador.unidade.apto}). Código de Resgate: ${codigo6Digitos}`,
      tipo: 'encomenda',
    });

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'encomenda',
      titulo: '📦 Nova Encomenda Recebida na Portaria',
      corpoMensagem: `Chegou uma encomenda para sua unidade!\n\n🚚 *Transportadora:* ${data.transportadora}\n🏷️ *Rastreio:* ${novaEnc.codigoRastreio}\n🔐 *CÓDIGO DE RESGATE:* *${codigo6Digitos}*\n👮 *Recebido por:* ${data.recebidoPor}\n\n_Apresente este código de 6 dígitos ao porteiro para retirar seu pacote._`,
    });

    this.notify();
    return novaEnc;
  }

  public darBaixaEncomenda(
    condoId: string,
    encomendaIdOrCode: string,
    operadorNome: string
  ): { success: boolean; message: string; encomenda?: Encomenda } {
    const list = this.encomendas[condoId] || [];
    const enc = list.find(
      (e) =>
        e.id === encomendaIdOrCode ||
        e.codigoResgate === encomendaIdOrCode.trim() ||
        e.codigoRastreio.toLowerCase() === encomendaIdOrCode.trim().toLowerCase()
    );

    if (!enc) {
      return { success: false, message: 'Código de resgate ou encomenda não encontrada.' };
    }

    if (enc.status === 'entregue') {
      return {
        success: false,
        message: `Esta encomenda já foi entregue anteriormente para ${enc.entreguePara || 'o morador'}.`,
      };
    }

    enc.status = 'entregue';
    enc.entregueEm = Date.now();
    enc.entreguePara = `${enc.moradorNome} (Código ${enc.codigoResgate} Validado por ${operadorNome})`;

    this.addNotification({
      condominioId: condoId,
      paraMoradorId: enc.moradorId,
      titulo: '✅ Encomenda Retirada',
      mensagem: `A encomenda da ${enc.transportadora} foi entregue pela portaria com sucesso.`,
      tipo: 'encomenda',
    });

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    const morador = this.getMorador(condoId, enc.moradorId);
    if (morador) {
      whatsappService.notificarMorador({
        condominioId: condoId,
        condominioNome: condoNome,
        morador,
        tipo: 'encomenda_baixa',
        titulo: '✅ Encomenda Retirada com Sucesso',
        corpoMensagem: `Sua encomenda da transportadora *${enc.transportadora}* foi retirada na portaria.\n\nCódigo validado: *${enc.codigoResgate}*\nEntregue por: *${operadorNome}*`,
      });
    }

    this.notify();
    return {
      success: true,
      message: `Baixa confirmada para ${enc.moradorNome} (Bloco ${enc.unidade.bloco} - ${enc.unidade.apto})!`,
      encomenda: enc,
    };
  }

  // --- Áreas de Lazer ---
  public getAreasLazer(condoId: string): AreaLazer[] {
    return [...(this.areasLazer[condoId] || [])];
  }

  public addAreaLazer(
    condoId: string,
    data: Omit<AreaLazer, 'id' | 'condominioId' | 'atualizadoEm'>
  ): AreaLazer {
    const newId = `area_${Date.now()}`;
    const newArea: AreaLazer = {
      ...data,
      id: newId,
      condominioId: condoId,
      atualizadoEm: Date.now(),
    };
    if (!this.areasLazer[condoId]) this.areasLazer[condoId] = [];
    this.areasLazer[condoId].push(newArea);
    this.notify();
    return newArea;
  }

  public updateAreaLazer(condoId: string, areaId: string, data: Partial<AreaLazer>) {
    const list = this.areasLazer[condoId] || [];
    const area = list.find((a) => a.id === areaId);
    if (area) {
      Object.assign(area, data);
      area.atualizadoEm = Date.now();
      this.notify();
    }
  }

  public deleteAreaLazer(condoId: string, areaId: string) {
    if (this.areasLazer[condoId]) {
      this.areasLazer[condoId] = this.areasLazer[condoId].filter((a) => a.id !== areaId);
      this.notify();
    }
  }

  public updateAreaLazerStatus(
    condoId: string,
    areaId: string,
    status: 'aberto' | 'manutencao' | 'limpeza' | 'fechado_clima',
    aviso: string,
    previsaoReabertura?: string
  ) {
    const list = this.areasLazer[condoId] || [];
    const area = list.find((a) => a.id === areaId);
    if (area) {
      area.status = status;
      area.aviso = aviso;
      area.previsaoReabertura = previsaoReabertura;
      area.atualizadoEm = Date.now();

      // Notificação geral para o condomínio se for alteração crítica
      if (status !== 'aberto') {
        this.addNotification({
          condominioId: condoId,
          titulo: `🏊 Status de Lazer: ${area.nome}`,
          mensagem: `Status alterado para [${status.toUpperCase()}]: ${aviso}. ${previsaoReabertura ? `Previsão: ${previsaoReabertura}` : ''}`,
          tipo: 'lazer',
        });
      }

      this.notify();
    }
  }

  // --- Reservas ---
  public getReservas(condoId: string): Reserva[] {
    return [...(this.reservas[condoId] || [])];
  }

  public addReserva(
    condoId: string,
    data: {
      areaId: string;
      espaco: string;
      data: string; // YYYY-MM-DD
      periodo: 'manha' | 'tarde' | 'noite' | 'dia_inteiro';
      moradorId: string;
      termoAceito: boolean;
      valorTaxa: number;
      observacoes?: string;
    }
  ): { success: boolean; message: string; reserva?: Reserva } {
    const list = this.reservas[condoId] || [];
    const morador = this.getMorador(condoId, data.moradorId);
    if (!morador) return { success: false, message: 'Morador não encontrado.' };

    if (!data.termoAceito) {
      return { success: false, message: 'É obrigatório aceitar o termo de regras e caução para prosseguir.' };
    }

    // Bloqueio automático de concorrência dupla
    const conflito = list.find(
      (r) =>
        r.areaId === data.areaId &&
        r.data === data.data &&
        r.status !== 'cancelada' &&
        (r.periodo === data.periodo || r.periodo === 'dia_inteiro' || data.periodo === 'dia_inteiro')
    );

    if (conflito) {
      return {
        success: false,
        message: `Esta data (${data.data}) já está reservada por outra unidade (${conflito.moradorNome} - Bloco ${conflito.unidade.bloco}).`,
      };
    }

    const novaReserva: Reserva = {
      id: `res_${Date.now()}`,
      condominioId: condoId,
      areaId: data.areaId,
      espaco: data.espaco,
      data: data.data,
      periodo: data.periodo,
      moradorId: morador.id,
      moradorNome: morador.nome,
      unidade: morador.unidade,
      status: 'confirmada',
      termoAceito: data.termoAceito,
      valorTaxa: data.valorTaxa,
      criadoEm: Date.now(),
      observacoes: data.observacoes,
    };

    if (!this.reservas[condoId]) this.reservas[condoId] = [];
    this.reservas[condoId].unshift(novaReserva);

    this.addNotification({
      condominioId: condoId,
      paraMoradorId: morador.id,
      titulo: '🎉 Reserva Confirmada',
      mensagem: `Seu agendamento para ${data.espaco} em ${data.data} foi confirmado com sucesso!`,
      tipo: 'lazer',
    });

    const condo = this.getCondominio(condoId);
    const condoNome = condo ? condo.nome : 'Condomínio Residencial';
    const periodosMap: Record<string, string> = {
      manha: 'Manhã (08h às 12h)',
      tarde: 'Tarde (13h às 17h)',
      noite: 'Noite (18h às 23h)',
      dia_inteiro: 'Dia Inteiro (08h às 23h)',
    };
    whatsappService.notificarMorador({
      condominioId: condoId,
      condominioNome: condoNome,
      morador,
      tipo: 'reserva',
      titulo: `🎉 Reserva Confirmada: ${data.espaco}`,
      corpoMensagem: `Sua reserva foi confirmada com sucesso!\n\n🏢 *Espaço:* ${data.espaco}\n📅 *Data do Evento:* ${data.data}\n⏰ *Período:* ${periodosMap[data.periodo] || data.periodo}\n💰 *Taxa de Uso:* ${data.valorTaxa === 0 ? 'Gratuito' : `R$ ${data.valorTaxa.toFixed(2)}`}\n\n_Lembre-se de respeitar os horários de silêncio e as normas de limpeza e conservação do condomínio._`,
    });

    this.notify();
    return { success: true, message: 'Reserva confirmada com sucesso!', reserva: novaReserva };
  }

  public cancelarReserva(condoId: string, reservaId: string) {
    const list = this.reservas[condoId] || [];
    const r = list.find((x) => x.id === reservaId);
    if (r) {
      r.status = 'cancelada';

      const morador = this.getMorador(condoId, r.moradorId);
      const condo = this.getCondominio(condoId);
      const condoNome = condo ? condo.nome : 'Condomínio Residencial';
      if (morador) {
        whatsappService.notificarMorador({
          condominioId: condoId,
          condominioNome: condoNome,
          morador,
          tipo: 'reserva_cancelamento',
          titulo: '⚠️ Reserva Cancelada',
          corpoMensagem: `A sua reserva para o espaço *${r.espaco}* agendada para *${r.data}* foi cancelada no sistema.`,
        });
      }

      this.notify();
    }
  }

  // --- Mural de Avisos ---
  public getAvisos(condoId: string): Aviso[] {
    return [...(this.avisos[condoId] || [])];
  }

  public addAviso(condoId: string, aviso: Omit<Aviso, 'id' | 'condominioId' | 'criadoEm'>): Aviso {
    const novoAviso: Aviso = {
      ...aviso,
      id: `aviso_${Date.now()}`,
      condominioId: condoId,
      criadoEm: Date.now(),
    };

    if (!this.avisos[condoId]) this.avisos[condoId] = [];
    this.avisos[condoId].unshift(novoAviso);

    if (aviso.prioritario) {
      this.addNotification({
        condominioId: condoId,
        titulo: `🚨 Comunicado Urgente: ${aviso.titulo}`,
        mensagem: aviso.mensagem,
        tipo: 'aviso',
      });
    }

    this.notify();
    return novoAviso;
  }

  public deleteAviso(condoId: string, avisoId: string) {
    if (this.avisos[condoId]) {
      this.avisos[condoId] = this.avisos[condoId].filter((a) => a.id !== avisoId);
      this.notify();
    }
  }

  // --- Notificações ---
  public getNotificacoes(condoId: string, moradorId?: string): AppNotification[] {
    return this.notificacoes.filter((n) => {
      if (n.condominioId !== condoId) return false;
      if (!n.paraMoradorId) return true; // broadcast
      return n.paraMoradorId === moradorId;
    });
  }

  public addNotification(notif: Omit<AppNotification, 'id' | 'timestamp' | 'lida'>) {
    const newN: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      lida: false,
    };
    this.notificacoes.unshift(newN);
    this.notify();
  }

  public markNotificationAsRead(id: string) {
    const n = this.notificacoes.find((x) => x.id === id);
    if (n) {
      n.lida = true;
      this.notify();
    }
  }

  public markAllNotificationsAsRead(condoId: string, moradorId?: string) {
    this.notificacoes.forEach((n) => {
      if (n.condominioId === condoId && (!n.paraMoradorId || n.paraMoradorId === moradorId)) {
        n.lida = true;
      }
    });
    this.notify();
  }
}

export const condoStore = new MockCondoStore();
