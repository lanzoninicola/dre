import crypto from "crypto";

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

export function parseOFX(ofxContent: string): OFXParseResult {
  try {
    const lines = ofxContent.split("\n");
    const transactions: OFXTransaction[] = [];
    const warnings: string[] = [];

    let currentTransaction: Partial<OFXTransaction> = {};
    let inTransaction = false;
    let accountId = "";
    let bankId = "";
    let accountType = "";
    let routingNumber = "";
    let balanceAmount: number | undefined;
    let balanceDate: Date | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Informações da conta
      if (line.includes("<ACCTID>")) {
        accountId = extractValue(line, "ACCTID");
      } else if (line.includes("<BANKID>")) {
        bankId = extractValue(line, "BANKID");
      } else if (line.includes("<ACCTTYPE>")) {
        accountType = extractValue(line, "ACCTTYPE");
      } else if (line.includes("<ROUTINGNUM>")) {
        routingNumber = extractValue(line, "ROUTINGNUM");
      }

      // Saldo
      else if (line.includes("<BALAMT>")) {
        const balanceStr = extractValue(line, "BALAMT");
        balanceAmount = parseFloat(balanceStr);
      } else if (line.includes("<DTASOF>")) {
        const dateStr = extractValue(line, "DTASOF");
        balanceDate = parseOFXDate(dateStr);
      }

      // Transações
      else if (line.includes("<STMTTRN>")) {
        inTransaction = true;
        currentTransaction = {};
      } else if (line.includes("</STMTTRN>") && inTransaction) {
        if (isValidTransaction(currentTransaction)) {
          transactions.push(currentTransaction as OFXTransaction);
        } else {
          warnings.push(
            `Transação inválida na linha ${i + 1}: dados incompletos`
          );
        }
        inTransaction = false;
      } else if (inTransaction) {
        parseTransactionField(line, currentTransaction);
      }
    }

    // Validações básicas
    if (!accountId) {
      return {
        success: false,
        error: "ID da conta não encontrado no arquivo OFX",
      };
    }

    if (transactions.length === 0) {
      return {
        success: false,
        error: "Nenhuma transação encontrada no arquivo OFX",
      };
    }

    const data: OFXData = {
      accountId,
      bankId,
      accountType,
      routingNumber,
      balanceAmount,
      balanceDate,
      transactions: transactions.sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      ),
    };

    return {
      success: true,
      data,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: `Erro ao processar arquivo OFX: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`,
    };
  }
}

function extractValue(line: string, tag: string): string {
  const regex = new RegExp(`<${tag}>(.*?)<\/${tag}>`, "i");
  const match = line.match(regex);
  if (match) {
    return match[1].trim();
  }

  // Fallback para tags sem fechamento
  const openTag = new RegExp(`<${tag}>(.*)`, "i");
  const openMatch = line.match(openTag);
  if (openMatch) {
    return openMatch[1].trim();
  }

  return "";
}

function parseOFXDate(dateStr: string): Date {
  // OFX date format: YYYYMMDD ou YYYYMMDDHHMMSS
  const cleanDate = dateStr.replace(/[^0-9]/g, "");

  if (cleanDate.length >= 8) {
    const year = parseInt(cleanDate.substring(0, 4));
    const month = parseInt(cleanDate.substring(4, 6)) - 1; // Month is 0-based
    const day = parseInt(cleanDate.substring(6, 8));

    let hour = 0;
    let minute = 0;
    let second = 0;

    if (cleanDate.length >= 14) {
      hour = parseInt(cleanDate.substring(8, 10));
      minute = parseInt(cleanDate.substring(10, 12));
      second = parseInt(cleanDate.substring(12, 14));
    }

    return new Date(year, month, day, hour, minute, second);
  }

  throw new Error(`Data inválida no OFX: ${dateStr}`);
}

function parseTransactionField(
  line: string,
  transaction: Partial<OFXTransaction>
) {
  if (line.includes("<TRNAMT>")) {
    const amountStr = extractValue(line, "TRNAMT");
    transaction.amount = parseFloat(amountStr);
  } else if (line.includes("<DTPOSTED>")) {
    const dateStr = extractValue(line, "DTPOSTED");
    transaction.date = parseOFXDate(dateStr);
  } else if (line.includes("<FITID>")) {
    transaction.id = extractValue(line, "FITID");
  } else if (line.includes("<MEMO>")) {
    transaction.description = extractValue(line, "MEMO");
    transaction.memo = transaction.description; // Backup do memo
  } else if (line.includes("<NAME>")) {
    // Se não tiver description, usa o NAME
    if (!transaction.description) {
      transaction.description = extractValue(line, "NAME");
    }
  } else if (line.includes("<TRNTYPE>")) {
    transaction.type = extractValue(line, "TRNTYPE");
  } else if (line.includes("<CHECKNUM>")) {
    transaction.checkNumber = extractValue(line, "CHECKNUM");
  } else if (line.includes("<REFNUM>")) {
    transaction.referenceNumber = extractValue(line, "REFNUM");
  }
}

function isValidTransaction(transaction: Partial<OFXTransaction>): boolean {
  return !!(
    transaction.id &&
    transaction.date &&
    transaction.amount !== undefined &&
    transaction.description &&
    transaction.type
  );
}

export function generateFileHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

export function validateOFXFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Validar extensão
  if (!file.name.toLowerCase().endsWith(".ofx")) {
    return { valid: false, error: "Arquivo deve ter extensão .ofx" };
  }

  // Validar tamanho (máximo 10MB)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: "Arquivo muito grande (máximo 10MB)" };
  }

  return { valid: true };
}

// Utilitário para categorizar transações automaticamente
export function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase();

  if (desc.includes("pix") || desc.includes("ted") || desc.includes("doc")) {
    return "TRANSFERENCIA";
  }

  if (desc.includes("cartao") || desc.includes("card")) {
    return "CARTAO";
  }

  if (desc.includes("saque") || desc.includes("withdrawal")) {
    return "SAQUE";
  }

  if (desc.includes("deposito") || desc.includes("deposit")) {
    return "DEPOSITO";
  }

  if (
    desc.includes("tarifa") ||
    desc.includes("taxa") ||
    desc.includes("fee")
  ) {
    return "TARIFA";
  }

  if (desc.includes("juros") || desc.includes("interest")) {
    return "JUROS";
  }

  return "OUTROS";
}

// Utilitário para detectar transações duplicadas
export function detectDuplicateTransactions(
  transactions: OFXTransaction[]
): OFXTransaction[] {
  const seen = new Set<string>();
  return transactions.filter((transaction) => {
    const key = `${transaction.date.toISOString()}-${transaction.amount}-${
      transaction.description
    }`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

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

export function generateImportReport(
  transactions: OFXTransaction[]
): ImportReport {
  if (transactions.length === 0) {
    throw new Error("Nenhuma transação para gerar relatório");
  }

  const dates = transactions.map((t) => t.date);
  const amounts = transactions.map((t) => t.amount);
  const categories: Record<string, number> = {};

  transactions.forEach((transaction) => {
    const category = categorizeTransaction(transaction.description);
    categories[category] = (categories[category] || 0) + 1;
  });

  return {
    totalTransactions: transactions.length,
    duplicatesRemoved: 0, // Será calculado na importação
    dateRange: {
      start: new Date(Math.min(...dates.map((d) => d.getTime()))),
      end: new Date(Math.max(...dates.map((d) => d.getTime()))),
    },
    amountRange: {
      min: Math.min(...amounts),
      max: Math.max(...amounts),
    },
    categories,
  };
}
