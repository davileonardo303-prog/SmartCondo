export type UserRole = 'super_admin' | 'sindico' | 'portaria' | 'morador';

// Módulo de Interfonia Digital / Walkie-Talkie Push-to-Talk (PTT Estilo Zello & Chamadas em Tempo Real)
export type InterfoneCanalTipo = 'portaria_morador' | 'geral' | 'emergencia';
export type InterfoneRemetenteTipo = 'morador' | 'portaria' | 'sindico' | 'administrador';

export type ChamadaStatus = 'calling' | 'ringing' | 'connected' | 'rejected' | 'ended' | 'missed' | 'busy';
export type ChamadaTipo = 'audio' | 'video';

export interface ChamadaInterfone {
  id: string;
  condominioId: string;
  callerId: string;
  callerName: string;
  callerRole: UserRole;
  callerUnidade?: Unidade;
  callerAvatar?: string;
  receiverId: string; // 'portaria' | 'sindico' | moradorId
  receiverName: string;
  receiverRole: UserRole;
  receiverUnidade?: Unidade;
  status: ChamadaStatus;
  tipo: ChamadaTipo;
  startedAt: number;
  connectedAt?: number;
  endedAt?: number;
  duracaoSegundos?: number;
}

export interface InterfoneMensagem {
  id: string;
  condominioId: string;
  remetenteId: string;
  remetenteNome: string;
  remetenteTipo: InterfoneRemetenteTipo;
  remetenteUnidade?: Unidade;
  destinatarioTipo: 'portaria' | 'morador' | 'todos';
  destinatarioUnidade?: Unidade;
  destinatarioMoradorId?: string;
  tipoCanal: InterfoneCanalTipo;
  audioDataUrl?: string; // Gravação de áudio Base64 (webm/ogg/mp4)
  duracaoSegundos?: number;
  texto?: string; // Transcrição ou mensagem rápida de texto do rádio
  criadoEm: number;
  lido: boolean;
  prioridade?: 'normal' | 'urgente' | 'emergencia';
}

export type CargoFuncionario = 'porteiro' | 'zelador' | 'administracao' | 'gerente_predial' | 'vigilante' | 'auxiliar_servicos';

export interface PermissoesFuncionario {
  receber_encomendas: boolean;
  liberar_bicicletas: boolean;
  gerenciar_equipamentos: boolean;
  autorizar_visitantes: boolean;
  enviar_avisos: boolean;
  acesso_financeiro: boolean;
  administracao_geral: boolean;
}

export interface FuncionarioEquipe {
  id: string;
  condominioId: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: CargoFuncionario;
  status: 'ativo' | 'inativo' | 'ferias';
  permissoes: PermissoesFuncionario;
  cadastradoEm: number;
  senha?: string;
  documentoCpf?: string;
  turnoTrabalho?: string;
}

export type BikeStatus = 'disponivel' | 'reservada_5min' | 'em_uso' | 'manutencao';

export type PackageStatus = 'na_portaria' | 'encaminhada_administracao' | 'entregue' | 'devolvida';

export type AreaStatus = 'aberto' | 'manutencao' | 'limpeza' | 'fechado_clima';

export type ReservationStatus = 'confirmada' | 'pendente' | 'cancelada';

export type NoticeCategory = 'urgente' | 'manutencao' | 'comunicado' | 'social' | 'eventos' | 'regras';

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
  tipoMorador?: 'proprietario' | 'inquilino';
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

export type PlanoTipo = 'Teste' | 'Smart' | 'Plus' | 'Pro' | 'Enterprise';

export interface PlanoConfigItem {
  id: PlanoTipo;
  nome: string;
  valor: number;
  unidades: string;
  bikes: string;
  desc: string;
  duracaoMeses?: number;
  periodoMesesTeste?: number;
  isTesteGratuito?: boolean;
  destaque?: boolean;
  ativo?: boolean;
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
  plano: PlanoTipo;
  valorMensalidade?: number;
  diaVencimento?: number;
  statusPagamento?: 'em_dia' | 'pendente' | 'vencido' | 'cortesia';
  chavePix?: string;
  dataInicioTeste?: string;
  dataFimTeste?: string;
  sindicoNome: string;
  sindicoEmail: string;
  sindicoTelefone?: string;
  portariaTelefone?: string;
  regras: {
    limiteTempoBikeMinutos: number;
    limiteBikesPorMorador: number;
    horarioBicicletario: string;
    diasAntecedenciaReserva: number;
    taxaReservaSalao: number;
    tempoToleranciaRetiradaMinutos?: number;
    locaisDevolucao?: string[];
    diasLimiteRetiradaEncomenda?: number; // Padrão: 5 dias (Ex: Jardins do Brito)
    acaoAposLimiteEncomenda?: 'encaminhar_administracao' | 'notificar_reincidencia';
  };
}

