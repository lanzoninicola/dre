import { Company, DREGroup } from "@prisma/client";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Await, defer, Link, Outlet, useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import { Search, FolderTree, Tag, AlertTriangle, Check, Edit, Trash2, X, Loader2, Plus, ArrowLeft } from "lucide-react";
import { useState, Suspense } from "react";
import { AccountPlan, getAccountPlanData } from "~/domain/account-plan/account-plan.server";
import { requireUser } from "~/domain/auth/auth.server";
import { badRequest } from "~/utils/http-response.server";
import AccountPlanForm from "~/domain/account-plan/components/account-plan-form";
import { getCompanyById, validateUserCompanyAccess } from "~/domain/company/company.server";
import prismaClient from "~/lib/prisma/client.server";

interface LoaderData {
  data: Promise<{
    company: Company;
    accounts: AccountPlan[];
    dreGroups: DREGroup[];
  }>;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId;

  if (!companyId) {
    return badRequest("Empresa não informada na URL");
  }

  // Criar uma promise que retorna todos os dados necessários
  const data = async () => {
    try {
      console.log(`[loader] Buscando dados para companyId: ${companyId}`);

      const [company, accountPlanData] = await Promise.all([
        getCompanyById(companyId),
        getAccountPlanData(companyId)
      ]);

      if (!company) {
        throw new Error(`Empresa não encontrada com ID: ${companyId}`);
      }

      const hasAccess = await validateUserCompanyAccess(companyId, user.id);
      if (!hasAccess) {
        throw new Error("Você não tem acesso a esta empresa");
      }

      return {
        company,
        accounts: accountPlanData.accounts,
        dreGroups: accountPlanData.dreGroups
      };
    } catch (error) {
      console.error('[loader] Erro ao carregar dados do plano de contas:', error);
      throw error;
    }
  };

  return defer<LoaderData>({ data: data() });
}

export async function action({ request }: LoaderFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const companyId = formData.get("companyId")?.toString();

  if (!companyId) {
    return json({ error: "Empresa não informada." }, { status: 400 });
  }

  try {
    if (intent === "move-account") {
      const accountId = formData.get("accountId")?.toString();
      const newDreGroupId = formData.get("newDreGroupId")?.toString();

      if (!accountId || !newDreGroupId) {
        return json({ error: "Dados incompletos para mover conta." }, { status: 400 });
      }

      await prismaClient.accountPlan.update({
        where: { id: accountId },
        data: {
          dreGroupId: newDreGroupId
        }
      });

      return json({ success: "Conta movida com sucesso." });
    }

    if (intent === "delete") {
      const accountId = formData.get("accountId")?.toString();

      if (!accountId) {
        return json({ error: "ID da conta não informado." }, { status: 400 });
      }

      await prismaClient.accountPlan.delete({
        where: { id: accountId }
      });

      return json({ success: "Conta excluída com sucesso." });
    }

    return json({ error: "Ação não reconhecida." }, { status: 400 });
  } catch (error: any) {
    console.error("Erro na action do plano de contas:", error);
    return json({ error: "Erro interno ao processar a solicitação." }, { status: 500 });
  }
}

