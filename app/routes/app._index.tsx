// routes/app.tsx
import { Link } from "@remix-run/react";
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

export default function Home() {
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
      <PageLayout
        title="Iniçio"
        subtitle="Visão geral do seu sistema de gestão contábil"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <GlassCard variant="secondary" className="p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Ações Rápidas
              </h3>

              <div className="space-y-4">
                <Link
                  to={"/app/import"}
                >
                  <GradientButton
                    variant="primary"
                    className="w-full justify-start"
                    icon={<Upload className="w-4 h-4" />}
                    iconPosition="left"
                  >
                    Importar Extrato
                  </GradientButton>
                </Link>

                <GradientButton
                  variant="secondary"
                  className="w-full justify-start"
                  icon={<FileText className="w-4 h-4" />}
                  iconPosition="left"
                >
                  Gerar DRE
                </GradientButton>

                <GradientButton
                  variant="secondary"
                  className="w-full justify-start"
                  icon={<Plus className="w-4 h-4" />}
                  iconPosition="left"
                >
                  Nova Empresa
                </GradientButton>

                <GradientButton
                  variant="secondary"
                  className="w-full justify-start"
                  icon={<Download className="w-4 h-4" />}
                  iconPosition="left"
                >
                  Exportar Dados
                </GradientButton>
              </div>
            </GlassCard>
          </div>

          {/* Recent Activities */}
          <div className="lg:col-span-2">
            <GlassCard variant="secondary" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Atividades Recentes
                </h3>
                <GradientButton variant="ghost" size="sm">
                  Ver todas
                  <ArrowRight className="w-4 h-4" />
                </GradientButton>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/60 transition-all duration-200">
                    <div className={`w-3 h-3 rounded-full mt-2 ${activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'info' ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{activity.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Tasks */}
          <GlassCard variant="secondary" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Tarefas Pendentes
              </h3>
              <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded-full">
                {pendingTasks.length} pendentes
              </span>
            </div>

            <div className="space-y-3">
              {pendingTasks.map((task, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/60 transition-all duration-200">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{task.title}</h4>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-600' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                        {task.priority === 'high' ? 'Alta' :
                          task.priority === 'medium' ? 'Média' : 'Baixa'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {task.dueDate}
                      </span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-indigo-600 transition-colors duration-200">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Stats Chart Area */}
          <GlassCard variant="secondary" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                Resumo Mensal
              </h3>
              <div className="flex gap-2">
                <button className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white/50 rounded-lg transition-all duration-200">
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white/50 rounded-lg transition-all duration-200">
                  <PieChart className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Placeholder for chart */}
            <div className="h-48 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center border border-white/20">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Gráfico de Performance</p>
                <p className="text-sm text-gray-500 mt-1">Dados dos últimos 6 meses</p>
              </div>
            </div>

            {/* Summary Numbers */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">94%</p>
                <p className="text-sm text-gray-600">DREs Concluídas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">R$ 890K</p>
                <p className="text-sm text-gray-600">Volume Processado</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8">
          <GlassCard variant="secondary" className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  Precisa de ajuda com o fechamento mensal?
                </h4>
                <p className="text-gray-600">
                  Nossa equipe está disponível para auxiliar no processo de fechamento e classificação.
                </p>
              </div>
              <div className="flex gap-3">
                <GradientButton variant="secondary" size="sm">
                  Documentação
                </GradientButton>
                <GradientButton variant="primary" size="sm">
                  Falar com Suporte
                  <ArrowRight className="w-4 h-4" />
                </GradientButton>
              </div>
            </div>
          </GlassCard>
        </div>
      </PageLayout>
    </>
  );
}