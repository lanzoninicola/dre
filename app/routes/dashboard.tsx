// routes/dashboard.tsx
import { Link, Outlet } from "@remix-run/react";
import {
  TrendingUp,
  DollarSign,
  FileText,
  Users,
  Upload,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  ArrowRight,
  Plus
} from "lucide-react";
import { GlassCard } from "~/components/layouts/glass-card";
import { GradientButton } from "~/components/layouts/gradient-button";
import { Navbar } from "~/components/layouts/nav-bar";
import { PageLayout } from "~/components/layouts/page-layout";
import { StatCard } from "~/components/layouts/stat-card";

export default function Dashboard() {
  const user = {
    name: "João Silva",
    email: "joao@contabilidade.com",
    role: "Contador"
  };

  const stats = [
    {
      title: "Receita Total",
      value: "R$ 125.430",
      subtitle: "Este mês",
      icon: <DollarSign className="w-5 h-5" />,
      trend: { value: 12.5, isPositive: true },
      color: "green" as const
    },
    {
      title: "Empresas Ativas",
      value: "28",
      subtitle: "Clientes",
      icon: <Users className="w-5 h-5" />,
      trend: { value: 5.2, isPositive: true },
      color: "indigo" as const
    },
    {
      title: "DREs Pendentes",
      value: "12",
      subtitle: "Para fechar",
      icon: <FileText className="w-5 h-5" />,
      color: "yellow" as const
    },
    {
      title: "Transações",
      value: "1.247",
      subtitle: "Este mês",
      icon: <TrendingUp className="w-5 h-5" />,
      trend: { value: 8.1, isPositive: true },
      color: "purple" as const
    }
  ];

  const recentActivities = [
    {
      title: "DRE de Outubro - Empresa ABC",
      description: "Fechamento mensal concluído",
      time: "2 horas atrás",
      type: "success"
    },
    {
      title: "Importação de extrato - XYZ Ltda",
      description: "350 transações importadas",
      time: "4 horas atrás",
      type: "info"
    },
    {
      title: "Novo usuário criado",
      description: "Maria Santos - Empresa DEF",
      time: "1 dia atrás",
      type: "neutral"
    }
  ];

  const pendingTasks = [
    {
      title: "Classificar transações - ABC Corp",
      priority: "high",
      dueDate: "Hoje"
    },
    {
      title: "Revisar DRE - Tech Solutions",
      priority: "medium",
      dueDate: "Amanhã"
    },
    {
      title: "Backup mensal dos dados",
      priority: "low",
      dueDate: "Esta semana"
    }
  ];

  return (
    <>
      <Navbar user={user} />
      <Outlet />
    </>

  );
}