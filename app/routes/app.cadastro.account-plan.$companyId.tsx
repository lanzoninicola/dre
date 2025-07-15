import { Company, DREGroup } from "@prisma/client";
import { LoaderFunctionArgs } from "@remix-run/node";
import { Await, defer, useActionData, useFetcher, useLoaderData } from "@remix-run/react";
import { Search, FolderTree, Tag, AlertTriangle, Check, Edit, Trash2, X, Loader2, Plus } from "lucide-react";
import { useState, Suspense } from "react";
import { AccountPlan, getAccountPlanData } from "~/domain/account-plan/account-plan.server";
import { requireUser } from "~/domain/auth/auth.server";
import { badRequest } from "~/utils/http-response.server";
import { action } from "./app.bank-transactions.$companyId";
import AccountPlanForm from "~/domain/account-plan/components/account-plan-form";

interface LoaderData {
  accountPlanData: Promise<{
    company: Company;
    accounts: AccountPlan[];
    dreGroups: DREGroup[];
  }>;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const companyId = url.searchParams.get('company');

  if (!companyId) {
    return badRequest("Empresa não informada");
  }

  // Buscar dados do plano de contas de forma assíncrona
  const accountPlanData = getAccountPlanData(companyId, user.id);

  return defer<LoaderData>({
    accountPlanData
  });
}

// Componente de Loading
function AccountPlanLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header Loading */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Stats Loading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

// Componente Principal do Plano de Contas
function AccountPlanContent({
  company,
  accounts,
  dreGroups
}: {
  company: Company;
  accounts: AccountPlan[];
  dreGroups: DREGroup[];
}) {
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountPlan | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AccountPlan | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<'all' | 'receita' | 'despesa'>('all');
  const [draggedAccount, setDraggedAccount] = useState<AccountPlan | null>(null);

  // Filtrar contas
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.dreGroup.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || account.type === typeFilter;
    return matchesSearch && matchesType;
  });

  // Agrupar por grupo DRE
  const groupedAccounts = filteredAccounts.reduce((groups, account) => {
    const groupName = account.dreGroup.name;
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(account);
    return groups;
  }, {} as Record<string, AccountPlan[]>);

  const handleEdit = (account: AccountPlan) => {
    setEditingAccount(account);
    setIsFormOpen(true);
  };

  const handleDelete = (account: AccountPlan) => {
    setDeletingAccount(account);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Plano de Contas - {company.name}
              </h1>
              <p className="text-gray-500 mt-1">
                Gerencie as contas contábeis e organize entre grupos DRE
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Conta
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filtros */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
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
                <p className="text-2xl font-semibold text-gray-900">{accounts.length}</p>
              </div>
              <FolderTree className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm text-gray-600">Contas de Receita</p>
                <p className="text-2xl font-semibold text-green-600">
                  {accounts.filter(a => a.type === 'receita').length}
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
                  {accounts.filter(a => a.type === 'despesa').length}
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
                              {account._count.bankTransactions} transação{account._count.bankTransactions !== 1 ? 'ões' : ''} vinculada{account._count.bankTransactions !== 1 ? 's' : ''}
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
                              disabled={account._count.bankTransactions > 0}
                              className={`p-2 rounded-md ${account._count.bankTransactions > 0
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
              Nenhuma conta encontrada
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || typeFilter !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Comece criando sua primeira conta do plano de contas.'}
            </p>
            {!searchTerm && typeFilter === 'all' && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md"
              >
                Criar primeira conta
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      {isFormOpen && (
        <AccountPlanForm
          companyId={company.id}
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
                      companyId: company.id
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

// Componente principal com Suspense/Await
export default function CompanyAccountingPlan() {
  const { accountPlanData } = useLoaderData<LoaderData>();

  return (
    <div className="bg-gray-50 min-h-screen">
      <Suspense fallback={<AccountPlanLoading />}>
        <Await
          resolve={accountPlanData}
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
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          }
        >
          {({ company, accounts, dreGroups }) => (
            <AccountPlanContent
              company={company}
              accounts={accounts}
              dreGroups={dreGroups}
            />
          )}
        </Await>
      </Suspense>
    </div>
  );
}