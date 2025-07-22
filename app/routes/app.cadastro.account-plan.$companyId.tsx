import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Link, Form, Outlet, useLocation } from "@remix-run/react";
import { Plus, Edit, Trash2, BarChart3, ArrowRightLeft, BarChart, Settings } from "lucide-react";
import { useState } from "react";
import { SubpageLayout } from "~/components/layouts/sub-page-layout";
import { NavigationToggle } from "~/components/navigation-toggle/navigation-toggle";
import AccountRow from "~/domain/account-plan/components/account-row";
import { createAccountPlanService } from "~/domain/account-plan/services/accoun-plan.service.server";
import { requireUser } from "~/domain/auth/auth.server";
import { useFlashToastFromQuery } from "~/hooks/use-flash-toast-from-query";

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
  const { stats, companyId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [showSearch, toggleSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<'all' | 'receita' | 'despesa'>('all');

  const location = useLocation()
  useFlashToastFromQuery()

  // // Filtrar contas
  // const filteredAccounts = accounts?.filter(account => {
  //   const matchesSearch = account?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     account?.dreGroup?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  //   const matchesType = typeFilter === 'all' || account.type === typeFilter;
  //   return matchesSearch && matchesType;
  // }) || [];

  // // Agrupar contas por tipo
  // const receitaAccounts = accounts.filter(acc => acc.type === 'receita');
  // const despesaAccounts = accounts.filter(acc => acc.type === 'despesa');



  return (

    <SubpageLayout
      backTo="/app/cadastro/account-plan"
      title="Plano de Contas"
      actions={[
        {
          to: "stats",
          icon: <BarChart3 className="w-4 h-4" />,
          children: "Estatísticas",
          variant: "outline"
        },
        {
          to: "new",
          icon: <Plus className="w-4 h-4" />,
          children: "Nova Conta"
        }
      ]}
      searchConfig={{
        searchFilter: {
          placeholder: "Buscar contas...",
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value)
        },
        selectFilter: {
          value: typeFilter,
          onChange: (e) => setTypeFilter(e.target.value as 'all' | 'receita' | 'despesa'),
          options: [
            { value: 'all', label: 'Todos os tipos' },
            { value: 'receita', label: 'Receitas' },
            { value: 'despesa', label: 'Despesas' }
          ]
        }
      }}
      showSearch={showSearch}
      onToggleSearch={() => toggleSearch(!showSearch)}
    >
      <div className="container-content">

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

        <NavigationToggle
          options={[
            { value: 'receita', label: 'Contas de Receitas', path: `/app/cadastro/account-plan/${companyId}/receita`, icon: BarChart, shortLabel: 'C. Receitas' },
            { value: 'despesa', label: 'Contas de Despesas', path: `/app/cadastro/account-plan/${companyId}/despesa`, icon: BarChart, shortLabel: 'C. Despesas' },
          ]}
          className="w-max px-4 gap-6 mx-auto"
        />

        <Outlet key={location.pathname} />

      </div>
    </SubpageLayout>

  );
}



