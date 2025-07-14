// app/services/dre.server.ts

import { randomUUID } from "crypto";
import {
  DREData,
  DREFilters,
  DRELineItem,
  GenerateDRERequest,
  ListDREsRequest,
} from "./dre.types";
import { createAuditLog } from "../audit/audit.server";
import { calculateDREStructure } from "./dre-calculation.server";
import { prisma } from "~/infrastructure/prisma/client.server";
import formatDREPeriod from "./utils/format-dre-period";

// ====================================
// DRE DATA QUERIES
// ====================================

export async function getTransactionsSummaryForPeriod(
  companyId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<DRELineItem[]> {
  // Query complexa para agrupar transações por grupo DRE
  const result = await prisma.$queryRaw<
    Array<{
      group_id: string;
      group_name: string;
      group_type: string;
      group_order: number;
      total_amount: number;
      account_id: string;
      account_name: string;
      account_amount: number;
    }>
  >`
    SELECT
      dg.id as group_id,
      dg.name as group_name,
      dg.type as group_type,
      dg."order" as group_order,
      SUM(bt.amount) as total_amount,
      ap.id as account_id,
      ap.name as account_name,
      SUM(bt.amount) as account_amount
    FROM bank_transactions bt
    INNER JOIN bank_statements bs ON bt.statement_id = bs.id
    INNER JOIN account_plan ap ON bt.account_id = ap.id
    INNER JOIN dre_group dg ON ap.dre_group_id = dg.id
    WHERE bs.companyId = ${companyId}
      AND bt.date >= ${periodStart}
      AND bt.date <= ${periodEnd}
      AND bt.account_id IS NOT NULL
    GROUP BY dg.id, dg.name, dg.type, dg."order", ap.id, ap.name
    ORDER BY dg."order", ap.name
  `;

  // Agrupar por grupo DRE
  const groupsMap = new Map<string, DRELineItem>();

  for (const row of result) {
    const groupId = row.group_id;

    if (!groupsMap.has(groupId)) {
      groupsMap.set(groupId, {
        groupId: row.group_id,
        groupName: row.group_name,
        groupType: row.group_type as "receita" | "despesa",
        groupOrder: Number(row.group_order),
        totalAmount: 0,
        accounts: [],
      });
    }

    const group = groupsMap.get(groupId)!;
    group.totalAmount += Number(row.account_amount);
    group.accounts.push({
      accountId: row.account_id,
      accountName: row.account_name,
      amount: Number(row.account_amount),
    });
  }

  return Array.from(groupsMap.values());
}

export async function findDREById(id: string): Promise<DREData | null> {
  const dre = await prisma.dRE.findUnique({
    where: { id },
  });

  if (!dre) return null;

  return {
    id: dre.id,
    companyId: dre.companyId,
    periodStart: dre.periodStart,
    periodEnd: dre.periodEnd,
    data: dre.data as any,
    generatedAt: dre.generatedAt,
  };
}

export async function findDREByPeriod(
  companyId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<DREData | null> {
  const dre = await prisma.dRE.findFirst({
    where: {
      companyId: companyId,
      periodStart: periodStart,
      periodEnd: periodEnd,
    },
  });

  if (!dre) return null;

  return {
    id: dre.id,
    companyId: dre.companyId,
    periodStart: dre.periodStart,
    periodEnd: dre.periodEnd,
    data: dre.data as any,
    generatedAt: dre.generatedAt,
  };
}

export async function findDREs(filters: DREFilters): Promise<DREData[]> {
  const where: any = {};

  if (filters.companyId) {
    where.companyId = filters.companyId;
  }

  if (filters.periodStart) {
    where.period_start = { gte: filters.periodStart };
  }

  if (filters.periodEnd) {
    where.period_end = { lte: filters.periodEnd };
  }

  const include = filters.includeCompanyInfo ? { company: true } : undefined;

  const dres = await prisma.dRE.findMany({
    where,
    include,
    orderBy: { periodStart: "desc" },
    take: filters.limit,
    skip: filters.offset,
  });

  return dres.map((dre) => ({
    id: dre.id,
    companyId: dre.companyId,
    periodStart: dre.periodStart,
    periodEnd: dre.periodEnd,
    data: dre.data as any,
    generatedAt: dre.generatedAt,
    company: (dre as any).company
      ? {
          id: (dre as any).company.id,
          name: (dre as any).company.name,
          cnpj: (dre as any).company.cnpj,
        }
      : undefined,
  }));
}

// ====================================
// DRE OPERATIONS
// ====================================

export async function generateDRE(
  request: GenerateDRERequest
): Promise<{ success: boolean; data?: DREData; error?: string }> {
  try {
    // Validar se a empresa existe
    const company = await prisma.company.findUnique({
      where: { id: request.companyId },
    });

    if (!company) {
      return { success: false, error: "Empresa não encontrada" };
    }

    // Validar período
    if (request.periodStart >= request.periodEnd) {
      return {
        success: false,
        error: "Data de início deve ser anterior à data de fim",
      };
    }

    // Verificar se já existe DRE para o período
    const existingDRE = await findDREByPeriod(
      prisma,
      request.companyId,
      request.periodStart,
      request.periodEnd
    );

    if (existingDRE) {
      return {
        success: false,
        error: "Já existe uma DRE gerada para este período",
      };
    }

    // Obter dados de transações agrupadas
    const transactionsSummary = await getTransactionsSummaryForPeriod(
      prisma,
      request.companyId,
      request.periodStart,
      request.periodEnd
    );

    if (transactionsSummary.length === 0) {
      return {
        success: false,
        error: "Não há transações classificadas para o período informado",
      };
    }

    // Calcular DRE
    const dreStructure = calculateDREStructure(transactionsSummary);

    const dreId = randomUUID();

    // Salvar DRE
    await prisma.dRE.create({
      data: {
        id: dreId,
        companyId: request.companyId,
        period_start: request.periodStart,
        period_end: request.periodEnd,
        data: dreStructure,
        generated_at: new Date(),
      },
    });

    // Registrar log de auditoria
    await createAuditLog({
      userId: request.userId,
      action: "GENERATE",
      entity: "DRE",
      entityId: dreId,
      details: {
        period: formatDREPeriod(request.periodStart, request.periodEnd),
        lucroLiquido: dreStructure.lucroLiquido,
        receitaBruta: dreStructure.receitaBruta,
        transactionsCount: transactionsSummary.reduce(
          (sum, item) => sum + item.accounts.length,
          0
        ),
      },
    });

    const dreData: DREData = {
      id: dreId,
      companyId: request.companyId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      data: dreStructure,
      generatedAt: new Date(),
    };

    return { success: true, data: dreData };
  } catch (error) {
    console.error("Erro ao gerar DRE:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}

export async function listDREs(request: ListDREsRequest): Promise<{
  success: boolean;
  data?: { dres: DREData[]; pagination: any };
  error?: string;
}> {
  try {
    const page = request.page || 1;
    const limit = request.limit || 10;
    const offset = (page - 1) * limit;

    const filters: DREFilters = {
      companyId: request.companyId,
      periodStart: request.periodStart,
      periodEnd: request.periodEnd,
      includeCompanyInfo: request.includeCompanyInfo,
      limit: limit + 1, // +1 para verificar se há próxima página
      offset,
    };

    const dres = await findDREs(filters);

    // Verificar se há próxima página
    const hasNext = dres.length > limit;
    if (hasNext) {
      dres.pop(); // Remover o item extra
    }

    const hasPrev = page > 1;

    return {
      success: true,
      data: {
        dres,
        pagination: {
          total: dres.length,
          page,
          limit,
          hasNext,
          hasPrev,
        },
      },
    };
  } catch (error) {
    console.error("Erro ao listar DREs:", error);
    return { success: false, error: "Erro interno do servidor" };
  }
}
