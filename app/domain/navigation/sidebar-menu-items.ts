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
      href: "/app",
      active: true,
    },

    {
      label: "Importar Extrato",
      icon: Upload,
      href: "/app/import",
    },
    {
      label: "Transações",
      icon: FileText,
      href: "/app/bank-transactions",
    },
    {
      label: "DRE",
      icon: FileText,
      href: "/app/dre",
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
        { label: "Usuários", href: "/app/cadastro/usuarios", icon: Users },
        { label: "Empresas", href: "/app/cadastro/empresas", icon: Building2 },
        {
          label: "Plano de contas",
          href: "/app/cadastro/account-plan",
          icon: Building2,
        },
        {
          label: "Grupos DRE",
          href: "/app/cadastro/dre-groups",
          icon: Building2,
        },
      ],
    },
    {
      label: "Configurações",
      icon: Settings,
      href: "/configuracoes",
    },
  ],
};
