import prismaClient from '~/lib/prisma/client.server';
import { ServiceResult, CreateDreGroupData, UpdateDreGroupData, User } from '../dre-groups.types';

export class DreGroupsCRUDService {
  constructor(private user: User) {}

  async getAll(): Promise<ServiceResult> {
    try {
      const groups = await prismaClient.dREGroup.findMany({
        orderBy: { order: 'asc' },
      });
      return { success: true, data: groups };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao listar grupos' };
    }
  }

  async getById(groupId: string): Promise<ServiceResult> {
    try {
      const group = await prismaClient.dREGroup.findUnique({ where: { id: groupId } });
      if (!group) return { success: false, error: 'Grupo não encontrado' };
      return { success: true, data: group };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao buscar grupo' };
    }
  }

  async create(data: CreateDreGroupData): Promise<ServiceResult> {
    try {
      this.checkAdmin();
      const group = await prismaClient.dREGroup.create({ data });
      return { success: true, data: group, message: 'Grupo criado com sucesso' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao criar grupo' };
    }
  }

  async update(groupId: string, data: UpdateDreGroupData): Promise<ServiceResult> {
    try {
      this.checkAdmin();
      const existing = await prismaClient.dREGroup.findUnique({ where: { id: groupId } });
      if (!existing) return { success: false, error: 'Grupo não encontrado' };
      const group = await prismaClient.dREGroup.update({ where: { id: groupId }, data });
      return { success: true, data: group, message: 'Grupo atualizado com sucesso' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao atualizar grupo' };
    }
  }

  async delete(groupId: string): Promise<ServiceResult> {
    try {
      this.checkAdmin();
      const count = await prismaClient.account.count({ where: { dreGroupId: groupId } });
      if (count > 0) {
        return { success: false, error: 'Grupo possui contas vinculadas' };
      }
      await prismaClient.dREGroup.delete({ where: { id: groupId } });
      return { success: true, message: 'Grupo excluído com sucesso' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro ao excluir grupo' };
    }
  }

  private checkAdmin() {
    if (this.user.role !== 'admin') {
      throw new Error('Acesso negado');
    }
  }
}
