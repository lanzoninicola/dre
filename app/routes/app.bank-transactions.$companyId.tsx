// app/routes/app.bank-transactions.$companyId.tsx
// Página de transações da empresa específica com defer/suspense

import { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction, json, defer } from "@remix-run/node";
import { useLoaderData, useActionData, useSearchParams, useSubmit, Await, Link } from "@remix-run/react";
import React, { Suspense } from "react";
import { Loader2, ArrowLeft, FileText, Clock, TrendingUp, TrendingDown } from "lucide-react";

import { requireUser } from "~/domain/auth/auth.server";
import { TransactionsPage } from "~/domain/transactions/components/transaction-page";
import {
  verifyUserCompanyAccess,
  getTransactionsByCompany,
  getAccountPlanByCompany,
  getCompanyById,
  classifyTransaction,
  bulkClassifyTransactions,
  reconcileTransaction
} from "~/domain/transactions/transactions.server";
import { buildTransactionFilters } from "~/domain/transactions/transactions.utils";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { companyId } = params;

  if (!companyId) {
    throw new Response("ID da empresa é obrigatório", { status: 400 });
  }

  // Verificar permissão do usuário para acessar esta empresa
  await verifyUserCompanyAccess(user.id, companyId);

  const url = new URL(request.url);
  const filters = buildTransactionFilters(url.searchParams);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  // Dados críticos que devem ser carregados imediatamente (100-300ms)
  const criticalData = Promise.all([
    getCompanyById(companyId),
    getAccountPlanByCompany(companyId)
  ]);

  // Dados que podem ser carregados de forma diferida (1-3 segundos)
  const transactionsPromise = getTransactionsByCompany({ companyId, filters, page, limit });

  // Aguardar apenas os dados críticos
  const [company, accounts] = await criticalData;

  if (!company) {
    throw new Response("Empresa não encontrada", { status: 404 });
  }

  // Retornar com defer para carregar transações de forma assíncrona
  return defer({
    // Dados imediatos
    company,
    accounts,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      type: user.type
    },
    pagination: {
      currentPage: page,
      totalPages: 1, // Será atualizado quando as transações carregarem
      totalCount: 0, // Será atualizado quando as transações carregarem
      limit
    },
    filters,
    // Dados diferidos
    transactionsData: transactionsPromise
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const { companyId } = params;

  if (!companyId) {
    throw new Response("ID da empresa é obrigatório", { status: 400 });
  }

  // Verificar permissão do usuário para acessar esta empresa
  await verifyUserCompanyAccess(user.id, companyId);

  const formData = await request.formData();
  const actionType = formData.get("_action");

  try {
    switch (actionType) {
      case "classify": {
        const transactionId = formData.get("transactionId") as string;
        const accountId = formData.get("accountId") as string;
        const notes = formData.get("notes") as string;

        if (!transactionId || !accountId) {
          return json({
            error: "ID da transação e da conta são obrigatórios",
            success: false
          }, { status: 400 });
        }

        await classifyTransaction({
          transactionId,
          accountId,
          notes: notes || undefined,
          userId: user.id,
          companyId
        });

        return json({
          success: true,
          message: "Transação classificada com sucesso"
        });
      }

      case "bulk_classify": {
        const transactionIdsJson = formData.get("transactionIds") as string;
        const accountId = formData.get("accountId") as string;

        if (!transactionIdsJson || !accountId) {
          return json({
            error: "IDs das transações e da conta são obrigatórios",
            success: false
          }, { status: 400 });
        }

        let transactionIds: string[];
        try {
          transactionIds = JSON.parse(transactionIdsJson);
        } catch {
          return json({
            error: "IDs das transações inválidos",
            success: false
          }, { status: 400 });
        }

        if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
          return json({
            error: "Nenhuma transação selecionada",
            success: false
          }, { status: 400 });
        }

        const result = await bulkClassifyTransactions({
          transactionIds,
          accountId,
          userId: user.id,
          companyId
        });

        return json({
          success: true,
          message: `${result.count} transações classificadas com sucesso`
        });
      }

      case "reconcile": {
        const transactionId = formData.get("transactionId") as string;

        if (!transactionId) {
          return json({
            error: "ID da transação é obrigatório",
            success: false
          }, { status: 400 });
        }

        await reconcileTransaction({
          transactionId,
          userId: user.id,
          companyId
        });

        return json({
          success: true,
          message: "Transação reconciliada com sucesso"
        });
      }

      default:
        return json({
          error: "Ação inválida",
          success: false
        }, { status: 400 });
    }
  } catch (error) {
    console.error("Erro na action:", error);

    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";

    return json({
      error: errorMessage,
      success: false
    }, { status: 500 });
  }
}

