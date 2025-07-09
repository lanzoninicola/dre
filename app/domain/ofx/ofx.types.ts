// Utilitário para gerar relatório de importação
export interface ImportReport {
  totalTransactions: number;
  duplicatesRemoved: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  amountRange: {
    min: number;
    max: number;
  };
  categories: Record<string, number>;
}

export interface OFXTransaction {
  id: string;
  date: Date;
  amount: number;
  description: string;
  type: string;
  memo?: string;
  checkNumber?: string;
  referenceNumber?: string;
}

export interface OFXData {
  accountId: string;
  bankId: string;
  accountType: string;
  routingNumber?: string;
  balanceAmount?: number;
  balanceDate?: Date;
  transactions: OFXTransaction[];
}

export interface OFXParseResult {
  success: boolean;
  data?: OFXData;
  error?: string;
  warnings?: string[];
}
