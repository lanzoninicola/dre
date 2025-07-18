// ============================================================================
// 2. ACCOUNT PLAN UTILITY SERVICE - Operações auxiliares
// ============================================================================

import { createAuditLog } from "~/domain/audit/audit.server";
import { getCompanyById } from "~/domain/company/company.server";
import prismaClient from "~/lib/prisma/client.server";
import { ServiceResult, SearchFilters, User } from "../account-plan.types";
import { createAccountPlanService } from "./accoun-plan.service.server";
import { Account } from "@prisma/client";

export class AccountPlanUtilityService {
  constructor(private user: User) {}

  /**
   * Mover conta entre grupos DRE (migrado de moveAccountToGroup)
   */
  async moveAccountToGroup(
    accountId: string,
    companyId: string,
    newDreGroupId: string
  ): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      // Verificar se a conta existe
      const account = await prismaClient.account.findFirst({
        where: { id: accountId, companyId },
        include: { dreGroup: true },
      });

      if (!account) {
        return {
          success: false,
          error: "Conta não encontrada",
        };
      }

      // Verificar se o novo grupo DRE existe e é compatível
      const newDreGroup = await prismaClient.dREGroup.findUnique({
        where: { id: newDreGroupId },
      });

      if (!newDreGroup) {
        return {
          success: false,
          error: "Grupo DRE não encontrado",
        };
      }

      if (account.type !== newDreGroup.type) {
        return {
          success: false,
          error: "Tipo da conta não é compatível com o grupo DRE selecionado",
        };
      }

      // Se já está no mesmo grupo, não fazer nada
      if (account?.dreGroup?.id === newDreGroupId) {
        return {
          success: true,
          data: account,
          message: "Conta já está no grupo especificado",
        };
      }

      const updatedAccount = await prismaClient.account.update({
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

      return {
        success: true,
        data: updatedAccount,
        message: "Conta movida para novo grupo com sucesso",
      };
    } catch (error: any) {
      console.error("Error moving account to group:", error);
      return {
        success: false,
        error: error.message || "Erro ao mover conta",
      };
    }
  }

  /**
   * Duplicar conta existente
   */
  async duplicateAccount(
    companyId: string,
    accountId: string,
    newName: string
  ): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      const originalAccount = await prismaClient.account.findFirst({
        where: { id: accountId, companyId },
        include: { dreGroup: true },
      });

      if (!originalAccount) {
        return {
          success: false,
          error: "Conta original não encontrada",
        };
      }

      // Usar o CRUD service para criar a nova conta
      const crudService = createAccountPlanService(this.user);
      const result = await crudService.create(companyId, {
        name: newName,
        type: originalAccount.type as "receita" | "despesa",
        dreGroupId: originalAccount.dreGroupId ?? "",
      });

      if (result.success) {
        // Log de auditoria específico para duplicação
        await createAuditLog({
          userId: this.user.id,
          action: "DUPLICATE",
          entity: "AccountPlan",
          entityId: result.data.id,
          details: {
            originalAccountId: accountId,
            originalName: originalAccount.name,
            newName: newName,
          },
        });
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao duplicar conta",
      };
    }
  }

  /**
   * Buscar contas por filtros
   */
  async searchAccounts(
    companyId: string,
    filters: SearchFilters
  ): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      const where: any = { companyId };

      if (filters.query) {
        where.name = {
          contains: filters.query,
          mode: "insensitive",
        };
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.dreGroupId) {
        where.dreGroupId = filters.dreGroupId;
      }

      const accounts = await prismaClient.account.findMany({
        where,
        include: {
          dreGroup: true,
          _count: {
            select: {
              bankTransactions: true,
            },
          },
        },
        orderBy: [{ dreGroup: { order: "asc" } }, { name: "asc" }],
      });

      return {
        success: true,
        data: accounts,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro na busca",
      };
    }
  }

  private async checkPermissions(companyId: string): Promise<void> {
    const company = await getCompanyById(companyId);
    if (!company) throw new Error("Empresa não encontrada");

    const hasPermission =
      this.user.role === "admin" ||
      (this.user.role === "contador" &&
        company.accountingFirmId === this.user.accountingFirmId) ||
      (this.user.role === "empresa" && company.userId === this.user.id);

    if (!hasPermission) throw new Error("Acesso negado");
  }
}
