import { prisma } from "~/infrastructure/prisma/client.server";
import { type TransactionFilters } from "./transactions.types";
import { forbidden } from "~/utils/http-response.server";

export async function getTransactionsByCompany({
  companyId,
  filters,
  page = 1,
  limit = 20,
}: {
  companyId: string;
  filters: TransactionFilters;
  page?: number;
  limit?: number;
}) {
  // Construir filtros dinâmicos
  const where: any = {
    statement: {
      companyId: companyId,
    },
  };

  // Filtro de busca textual
  if (filters.search) {
    where.OR = [
      { description: { contains: filters.search, mode: "insensitive" } },
      { documentNumber: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // Filtro de datas
  if (filters.dateFrom) {
    where.date = { ...where.date, gte: new Date(filters.dateFrom) };
  }
  if (filters.dateTo) {
    where.date = { ...where.date, lte: new Date(filters.dateTo) };
  }

  // Filtro por conta
  if (filters.accountId) {
    where.accountId = filters.accountId;
  }

  // Filtro por status de classificação
  if (filters.isClassified !== "") {
    where.isClassified = filters.isClassified === "true";
  }

  // Filtro por reconciliação
  if (filters.isReconciled !== "") {
    where.isReconciled = filters.isReconciled === "true";
  }

  // Filtro por tipo de transação
  if (filters.transactionType) {
    where.transactionType = filters.transactionType;
  }

  // Buscar transações com paginação
  const [transactions, totalCount] = await Promise.all([
    prisma.bankTransaction.findMany({
      where,
      include: {
        account: {
          include: {
            dreGroup: true,
          },
        },
        classifiedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        statement: {
          select: {
            id: true,
            fileName: true,
            bankName: true,
            accountNumber: true,
          },
        },
      },
      orderBy: {
        date: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bankTransaction.count({ where }),
  ]);

  return {
    transactions: transactions.map((t) => ({
      ...t,
      date: t.date.toISOString().split("T")[0],
      amount: t.amount.toNumber(),
      createdAt: t.createdAt.toISOString(),
      classifiedAt: t.classifiedAt?.toISOString() || null,
    })),
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}

export async function getAccountPlanByCompany(companyId: string) {
  return await prisma.accountPlan.findMany({
    where: {
      companyId: companyId,
      isActive: true,
    },
    include: {
      dreGroup: true,
    },
    orderBy: [{ code: "asc" }, { name: "asc" }],
  });
}

export async function classifyTransaction({
  transactionId,
  accountId,
  notes,
  userId,
  companyId,
}: {
  transactionId: string;
  accountId: string;
  notes?: string;
  userId: string;
  companyId: string;
}) {
  // Verificar se a transação pertence à empresa
  const transaction = await prisma.bankTransaction.findFirst({
    where: {
      id: transactionId,
      statement: {
        companyId: companyId,
      },
    },
  });

  if (!transaction) {
    throw new Error("Transação não encontrada");
  }

  // Verificar se a conta pertence à empresa
  const account = await prisma.accountPlan.findFirst({
    where: {
      id: accountId,
      companyId: companyId,
      isActive: true,
    },
  });

  if (!account) {
    throw new Error("Conta não encontrada");
  }

  // Atualizar a transação
  const updatedTransaction = await prisma.bankTransaction.update({
    where: { id: transactionId },
    data: {
      accountId: accountId,
      notes: notes || null,
      isClassified: true,
      classifiedByUserId: userId,
      classifiedAt: new Date(),
    },
  });

  // Registrar log de auditoria
  await prisma.auditLog.create({
    data: {
      userId: userId,
      companyId: companyId,
      action: "UPDATE",
      entity: "BankTransaction",
      entityId: transactionId,
      details: {
        action: "classify_transaction",
        accountId: accountId,
        notes: notes,
        previousClassified: transaction.isClassified,
      },
    },
  });

  return updatedTransaction;
}

export async function bulkClassifyTransactions({
  transactionIds,
  accountId,
  userId,
  companyId,
}: {
  transactionIds: string[];
  accountId: string;
  userId: string;
  companyId: string;
}) {
  // Verificar se todas as transações pertencem à empresa
  const transactions = await prisma.bankTransaction.findMany({
    where: {
      id: { in: transactionIds },
      statement: {
        companyId: companyId,
      },
    },
  });

  if (transactions.length !== transactionIds.length) {
    throw new Error("Algumas transações não foram encontradas");
  }

  // Verificar se a conta pertence à empresa
  const account = await prisma.accountPlan.findFirst({
    where: {
      id: accountId,
      companyId: companyId,
      isActive: true,
    },
  });

  if (!account) {
    throw new Error("Conta não encontrada");
  }

  // Atualizar transações em lote
  const result = await prisma.bankTransaction.updateMany({
    where: {
      id: { in: transactionIds },
    },
    data: {
      accountId: accountId,
      isClassified: true,
      classifiedByUserId: userId,
      classifiedAt: new Date(),
    },
  });

  // Registrar log de auditoria
  await prisma.auditLog.create({
    data: {
      userId: userId,
      companyId: companyId,
      action: "UPDATE",
      entity: "BankTransaction",
      entityId: "bulk",
      details: {
        action: "bulk_classify_transactions",
        accountId: accountId,
        transactionIds: transactionIds,
        count: transactionIds.length,
      },
    },
  });

  return result;
}

export async function reconcileTransaction({
  transactionId,
  userId,
  companyId,
}: {
  transactionId: string;
  userId: string;
  companyId: string;
}) {
  // Verificar se a transação pertence à empresa e está classificada
  const transaction = await prisma.bankTransaction.findFirst({
    where: {
      id: transactionId,
      statement: {
        companyId: companyId,
      },
      isClassified: true,
    },
  });

  if (!transaction) {
    throw new Error("Transação não encontrada ou não classificada");
  }

  // Reconciliar a transação
  const updatedTransaction = await prisma.bankTransaction.update({
    where: { id: transactionId },
    data: {
      isReconciled: true,
    },
  });

  // Registrar log de auditoria
  await prisma.auditLog.create({
    data: {
      userId: userId,
      companyId: companyId,
      action: "UPDATE",
      entity: "BankTransaction",
      entityId: transactionId,
      details: {
        action: "reconcile_transaction",
        previousReconciled: transaction.isReconciled,
      },
    },
  });

  return updatedTransaction;
}

// Função helper para verificar acesso do usuário à empresa
export async function verifyUserCompanyAccess(
  userId: string,
  companyId: string | undefined
) {
  if (!companyId) {
    forbidden("Empresa não encontrada", {
      throwIt: true,
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accountingFirm: true,
      company: true,
      companyAccesses: {
        where: {
          companyId: companyId,
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      },
    },
  });

  if (!user) {
    throw new Response("Usuário não encontrado", { status: 404 });
  }

  // Verificar se o usuário tem acesso à empresa
  const hasAccess =
    // Usuário pertence diretamente à empresa
    (user.type === "company" && user.companyId === companyId) ||
    // Usuário é do escritório contábil que atende a empresa
    (user.type === "accountingFirm" && user.accountingFirm) ||
    // Usuário tem acesso específico via UserCompanyAccess
    user.companyAccesses.length > 0;

  if (!hasAccess) {
    throw new Response("Acesso negado", { status: 403 });
  }

  return user;
}
