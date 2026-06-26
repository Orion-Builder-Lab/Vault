import {
  BookUser,
  FileSpreadsheet,
  FileText,
  Landmark,
  LayoutDashboard,
  Package,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react';

export type Role = 'admin' | 'financeiro' | 'faturamento' | 'almoxarife' | 'contador';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[] | 'all';
  requireEstoque?: boolean;
  requireSemEstoque?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: 'all',
  },
  {
    label: 'Cadastros',
    href: '/cadastros',
    icon: BookUser,
    roles: ['admin', 'financeiro', 'faturamento'],
  },
  {
    label: 'Faturamento',
    href: '/faturamento',
    icon: FileText,
    roles: ['admin', 'financeiro', 'faturamento'],
  },
  {
    label: 'Compras',
    href: '/compras',
    icon: ShoppingCart,
    roles: ['admin', 'financeiro', 'almoxarife'],
    requireEstoque: true,
  },
  {
    label: 'Estoque',
    href: '/estoque',
    icon: Package,
    roles: ['admin', 'financeiro', 'almoxarife'],
    requireEstoque: true,
  },
  {
    label: 'Financeiro',
    href: '/financeiro',
    icon: Landmark,
    roles: ['admin', 'financeiro'],
  },
  {
    label: 'SPED Fiscal',
    href: '/sped',
    icon: FileSpreadsheet,
    roles: ['admin', 'contador'],
    requireEstoque: true,
  },
];

export function filterNavItems(role: Role, hasEstoque: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    const temRole = item.roles === 'all' || item.roles.includes(role);
    if (!temRole) return false;

    if (item.requireEstoque && !hasEstoque) return false;
    if (item.requireSemEstoque && hasEstoque) return false;

    return true;
  });
}
