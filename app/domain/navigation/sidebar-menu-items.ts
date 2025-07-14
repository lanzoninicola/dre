import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  Upload,
  Users,
  BookUser,
} from "lucide-react";
import { SidebarMenuItems } from "./navigation.types";

export const SIDEBAR_MENU_ITEMS: SidebarMenuItems = {
  navMain: [
    {
      label: "Iniçio",
      icon: LayoutDashboard,
      href: "/home",
      active: true,
    },

    {
      label: "Importar Extrato",
      icon: Upload,
      href: "/home/import",
    },
    {
      label: "Transações",
      icon: FileText,
      href: "/transacoes",
    },
    {
      label: "Relatórios",
      icon: BarChart3,
      href: "/relatorios",
      subMenu: [
        { label: "DRE", href: "/relatorios/dre" },
        { label: "Plano de Contas", href: "/relatorios/plano-contas" },
        { label: "Auditoria", href: "/relatorios/auditoria" },
      ],
    },
  ],
  navSecondary: [
    {
      label: "Cadastro",
      icon: BookUser,
      href: "/cadastro",
      subMenu: [
        { label: "Usuários", href: "/cadastro/usuarios", icon: Users },
        { label: "Empresas", href: "/cadastro/empresas", icon: Building2 },
      ],
    },
    {
      label: "Configurações",
      icon: Settings,
      href: "/configuracoes",
    },
  ],
};
