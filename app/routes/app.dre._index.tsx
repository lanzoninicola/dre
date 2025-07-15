// app/routes/dres.tsx

import { defer, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Outlet, Link } from "@remix-run/react";
import { FileText, TrendingUp, Building, Calendar, Plus, Search } from "lucide-react";
import { Suspense } from "react";
import { Await } from "@remix-run/react";
import { requireUser } from "~/domain/auth/auth.server";
import { listDREs } from "~/domain/dre/dre.server";
import formatCurrency from "~/utils/format-currency";
import DREsList from "~/domain/dre/components/dre-list";
import prismaClient from "~/lib/prisma/client.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  // Load DREs with company info
  const dresPromise = listDREs({
    includeCompanyInfo: true,
    limit: 20
  });

  const companies = await prismaClient.company.findMany({
    where: {
      accountingFirmId: user.accountingFirmId,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      cnpj: true,
      _count: {
        select: {
          statements: true
        }
      }
    },
    orderBy: {
      name: "asc"
    }
  })

  return defer({
    user,
    dresData: dresPromise,
    companies
  });
}

export default function DREsPage() {
  const { user, dresData, companies } = useLoaderData<typeof loader>();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Stats Cards */}
        <Suspense fallback={<StatsCardsSkeleton />}>
          <Await resolve={dresData}>
            {(dresResult) => <StatsCards dresResult={dresResult} />}
          </Await>
        </Suspense>

        {/* DREs List */}
        <div className="mt-8">
          <Suspense fallback={<AllDREsListSkeleton />}>
            <Await resolve={dresData}>
              {(dresResult) => {

                if (!dresResult.success) {
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Erro ao carregar DREs
                        </h3>
                        <p className="text-sm text-red-600">{dresResult.error}</p>
                      </div>
                    </div>
                  );
                }

                const dres = dresResult.data?.dres || [];

                if (dres.length === 0) {
                  return (
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhuma DRE encontrada
                        </h3>
                        <p className="text-gray-500 mb-6">
                          As DREs aparecerão aqui quando forem geradas pelas empresas.
                        </p>
                        <Link
                          to="/app/companies"
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md inline-flex items-center gap-2"
                        >
                          <Building className="w-4 h-4" />
                          Ver Empresas
                        </Link>
                      </div>
                    </div>
                  );
                }

                return (
                  <Suspense fallback={<div>Carregando empresas...</div>}>
                    <Await resolve={companies}>
                      {(companiesData) => {

                        console.log({ companiesData })
                        return (
                          <DREsList dres={dres} companies={companiesData} />
                        )
                      }
                      }
                    </Await>
                  </Suspense>
                );
              }}
            </Await>
          </Suspense>
        </div>

        <Outlet />
      </div>
    </div>
  );
}

function StatsCards({ dresResult }: { dresResult: any }) {
  if (!dresResult.success) {
    return <StatsCardsSkeleton />;
  }

  const dres = dresResult.data?.dres || [];

  // Calcular estatísticas
  const totalDREs = dres.length;
  const empresasComDRE = new Set(dres.map((dre: any) => dre.companyId)).size;

  const totalLucro = dres.reduce((sum: number, dre: any) => {
    const lucro = dre.data?.lucroLiquido || 0;
    return sum + lucro;
  }, 0);

  const totalReceita = dres.reduce((sum: number, dre: any) => {
    const receita = dre.data?.receitaBruta || 0;
    return sum + receita;
  }, 0);

  const stats = [
    {
      title: "Total de DREs",
      value: totalDREs.toString(),
      icon: FileText,
      color: "indigo"
    },
    {
      title: "Empresas com DRE",
      value: empresasComDRE.toString(),
      icon: Building,
      color: "blue"
    },
    {
      title: "Receita Total",
      value: formatCurrency(totalReceita),
      icon: TrendingUp,
      color: "blue",
      isFinancial: true
    },
    {
      title: "Lucro Total",
      value: formatCurrency(totalLucro),
      icon: TrendingUp,
      color: totalLucro >= 0 ? "green" : "red",
      isFinancial: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  isFinancial = false
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  isFinancial?: boolean;
}) {
  const iconColors = {
    indigo: "text-indigo-600 bg-indigo-50",
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    red: "text-red-600 bg-red-50"
  };

  const valueColors = {
    indigo: "text-gray-900",
    blue: isFinancial ? "text-blue-600" : "text-gray-900",
    green: "text-green-600",
    red: "text-red-600"
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-2xl font-semibold ${valueColors[color as keyof typeof valueColors]}`}>
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${iconColors[color as keyof typeof iconColors]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AllDREsListSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      {/* List items */}
      <div className="divide-y divide-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* Company info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>

                {/* Financial data */}
                <div className="grid grid-cols-2 gap-6">
                  {[1, 2].map((j) => (
                    <div key={j}>
                      <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                      <div className="h-5 bg-gray-200 rounded w-24"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action button */}
              <div className="ml-6">
                <div className="h-10 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}