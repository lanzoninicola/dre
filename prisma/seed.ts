import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const firm = await prisma.accountingFirm.create({
    data: {
      name: "Contabilidade Modelo"
    }
  });

  const user = await prisma.user.create({
    data: {
      email: "admin@example.com",
      password: "123456",
      role: "ADMIN",
      isActive: true,
      canManageUsers: true,
      accountingFirmId: firm.id
    }
  });

  const company = await prisma.company.create({
    data: {
      name: "Empresa Teste",
      userId: user.id,
      accountingFirmId: firm.id
    }
  });

  const dreGroup = await prisma.dREGroup.create({
    data: {
      name: "Receita Operacional",
      order: 1
    }
  });

  await prisma.accountPlan.create({
    data: {
      name: "Receitas PIX",
      type: "INCOME",
      companyId: company.id,
      dreGroupId: dreGroup.id
    }
  });

  console.log("Seed concluído");
}

main().finally(() => prisma.$disconnect());
