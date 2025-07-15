import prismaClient from "~/lib/prisma/client.server";

export interface AccountPlan {
  id: string;
  name: string;
  type: "receita" | "despesa";
  dreGroup: {
    id: string;
    name: string;
    order: number;
    type: string;
  };
  _count: {
    bankTransactions: number;
  };
}

// Função para buscar dados do plano de contas
export async function getAccountPlanData(companyId: string, userId: string) {
  // TODO: Verificar se o usuário tem acesso à empresa

  const [accounts, dreGroups] = await Promise.all([
    // Buscar contas do plano de contas
    prismaClient.accountPlan.findMany({
      where: { companyId },
      include: {
        dreGroup: true,
        _count: {
          select: {
            bankTransactions: true,
          },
        },
      },
      orderBy: [{ dreGroup: { order: "asc" } }, { name: "asc" }],
    }),
    // Buscar grupos DRE disponíveis
    prismaClient.dREGroup.findMany({
      orderBy: { order: "asc" },
    }),
  ]);

  return { accounts, dreGroups };
}
