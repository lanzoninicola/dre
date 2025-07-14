// app/types/dre.ts

export interface DRELineItem {
  groupId: string;
  groupName: string;
  groupType: "receita" | "despesa";
  groupOrder: number;
  totalAmount: number;
  accounts: Array<{
    accountId: string;
    accountName: string;
    amount: number;
  }>;
}

export interface DREStructure {
  receitaBruta: number;
  deducoesDaReceita: number;
  receitaLiquida: number;
  custoDosProdutosVendidos: number;
  lucroBruto: number;
  despesasAdministrativas: number;
  despesasComerciais: number;
  despesasFinanceiras: number;
  receitasFinanceiras: number;
  outrasReceitasOperacionais: number;
  outrasDespesasOperacionais: number;
  lucroOperacional: number;
  lucroLiquido: number;
  lineItems: DRELineItem[];
}

export interface DREData {
  id: string;
  companyId: string;
  periodStart: Date;
  periodEnd: Date;
  data: DREStructure;
  generatedAt: Date;
  company?: {
    id: string;
    name: string;
    cnpj: string;
  };
}

export interface DREFilters {
  companyId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  includeCompanyInfo?: boolean;
  limit?: number;
  offset?: number;
}

export interface GenerateDRERequest {
  companyId: string;
  periodStart: Date;
  periodEnd: Date;
  userId: string;
}

export interface ListDREsRequest {
  companyId?: string;
  periodStart?: Date;
  periodEnd?: Date;
  includeCompanyInfo?: boolean;
  page?: number;
  limit?: number;
}

export interface ExportDREToPDFRequest {
  dreId: string;
}
