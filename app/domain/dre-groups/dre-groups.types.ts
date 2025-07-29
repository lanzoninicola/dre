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

export interface DreGroupFormData {
  name: string;
  order: number;
  type: 'receita' | 'despesa' | 'resultado';
}

export interface CreateDreGroupData extends DreGroupFormData {}
export interface UpdateDreGroupData extends DreGroupFormData {}

export interface User {
  id: string;
  role: string;
  accountingFirmId?: string;
}
