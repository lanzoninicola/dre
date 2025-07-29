import z from 'zod';
import prismaClient from '~/lib/prisma/client.server';
import { DreGroupFormData, ValidationResult } from '../dre-groups.types';

export class DreGroupsValidationService {
  async validateFormData(formData: DreGroupFormData): Promise<ValidationResult> {
    const schema = z.object({
      name: z
        .string()
        .min(3, 'Nome deve ter pelo menos 3 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres')
        .trim(),
      order: z.number().int().nonnegative(),
      type: z.enum(['receita', 'despesa', 'resultado']),
    });

    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = Object.fromEntries(
        Object.entries(result.error.flatten().fieldErrors).map(([k, v]) => [
          k,
          v?.[0] ?? 'Erro de validação',
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
      const [nameExists, orderExists] = await Promise.all([
        prismaClient.dREGroup.findFirst({
          where: {
            name: { equals: data.name, mode: 'insensitive' },
            ...(groupId && { id: { not: groupId } }),
          },
        }),
        prismaClient.dREGroup.findFirst({
          where: {
            order: data.order,
            ...(groupId && { id: { not: groupId } }),
          },
        }),
      ]);

      if (nameExists) {
        return {
          success: false,
          fieldErrors: { name: 'Já existe um grupo com este nome' },
        };
      }

      if (orderExists) {
        return {
          success: false,
          fieldErrors: { order: 'Já existe um grupo com esta ordem' },
        };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Erro na validação de regras de negócio' };
    }
  }
}
