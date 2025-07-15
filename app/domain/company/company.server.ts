import { Company } from "@prisma/client";
import prismaClient from "~/lib/prisma/client.server";

export interface CompanyWithStats extends Company {
  _count: {
    accounts: number;
    users: number;
  };
}
export async function getCompanies() {
  return await prismaClient.dRE.findMany();
}

// Função para buscar empresa por ID
export async function getCompanyById(
  companyId: string
): Promise<Company | null> {
  try {
    const company = await prismaClient.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        cnpj: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        accountingFirmId: true,
      },
    });

    if (!company) {
      console.warn(`Company not found with ID: ${companyId}`);
      return null;
    }

    return company;
  } catch (error) {
    console.error("Error fetching company by ID:", error);
    throw new Error("Failed to fetch company");
  }
}

// Função para buscar empresa com estatísticas
export async function getCompanyWithStats(
  companyId: string
): Promise<CompanyWithStats | null> {
  try {
    const company = await prismaClient.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            accounts: true,
            users: true,
          },
        },
      },
    });

    return company;
  } catch (error) {
    console.error("Error fetching company with stats:", error);
    throw new Error("Failed to fetch company with statistics");
  }
}

// Função para verificar se o usuário tem acesso à empresa
export async function validateUserCompanyAccess(
  companyId: string,
  userId: string
): Promise<boolean> {
  try {
    const company = await prismaClient.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { userId: userId },
          { users: { some: { id: userId } } },
          { accountingFirm: { users: { some: { id: userId } } } },
        ],
      },
      select: { id: true },
    });

    return !!company;
  } catch (error) {
    console.error("Error validating user company access:", error);
    return false;
  }
}

// Função para buscar empresas do usuário
export async function getUserCompanies(userId: string): Promise<Company[]> {
  try {
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: { accountingFirmId: true },
    });

    const companies = await prismaClient.company.findMany({
      where: {
        OR: [
          { userId: userId },
          { users: { some: { id: userId } } },
          ...(user?.accountingFirmId
            ? [{ accountingFirmId: user.accountingFirmId }]
            : []),
        ],
      },
      select: {
        id: true,
        name: true,
        cnpj: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        accountingFirmId: true,
      },
      orderBy: { name: "asc" },
    });

    return companies;
  } catch (error) {
    console.error("Error fetching user companies:", error);
    throw new Error("Failed to fetch user companies");
  }
}

// Função para buscar empresas com estatísticas
export async function getUserCompaniesWithStats(
  userId: string
): Promise<CompanyWithStats[]> {
  try {
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: { accountingFirmId: true },
    });

    const companies = await prismaClient.company.findMany({
      where: {
        OR: [
          { userId: userId },
          { users: { some: { id: userId } } },
          ...(user?.accountingFirmId
            ? [{ accountingFirmId: user.accountingFirmId }]
            : []),
        ],
      },
      include: {
        _count: {
          select: {
            accountPlans: true,
            bankTransactions: true,
            users: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return companies;
  } catch (error) {
    console.error("Error fetching user companies with stats:", error);
    throw new Error("Failed to fetch user companies with statistics");
  }
}

// Função para criar nova empresa
export async function createCompany(data: {
  name: string;
  cnpj: string;
  userId: string;
  accountingFirmId?: string;
}): Promise<Company> {
  try {
    // Verificar se já existe empresa com mesmo CNPJ
    const existingCompany = await prismaClient.company.findUnique({
      where: { cnpj: data.cnpj },
    });

    if (existingCompany) {
      throw new Error("Já existe uma empresa cadastrada com este CNPJ");
    }

    const company = await prismaClient.company.create({
      data: {
        name: data.name,
        cnpj: data.cnpj,
        userId: data.userId,
        accountingFirmId: data.accountingFirmId,
      },
    });

    return company;
  } catch (error) {
    console.error("Error creating company:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create company");
  }
}

// Função para atualizar empresa
export async function updateCompany(
  companyId: string,
  data: Partial<{
    name: string;
    cnpj: string;
    accountingFirmId: string;
  }>
): Promise<Company> {
  try {
    // Se estiver atualizando o CNPJ, verificar duplicidade
    if (data.cnpj) {
      const existingCompany = await prismaClient.company.findFirst({
        where: {
          cnpj: data.cnpj,
          id: { not: companyId },
        },
      });

      if (existingCompany) {
        throw new Error("Já existe uma empresa cadastrada com este CNPJ");
      }
    }

    const company = await prismaClient.company.update({
      where: { id: companyId },
      data,
    });

    return company;
  } catch (error) {
    console.error("Error updating company:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update company");
  }
}

// Função para deletar empresa
export async function deleteCompany(companyId: string): Promise<void> {
  try {
    // Verificar se a empresa tem dados dependentes
    const [accountPlans, bankTransactions] = await Promise.all([
      prismaClient.accountPlan.count({ where: { companyId } }),
      prismaClient.bankTransaction.count({
        where: { account: { companyId } },
      }),
    ]);

    if (accountPlans > 0 || bankTransactions > 0) {
      throw new Error(
        "Não é possível excluir uma empresa que possui plano de contas ou transações cadastradas"
      );
    }

    await prismaClient.company.delete({
      where: { id: companyId },
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete company");
  }
}

// Função para validar dados da empresa
export function validateCompanyData(data: { name: string; cnpj: string }) {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push("Nome da empresa deve ter pelo menos 2 caracteres");
  }

  if (data.name && data.name.trim().length > 100) {
    errors.push("Nome da empresa deve ter no máximo 100 caracteres");
  }

  if (!data.cnpj || data.cnpj.trim().length === 0) {
    errors.push("CNPJ é obrigatório");
  }

  // Validação básica de formato do CNPJ (apenas números e pontuação)
  if (data.cnpj && !/^[\d.\-\/]+$/.test(data.cnpj)) {
    errors.push("CNPJ deve conter apenas números, pontos, hífens e barras");
  }

  return errors;
}

// Função para formatar CNPJ
export function formatCNPJ(cnpj: string): string {
  // Remove caracteres não numéricos
  const numbers = cnpj.replace(/\D/g, "");

  // Se não tem 14 dígitos, retorna como está
  if (numbers.length !== 14) {
    return cnpj;
  }

  // Formata como XX.XXX.XXX/XXXX-XX
  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}
