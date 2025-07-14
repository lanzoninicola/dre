// app/routes/app.bank-transactions._index.tsx
// Página inicial para seleção de empresa com defer/suspense

import { type LoaderFunctionArgs, defer } from "@remix-run/node";
import { useLoaderData, Link, Await } from "@remix-run/react";
import React, { Suspense } from "react";
import {
  Building2,
  ArrowRight,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  Filter,
  Plus,
  Loader2
} from "lucide-react";
import { requireUser } from "~/domain/auth/auth.server";
import { prisma } from "~/infrastructure/prisma/client.server";

// Função para buscar empresas básicas (rápido)
async function getCompaniesForUser(user: any) {
  let companies = [];

  if (user.type === "company" && user.companyId) {
    // Usuário de empresa - só sua própria empresa
    const company = await prisma.company.findUnique({
      where: {
        id: user.companyId,
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
      }
    });
    if (company) companies = [company];
  } else if (user.type === "accountingFirm" && user.accountingFirmId) {
    // Usuário de escritório contábil - empresas do escritório
    companies = await prisma.company.findMany({
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
    });
  } else {
    // Usuário com acessos específicos via UserCompanyAccess
    const userAccesses = await prisma.userCompanyAccess.findMany({
      where: {
        userId: user.id,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            cnpj: true,
            isActive: true,
            _count: {
              select: {
                statements: true
              }
            }
          }
        }
      }
    });

    companies = userAccesses
      .filter(access => access.company.isActive)
      .map(access => access.company);
  }

  return companies;
}

// Função para buscar estatísticas (lento - vai ser diferido)
async function getCompaniesWithStats(companies: any[]) {
  return Promise.all(
    companies.map(async (company) => {
      const [transactionStats, pendingCount] = await Promise.all([
        prisma.bankTransaction.aggregate({
          where: {
            statement: {
              companyId: company.id
            }
          },
          _count: {
            _all: true
          },
          _sum: {
            amount: true
          }
        }),
        prisma.bankTransaction.count({
          where: {
            statement: {
              companyId: company.id
            },
            isClassified: false
          }
        })
      ]);

      return {
        ...company,
        stats: {
          totalTransactions: transactionStats._count._all || 0,
          totalAmount: transactionStats._sum.amount?.toNumber() || 0,
          pendingTransactions: pendingCount,
          statementsCount: company._count.statements
        }
      };
    })
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  // Carregar lista básica de empresas imediatamente (rápido)
  const companies = await getCompaniesForUser(user);

  // Carregar estatísticas de forma diferida (lento)
  const companiesWithStatsPromise = getCompaniesWithStats(companies);

  return defer({
    // Dados imediatos
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      type: user.type
    },
    companiesCount: companies.length,
    basicCompanies: companies, // Lista básica sem estatísticas
    // Dados diferidos
    companiesWithStats: companiesWithStatsPromise
  });
}

