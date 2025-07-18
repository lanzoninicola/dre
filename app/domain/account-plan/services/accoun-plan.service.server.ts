import { createAuditLog } from "~/domain/audit/audit.server";
import {
  CreateAccountData,
  ServiceResult,
  UpdateAccountData,
  User,
} from "../account-plan.types";
import { AccountPlanCRUDService } from "./account-plan-crud.service.server";
import { AccountPlanUtilityService } from "./account-plan-utility.service.server";
import { AccountPlanValidationService } from "./account-plan-validation.service.server";

export class AccountPlanService {
  private crudService: AccountPlanCRUDService;
  private validationService: AccountPlanValidationService;
  private utilityService: AccountPlanUtilityService;

  constructor(user: User) {
    this.crudService = new AccountPlanCRUDService(user);
    this.validationService = new AccountPlanValidationService();
    this.utilityService = new AccountPlanUtilityService(user);
  }

  // Métodos principais que combinam validação + CRUD + auditoria
  async create(
    companyId: string,
    accountData: CreateAccountData
  ): Promise<ServiceResult> {
    const validation = await this.validationService.validateFormData(
      accountData
    );
    if (!validation.success) return validation;

    const businessValidation =
      await this.validationService.validateBusinessRules(
        companyId,
        validation.data!
      );
    if (!businessValidation.success) return businessValidation;

    const result = await this.crudService.create(companyId, validation.data!);

    if (result.success) {
      await createAuditLog({
        userId: this.crudService["user"].id,
        action: "CREATE",
        entity: "AccountPlan",
        entityId: result.data.id,
        details: validation.data,
      });
    }

    return result;
  }

  async update(
    companyId: string,
    accountId: string,
    accountData: UpdateAccountData
  ): Promise<ServiceResult> {
    const validation = await this.validationService.validateFormData(
      accountData
    );
    if (!validation.success) return validation;

    const businessValidation =
      await this.validationService.validateBusinessRules(
        companyId,
        validation.data!,
        accountId
      );
    if (!businessValidation.success) return businessValidation;

    const result = await this.crudService.update(
      companyId,
      accountId,
      validation.data!
    );

    if (result.success) {
      await createAuditLog({
        userId: this.crudService["user"].id,
        action: "UPDATE",
        entity: "AccountPlan",
        entityId: accountId,
        details: validation.data,
      });
    }

    return result;
  }

  async delete(companyId: string, accountId: string): Promise<ServiceResult> {
    const result = await this.crudService.delete(companyId, accountId);

    if (result.success) {
      await createAuditLog({
        userId: this.crudService["user"].id,
        action: "DELETE",
        entity: "AccountPlan",
        entityId: accountId,
        details: { companyId },
      });
    }

    return result;
  }

  get getAccountPlanData() {
    return this.crudService.getAccountPlanData.bind(this.crudService);
  }

  get getById() {
    return this.crudService.getById.bind(this.crudService);
  }

  get getStats() {
    return this.crudService.getStats.bind(this.crudService);
  }

  get validateAccountPlan() {
    return this.validationService.validateAccountPlan.bind(
      this.validationService
    );
  }

  get moveAccountToGroup() {
    return this.utilityService.moveAccountToGroup.bind(this.utilityService);
  }

  get duplicateAccount() {
    return this.utilityService.duplicateAccount.bind(this.utilityService);
  }

  get searchAccounts() {
    return this.utilityService.searchAccounts.bind(this.utilityService);
  }
}

// Factory function para facilitar uso nas rotas
export function createAccountPlanService(user: User) {
  return new AccountPlanService(user);
}