export interface CobrancaCondominio {
  id: string;
  condominioId: string;
  condominioNome: string;
  sindicoNome: string;
  sindicoEmail: string;
  sindicoTelefone?: string;
  mesReferencia: string; // Ex: "Agosto/2026"
  plano: PlanoTipo;
  valor: number;
  dataVencimento: string; // YYYY-MM-DD
  status: 'pendente' | 'enviada' | 'paga' | 'cancelada';
  chavePix: string;
  codigoPixCopiaCola: string;
  mensagem?: string;
  observacoes?: string;
  enviadoEm: number;
  enviadoPor?: string;
  notificacaoWhatsAppUrl?: string;
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
  // Campos da Reserva Exclusiva com Timer de 5 Minutos (Novolar)
  reserva5minTimestamp?: number | null;
  reservaMoradorId?: string | null;
  reservaMoradorNome?: string | null;
  reservaMoradorUnidade?: string | null;
  reservaCodigo?: string | null;
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
  // Vistoria Fotográfica na Baixa / Devolução
  fotoVistoriaDevolucaoUrl?: string;
  fotoVistoriaTimestamp?: number;
  vistoriaStatus?: 'sem_avarias' | 'com_defeito';
  vistoriaOperador?: string;
  detalhesDefeito?: string;
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
  diasLimiteRetirada?: number; // Ex: 5 dias
  dataLimiteRetirada?: number; // Timestamp limite
  encaminhadaAdministracaoEm?: number | null;
  motivoEncaminhamentoAdmin?: string;
  notificacaoPushEnviada?: boolean;
  notificacaoEmailEnviada?: boolean;
  notificacaoWhatsAppEnviada?: boolean;
  fotoUrl?: string; // Foto do selo/etiqueta da encomenda com dados do morador
  entregueEm?: number | null;
  entreguePara?: string | null;
  metodoRetirada?: 'pin_6_digitos' | 'documento_rubrica';
  documentoRetirante?: string; // CPF ou RG do retirante
  nomeRetirante?: string; // Nome de quem retirou (morador ou terceiro)
  assinaturaRetiranteUrl?: string; // Rúbrica/assinatura digital capturada no ato da entrega
  motivoSemPin?: string; // Motivo da retirada sem código PIN
  observacao?: string;
}

export interface AreaLazer {
  id: string;
  condominioId: string;
  nome: string;
  tipo: 'piscina' | 'academia' | 'salao_festas' | 'churrasqueira' | 'sauna' | 'quadra' | 'espaco_gourmet' | 'coworking';
  status: AreaStatus;
  aviso: string;
  previsaoReabertura?: string;
  atualizadoEm: number;
  capacidade: number;
  permiteReserva: boolean;
  taxaReserva: number;
  horarioFuncionamento: string;
  regrasUso?: string[];
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
  lidoPor?: string[];
}

// Módulo 3: Visitantes, Prestadores & Câmeras
export interface VisitanteLiberado {
  id: string;
  condominioId: string;
  moradorId: string;
  moradorNome: string;
  unidade: Unidade;
  nomeVisitante: string;
  documento?: string; // RG ou CPF
  placaVeiculo?: string;
  tipo: 'visitante' | 'prestador' | 'entrega';
  empresa?: string;
  servicoDescricao?: string;
  dataVisita: string; // YYYY-MM-DD
  periodoPermitido?: string; // Ex: "08:00 às 18:00"
  codigoAcesso: string; // Código de 4 a 6 dígitos ou alfanumérico
  status: 'pendente' | 'dentro' | 'saiu' | 'expirado';
  criadoEm: number;
  entradaEm?: number | null;
  saidaEm?: number | null;
  observacoes?: string;
}

export interface CameraAreaComum {
  id: string;
  condominioId: string;
  nome: string;
  localizacao: string;
  status: 'online' | 'manutencao';
  gravando: boolean;
  urlPlaceholder: string;
  fps: number;
}

// Módulo 5: Ocorrências e Problemas
export type OcorrenciaCategoria = 'barulho' | 'vazamento' | 'manutencao' | 'limpeza' | 'elevador' | 'garagem' | 'seguranca' | 'outro';
export type OcorrenciaStatus = 'enviado' | 'aberto' | 'em_analise' | 'em_andamento' | 'resolvido';
export type OcorrenciaPrioridade = 'baixa' | 'media' | 'alta' | 'urgente';

export interface Ocorrencia {
  id: string;
  condominioId: string;
  moradorId: string;
  moradorNome: string;
  unidade: Unidade;
  titulo: string;
  descricao: string;
  local?: string;
  categoria: OcorrenciaCategoria;
  prioridade: OcorrenciaPrioridade;
  status: OcorrenciaStatus;
  fotoUrl?: string;
  criadoEm: number;
  atualizadoEm: number;
  respostaSindico?: string;
  respondidoEm?: number | null;
  respondidoPor?: string;
  historicoAcoes?: {
    status: OcorrenciaStatus;
    mensagem: string;
    data: number;
    autor: string;
  }[];
}

// Módulo 6: Financeiro e Transparência
export interface BoletoMensalidade {
  id: string;
  condominioId: string;
  moradorId: string;
  moradorNome: string;
  unidade: Unidade;
  mesReferencia: string; // Ex: "Agosto / 2026"
  valor: number;
  dataVencimento: string; // YYYY-MM-DD
  status: 'pago' | 'a_vencer' | 'vencido';
  linhaDigitavel: string;
  codigoBarras: string;
  pixCopiaCola: string;
  dataPagamento?: number | null;
  descontoAteVencimento?: number;
  multaAposVencimento?: number;
}

