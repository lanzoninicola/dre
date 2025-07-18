import z from "zod";
import prismaClient from "~/lib/prisma/client.server";
import {
  ValidationResult,
  AccountFormData,
  UpdateAccountData,
} from "../account-plan.types";

export class AccountPlanValidationService {
  /**
   * Valida os dados de entrada do formulário usando Zod.
   * Corrigido o uso de enum: z.enum não aceita 'required_error'
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
      // 🛠 Corrigido: 'required_error' não é válido para z.enum
      type: z.enum(["receita", "despesa"]),
      dreGroupId: z
        .string()
        .min(1, "Grupo DRE é obrigatório")
        .uuid("Grupo DRE inválido"),
    });

    const result = schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = Object.fromEntries(
        Object.entries(result.error.flatten().fieldErrors).map(([key, val]) => [
          key,
          val?.[0] ?? "Erro de validação",
        ])
      );

      return {
        success: false,
        fieldErrors,
      };
    }

    return { success: true, data: result.data };
  }

  /**
   * Regras de negócio adicionais: valida o tipo de grupo DRE e verifica nomes duplicados.
   */
  async validateBusinessRules(
    companyId: string,
    data: AccountFormData,
    accountId?: string
  ): Promise<ValidationResult> {
    try {
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
    } catch {
      return {
        success: false,
        error: "Erro na validação de regras de negócio",
      };
    }
  }

  /**
   * Valida o plano de contas completo, incluindo:
   * - nomes duplicados
   * - grupos DRE inconsistentes
   * - contas não utilizadas
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
        invalidDREGroups: this.findInvalidDREGroups(
          accounts as { dreGroupId: string; type: string }[], // 🛠 Corrigido: tipagem explícita para evitar erro de compatibilidade TS2345
          dreGroups
        ),
        unusedAccounts: await this.findUnusedAccounts(accounts),
      };

      const hasIssues = Object.values(issues).some((arr) => arr.length > 0);

      return {
        success: !hasIssues,
        data: {
          ...issues,
          summary: hasIssues
            ? "Problemas encontrados no plano de contas"
            : "Plano de contas válido",
        },
      };
    } catch {
      return {
        success: false,
        error: "Erro na validação do plano de contas",
      };
    }
  }

  /**
   * Localiza contas com nomes duplicados (case-insensitive).
   */
  private findDuplicateNames(accounts: { name: string; id: string }[]) {
    const nameMap = new Map<string, { name: string; id: string }>();
    const duplicates: { name: string; accounts: any[] }[] = [];

    for (const acc of accounts) {
      const key = acc.name.toLowerCase();
      if (nameMap.has(key)) {
        duplicates.push({
          name: acc.name,
          accounts: [nameMap.get(key), acc],
        });
      } else {
        nameMap.set(key, acc);
      }
    }

    return duplicates;
  }

  /**
   * Filtra contas cujo grupo DRE associado não é compatível com seu tipo.
   */
  private findInvalidDREGroups(
    accounts: { dreGroupId: string; type: string }[],
    dreGroups: { id: string; type: string }[]
  ) {
    const groupMap = new Map(dreGroups.map((g) => [g.id, g.type]));
    return accounts.filter((acc) => groupMap.get(acc.dreGroupId) !== acc.type);
  }

  /**
   * Retorna todas as contas que não possuem transações associadas.
   */
  private async findUnusedAccounts(accounts: { id: string }[]) {
    const unused: { id: string }[] = [];

    for (const acc of accounts) {
      const count = await prismaClient.bankTransaction.count({
        where: { accountId: acc.id },
      });
      if (count === 0) unused.push(acc);
    }

    return unused;
  }
}
