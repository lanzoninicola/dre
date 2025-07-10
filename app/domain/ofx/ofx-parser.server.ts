import crypto from "crypto";
import {
  OFXParseResult,
  OFXTransaction,
  OFXData,
  ImportReport,
} from "./ofx.types";

export function parseOFX(ofxContent: string): OFXParseResult {
  try {
    const lines = ofxContent.split("\n");
    const transactions: OFXTransaction[] = [];
    const warnings: string[] = [];

    let currentTransaction: Partial<OFXTransaction> = {};
    let inTransaction = false;
    let inBankAccount = false;
    let accountId = "";
    let bankId = "";
    let accountType = "";
    let routingNumber = "";
    let balanceAmount: number | undefined;
    let balanceDate: Date | undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detecta início da seção da conta bancária
      if (line.includes("<BANKACCTFROM>")) {
        inBankAccount = true;
        continue;
      }

      // Detecta fim da seção da conta bancária
      if (line.includes("</BANKACCTFROM>")) {
        inBankAccount = false;
        continue;
      }

      // Informações da conta (apenas quando estiver na seção BANKACCTFROM)
      if (inBankAccount) {
        if (line.includes("<ACCTID>")) {
          accountId = extractValue(line, "ACCTID");
        } else if (line.includes("<BANKID>")) {
          bankId = extractValue(line, "BANKID");
        } else if (line.includes("<ACCTTYPE>")) {
          accountType = extractValue(line, "ACCTTYPE");
        } else if (line.includes("<ROUTINGNUM>")) {
          routingNumber = extractValue(line, "ROUTINGNUM");
        }
        continue;
      }

      // Saldo (fora da seção de conta)
      if (line.includes("<BALAMT>")) {
        const balanceStr = extractValue(line, "BALAMT");
        if (balanceStr) {
          balanceAmount = parseFloat(balanceStr);
        }
      } else if (line.includes("<DTASOF>")) {
        const dateStr = extractValue(line, "DTASOF");
        if (dateStr) {
          balanceDate = parseOFXDate(dateStr);
        }
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
            `Transação inválida na linha ${
              i + 1
            }: dados incompletos - ${JSON.stringify(currentTransaction)}`
          );
        }
        inTransaction = false;
        currentTransaction = {};
      } else if (inTransaction) {
        parseTransactionField(line, currentTransaction);
      }
    }

    // Debug: Log dos dados extraídos
    console.log("Dados extraídos do OFX:", {
      accountId,
      bankId,
      accountType,
      routingNumber,
      balanceAmount,
      balanceDate,
      transactionsCount: transactions.length,
    });

    // Validações básicas
    if (!accountId) {
      return {
        success: false,
        error: `ID da conta não encontrado no arquivo OFX. Dados encontrados: bankId=${bankId}, accountType=${accountType}. Verificar estrutura do arquivo.`,
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
    console.error("Erro no parseOFX:", error);
    return {
      success: false,
      error: `Erro ao processar arquivo OFX: ${
        error instanceof Error ? error.message : "Erro desconhecido"
      }`,
    };
  }
}

function extractValue(line: string, tag: string): string {
  // Tenta primeiro com tag fechada
  const closedTagRegex = new RegExp(`<${tag}>(.*?)</${tag}>`, "i");
  const closedMatch = line.match(closedTagRegex);
  if (closedMatch) {
    return closedMatch[1].trim();
  }

  // Fallback para tags sem fechamento (mais comum em OFX)
  const openTagRegex = new RegExp(`<${tag}>(.*)`, "i");
  const openMatch = line.match(openTagRegex);
  if (openMatch) {
    return openMatch[1].trim();
  }

  return "";
}

function parseOFXDate(dateStr: string): Date {
  try {
    // Remove timezone e outros caracteres especiais
    const cleanDate = dateStr.replace(/\[.*?\]/g, "").replace(/[^0-9]/g, "");

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

      const date = new Date(year, month, day, hour, minute, second);

      // Valida se a data é válida
      if (isNaN(date.getTime())) {
        throw new Error(`Data inválida gerada: ${year}-${month + 1}-${day}`);
      }

      return date;
    }

    throw new Error(`Formato de data inválido: ${dateStr}`);
  } catch (error) {
    console.error("Erro ao fazer parse da data:", dateStr, error);
    throw new Error(`Data inválida no OFX: ${dateStr}`);
  }
}

function parseTransactionField(
  line: string,
  transaction: Partial<OFXTransaction>
) {
  if (line.includes("<TRNAMT>")) {
    const amountStr = extractValue(line, "TRNAMT");
    if (amountStr) {
      transaction.amount = parseFloat(amountStr);
    }
  } else if (line.includes("<DTPOSTED>")) {
    const dateStr = extractValue(line, "DTPOSTED");
    if (dateStr) {
      try {
        transaction.date = parseOFXDate(dateStr);
      } catch (error) {
        console.error("Erro ao processar data da transação:", dateStr, error);
      }
    }
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
  const isValid = !!(
    transaction.id &&
    transaction.date &&
    transaction.amount !== undefined &&
    transaction.description &&
    transaction.type
  );

  if (!isValid) {
    console.log("Transação inválida:", {
      hasId: !!transaction.id,
      hasDate: !!transaction.date,
      hasAmount: transaction.amount !== undefined,
      hasDescription: !!transaction.description,
      hasType: !!transaction.type,
      transaction,
    });
  }

  return isValid;
}

export function generateFileHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

// Utilitário para categorizar transações automaticamente
export function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase();

  if (desc.includes("pix") || desc.includes("ted") || desc.includes("doc")) {
    return "TRANSFERENCIA";
  }

  if (
    desc.includes("cartao") ||
    desc.includes("card") ||
    desc.includes("credito") ||
    desc.includes("debito")
  ) {
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
    desc.includes("fee") ||
    desc.includes("fatura")
  ) {
    return "TARIFA";
  }

  if (
    desc.includes("juros") ||
    desc.includes("interest") ||
    desc.includes("rendimento")
  ) {
    return "JUROS";
  }

  if (desc.includes("antecipacao") || desc.includes("antec")) {
    return "ANTECIPACAO";
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
