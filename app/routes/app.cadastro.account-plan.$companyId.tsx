import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Link, Form } from "@remix-run/react";
import { Plus, Edit, Trash2, BarChart3, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { createAccountPlanService } from "~/domain/account-plan/services/accoun-plan.service.server";
import { requireUser } from "~/domain/auth/auth.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId!;

  if (!user) {
    throw new Response("Autorização negada", { status: 401 })
  }

  if (!companyId) {
    throw new Response("Company ID is required", { status: 400 });
  }

  const accountPlanService = createAccountPlanService({
    id: user.id,
    role: user.role,
    accountingFirmId: user?.accountingFirmId ?? undefined
  });

  // Usar o método migrado que busca dados completos
  const result = await accountPlanService.getAccountPlanData(companyId);

  if (!result.success) {
    throw new Response(result.error, { status: 400 });
  }

  // Buscar estatísticas também
  const statsResult = await accountPlanService.getStats(companyId);

  return json({
    ...result.data, // accounts e dreGroups
    stats: statsResult.success ? statsResult.data : null,
    user,
    companyId
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId!;
  const formData = await request.formData();
  const intent = formData.get('intent') as string;
  const accountId = formData.get('accountId') as string;

  const accountPlanService = createAccountPlanService({
    id: user.id,
    role: user.role,
    accountingFirmId: user?.accountingFirmId ?? undefined
  });

  switch (intent) {
    case 'delete':
      return json(await accountPlanService.delete(companyId, accountId));

    case 'move':
      const newDreGroupId = formData.get('newDreGroupId') as string;
      return json(await accountPlanService.moveAccountToGroup(accountId, companyId, newDreGroupId));

    default:
      return json({ success: false, error: "Ação não reconhecida" });
  }
}

export default function AccountPlanListPage() {
  const { accounts, dreGroups, stats, companyId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  // Agrupar contas por tipo
  const receitaAccounts = accounts.filter(acc => acc.type === 'receita');
  const despesaAccounts = accounts.filter(acc => acc.type === 'despesa');

  return (
    <div className="container-content">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-heading-1">Plano de Contas</h1>
          <p className="text-muted mt-2">
            Gerencie as contas contábeis da empresa
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/app/cadastro/account-plan/${companyId}/stats`}
            className="btn-secondary flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Estatísticas
          </Link>
          <Link
            to={`/app/cadastro/account-plan/${companyId}/new`}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </Link>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card-stat">
            <div className="text-sm font-medium text-gray-600">Total de Contas</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalAccounts}</div>
          </div>
          <div className="card-stat">
            <div className="text-sm font-medium text-gray-600">Receitas</div>
            <div className="text-2xl font-bold text-green-600">{stats.receitaAccounts}</div>
          </div>
          <div className="card-stat">
            <div className="text-sm font-medium text-gray-600">Despesas</div>
            <div className="text-2xl font-bold text-red-600">{stats.despesaAccounts}</div>
          </div>
          <div className="card-stat">
            <div className="text-sm font-medium text-gray-600">Transações</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalTransactions}</div>
          </div>
        </div>
      )}

      {/* Mensagens de feedback */}
      {actionData?.success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <p className="text-green-700">{actionData.message}</p>
        </div>
      )}

      {actionData?.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-700">{actionData.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contas de Receita */}
        <div className="card-default">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-heading-3 text-green-700">Contas de Receita</h3>
            <p className="text-small text-gray-500 mt-1">
              {receitaAccounts.length} conta(s) cadastrada(s)
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {receitaAccounts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhuma conta de receita cadastrada
              </div>
            ) : (
              receitaAccounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  companyId={companyId!}
                  dreGroups={dreGroups}
                />
              ))
            )}
          </div>
        </div>

        {/* Contas de Despesa */}
        <div className="card-default">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-heading-3 text-red-700">Contas de Despesa</h3>
            <p className="text-small text-gray-500 mt-1">
              {despesaAccounts.length} conta(s) cadastrada(s)
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {despesaAccounts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Nenhuma conta de despesa cadastrada
              </div>
            ) : (
              despesaAccounts.map((account) => (
                <AccountRow
                  key={account.id}
                  account={account}
                  companyId={companyId!}
                  dreGroups={dreGroups}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente para linha da conta
function AccountRow({ account, companyId, dreGroups }) {
  const [showMoveModal, setShowMoveModal] = useState(false);
  const canDelete = account._count.bankTransactions === 0;

  return (
    <>
      <div className="p-6 flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-medium text-gray-900">{account.name}</h4>
            {account._count.bankTransactions > 0 && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                {account._count.bankTransactions} transações
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{account.dreGroup.name}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMoveModal(true)}
            className="btn-ghost p-2"
            title="Mover para outro grupo"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <Link
            to={`/app/cadastro/account-plan/${companyId}/edit/${account.id}`}
            className="btn-ghost p-2"
            title="Editar conta"
          >
            <Edit className="w-4 h-4" />
          </Link>

          {canDelete && (
            <Form method="post" className="inline">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="accountId" value={account.id} />
              <button
                type="submit"
                className="btn-ghost p-2 text-red-600 hover:text-red-700"
                title="Excluir conta"
                onClick={(e) => {
                  if (!confirm('Tem certeza que deseja excluir esta conta?')) {
                    e.preventDefault();
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Form>
          )}
        </div>
      </div>

      {/* Modal para mover conta */}
      {showMoveModal && (
        <MoveAccountModal
          account={account}
          dreGroups={dreGroups}
          onClose={() => setShowMoveModal(false)}
        />
      )}
    </>
  );
}

// Modal para mover conta entre grupos
function MoveAccountModal({ account, dreGroups, onClose }) {
  const filteredGroups = dreGroups.filter(g =>
    g.type === account.type && g.id !== account.dreGroup.id
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Mover Conta: {account.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Grupo atual: {account.dreGroup.name}
          </p>
        </div>

        <Form method="post" className="p-6">
          <input type="hidden" name="intent" value="move" />
          <input type="hidden" name="accountId" value={account.id} />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Novo Grupo DRE
            </label>
            <select
              name="newDreGroupId"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Selecione um grupo</option>
              {filteredGroups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={filteredGroups.length === 0}
            >
              Mover
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