// Componente principal com Suspense/Await
export default function CompanyAccountingPlan() {
  const { data } = useLoaderData<LoaderData>();

  return (
    <>
      <Outlet />
      <Suspense fallback={<AccountPlanLoading />}>
        <Await
          resolve={data}
          errorElement={
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  Erro ao carregar dados
                </h3>
                <p className="text-red-700 mb-4">
                  Não foi possível carregar o plano de contas da empresa selecionada.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md"
                  >
                    Tentar novamente
                  </button>
                  <Link
                    to="/app/cadastro/account-plan"
                    className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-md"
                  >
                    Voltar
                  </Link>
                </div>
              </div>
            </div>
          }
        >
          {(resolvedData) => {
            // Debug log para verificar os dados
            console.log('Resolved data:', resolvedData);

            // Verificações de segurança
            if (!resolvedData) {
              console.error('No data resolved');
              return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-yellow-900 mb-2">
                      Dados não encontrados
                    </h3>
                    <p className="text-yellow-700 mb-4">
                      Nenhum dado foi retornado para a empresa selecionada.
                    </p>
                    <Link
                      to="/app/cadastro/account-plan"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-4 py-2 rounded-md"
                    >
                      Voltar à seleção
                    </Link>
                  </div>
                </div>
              );
            }

            if (!resolvedData.company) {
              console.error('Company not found in resolved data');
              return (
                <div className="max-w-7xl mx-auto px-4 py-8">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-yellow-900 mb-2">
                      Empresa não encontrada
                    </h3>
                    <p className="text-yellow-700 mb-4">
                      A empresa selecionada não foi encontrada ou você não tem acesso a ela.
                    </p>
                    <Link
                      to="/app/cadastro/account-plan"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-4 py-2 rounded-md"
                    >
                      Voltar à seleção
                    </Link>
                  </div>
                </div>
              );
            }

            return (
              <AccountPlanContent
                company={resolvedData.company}
                accounts={resolvedData.accounts || []}
                dreGroups={resolvedData.dreGroups || []}
              />
            );
          }}
        </Await>
      </Suspense>
    </>
  );
}

