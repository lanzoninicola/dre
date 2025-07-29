import { createAuditLog } from "~/domain/audit/audit.server";
import {
  CreateDreGroupData,
  ServiceResult,
  UpdateDreGroupData,
  User,
} from "../dre-groups.types";
import { DREGroupsCRUDService } from "./dre-groups-crud.service.server";
import { DREGroupsValidationService } from "./dre-groups-validation.service.server";
import { DreGroupsUtilsService } from "./dre-groups-utils.service.server";

export class DREGroupsService {
  private crudService: DREGroupsCRUDService;
  private validationService: DREGroupsValidationService;
  private utilsService: DreGroupsUtilsService;

  constructor(user: User) {
    this.crudService = new DREGroupsCRUDService(user);
    this.validationService = new DREGroupsValidationService();
    this.utilsService = new DreGroupsUtilsService();
  }

  async create(data: CreateDreGroupData): Promise<ServiceResult> {
    const validation = await this.validationService.validateFormData(data);
    if (!validation.success) return validation;

    const business = await this.validationService.validateBusinessRules(
      validation.data!
    );
    if (!business.success) return business;

    const result = await this.crudService.create(validation.data!);

    if (result.success) {
      await createAuditLog({
        userId: this.crudService["user"].id,
        action: "CREATE",
        entity: "DREGroup",
        entityId: result?.data?.id ?? "",
        details: validation.data,
      });
    }

    return result;
  }

  async update(id: string, data: UpdateDreGroupData): Promise<ServiceResult> {
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
        userId: this.crudService["user"].id,
        action: "UPDATE",
        entity: "DREGroup",
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
        userId: this.crudService["user"].id,
        action: "DELETE",
        entity: "DREGroup",
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

  async list(companyId: string, type: string) {
    const validType = DREGroupsValidationService.validateType(type);
    return this.crudService.getByType(companyId, validType);
  }
  async reorder(groups: { id: string; order: number }[], type: string) {
    const validType = DREGroupsValidationService.validateType(type);
    return this.utilsService.reorder(groups, validType);
  }
}

export function createDREGroupsService(user: User) {
  return new DREGroupsService(user);
}
