import { CreateDreGroupData, UpdateDreGroupData, ServiceResult, User } from '../dre-groups.types';
import { DreGroupsCRUDService } from './dre-groups-crud.service.server';
import { DreGroupsValidationService } from './dre-groups-validation.service.server';

export class DreGroupsService {
  private crudService: DreGroupsCRUDService;
  private validationService: DreGroupsValidationService;

  constructor(user: User) {
    this.crudService = new DreGroupsCRUDService(user);
    this.validationService = new DreGroupsValidationService();
  }

  async create(data: CreateDreGroupData): Promise<ServiceResult> {
    const validation = await this.validationService.validateFormData(data);
    if (!validation.success) return validation;

    const businessValidation = await this.validationService.validateBusinessRules(
      validation.data!
    );
    if (!businessValidation.success) return businessValidation;

    return this.crudService.create(validation.data!);
  }

  async update(groupId: string, data: UpdateDreGroupData): Promise<ServiceResult> {
    const validation = await this.validationService.validateFormData(data);
    if (!validation.success) return validation;

    const businessValidation = await this.validationService.validateBusinessRules(
      validation.data!,
      groupId
    );
    if (!businessValidation.success) return businessValidation;

    return this.crudService.update(groupId, validation.data!);
  }

  delete(groupId: string) {
    return this.crudService.delete(groupId);
  }

  get getAll() {
    return this.crudService.getAll.bind(this.crudService);
  }

  get getById() {
    return this.crudService.getById.bind(this.crudService);
  }
}

export function createDreGroupsService(user: User) {
  return new DreGroupsService(user);
}
