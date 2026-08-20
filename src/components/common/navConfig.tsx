import {
  Home,
  Bike,
  Wrench,
  Calendar,
  Users,
  PhoneCall,
  Package,
  AlertCircle,
  DollarSign,
  MessageSquare,
  FileText,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Vote,
  Settings,
  Clock,
  Building2,
  CreditCard,
  ShieldAlert,
  UserCheck,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeType?: 'info' | 'warning' | 'danger';
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const defaultTabByRole: Record<string, string> = {
  morador: 'inicio',
  portaria: 'receber',
  sindico: 'moradores',
  super_admin: 'condominios',
};

export const navSectionsByRole: Record<string, NavSection[]> = {
  morador: [
    {
      items: [
        { id: 'inicio', label: 'Início', icon: Home },
      ],
    },
    {
      title: 'Comunicação',
      items: [
        { id: 'interfone', label: 'Interfone & PTT', icon: PhoneCall },
        { id: 'mural', label: 'Comunidade', icon: MessageSquare },
      ],
    },
    {
      title: 'Serviços',
      items: [
        { id: 'bicicletario', label: 'Bicicletas', icon: Bike },
        { id: 'equipamentos', label: 'Equipamentos', icon: Wrench },
        { id: 'encomendas', label: 'Encomendas', icon: Package },
        { id: 'lazer', label: 'Reservas & Lazer', icon: Calendar },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { id: 'seguranca', label: 'Visitantes', icon: Users },
        { id: 'ocorrencias', label: 'Ocorrências', icon: AlertCircle },
        { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
        { id: 'documentos', label: 'Documentos', icon: FileText },
      ],
    },
  ],
  portaria: [
    {
      items: [
        { id: 'receber', label: 'Receber Encomendas', icon: Package },
      ],
    },
    {
      title: 'Operação',
      items: [
        { id: 'bicicletario', label: 'Totem & Bikes', icon: Bike },
        { id: 'equipamentos', label: 'Equipamentos', icon: Wrench },
        { id: 'visitantes', label: 'Visitantes', icon: Users },
        { id: 'interfone', label: 'Interfone', icon: PhoneCall },
      ],
    },
    {
      title: 'Registros',
      items: [
        { id: 'historico', label: 'Histórico', icon: Clock },
      ],
    },
  ],
  sindico: [
    {
      items: [
        { id: 'moradores', label: 'Moradores', icon: Users },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { id: 'equipe', label: 'Equipe & Permissões', icon: ShieldCheck },
        { id: 'aprovacoes', label: 'Aprovações', icon: KeyRound },
        { id: 'regras_encomendas', label: 'Regras de Encomendas', icon: Package },
      ],
    },
    {
      title: 'Patrimônio',
      items: [
        { id: 'frota', label: 'Frota de Bikes', icon: Bike },
        { id: 'equipamentos', label: 'Equipamentos', icon: Wrench },
        { id: 'liberacoes', label: 'Liberação & Senhas', icon: KeyRound },
        { id: 'lazer', label: 'Áreas Comuns', icon: Sparkles },
        { id: 'reservas', label: 'Agenda & Reservas', icon: Calendar },
      ],
    },
    {
      title: 'Administrativo',
      items: [
        { id: 'ocorrencias', label: 'Ocorrências', icon: AlertCircle },
        { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
        { id: 'comunidade', label: 'Comunidade', icon: Vote },
        { id: 'documentos', label: 'Documentos', icon: FileText },
        { id: 'avisos', label: 'Comunicados', icon: AlertCircle },
        { id: 'whatsapp', label: 'Disparador WhatsApp', icon: PhoneCall },
        { id: 'configuracoes', label: 'Configurações', icon: Settings },
      ],
    },
  ],
  super_admin: [
    {
      items: [
        { id: 'condominios', label: 'Condomínios', icon: Building2 },
        { id: 'cobrancas', label: 'Planos & Cobranças', icon: CreditCard },
        { id: 'aprovacoes', label: 'Aprovações', icon: ShieldAlert },
        { id: 'sindicos', label: 'Síndicos & Contas', icon: UserCheck },
      ],
    },
  ],
};
