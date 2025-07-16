import { Account, DREGroup } from "@prisma/client";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import AccountPlanForm from "~/domain/account-plan/components/account-plan-form";
import { requireUser } from "~/domain/auth/auth.server";
import prismaClient from "~/lib/prisma/client.server";

type LoaderData = {
  companyId: Company;
  accountId: Account;
  dreGroups: DREGroup[];
};


// 🔸 Loader: busca grupos DRE
export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId;
  const accountId = params.accountId;

  if (!companyId) {
    throw new Response("Empresa não informada na URL", { status: 400 });
  }

  if (!accountId) {
    throw new Response("Conta não informada na URL", { status: 400 });
  }

  const accountingFirm = await prismaClient.accountingFirm.findFirst({
    where: {
      users: {
        some: {
          id: user.id
        }
      }
    },
  });

  const company = await prismaClient.company.findUnique({
    where: { id: companyId, accountingFirmId: accountingFirm?.id },
  });

  if (!company) {
    throw new Response("Acesso negado à empresa", { status: 403 });
  }

  const dreGroups = await prismaClient.dREGroup.findMany({
    orderBy: { name: "asc" }
  });

  return json<LoaderData>({ companyId, accountId, dreGroups });
}

export default function AppCadastroAccountingPlanCompanyEditAccount() {
  const { companyId, accountId, dreGroups } = useLoaderData<LoaderData>();

  return (
    <AccountPlanForm
      companyId={companyId}
      dreGroups={dreGroups}
      account={editingAccount}
      onClose={handleCloseForm}
    />
  )
}