// Skeleton para resumo geral
function SummaryLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-12"></div>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton para cards de empresas
function CompaniesLoadingSkeleton({ basicCompanies }: { basicCompanies: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {basicCompanies.map((company) => (
        <div key={company.id} className="border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900">
                {company.name}
              </h4>
              {company.cnpj && (
                <p className="text-sm text-gray-500 mt-1">
                  CNPJ: {company.cnpj}
                </p>
              )}
            </div>
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Skeletons para estatísticas */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Transações</p>
                <div className="h-4 bg-gray-200 rounded w-8 mt-1"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pendentes</p>
                <div className="h-4 bg-gray-200 rounded w-8 mt-1"></div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Movimento Total</span>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Extratos importados</span>
              <div className="h-3 bg-gray-200 rounded w-8"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Estado de loading inicial
function InitialLoadingState({ user, companiesCount, basicCompanies }: {
  user: any,
  companiesCount: number,
  basicCompanies: any[]
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {companiesCount === 0 ? (
        // Estado vazio
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma empresa encontrada
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {user.type === "company"
              ? "Você não está vinculado a nenhuma empresa ativa. Entre em contato com seu escritório contábil."
              : user.type === "accountingFirm"
                ? "Não há empresas cadastradas no seu escritório contábil. Cadastre a primeira empresa para começar."
                : "Você não tem acesso a nenhuma empresa. Entre em contato com seu administrador."
            }
          </p>
          {user.type === "accountingFirm" && (
            <Link
              to="/empresas/nova"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-md inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Primeira Empresa
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Indicador de carregamento no topo */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando estatísticas das empresas...
            </div>
            {user.type === "accountingFirm" && (
              <Link
                to="/empresas/nova"
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Empresa
              </Link>
            )}
          </div>

          <SummaryLoadingSkeleton />

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Suas Empresas</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar empresas..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>
            <CompaniesLoadingSkeleton basicCompanies={basicCompanies} />
          </div>
        </>
      )}
    </div>
  );
}

// Componente das empresas carregadas
function CompaniesSection({ companiesWithStats, user }: { companiesWithStats: any[], user: any }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calcular resumo geral
  const summary = {
    totalCompanies: companiesWithStats.length,
    totalTransactions: companiesWithStats.reduce((sum, company) => sum + company.stats.totalTransactions, 0),
    totalPending: companiesWithStats.reduce((sum, company) => sum + company.stats.pendingTransactions, 0),
    totalAmount: companiesWithStats.reduce((sum, company) => sum + company.stats.totalAmount, 0)
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Resumo geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Empresas</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalCompanies}</p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <Building2 className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transações</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalTransactions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-semibold text-yellow-600">{summary.totalPending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Movimento Total</p>
              <p className={`text-2xl font-semibold ${summary.totalAmount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                {formatCurrency(summary.totalAmount)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de empresas */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Suas Empresas</h3>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar empresas..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {user.type === "accountingFirm" && (
                <Link
                  to="/empresas/nova"
                  className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nova Empresa
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {companiesWithStats.map((company) => (
            <Link
              key={company.id}
              to={`/app/bank-transactions/${company.id}`}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md hover:border-indigo-300 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {company.name}
                  </h4>
                  {company.cnpj && (
                    <p className="text-sm text-gray-500 mt-1">
                      CNPJ: {company.cnpj}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>

              {/* Estatísticas da empresa */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Transações</p>
                    <p className="text-sm font-medium text-gray-900">
                      {company.stats.totalTransactions}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pendentes</p>
                    <p className="text-sm font-medium text-yellow-600">
                      {company.stats.pendingTransactions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Movimento Total</span>
                  <span className={`text-sm font-medium ${company.stats.totalAmount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {formatCurrency(company.stats.totalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Extratos importados</span>
                  <span className="text-xs text-gray-700 font-medium">
                    {company.stats.statementsCount}
                  </span>
                </div>
              </div>

              {/* Indicador de ação necessária */}
              {company.stats.pendingTransactions > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {company.stats.pendingTransactions} transação(ões) pendente(s) de classificação
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente principal
export default function TransacoesIndex() {
  const { user, companiesCount, basicCompanies, companiesWithStats } = useLoaderData<typeof loader>();

  return (
    <Suspense fallback={<InitialLoadingState user={user} companiesCount={companiesCount} basicCompanies={basicCompanies} />}>
      <Await resolve={companiesWithStats}>
        {(resolvedCompanies) => {
          if (resolvedCompanies.length === 0) {
            return (
              <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="text-center py-12">
                  <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma empresa encontrada
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {user.type === "company"
                      ? "Você não está vinculado a nenhuma empresa ativa. Entre em contato com seu escritório contábil."
                      : user.type === "accountingFirm"
                        ? "Não há empresas cadastradas no seu escritório contábil. Cadastre a primeira empresa para começar."
                        : "Você não tem acesso a nenhuma empresa. Entre em contato com seu administrador."
                    }
                  </p>
                  {user.type === "accountingFirm" && (
                    <Link
                      to="/empresas/nova"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-md inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Cadastrar Primeira Empresa
                    </Link>
                  )}
                </div>
              </div>
            );
          }

          return <CompaniesSection companiesWithStats={resolvedCompanies} user={user} />;
        }}
      </Await>
    </Suspense>
  );
}