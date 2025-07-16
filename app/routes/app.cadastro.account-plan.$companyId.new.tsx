import { LoaderFunctionArgs, ActionFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { requireUser } from "~/domain/auth/auth.server";
import AccountPlanForm from "~/domain/account-plan/components/account-plan-form";
import prismaClient from "~/lib/prisma/client.server";

// 🔹 Tipo auxiliar
type DREGroup = {
  id: string;
  name: string;
  type: string;
  order: number;
};

type LoaderData = {
  companyId: string;
  dreGroups: DREGroup[];
};

// 🔸 Loader: busca grupos DRE
export async function loader({ params, request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId;

  if (!companyId) {
    throw new Response("Empresa não informada na URL", { status: 400 });
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

  return json<LoaderData>({ companyId, dreGroups });
}

// 🔸 Action: cria nova conta
export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const companyId = params.companyId;

  if (!companyId) {
    return json({ error: "Empresa não informada." }, { status: 400 });
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent !== "create") {
    return json({ error: "Ação inválida." }, { status: 400 });
  }

  const name = formData.get("name")?.toString().trim();
  const type = formData.get("type")?.toString();
  const dreGroupId = formData.get("dreGroupId")?.toString();

  if (!name || name.length < 3) {
    return json({ error: "Nome da conta inválido." }, { status: 400 });
  }

  if (type !== "receita" && type !== "despesa") {
    return json({ error: "Tipo inválido." }, { status: 400 });
  }

  if (!dreGroupId) {
    return json({ error: "Grupo DRE não selecionado." }, { status: 400 });
  }

  // Verificar se a empresa pertence ao usuário
  const company = await prismaClient.company.findUnique({
    where: { id: companyId },
    include: { accountingFirm: true },
  });

  if (!company || company.accountingFirm?.userId !== user.id) {
    return json({ error: "Acesso negado à empresa." }, { status: 403 });
  }

  // Verificar se o grupo DRE pertence à empresa
  const dreGroup = await prismaClient.dREGroup.findFirst({
    where: { id: dreGroupId, companyId }
  });

  if (!dreGroup) {
    return json({ error: "Grupo DRE inválido." }, { status: 400 });
  }

  await prismaClient.account.create({
    data: {
      name,
      type,
      companyId,
      dreGroupId
    }
  });

  return json({ success: "Conta criada com sucesso." });
}

// 🔸 Componente que exibe o modal
export default function AppCadastroAccountingPlanCompanyNewAccount() {
  const { companyId, dreGroups } = useLoaderData<LoaderData>();
  const navigate = useNavigate();

  return (
    <AccountPlanForm
      companyId={companyId}
      dreGroups={dreGroups}
      account={null}
      onClose={() => navigate(-1)}
    />
  );
}
