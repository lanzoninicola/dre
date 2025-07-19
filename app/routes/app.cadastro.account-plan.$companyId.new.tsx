import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useActionData, useNavigate } from "@remix-run/react";
import AccountPlanForm from "~/domain/account-plan/components/account-plan-form";
import { createAccountPlanService } from "~/domain/account-plan/services/accoun-plan.service.server";
import { requireUser } from "~/domain/auth/auth.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId!;

  const accountPlanService = createAccountPlanService(user);
  const result = await accountPlanService.getAccountPlanData(companyId);

  if (!result.success) {
    throw new Response(result.error, { status: 400 });
  }

  return json({
    company: { id: companyId }, // Simplified - you might want to get full company data
    dreGroups: result.data.dreGroups,
    user
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId!;
  const formData = await request.formData();

  const accountPlanService = createAccountPlanService(user);
  const result = await accountPlanService.create(companyId, formData);

  if (result.success) {
    return redirect(`/app/cadastro/account-plan/${companyId}`);
  }

  return json(result);
}

export default function NewAccountPlanPage() {
  const { company, dreGroups } = useLoaderData<typeof loader>();
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
        account={null}
        onClose={handleClose}
        actionData={actionData}
      />
    </div>
  );
}