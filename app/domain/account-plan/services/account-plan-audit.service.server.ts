// ============================================================================
// 4. AUDIT - Logs de auditoria
// ============================================================================

import { createAuditLog } from "~/domain/audit/audit.server";
import { User } from "../account-plan.types";

// app/services/account-plan/AccountPlanAuditService.ts
export class AccountPlanAuditService {
  constructor(private user: User) {}

  async logCreate(accountId: string, data: any): Promise<void> {
    await createAuditLog({
      userId: this.user.id,
      action: "CREATE",
      entity: "AccountPlan",
      entityId: accountId,
      details: data,
    });
  }

  async logUpdate(accountId: string, data: any): Promise<void> {
    await createAuditLog({
      userId: this.user.id,
      action: "UPDATE",
      entity: "AccountPlan",
      entityId: accountId,
      details: data,
    });
  }

  async logDelete(accountId: string, data: any): Promise<void> {
    await createAuditLog({
      userId: this.user.id,
      action: "DELETE",
      entity: "AccountPlan",
      entityId: accountId,
      details: data,
    });
  }

  async logImport(companyId: string, data: any): Promise<void> {
    await createAuditLog({
      userId: this.user.id,
      action: "IMPORT",
      entity: "AccountPlan",
      entityId: companyId,
      details: data,
    });
  }

  async logExport(companyId: string, data: any): Promise<void> {
    await createAuditLog({
      userId: this.user.id,
      action: "EXPORT",
      entity: "AccountPlan",
      entityId: companyId,
      details: data,
    });
  }
}
