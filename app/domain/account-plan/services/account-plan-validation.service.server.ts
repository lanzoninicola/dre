import z from "zod";
import prismaClient from "~/lib/prisma/client.server";
import {
  ValidationResult,
  AccountFormData,
  UpdateAccountData,
} from "../account-plan.types";

export class AccountPlanValidationService {
  /**
   * Validar dados do formulário (migrado e melhorado de validateAccountPlanData)
   */
  async validateFormData(
    formData: AccountFormData | UpdateAccountData
  ): Promise<ValidationResult> {
    const schema = z.object({
      name: z
        .string()
        .min(3, "Nome da conta deve ter pelo menos 3 caracteres")
        .max(100, "Nome da conta deve ter no máximo 100 caracteres")
        .trim(),
      type: z.enum(["receita", "despesa"], {
        required_error: "Tipo da conta deve ser 'receita' ou 'despesa'",
      }),
      dreGroupId: z
        .string()
        .min(1, "Grupo DRE é obrigatório")
        .uuid("Grupo DRE inválido"),
    });

    return validateFormData(formData, schema);
  }

  /**
   * Validar regras de negócio específicas
   */
  async validateBusinessRules(
    companyId: string,
    data: AccountFormData,
    accountId?: string
  ): Promise<ValidationResult> {
    try {
      // Verificar grupo DRE
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
            dreGroupId: `Grupo DRE deve ser do tipo ${data.type}`,
          },
        };
      }

      // Verificar nome duplicado
      const existingAccount = await prismaClient.account.findFirst({
        where: {
          companyId,
          name: {
            equals: data.name,
            mode: "insensitive",
          },
          ...(accountId && { id: { not: accountId } }),
        },
      });

      if (existingAccount) {
        return {
          success: false,
          fieldErrors: { name: "Já existe uma conta com este nome" },
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Erro na validação de regras de negócio",
      };
    }
  }

  /**
   * Validar integridade completa do plano de contas
   */
  async validateAccountPlan(companyId: string): Promise<ValidationResult> {
    try {
      const [accounts, dreGroups] = await Promise.all([
        prismaClient.account.findMany({
          where: { companyId },
          include: { dreGroup: true },
        }),
        prismaClient.dREGroup.findMany(),
      ]);

      const issues = {
        duplicateNames: this.findDuplicateNames(accounts),
        invalidDREGroups: this.findInvalidDREGroups(accounts, dreGroups),
        unusedAccounts: await this.findUnusedAccounts(accounts),
      };

      const hasIssues = Object.values(issues).some((arr) => arr.length > 0);

      return {
        success: !hasIssues,
        data: issues,
        message: hasIssues
          ? "Problemas encontrados no plano de contas"
          : "Plano de contas válido",
      };
    } catch (error) {
      return {
        success: false,
        error: "Erro na validação do plano de contas",
      };
    }
  }

  private findDuplicateNames(accounts: any[]): any[] {
    const nameMap = new Map();
    const duplicates = [];

    accounts.forEach((account) => {
      const lowerName = account.name.toLowerCase();
      if (nameMap.has(lowerName)) {
        duplicates.push({
          name: account.name,
          accounts: [nameMap.get(lowerName), account],
        });
      } else {
        nameMap.set(lowerName, account);
      }
    });

    return duplicates;
  }

  private findInvalidDREGroups(accounts: any[], dreGroups: any[]): any[] {
    return accounts.filter((account) => {
      const dreGroup = dreGroups.find((g) => g.id === account.dreGroupId);
      return !dreGroup || dreGroup.type !== account.type;
    });
  }

  private async findUnusedAccounts(accounts: any[]): Promise<any[]> {
    const unusedAccounts = [];

    for (const account of accounts) {
      const transactionCount = await prismaClient.bankTransaction.count({
        where: { accountId: account.id },
      });
      if (transactionCount === 0) {
        unusedAccounts.push(account);
      }
    }

    return unusedAccounts;
  }
}
