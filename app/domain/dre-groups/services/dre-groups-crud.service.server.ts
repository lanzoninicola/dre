import prismaClient from "~/lib/prisma/client.server";
import {
  CreateDreGroupData,
  ServiceResult,
  UpdateDreGroupData,
  User,
} from "../dre-groups.types";
import { DREGroupsValidationService } from "./dre-groups-validation.service.server";

export class DREGroupsCRUDService {
  constructor(private user: User) {}

  async getAll(): Promise<ServiceResult> {
    try {
      const groups = await prismaClient.dREGroup.findMany({
        orderBy: { order: "asc" },
      });
      return { success: true, data: groups };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao buscar grupos",
      };
    }
  }

  async getById(id: string): Promise<ServiceResult> {
    try {
      const group = await prismaClient.dREGroup.findUnique({ where: { id } });
      if (!group) {
        return { success: false, error: "Grupo não encontrado" };
      }
      return { success: true, data: group };
    } catch (error: any) {
      return { success: false, error: error.message || "Erro ao buscar grupo" };
    }
  }

  async getByType(
    companyId: string,
    type: "receita" | "despesa"
  ): Promise<ServiceResult> {
    try {
      await this.checkPermissions();

      const dreGroups = // Buscar grupos DRE disponíveis
        await prismaClient.dREGroup.findMany({
          where: { type },
          orderBy: { order: "asc" },
        });

      return {
        success: true,
        data: { dreGroups },
      };
    } catch (error: any) {
      console.error("Error loading account plan data:", error);
      return {
        success: false,
        error: error.message || "Failed to load account plan data",
      };
    }
  }

  async create(data: { name: string; type: string }) {
    const type = DREGroupsValidationService.validateType(data.type);
    const baseOrder = DREGroupsValidationService.getBaseOrderByType(type);

    const count = await prismaClient.dREGroup.count({
      where: { type },
    });

    const dreGroup = await prismaClient.dREGroup.create({
      data: {
        name: data.name,
        type,
        order: baseOrder + count + 1,
      },
    });

    if (!dreGroup) {
      return {
        success: false,
        error: "Grupo não criado",
      };
    }

    return {
      success: true,
      data: dreGroup,
    };
  }

  async update(id: string, data: UpdateDreGroupData): Promise<ServiceResult> {
    DREGroupsValidationService.validateType(data.type);

    try {
      this.checkPermissions();
      const updatedGroup = await prismaClient.dREGroup.update({
        where: { id },
        data,
      });
      return {
        success: true,
        data: updatedGroup,
        message: "Grupo atualizado com sucesso",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao atualizar grupo",
      };
    }
  }

  async delete(id: string): Promise<ServiceResult> {
    try {
      this.checkPermissions();
      const accountsCount = await prismaClient.account.count({
        where: { dreGroupId: id },
      });

      if (accountsCount > 0) {
        return {
          success: false,
          error: "Não é possível excluir grupo com contas vinculadas",
        };
      }

      await prismaClient.dREGroup.delete({ where: { id } });
      return { success: true, message: "Grupo excluído com sucesso" };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Erro ao excluir grupo",
      };
    }
  }

  private checkPermissions(): void {
    if (this.user.role !== "admin") {
      throw new Error("Acesso negado");
    }
  }
}
