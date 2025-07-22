import { getCompanyById } from "~/domain/company/company.server";
import prismaClient from "~/lib/prisma/client.server";
import {
  ServiceResult,
  CreateAccountData,
  UpdateAccountData,
  User,
} from "../account-plan.types";

export class AccountPlanCRUDService {
  constructor(private user: User) {}

  /**
   * Buscar dados completos do plano de contas (migrado de getAccountPlanData)
   */
  async getAccountPlanData(companyId: string): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      const [accounts, dreGroups] = await Promise.all([
        // Buscar contas do plano de contas
        prismaClient.account.findMany({
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

      return {
        success: true,
        data: { accounts, dreGroups },
      };
    } catch (error: any) {
      console.error("Error loading account plan data:", error);
      return {
        success: false,
        error: error.message || "Failed to load account plan data",
      };
    }
  }

  async getAccountPlanDataByType(
    companyId: string,
    type: "receita" | "despesa"
  ): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      const [accounts, dreGroups] = await Promise.all([
        // Buscar contas do plano de contas
        prismaClient.account.findMany({
          where: { companyId, type },
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

      return {
        success: true,
        data: { accounts, dreGroups },
      };
    } catch (error: any) {
      console.error("Error loading account plan data:", error);
      return {
        success: false,
        error: error.message || "Failed to load account plan data",
      };
    }
  }

  /**
   * Buscar conta específica
   */
  async getById(accountId: string, companyId: string): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      const account = await prismaClient.account.findFirst({
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

      if (!account) {
        return {
          success: false,
          error: "Conta não encontrada",
        };
      }

      return {
        success: true,
        data: account,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao buscar conta",
      };
    }
  }

  /**
   * Criar nova conta (migrado de createAccountPlan)
   */
  async create(
    companyId: string,
    data: CreateAccountData
  ): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      // Verificar se já existe uma conta com o mesmo nome
      const existingAccount = await prismaClient.account.findFirst({
        where: {
          companyId: companyId,
          name: {
            equals: data.name,
            mode: "insensitive",
          },
        },
      });

      if (existingAccount) {
        return {
          success: false,
          fieldErrors: { name: "Já existe uma conta com este nome" },
        };
      }

      // Verificar se o grupo DRE é compatível com o tipo
      const dreGroup = await prismaClient.dREGroup.findUnique({
        where: { id: data.dreGroupId },
      });

      if (!dreGroup) {
        return {
          success: false,
          fieldErrors: { dreGroupId: "Grupo DRE não encontrado" },
        };
      }

      if (dreGroup.type !== data.type) {
        return {
          success: false,
          fieldErrors: {
            dreGroupId: "Tipo da conta não é compatível com o grupo DRE",
          },
        };
      }

      const newAccount = await prismaClient.account.create({
        data: {
          name: data.name,
          type: data.type,
          companyId: companyId,
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

      return {
        success: true,
        data: newAccount,
        message: "Conta criada com sucesso",
      };
    } catch (error: any) {
      console.error("Error creating account:", error);
      return {
        success: false,
        error: error.message || "Erro ao criar conta",
      };
    }
  }

  /**
   * Atualizar conta (migrado de updateAccountPlan)
   */
  async update(
    companyId: string,
    accountId: string,
    data: UpdateAccountData
  ): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      // Verificar se a conta existe
      const existingAccount = await prismaClient.account.findFirst({
        where: { id: accountId, companyId },
        include: { dreGroup: true },
      });

      if (!existingAccount) {
        return {
          success: false,
          error: "Conta não encontrada",
        };
      }

      // Verificar duplicidade de nome (exceto a própria conta)
      const duplicateAccount = await prismaClient.account.findFirst({
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
        return {
          success: false,
          fieldErrors: { name: "Já existe uma conta com este nome" },
        };
      }

      // Verificar se o grupo DRE é compatível
      const dreGroup = await prismaClient.dREGroup.findUnique({
        where: { id: data.dreGroupId },
      });

      if (!dreGroup) {
        return {
          success: false,
          fieldErrors: { dreGroupId: "Grupo DRE não encontrado" },
        };
      }

      if (dreGroup.type !== data.type) {
        return {
          success: false,
          fieldErrors: {
            dreGroupId: "Tipo da conta não é compatível com o grupo DRE",
          },
        };
      }

      const updatedAccount = await prismaClient.account.update({
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

      return {
        success: true,
        data: updatedAccount,
        message: "Conta atualizada com sucesso",
      };
    } catch (error: any) {
      console.error("Error updating account:", error);
      return {
        success: false,
        error: error.message || "Erro ao atualizar conta",
      };
    }
  }

  /**
   * Deletar conta (migrado de deleteAccountPlan)
   */
  async delete(companyId: string, accountId: string): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      // Verificar se a conta existe e tem transações
      const account = await prismaClient.account.findFirst({
        where: { id: accountId, companyId },
        include: {
          _count: {
            select: { bankTransactions: true },
          },
        },
      });

      if (!account) {
        return {
          success: false,
          error: "Conta não encontrada",
        };
      }

      if (account._count.bankTransactions > 0) {
        return {
          success: false,
          error:
            "Não é possível excluir uma conta que possui transações vinculadas",
        };
      }

      await prismaClient.account.delete({
        where: { id: accountId },
      });

      return {
        success: true,
        message: "Conta excluída com sucesso",
      };
    } catch (error: any) {
      console.error("Error deleting account:", error);
      return {
        success: false,
        error: error.message || "Erro ao excluir conta",
      };
    }
  }

  /**
   * Buscar estatísticas (migrado de getAccountPlanStats)
   */
  async getStats(companyId: string): Promise<ServiceResult> {
    try {
      await this.checkPermissions(companyId);

      const [
        totalAccounts,
        receitaAccounts,
        despesaAccounts,
        totalTransactions,
      ] = await Promise.all([
        prismaClient.account.count({
          where: { companyId },
        }),
        prismaClient.account.count({
          where: { companyId, type: "receita" },
        }),
        prismaClient.account.count({
          where: { companyId, type: "despesa" },
        }),
        prismaClient.bankTransaction.count({
          where: {
            account: { companyId },
          },
        }),
      ]);

      return {
        success: true,
        data: {
          totalAccounts,
          receitaAccounts,
          despesaAccounts,
          totalTransactions,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao buscar estatísticas",
      };
    }
  }

  // Métodos auxiliares privados
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
