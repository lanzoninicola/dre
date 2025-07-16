// app/routes/bank-transactions.tsx
// Página inicial para seleção de empresa

import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  Building2,
  ArrowRight,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Search,
  Filter,
  Plus
} from "lucide-react";
import { PageLayout } from "~/components/layouts/page-layout";
import { SearchInput } from "~/components/search-input/search-input";
import { requireUser } from "~/domain/auth/auth.server";
import { prisma } from "~/infrastructure/prisma/client.server";
import formatCurrency from "~/utils/format-currency";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  // Buscar empresas que o usuário tem acesso baseado no tipo de usuário
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

  // Buscar estatísticas rápidas para cada empresa
  const companiesWithStats = await Promise.all(
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

  return json({
    companies: companiesWithStats,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      type: user.type
    }
  });
}

export default function TransacoesIndex() {
  const { companies, user } = useLoaderData<typeof loader>();



  return (


    <PageLayout
      title="Transações Bancárias"
      subtitle="Selecione uma empresa para visualiza e classificar as transações"
    >

      <div className="max-w-7xl mx-auto px-4 py-8">
        {companies.length === 0 ? (
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
            {/* Resumo geral */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Empresas</p>
                    <p className="text-2xl font-semibold text-gray-900">{companies.length}</p>
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
                    <p className="text-2xl font-semibold text-gray-900">
                      {companies.reduce((sum, company) => sum + company.stats.totalTransactions, 0)}
                    </p>
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
                    <p className="text-2xl font-semibold text-yellow-600">
                      {companies.reduce((sum, company) => sum + company.stats.pendingTransactions, 0)}
                    </p>
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
                    <p className={`text-2xl font-semibold ${companies.reduce((sum, company) => sum + company.stats.totalAmount, 0) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                      }`}>
                      {formatCurrency(companies.reduce((sum, company) => sum + company.stats.totalAmount, 0))}
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
                  <SearchInput placeholder="Buscar empresas" />
                  {user.type === "accountingFirm" && (
                    <div className="flex gap-3">
                      <Link
                        to="/empresas/nova"
                        className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-md flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Nova Empresa
                      </Link>
                    </div>
                  )}

                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {companies.map((company) => (
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
          </>
        )}
      </div>
    </PageLayout>

  );
}