import {
  type BankTransaction,
  type TransactionStats,
} from "./transactions.types";

export function calculateTransactionStats(
  transactions: BankTransaction[]
): TransactionStats {
  return {
    total: transactions.length,
    classified: transactions.filter((t) => t.isClassified).length,
    reconciled: transactions.filter((t) => t.isReconciled).length,
    pending: transactions.filter((t) => !t.isClassified).length,
    totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
    creditAmount: transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0),
    debitAmount: transactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0),
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("pt-BR");
}

export function getTransactionStatus(transaction: BankTransaction) {
  if (transaction.isReconciled) {
    return {
      label: "Reconciliada",
      color: "bg-green-50 text-green-700 border-green-200",
      variant: "success" as const,
    };
  } else if (transaction.isClassified) {
    return {
      label: "Classificada",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      variant: "info" as const,
    };
  } else {
    return {
      label: "Pendente",
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      variant: "warning" as const,
    };
  }
}

export function getTransactionTypeLabel(
  transactionType: string | null
): string {
  switch (transactionType) {
    case "credit":
      return "Crédito";
    case "debit":
      return "Débito";
    default:
      return "N/A";
  }
}

export function buildTransactionFilters(searchParams: URLSearchParams) {
  return {
    search: searchParams.get("search") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    accountId: searchParams.get("accountId") || "",
    isClassified: searchParams.get("isClassified") || "",
    isReconciled: searchParams.get("isReconciled") || "",
    transactionType: searchParams.get("transactionType") || "",
  };
}
