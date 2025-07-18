export type ExportFormat = "excel" | "pdf" | "csv";

export interface ServiceResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export interface ValidationResult {
  success: boolean;
  data?: any;
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface CreateAccountData {
  name: string;
  type: "receita" | "despesa";
  dreGroupId: string;
}

export interface UpdateAccountData extends CreateAccountData {}
export interface ImportAccountData extends CreateAccountData {}
export interface AccountFormData extends CreateAccountData {}

export interface SearchFilters {
  query?: string;
  type?: "receita" | "despesa";
  dreGroupId?: string;
}

export interface AccountOrderData {
  id: string;
  order: number;
}

export interface User {
  id: string;
  role: string;
  accountingFirmId?: string;
}
