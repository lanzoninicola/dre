export interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  transactionType: string | null;
  documentNumber: string | null;
  transactionHash: string;
  isClassified: boolean;
  isReconciled: boolean;
  notes: string | null;
  classifiedAt: string | null;
  createdAt: string;
  account: {
    id: string;
    name: string;
    code: string | null;
    type: string;
    dreGroup: {
      id: string;
      name: string;
      type: string;
    } | null;
  } | null;
  classifiedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  statement: {
    id: string;
    fileName: string;
    bankName: string | null;
    accountNumber: string | null;
  };
}

export interface Account {
  id: string;
  name: string;
  code: string | null;
  type: string;
  dreGroup: {
    id: string;
    name: string;
    type: string;
  } | null;
}

export interface TransactionFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  accountId: string;
  isClassified: string;
  isReconciled: string;
  transactionType: string;
}

export interface TransactionStats {
  total: number;
  classified: number;
  reconciled: number;
  pending: number;
  totalAmount: number;
  creditAmount: number;
  debitAmount: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export interface Company {
  id: string;
  name: string;
  cnpj: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  type: string;
}