// Skeleton para cards de estatísticas
function StatsLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
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

// Skeleton para a tabela
function TableLoadingSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente de Loading Geral
function TransactionsLoadingState({ company, accounts }: { company: any, accounts: any }) {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Link to="/app/bank-transactions" className="hover:text-gray-900 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Transações
                </Link>
                <span>/</span>
                <span className="text-gray-900">{company.name}</span>
              </nav>
              <h1 className="text-2xl font-semibold text-gray-900">Transações Bancárias</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-600">{company.name}</p>
                {company.cnpj && (
                  <span className="text-sm text-gray-500">CNPJ: {company.cnpj}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando transações...
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <StatsLoadingSkeleton />

        {/* Barra de filtros já funcional */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4">
                    🔍
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por descrição, valor ou documento..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    disabled
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  disabled
                  className="px-4 py-2 border border-gray-300 rounded-md font-medium flex items-center gap-2 bg-gray-50 text-gray-400 cursor-not-allowed"
                >
                  🔧 Filtros
                </button>
              </div>
            </div>
          </div>
        </div>

        <TableLoadingSkeleton />
      </div>
    </div>
  );
}

// Componente principal
export default function TransacoesEmpresa() {
  const { company, accounts, user, pagination, filters, transactionsData } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();

  // Mostrar mensagens de feedback
  React.useEffect(() => {
    if (actionData?.success && actionData?.message) {
      // Aqui você pode implementar um toast/notification
      console.log("Sucesso:", actionData.message);
    } else if (actionData?.error) {
      // Aqui você pode implementar um toast/notification de erro
      console.error("Erro:", actionData.error);
    }
  }, [actionData]);

  return (
    <Suspense fallback={<TransactionsLoadingState company={company} accounts={accounts} />}>
      <Await resolve={transactionsData}>
        {(resolvedTransactionsData) => {
          // Atualizar pagination com dados reais
          const updatedPagination = {
            ...pagination,
            totalPages: resolvedTransactionsData.totalPages,
            totalCount: resolvedTransactionsData.totalCount
          };

          return (
            <TransactionsPage
              transactions={resolvedTransactionsData.transactions}
              accounts={accounts}
              company={company}
              user={user}
              pagination={updatedPagination}
              onClassifyTransaction={(transactionId: string, accountId: string, notes?: string) => {
                const formData = new FormData();
                formData.append("_action", "classify");
                formData.append("transactionId", transactionId);
                formData.append("accountId", accountId);
                if (notes) formData.append("notes", notes);

                submit(formData, {
                  method: "post",
                  replace: true
                });
              }}
              onBulkClassify={(transactionIds: string[], accountId: string) => {
                const formData = new FormData();
                formData.append("_action", "bulk_classify");
                formData.append("transactionIds", JSON.stringify(transactionIds));
                formData.append("accountId", accountId);

                submit(formData, {
                  method: "post",
                  replace: true
                });
              }}
              onReconcileTransaction={(transactionId: string) => {
                const formData = new FormData();
                formData.append("_action", "reconcile");
                formData.append("transactionId", transactionId);

                submit(formData, {
                  method: "post",
                  replace: true
                });
              }}
              onUpdateFilters={(newFilters) => {
                const params = new URLSearchParams(searchParams);

                Object.entries(newFilters).forEach(([key, value]) => {
                  if (value && value.trim() !== '') {
                    params.set(key, value);
                  } else {
                    params.delete(key);
                  }
                });

                params.set("page", "1");

                submit(params, {
                  method: "get",
                  replace: true
                });
              }}
            />
          );
        }}
      </Await>
    </Suspense>
  );
}

// Error Boundary customizado para esta rota
export function ErrorBoundary() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Ops! Algo deu errado</h1>
          <p className="text-lg text-gray-600 mb-8">
            Não foi possível carregar as transações desta empresa.
          </p>
          <div className="space-x-4">
            <Link
              to="/app/bank-transactions"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-md"
            >
              Voltar para Empresas
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-6 py-3 rounded-md"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Meta para SEO
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const companyName = data?.company?.name || "Empresa";
  return [
    { title: `Transações - ${companyName} | FinanceFlow` },
    {
      name: "description",
      content: `Visualize e classifique as transações bancárias de ${companyName}`
    },
  ];
};