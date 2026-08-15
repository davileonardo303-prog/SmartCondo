export type UserRole = 'super_admin' | 'sindico' | 'portaria' | 'morador';

export type BikeStatus = 'disponivel' | 'em_uso' | 'manutencao';

export type PackageStatus = 'na_portaria' | 'entregue';

export type AreaStatus = 'aberto' | 'manutencao' | 'limpeza' | 'fechado_clima';

export type ReservationStatus = 'confirmada' | 'pendente' | 'cancelada';

export type NoticeCategory = 'urgente' | 'manutencao' | 'comunicado' | 'social';

export interface Unidade {
  bloco: string;
  apto: string;
}

export interface Morador {
  id: string;
  condominioId: string;
  nome: string;
  email: string;
  telefone: string;
  senha?: string;
  unidade: Unidade;
  statusAdimplencia: 'em_dia' | 'com_pendencia';
  statusCadastro: 'ativo' | 'pendente_aprovacao' | 'recusado';
  avatarUrl?: string;
  solicitadoEm?: number;
  aprovadoPor?: string;
  aprovadoEm?: number;
  authProvider?: 'google' | 'email';
}

export interface UsuarioSistema {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  telefone?: string;
  role: UserRole;
  condominioId: string;
  unidade?: Unidade;
  statusCadastro: 'ativo' | 'pendente_aprovacao' | 'recusado';
  avatarUrl?: string;
  authProvider: 'google' | 'email';
}

export interface UserAccount {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: UserRole;
  condominioId: string;
  unidade?: Unidade;
  statusCadastro: 'ativo' | 'pendente_aprovacao' | 'recusado';
  avatarUrl?: string;
  authProvider: 'google' | 'email';
}

export interface Condominio {
  id: string;
  nome: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  uf: string;
  totalUnidades: number;
  statusAssinatura: 'ativo' | 'suspenso' | 'em_teste';
  plano: 'Pro' | 'Enterprise' | 'Smart';
  sindicoNome: string;
  sindicoEmail: string;
  regras: {
    limiteTempoBikeMinutos: number;
    limiteBikesPorMorador: number;
    horarioBicicletario: string;
    diasAntecedenciaReserva: number;
    taxaReservaSalao: number;
  };
}

export interface Bicicleta {
  id: string;
  condominioId: string;
  codigo: string;
  modelo: string;
  tipo: 'urbana' | 'e-bike' | 'mountain';
  status: BikeStatus;
  usuarioAtualId: string | null;
  usuarioAtualNome?: string | null;
  usuarioAtualUnidade?: string | null;
  qrToken: string;
  lockPassword: string; // Senha do cadeado digital / trava
  localizacaoAtual: string;
  nivelBateria?: number; // Para e-bikes
  ultimaRevisao: string;
  avariasAtuais?: string[];
  inicioUsoTimestamp?: number | null;
}

export interface HistoricoLocacao {
  id: string;
  condominioId: string;
  bikeId: string;
  bikeCodigo: string;
  moradorId: string;
  moradorNome: string;
  moradorUnidade: string;
  retiradaEm: number; // timestamp
  devolucaoEm: number | null; // timestamp
  localDevolucao?: string;
  avariasReportadas?: string[];
  checklistStatus?: {
    freiosOk: boolean;
    correnteOk: boolean;
    pneusOk: boolean;
    quadroOk: boolean;
  };
  observacoes?: string;
}

export interface Encomenda {
  id: string;
  condominioId: string;
  moradorId: string;
  moradorNome: string;
  unidade: Unidade;
  transportadora: string;
  codigoRastreio: string;
  codigoResgate: string; // 6 dígitos numéricos
  status: PackageStatus;
  recebidoEm: number; // timestamp
  recebidoPor: string;
  entregueEm?: number | null;
  entreguePara?: string | null;
  observacao?: string;
}

export interface AreaLazer {
  id: string;
  condominioId: string;
  nome: string;
  tipo: 'piscina' | 'academia' | 'salao_festas' | 'churrasqueira' | 'sauna' | 'quadra';
  status: AreaStatus;
  aviso: string;
  previsaoReabertura?: string;
  atualizadoEm: number;
  capacidade: number;
  permiteReserva: boolean;
  taxaReserva: number;
  horarioFuncionamento: string;
}

export interface Reserva {
  id: string;
  condominioId: string;
  areaId: string;
  espaco: string;
  data: string; // YYYY-MM-DD
  periodo: 'manha' | 'tarde' | 'noite' | 'dia_inteiro';
  moradorId: string;
  moradorNome: string;
  unidade: Unidade;
  status: ReservationStatus;
  termoAceito: boolean;
  valorTaxa: number;
  criadoEm: number;
  observacoes?: string;
}

export interface Aviso {
  id: string;
  condominioId: string;
  titulo: string;
  mensagem: string;
  categoria: NoticeCategory;
  prioritario: boolean;
  autor: string;
  autorCargo: string;
  criadoEm: number;
  expiraEm?: string;
}

export interface AppNotification {
  id: string;
  condominioId: string;
  paraMoradorId?: string; // se undefined, broadcast
  titulo: string;
  mensagem: string;
  tipo: 'bike' | 'encomenda' | 'lazer' | 'aviso' | 'sistema';
  timestamp: number;
  lida: boolean;
  dadosExtras?: Record<string, unknown>;
}

export interface WhatsAppMessageLog {
  id: string;
  condominioId: string;
  moradorId?: string;
  moradorNome: string;
  moradorTelefone: string;
  moradorUnidade?: string;
  tipo: 'cadastro' | 'bike_retirada' | 'bike_devolucao' | 'encomenda' | 'encomenda_baixa' | 'reserva' | 'reserva_cancelamento' | 'comunicado_massa' | 'aviso_urgente';
  titulo: string;
  mensagem: string;
  whatsappUrl: string;
  status: 'enviado' | 'entregue' | 'lido';
  timestamp: number;
}

export interface WhatsAppBroadcast {
  id: string;
  condominioId: string;
  titulo: string;
  categoria: NoticeCategory;
  mensagem: string;
  enviadoPor: string;
  totalDestinatarios: number;
  sucessoCount: number;
  timestamp: number;
  destinatarios: {
    moradorId: string;
    nome: string;
    telefone: string;
    unidade: string;
    status: 'enviado' | 'entregue';
    whatsappUrl: string;
  }[];
}

export interface ActiveUserSession {
  role: UserRole;
  condominioId: string;
  moradorId: string; // se role === 'morador'
}

