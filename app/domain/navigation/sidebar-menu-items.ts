import {
  BarChart3,
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  Upload,
  Users,
} from "lucide-react";
import { SidebarMenuItems } from "./navigation.types";

export const SIDEBAR_MENU_ITEMS: SidebarMenuItems = {
  navMain: [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: true,
    },
    {
      label: "Empresas",
      icon: Building2,
      href: "/empresas",
    },
    {
      label: "Importar Extrato",
      icon: Upload,
      href: "/dashboard/import",
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
    {
      label: "Usuários",
      icon: Users,
      href: "/usuarios",
    },
    {
      label: "Configurações",
      icon: Settings,
      href: "/configuracoes",
    },
  ],
};
