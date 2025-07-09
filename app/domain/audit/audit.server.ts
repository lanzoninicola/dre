import prismaClient from "~/lib/prisma/client.server";

export async function createAuditLog(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  details?: any
) {
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
