import prismaClient from '~/lib/prisma/client.server';
import {
  ServiceResult,
  CreateDREGroupData,
  UpdateDREGroupData,
  User,
} from '../dre-groups.types';

export class DREGroupsCRUDService {
  constructor(private user: User) {}

  async getAll(): Promise<ServiceResult> {
    try {
      const groups = await prismaClient.dREGroup.findMany({
        orderBy: { order: 'asc' },
      });
      return { success: true, data: groups };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao buscar grupos' };
    }
  }

  async getById(id: string): Promise<ServiceResult> {
    try {
      const group = await prismaClient.dREGroup.findUnique({ where: { id } });
      if (!group) {
        return { success: false, error: 'Grupo não encontrado' };
      }
      return { success: true, data: group };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao buscar grupo' };
    }
  }

  async create(data: CreateDREGroupData): Promise<ServiceResult> {
    try {
      this.checkPermissions();
      const newGroup = await prismaClient.dREGroup.create({ data });
      return {
        success: true,
        data: newGroup,
        message: 'Grupo criado com sucesso',
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao criar grupo' };
    }
  }

  async update(id: string, data: UpdateDREGroupData): Promise<ServiceResult> {
    try {
      this.checkPermissions();
      const updatedGroup = await prismaClient.dREGroup.update({
        where: { id },
        data,
      });
      return {
        success: true,
        data: updatedGroup,
        message: 'Grupo atualizado com sucesso',
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao atualizar grupo' };
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
          error: 'Não é possível excluir grupo com contas vinculadas',
        };
      }

      await prismaClient.dREGroup.delete({ where: { id } });
      return { success: true, message: 'Grupo excluído com sucesso' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao excluir grupo' };
    }
  }

  private checkPermissions(): void {
    if (this.user.role !== 'admin') {
      throw new Error('Acesso negado');
    }
  }
}
