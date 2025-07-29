import z from "zod";
import prismaClient from "~/lib/prisma/client.server";
import { DreGroupFormData, ValidationResult } from "../dre-groups.types";

export class DREGroupsValidationService {
  async validateFormData(
    formData: DreGroupFormData
  ): Promise<ValidationResult> {
    const schema = z.object({
      name: z
        .string()
        .min(3, "Nome deve ter pelo menos 3 caracteres")
        .max(100, "Nome deve ter no máximo 100 caracteres")
        .trim(),
      order: z.number().int().positive("Ordem deve ser um número positivo"),
      type: z.enum(["receita", "despesa", "resultado"]),
    });

    const result = schema.safeParse(formData);

    if (!result.success) {
      const fieldErrors = Object.fromEntries(
        Object.entries(result.error.flatten().fieldErrors).map(([key, val]) => [
          key,
          val?.[0] ?? "Erro de validação",
        ])
      );

      return { success: false, fieldErrors };
    }

    return { success: true, data: result.data };
  }

  async validateBusinessRules(
    data: DreGroupFormData,
    groupId?: string
  ): Promise<ValidationResult> {
    try {
      const existingByName = await prismaClient.dREGroup.findFirst({
        where: {
          name: { equals: data.name, mode: "insensitive" },
          ...(groupId && { id: { not: groupId } }),
        },
      });

      if (existingByName) {
        return {
          success: false,
          fieldErrors: { name: "Já existe um grupo com este nome" },
        };
      }

      const existingByOrder = await prismaClient.dREGroup.findFirst({
        where: { order: data.order, ...(groupId && { id: { not: groupId } }) },
      });

      if (existingByOrder) {
        return {
          success: false,
          fieldErrors: { order: "Já existe um grupo com esta ordem" },
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

  private static validTypes = ["receita", "despesa", "resultado"] as const;

  static validateType(type: string): "receita" | "despesa" | "resultado" {
    if (!this.validTypes.includes(type as any)) {
      throw new Error(`Invalid DRE group type: ${type}`);
    }
    return type as "receita" | "despesa" | "resultado";
  }

  static getBaseOrderByType(type: "receita" | "despesa" | "resultado"): number {
    const orderBaseMap: Record<"receita" | "despesa" | "resultado", number> = {
      receita: 10000,
      despesa: 20000,
      resultado: 30000,
    };

    return orderBaseMap[type];
  }
}
