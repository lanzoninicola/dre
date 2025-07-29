import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, Outlet, useLocation } from "@remix-run/react";
import { Plus, BarChart } from "lucide-react";
import { useState } from "react";
import { SubpageLayout } from "~/components/layouts/sub-page-layout";
import { NavigationToggle } from "~/components/navigation-toggle/navigation-toggle";
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



  return json({
    user,
    companyId
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId!;
  const formData = await request.formData();
  const intent = formData.get('intent') as string;

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


  return (

    <SubpageLayout
      backTo="/app/cadastro/dre-groups"
      title="Grupos DRE"
      actions={[
        // {
        //   to: "stats",
        //   icon: <BarChart3 className="w-4 h-4" />,
        //   children: "Estatísticas",
        //   variant: "outline"
        // },
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
            { value: 'receita', label: 'Grupos de Receitas', path: `/app/cadastro/dre-groups/${companyId}/receita`, icon: BarChart, shortLabel: 'C. Receitas' },
            { value: 'despesa', label: 'Grupos de Despesas', path: `/app/cadastro/dre-groups/${companyId}/despesa`, icon: BarChart, shortLabel: 'C. Despesas' },
          ]}
          className="w-max px-4 gap-6 mx-auto"
        />

        <Outlet key={location.pathname} />

      </div>
    </SubpageLayout>

  );
}



