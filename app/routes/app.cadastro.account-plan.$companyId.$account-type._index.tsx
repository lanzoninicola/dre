import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "react-router";
import AccountRow from "~/domain/account-plan/components/account-row";
import { createAccountPlanService } from "~/domain/account-plan/services/accoun-plan.service.server";
import { requireUser } from "~/domain/auth/auth.server";


export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId!;
  const accountType = params['account-type']! as 'receita' | 'despesa';

  if (!user) {
    throw new Response("Autorização negada", { status: 401 })
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
    accountingFirmId: user?.accountingFirmId ?? undefined
  });

  // Usar o método migrado que busca dados completos
  const result = await accountPlanService.getAccountPlanDataByType(companyId, accountType);

  if (!result.success) {
    throw new Response(result.error, { status: 400 });
  }

  return json({
    ...result.data, // accounts e dreGroups
    user,
    companyId
  });
}



export default function AccountPlanCompanyIdType() {
  const { accounts, dreGroups, companyId } = useLoaderData<typeof loader>();


  return (
    <>
      {
        accounts.map((account) => (
          <AccountRow
            key={account.id}
            account={account}
            companyId={companyId!}
            dreGroups={dreGroups}
          />
        ))
      }
    </>
  )
}