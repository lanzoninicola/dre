// app/routes/dres.tsx

import { defer, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link, Outlet } from "@remix-run/react";
import { FileText, TrendingUp, Calendar, Building, Eye } from "lucide-react";
import { Suspense } from "react";
import { Await } from "@remix-run/react";
import { requireUser } from "~/domain/auth/auth.server";
import { listDREs } from "~/domain/dre/dre.server";
import formatCurrency from "~/utils/format-currency";
import { formatDREPeriod } from "~/domain/dre/dre-calculation.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  // Load DREs with company info
  const dresPromise = listDREs({
    includeCompanyInfo: true,
    limit: 20
  });

  return defer({
    user,
    dresData: dresPromise
  });
}

export default function DREsPage() {
  const { user, dresData } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          DREs - Visão Geral
        </h1>
        <p className="text-gray-600 mt-2">
          Visualize todas as Demonstrações do Resultado do Exercício
        </p>
      </div>

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
            {(dresResult) => <AllDREsList dresResult={dresResult} />}
          </Await>
        </Suspense>
      </div>

      <Outlet />
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total de DREs</p>
            <p className="text-2xl font-bold text-gray-900">{totalDREs}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <FileText className="w-6 h-6 text-indigo-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Empresas com DRE</p>
            <p className="text-2xl font-bold text-gray-900">{empresasComDRE}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Receita Total</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalReceita)}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Lucro Total</p>
            <p className={`text-2xl font-bold ${totalLucro >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalLucro)}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${totalLucro >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <TrendingUp className={`w-6 h-6 ${totalLucro >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AllDREsList({ dresResult }: { dresResult: any }) {
  if (!dresResult.success) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Erro ao carregar DREs</p>
          <p className="text-sm text-red-600 mt-2">{dresResult.error}</p>
        </div>
      </div>
    );
  }

  const dres = dresResult.data?.dres || [];

  if (dres.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma DRE encontrada
          </h3>
          <p className="text-gray-500 mb-4">
            As DREs aparecerão aqui quando forem geradas pelas empresas.
          </p>
          <Link
            to="/empresas"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Ver Empresas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Todas as DREs</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {dres.map((dre: any) => (
          <AllDREsListItem key={dre.id} dre={dre} />
        ))}
      </div>
    </div>
  );
}

function AllDREsListItem({ dre }: { dre: any }) {
  const data = dre.data || {};
  const lucroLiquido = data.lucroLiquido || 0;
  const receitaBruta = data.receitaBruta || 0;

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                DRE - {formatDREPeriod(new Date(dre.periodStart), new Date(dre.periodEnd))}
              </h4>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {dre.company && (
                  <span>{dre.company.name}</span>
                )}
                <span>
                  Gerada em {new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }).format(new Date(dre.generatedAt))}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Receita Bruta</p>
                <p className="font-medium text-blue-600">
                  {formatCurrency(receitaBruta)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${lucroLiquido >= 0 ? 'bg-green-50' : 'bg-red-50'
                }`}>
                <TrendingUp className={`w-4 h-4 ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                  }`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Lucro Líquido</p>
                <p className={`font-medium ${lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {formatCurrency(lucroLiquido)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="ml-6">
          <Link
            to={`/empresas/${dre.companyId}/dres/${dre.id}`}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Visualizar
          </Link>
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
            <div>
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      <div className="divide-y divide-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[1, 2].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                      <div>
                        <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ml-6">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}