// Componente de Loading melhorado
function AccountPlanLoading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header Loading */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-80 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Loading */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Stats Loading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Loading */}
        <div className="bg-white border border-gray-200 rounded-lg p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <span className="ml-3 text-gray-600">Carregando plano de contas...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountPlanContent({
  company,
  accounts = [],
  dreGroups = []
}: {
  company: Company | null;
  accounts: AccountPlan[];
  dreGroups: DREGroup[];
}) {
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();

  const [editingAccount, setEditingAccount] = useState<AccountPlan | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AccountPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<'all' | 'receita' | 'despesa'>('all');
  const [draggedAccount, setDraggedAccount] = useState<AccountPlan | null>(null);

  // Verificação de segurança para company
  if (!company) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-yellow-900 mb-2">
            Empresa não encontrada
          </h3>
          <p className="text-yellow-700 mb-4">
            A empresa selecionada não foi encontrada ou você não tem acesso a ela.
          </p>
          <Link
            to="/app/cadastro/account-plan"
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-medium px-4 py-2 rounded-md"
          >
            Voltar à seleção
          </Link>
        </div>
      </div>
    );
  }

  // Filtrar contas
  const filteredAccounts = accounts?.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.dreGroup.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || account.type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  // Agrupar por grupo DRE
  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const groupName = account.dreGroup?.name || 'Sem grupo';

    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(account);
    return groups;
  }, {} as Record<string, AccountPlan[]>);

  const handleEdit = (account: AccountPlan) => {
    setEditingAccount(account);
  };

  const handleDelete = (account: AccountPlan) => {
    setDeletingAccount(account);
  };

  const handleCloseForm = () => {
    setEditingAccount(null);
  };

  const handleCloseDelete = () => {
    setDeletingAccount(null);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, account: AccountPlan) => {
    setDraggedAccount(account);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetGroupId: string) => {
    e.preventDefault();

    if (!draggedAccount) return;

    const targetGroup = dreGroups.find(g => g.id === targetGroupId);
    if (!targetGroup) return;

    // Verificar se o tipo é compatível
    if (draggedAccount.type !== targetGroup.type) {
      // Mostrar mensagem de erro
      return;
    }

    // Se já está no mesmo grupo, não fazer nada
    if (draggedAccount.dreGroup.id === targetGroupId) return;

    // Mover a conta
    fetcher.submit(
      {
        intent: "move-account",
        accountId: draggedAccount.id,
        newDreGroupId: targetGroupId,
        companyId: company.id
      },
      { method: "post" }
    );

    setDraggedAccount(null);
  };

  const handleDragEnd = () => {
    setDraggedAccount(null);
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  to="/app/cadastro/account-plan"
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Link>
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Plano de Contas - {company?.name}
              </h1>

            </div>
            <div className="flex items-center gap-3">
              <Link
                to="new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Conta
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar contas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'receita' | 'despesa')}
                className="border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">Todos os tipos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Total de Contas</p>
                <p className="text-2xl font-semibold text-gray-900">{accounts?.length || 0}</p>
              </div>
              <FolderTree className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Contas de Receita</p>
                <p className="text-2xl font-semibold text-green-600">
                  {accounts?.filter(a => a.type === 'receita').length || 0}
                </p>
              </div>
              <Tag className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Contas de Despesa</p>
                <p className="text-2xl font-semibold text-red-600">
                  {accounts?.filter(a => a.type === 'despesa').length || 0}
                </p>
              </div>
              <Tag className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Alertas */}
        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{actionData.error}</p>
              </div>
            </div>
          </div>
        )}

        {actionData?.success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <Check className="w-5 h-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">{actionData.success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instruções de Drag and Drop */}
        {accounts?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <FolderTree className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  Reorganizar Contas
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Arraste e solte as contas entre os grupos DRE para reorganizar o plano de contas.
                  Só é possível mover contas entre grupos compatíveis (receita para receita, despesa para despesa).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Contas Agrupadas */}
        {Object.keys(groupedAccounts).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedAccounts).map(([groupName, groupAccounts]) => {
              const group = dreGroups.find(g => g.name === groupName);
              return (
                <div
                  key={groupName}
                  className={`bg-white border border-gray-200 rounded-lg transition-colors ${draggedAccount && group && draggedAccount.type === group.type
                    ? 'border-indigo-300 bg-indigo-50'
                    : ''
                    }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => group && handleDrop(e, group.id)}
                >
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-medium text-gray-900">{groupName}</h3>
                    <p className="text-sm text-gray-500">
                      {groupAccounts.length} conta{groupAccounts.length !== 1 ? 's' : ''} •
                      Tipo: {group?.type === 'receita' ? 'Receita' : 'Despesa'}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {groupAccounts.map((account) => (
                      <div
                        key={account.id}
                        className={`p-6 hover:bg-gray-50 cursor-move transition-colors ${draggedAccount?.id === account.id ? 'opacity-50' : ''
                          }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, account)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-8 bg-gray-300 rounded cursor-grab active:cursor-grabbing" />
                              <h4 className="text-lg font-medium text-gray-900">
                                {account.name}
                              </h4>
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded border ${account.type === 'receita'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                                  }`}
                              >
                                {account.type === 'receita' ? 'Receita' : 'Despesa'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {account._count?.bankTransactions || 0} transação{(account._count?.bankTransactions || 0) !== 1 ? 'ões' : ''} vinculada{(account._count?.bankTransactions || 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(account)}
                              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-md"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(account)}
                              disabled={(account._count?.bankTransactions || 0) > 0}
                              className={`p-2 rounded-md ${(account._count?.bankTransactions || 0) > 0
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <FolderTree className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || typeFilter !== 'all' ? 'Nenhuma conta encontrada' : 'Nenhuma conta cadastrada'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || typeFilter !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando sua primeira conta do plano de contas.'}
            </p>
            {(!searchTerm && typeFilter === 'all') && (
              <Link
                to="new"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Criar primeira conta
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      {editingAccount && (
        <AccountPlanForm
          companyId={company?.id}
          dreGroups={dreGroups}
          account={editingAccount}
          onClose={handleCloseForm}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Excluir Conta</h3>
              </div>
              <button
                onClick={handleCloseDelete}
                disabled={fetcher.state === "submitting"}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-700">
                Tem certeza que deseja excluir a conta "{deletingAccount.name}"?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button
                type="button"
                onClick={handleCloseDelete}
                disabled={fetcher.state === "submitting"}
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  fetcher.submit(
                    {
                      intent: "delete",
                      accountId: deletingAccount.id,
                      companyId: company?.id || ""
                    },
                    { method: "post" }
                  );
                  handleCloseDelete();
                }}
                disabled={fetcher.state === "submitting"}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {fetcher.state === "submitting" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}