export interface ItemExtratoFinanceiro {
  id: string;
  condominioId: string;
  mesReferencia: string;
  categoria: 'folha_pagamento' | 'energia_eletrica' | 'agua_esgoto' | 'manutencao_predial' | 'seguranca_portaria' | 'limpeza_conservacao' | 'fundo_reserva' | 'taxa_condominial' | 'outros';
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data: string;
  comprovanteDisponivel?: boolean;
}

export type ExtratoMensalItem = ItemExtratoFinanceiro;

// Módulo 7: Comunidade, Mural e Enquetes
export type MuralTipo = 'perdi_achei' | 'troca_venda' | 'indicacao' | 'geral';

export interface MuralPost {
  id: string;
  condominioId: string;
  autorId: string;
  autorNome: string;
  autorUnidade: string;
  tipo: MuralTipo;
  titulo: string;
  conteudo: string;
  contatoTelefone?: string;
  valor?: number;
  fotoUrl?: string;
  criadoEm: number;
  curtidas: string[]; // ids dos moradores
  comentarios: {
    id: string;
    autorNome: string;
    autorUnidade: string;
    texto: string;
    timestamp: number;
  }[];
}

export interface EnqueteOpcao {
  id: string;
  texto: string;
  votosCount: number;
  votantesIds: string[];
}

export interface EnqueteCondominio {
  id: string;
  condominioId: string;
  titulo: string;
  descricao: string;
  opcoes: EnqueteOpcao[];
  dataLimite: string;
  expiraEm?: string;
  criadoEm: number;
  finalizada: boolean;
  totalVotos: number;
  autorNome: string;
}

export interface SugestaoMorador {
  id: string;
  condominioId: string;
  moradorId: string;
  moradorNome: string;
  unidade: string;
  titulo: string;
  mensagem: string;
  status: 'recebida' | 'em_analise' | 'aprovada' | 'rejeitada' | 'atendida';
  criadoEm: number;
  respostaSindico?: string;
  respondidoEm?: number;
}

// Módulo 8: Documentos
export interface DocumentoCondominio {
  id: string;
  condominioId: string;
  titulo: string;
  categoria: 'regulamento' | 'convencao' | 'ata' | 'laudo' | 'manual' | 'prestacao_contas' | 'outros';
  dataPublicacao: string;
  tamanho: string;
  tipoArquivo: 'pdf' | 'doc' | 'img';
  descricao: string;
  urlSimulada: string;
}

export interface AppNotification {
  id: string;
  condominioId: string;
  paraMoradorId?: string; // se undefined, broadcast
  titulo: string;
  mensagem: string;
  tipo: 'bike' | 'encomenda' | 'lazer' | 'aviso' | 'sistema' | 'seguranca' | 'ocorrencia' | 'financeiro';
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
  tipo: 'cadastro' | 'bike_retirada' | 'bike_devolucao' | 'bike_reserva_5min' | 'bike_reserva_expirada' | 'encomenda' | 'encomenda_baixa' | 'reserva' | 'reserva_cancelamento' | 'visitante_liberado' | 'ocorrencia_atualizada' | 'comunicado_massa' | 'aviso_urgente';
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

// Versão do Aplicativo SmartCondo
export const APP_VERSION = '1.0.0.1';

// Módulo de Itens e Equipamentos Compartilhados
export type CategoriaItemCompartilhado = 'mobilidade' | 'ferramentas' | 'utilidades' | 'lavanderia';
export type StatusItemCompartilhado = 'disponivel' | 'reservado' | 'em_uso' | 'manutencao';

export interface ReservaItemCompartilhado {
  moradorId: string;
  moradorNome: string;
  unidade: string;
  codigoResgate: string; // 6 dígitos numéricos
  expiraEm: string; // ISO string
  expiraEmTimestamp: number;
  reservadoEm: number;
}

export interface UsoAtualItemCompartilhado {
  moradorId: string;
  moradorNome: string;
  unidade: string;
  retiradoEm: number;
  devolucaoPrevistaEm?: number;
  liberadoPor?: string;
}

export interface ItemCompartilhado {
  id: string;
  condominioId: string;
  nome: string;
  categoria: CategoriaItemCompartilhado;
  codigoIdentificador: string; // Ex: FER-01, UTI-02, MOB-01, LAV-01
  status: StatusItemCompartilhado;
  tempoMaximoUsoHoras: number;
  descricao?: string;
  instrucoesUso?: string;
  fotoUrl?: string;
  localArmazenamento?: string;
  requerAprovacao?: boolean;
  reservaAtual?: ReservaItemCompartilhado | null;
  usoAtual?: UsoAtualItemCompartilhado | null;
  historicoUso?: {
    id: string;
    moradorId: string;
    moradorNome: string;
    unidade: string;
    retiradaEm: number;
    devolucaoEm: number;
    operador?: string;
    observacoes?: string;
  }[];
}
