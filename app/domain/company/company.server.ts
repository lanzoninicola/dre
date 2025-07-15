import prismaClient from "~/lib/prisma/client.server";

export async function getCompanies() {
  return await prismaClient.dRE.findMany();
}

export async function getCompanyById(companyId: string) {
  return await prismaClient.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      cnpj: true,
    },
  });
}
