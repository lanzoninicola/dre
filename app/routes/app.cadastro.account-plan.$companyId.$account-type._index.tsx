import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "react-router";
import AccountRow from "~/domain/account-plan/components/account-row";
import { createAccountPlanService } from "~/domain/account-plan/services/accoun-plan.service.server";
import { requireUser } from "~/domain/auth/auth.server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

  const result = await accountPlanService.getAccountPlanDataByType(companyId, accountType);

  if (!result.success) {
    throw new Response(result.error, { status: 400 });
  }

  return json({
    ...result.data, // accounts e dreGroups
    user,
    companyId,
    accountType,
  });
}

export default function AccountPlanCompanyIdType() {
  const { accounts, dreGroups, companyId } = useLoaderData<typeof loader>();

  const sortedGroups = [...dreGroups].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-8">
      {sortedGroups.map((group) => {
        const groupAccounts = accounts.filter(
          (account) => account.dreGroupId === group.id
        );

        if (groupAccounts.length === 0) return null;

        return (
          <Card key={group.id} className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg font-bold text-gray-900">
                <span className="text-blue-600 mr-2">{group.order}.</span>
                {group.name}
              </CardTitle>
            </CardHeader>

            <Separator />

            <CardContent className="p-0 divide-y">
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
