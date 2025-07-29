import { createAuditLog } from '~/domain/audit/audit.server';
import {
  CreateDREGroupData,
  UpdateDREGroupData,
  ServiceResult,
  User,
} from '../dre-groups.types';
import { DREGroupsCRUDService } from './dre-groups-crud.service.server';
import { DREGroupsValidationService } from './dre-groups-validation.service.server';

export class DREGroupsService {
  private crudService: DREGroupsCRUDService;
  private validationService: DREGroupsValidationService;

  constructor(user: User) {
    this.crudService = new DREGroupsCRUDService(user);
    this.validationService = new DREGroupsValidationService();
  }

  async create(data: CreateDREGroupData): Promise<ServiceResult> {
    const validation = await this.validationService.validateFormData(data);
    if (!validation.success) return validation;

    const business = await this.validationService.validateBusinessRules(
      validation.data!
    );
    if (!business.success) return business;

    const result = await this.crudService.create(validation.data!);

    if (result.success) {
      await createAuditLog({
        userId: this.crudService['user'].id,
        action: 'CREATE',
        entity: 'DREGroup',
        entityId: result.data.id,
        details: validation.data,
      });
    }

    return result;
  }

  async update(id: string, data: UpdateDREGroupData): Promise<ServiceResult> {
    const validation = await this.validationService.validateFormData(data);
    if (!validation.success) return validation;

    const business = await this.validationService.validateBusinessRules(
      validation.data!,
      id
    );
    if (!business.success) return business;

    const result = await this.crudService.update(id, validation.data!);

    if (result.success) {
      await createAuditLog({
        userId: this.crudService['user'].id,
        action: 'UPDATE',
        entity: 'DREGroup',
        entityId: id,
        details: validation.data,
      });
    }

    return result;
  }

  async delete(id: string): Promise<ServiceResult> {
    const result = await this.crudService.delete(id);

    if (result.success) {
      await createAuditLog({
        userId: this.crudService['user'].id,
        action: 'DELETE',
        entity: 'DREGroup',
        entityId: id,
        details: {},
      });
    }

    return result;
  }

  get getAll() {
    return this.crudService.getAll.bind(this.crudService);
  }

  get getById() {
    return this.crudService.getById.bind(this.crudService);
  }
}

export function createDREGroupsService(user: User) {
  return new DREGroupsService(user);
}
