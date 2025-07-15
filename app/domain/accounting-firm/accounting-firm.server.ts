import prismaClient from "~/lib/prisma/client.server";

export async function getAccountingFirmsByUserId(
  userId: string
): Promise<string[]> {
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { accountingFirmId: true },
  });

  return user?.accountingFirmId ? [user.accountingFirmId] : [];
}
