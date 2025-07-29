import { createAuditLog } from '~/domain/audit/audit.server';
import { User } from '../dre-groups.types';

export class DREGroupsAuditService {
  constructor(private user: User) {}

  async logCreate(groupId: string, data: any): Promise<void> {
    await createAuditLog({
      userId: this.user.id,
      action: 'CREATE',
      entity: 'DREGroup',
      entityId: groupId,
      details: data,
    });
  }

  async logUpdate(groupId: string, data: any): Promise<void> {
    await createAuditLog({
      userId: this.user.id,
      action: 'UPDATE',
      entity: 'DREGroup',
      entityId: groupId,
      details: data,
    });
  }

  async logDelete(groupId: string, data: any): Promise<void> {
    await createAuditLog({
      userId: this.user.id,
      action: 'DELETE',
      entity: 'DREGroup',
      entityId: groupId,
      details: data,
    });
  }
}
