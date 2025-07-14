import prismaClient from "~/lib/prisma/client.server";

export interface AuditLogInputProps {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: any;
}

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  details,
}: AuditLogInputProps) {
  return prismaClient.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      details,
    },
  });
}
