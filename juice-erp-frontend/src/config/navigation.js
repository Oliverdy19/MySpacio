import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Percent,
  Settings,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';

export const NAVIGATION = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'vendedor'] },
  { label: 'Ordenes', path: '/ordenes', icon: ClipboardList, roles: ['admin', 'supervisor', 'vendedor'] },
  { label: 'Ventas', path: '/ventas', icon: ShoppingCart, roles: ['admin', 'supervisor', 'vendedor'] },
  { label: 'Clientes', path: '/clientes', icon: Users, roles: ['admin', 'supervisor', 'vendedor'] },
  { label: 'Inventario', path: '/inventario', icon: Package, roles: ['admin', 'supervisor'] },
  { label: 'Reportes', path: '/reportes', icon: BarChart3, roles: ['admin', 'supervisor'] },
  { label: 'Comisiones', path: '/comisiones', icon: Percent, roles: ['admin', 'supervisor', 'vendedor'] },
  { label: 'Usuarios', path: '/usuarios', icon: Users, roles: ['admin'] },
  { label: 'Auditoría', path: '/auditoria', icon: ShieldCheck, roles: ['admin'] },
  { label: 'Configuración', path: '/configuracion', icon: Settings, roles: ['admin'] },
];

export function getNavigationForRole(role) {
  return NAVIGATION.filter((item) => item.roles.includes(role));
}
