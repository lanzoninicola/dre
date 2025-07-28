import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "react-router";
import AccountRow from "~/domain/account-plan/components/account-row";
import { createAccountPlanService } from "~/domain/account-plan/services/accoun-plan.service.server";
import { requireUser } from "~/domain/auth/auth.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId!;
  const accountType = params["account-type"]! as "receita" | "despesa";

  if (!user) {
    throw new Response("Autorização negada", { status: 401 });
  }

  if (!companyId) {
    throw new Response("Company ID is required", { status: 400 });
  }

  if (!accountType) {
    throw new Response("Account type is required", { status: 400 });
  }

  const accountPlanService = createAccountPlanService({
    id: user.id,
    role: user.role,
    accountingFirmId: user?.accountingFirmId ?? undefined,
  });

  // Busca contas e grupos DRE
  const result = await accountPlanService.getAccountPlanDataByType(companyId, accountType);

  if (!result.success) {
    throw new Response(result.error, { status: 400 });
  }

  return json({
    ...result.data, // accounts e dreGroups
    user,
    companyId,
  });
}

export default function AccountPlanCompanyIdType() {
  const { accounts, dreGroups, companyId } = useLoaderData<typeof loader>();

  // Ordenar grupos pelo campo order
  const sortedGroups = [...dreGroups].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {sortedGroups.map((group) => {
        // Filtrar contas do grupo atual
        const groupAccounts = accounts.filter(
          (account) => account.dreGroupId === group.id
        );

        if (groupAccounts.length === 0) return null;

        return (
          <div key={group.id} className="bg-white rounded-xl shadow p-4">
            {/* Cabeçalho do grupo */}
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">
              {group.name}
            </h3>

            {/* Contas do grupo */}
            <div className="divide-y">
              {groupAccounts
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    companyId={companyId!}
                    dreGroups={dreGroups}
                  />
                ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
