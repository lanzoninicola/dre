import { LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigate } from "@remix-run/react";
import { json } from "zod";
import AccountPlanForm from "~/domain/account-plan/components/account-plan-form";
import { createAccountPlanService } from "~/domain/account-plan/services/accoun-plan.service.server";
import { requireUser } from "~/domain/auth/auth.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const { companyId, accountId } = params;

  const accountPlanService = createAccountPlanService(user);

  // Buscar dados completos (dreGroups) e conta específica
  const [planResult, accountResult] = await Promise.all([
    accountPlanService.getAccountPlanData(companyId!),
    accountPlanService.getById(accountId!, companyId!)
  ]);

  if (!planResult.success) {
    throw new Response(planResult.error, { status: 400 });
  }

  if (!accountResult.success) {
    throw new Response(accountResult.error, { status: 404 });
  }

  return json({
    company: { id: companyId },
    dreGroups: planResult.data.dreGroups,
    account: accountResult.data,
    user
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const { companyId, accountId } = params;
  const formData = await request.formData();

  const accountPlanService = createAccountPlanService(user);
  const result = await accountPlanService.update(companyId!, accountId!, formData);

  if (result.success) {
    return redirect(`/app/cadastro/account-plan/${companyId}`);
  }

  return json(result);
}

export default function EditAccountPlanPage() {
  const { company, dreGroups, account } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(`/app/cadastro/account-plan/${company.id}`);
  };

  return (
    <div className="container-content">
      <AccountPlanForm
        companyId={company.id}
        dreGroups={dreGroups}
        account={account}
        onClose={handleClose}
        actionData={actionData}
      />
    </div>
  );
}