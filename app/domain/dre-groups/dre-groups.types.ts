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

export interface CreateDREGroupData {
  name: string;
  order: number;
  type: 'receita' | 'despesa' | 'resultado';
}

export interface UpdateDREGroupData extends CreateDREGroupData {}

export interface DREGroupFormData extends CreateDREGroupData {}

export interface User {
  id: string;
  role: string;
  accountingFirmId?: string;
}
