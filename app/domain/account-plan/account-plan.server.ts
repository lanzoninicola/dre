// ~/domain/account-plan/account-plan.server.ts
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
export async function getAccountPlanData(companyId: string) {
  try {
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

    console.log(`Account plan data loaded for company ${companyId}:`, {
      accountsCount: accounts.length,
      dreGroupsCount: dreGroups.length,
    });

    return { accounts, dreGroups };
  } catch (error) {
    console.error("Error loading account plan data:", error);
    throw new Error("Failed to load account plan data");
  }
}

// Função para verificar se o usuário tem acesso à empresa
export async function validateCompanyAccess(companyId: string, userId: string) {
  const company = await prismaClient.company.findFirst({
    where: {
      id: companyId,
      OR: [
        { users: { some: { id: userId } } },
        {
          accountingFirm: {
            users: { some: { id: userId } },
          },
        },
      ],
    },
    select: { id: true },
  });

  return !!company;
}

// Função para buscar conta específica
export async function getAccountPlanById(accountId: string, companyId: string) {
  return await prismaClient.accountPlan.findFirst({
    where: {
      id: accountId,
      companyId,
    },
    include: {
      dreGroup: true,
      _count: {
        select: {
          bankTransactions: true,
        },
      },
    },
  });
}

// Função para criar nova conta
export async function createAccountPlan(data: {
  name: string;
  type: "receita" | "despesa";
  companyId: string;
  dreGroupId: string;
}) {
  // Verificar se já existe uma conta com o mesmo nome
  const existingAccount = await prismaClient.accountPlan.findFirst({
    where: {
      companyId: data.companyId,
      name: {
        equals: data.name,
        mode: "insensitive",
      },
    },
  });

  if (existingAccount) {
    throw new Error("Já existe uma conta com este nome");
  }

  // Verificar se o grupo DRE é compatível com o tipo
  const dreGroup = await prismaClient.dREGroup.findUnique({
    where: { id: data.dreGroupId },
  });

  if (!dreGroup) {
    throw new Error("Grupo DRE não encontrado");
  }

  if (dreGroup.type !== data.type) {
    throw new Error("Tipo da conta não é compatível com o grupo DRE");
  }

  return await prismaClient.accountPlan.create({
    data: {
      name: data.name,
      type: data.type,
      companyId: data.companyId,
      dreGroupId: data.dreGroupId,
    },
    include: {
      dreGroup: true,
      _count: {
        select: {
          bankTransactions: true,
        },
      },
    },
  });
}

// Função para atualizar conta
export async function updateAccountPlan(
  accountId: string,
  companyId: string,
  data: {
    name: string;
    type: "receita" | "despesa";
    dreGroupId: string;
  }
) {
  // Verificar se a conta existe
  const existingAccount = await getAccountPlanById(accountId, companyId);

  if (!existingAccount) {
    throw new Error("Conta não encontrada");
  }

  // Verificar duplicidade de nome (exceto a própria conta)
  const duplicateAccount = await prismaClient.accountPlan.findFirst({
    where: {
      companyId,
      name: {
        equals: data.name,
        mode: "insensitive",
      },
      id: { not: accountId },
    },
  });

  if (duplicateAccount) {
    throw new Error("Já existe uma conta com este nome");
  }

  // Verificar se o grupo DRE é compatível
  const dreGroup = await prismaClient.dREGroup.findUnique({
    where: { id: data.dreGroupId },
  });

  if (!dreGroup) {
    throw new Error("Grupo DRE não encontrado");
  }

  if (dreGroup.type !== data.type) {
    throw new Error("Tipo da conta não é compatível com o grupo DRE");
  }

  return await prismaClient.accountPlan.update({
    where: { id: accountId },
    data: {
      name: data.name,
      type: data.type,
      dreGroupId: data.dreGroupId,
    },
    include: {
      dreGroup: true,
      _count: {
        select: {
          bankTransactions: true,
        },
      },
    },
  });
}

// Função para deletar conta
export async function deleteAccountPlan(accountId: string, companyId: string) {
  // Verificar se a conta existe e tem transações
  const account = await prismaClient.accountPlan.findFirst({
    where: { id: accountId, companyId },
    include: {
      _count: {
        select: { bankTransactions: true },
      },
    },
  });

  if (!account) {
    throw new Error("Conta não encontrada");
  }

  if (account._count.bankTransactions > 0) {
    throw new Error(
      "Não é possível excluir uma conta que possui transações vinculadas"
    );
  }

  return await prismaClient.accountPlan.delete({
    where: { id: accountId },
  });
}

// Função para mover conta entre grupos DRE
export async function moveAccountToGroup(
  accountId: string,
  companyId: string,
  newDreGroupId: string
) {
  // Verificar se a conta existe
  const account = await getAccountPlanById(accountId, companyId);

  if (!account) {
    throw new Error("Conta não encontrada");
  }

  // Verificar se o novo grupo DRE existe e é compatível
  const newDreGroup = await prismaClient.dREGroup.findUnique({
    where: { id: newDreGroupId },
  });

  if (!newDreGroup) {
    throw new Error("Grupo DRE não encontrado");
  }

  if (account.type !== newDreGroup.type) {
    throw new Error(
      "Tipo da conta não é compatível com o grupo DRE selecionado"
    );
  }

  // Se já está no mesmo grupo, não fazer nada
  if (account.dreGroup.id === newDreGroupId) {
    return account;
  }

  return await prismaClient.accountPlan.update({
    where: { id: accountId },
    data: { dreGroupId: newDreGroupId },
    include: {
      dreGroup: true,
      _count: {
        select: {
          bankTransactions: true,
        },
      },
    },
  });
}

// Função para buscar estatísticas do plano de contas
export async function getAccountPlanStats(companyId: string) {
  const [totalAccounts, receitaAccounts, despesaAccounts, totalTransactions] =
    await Promise.all([
      prismaClient.accountPlan.count({
        where: { companyId },
      }),
      prismaClient.accountPlan.count({
        where: { companyId, type: "receita" },
      }),
      prismaClient.accountPlan.count({
        where: { companyId, type: "despesa" },
      }),
      prismaClient.bankTransaction.count({
        where: {
          account: { companyId },
        },
      }),
    ]);

  return {
    totalAccounts,
    receitaAccounts,
    despesaAccounts,
    totalTransactions,
  };
}

// Função para validar dados de entrada
export function validateAccountPlanData(data: {
  name: string;
  type: string;
  dreGroupId: string;
}) {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 3) {
    errors.push("Nome da conta deve ter pelo menos 3 caracteres");
  }

  if (data.name && data.name.trim().length > 100) {
    errors.push("Nome da conta deve ter no máximo 100 caracteres");
  }

  if (!data.type || !["receita", "despesa"].includes(data.type)) {
    errors.push("Tipo da conta deve ser 'receita' ou 'despesa'");
  }

  if (!data.dreGroupId || data.dreGroupId.trim().length === 0) {
    errors.push("Grupo DRE é obrigatório");
  }

  return errors;
}
