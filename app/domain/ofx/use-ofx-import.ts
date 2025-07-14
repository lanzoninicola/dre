import { useState, useCallback } from "react";
import {
  parseOFX,
  validateOFXFile,
  detectDuplicateTransactions,
  generateImportReport,
} from "./ofx-parser.server";
import type {
  OFXTransaction,
  ImportReport,
  OFXParseResult,
} from "./ofx-parser.server";

interface ImportState {
  step: "idle" | "parsing" | "preview" | "importing" | "success" | "error";
  transactions: OFXTransaction[];
  report: ImportReport | null;
  error: string | null;
  warnings: string[];
  file: File | null;
  companyId: string;
}

interface UseOFXImportReturn {
  state: ImportState;
  parseFile: (file: File) => Promise<void>;
  confirmImport: (selectedTransactionIds: string[]) => Promise<void>;
  resetImport: () => void;
  setCompanyId: (companyId: string) => void;
}

export function useOFXImport(): UseOFXImportReturn {
  const [state, setState] = useState<ImportState>({
    step: "idle",
    transactions: [],
    report: null,
    error: null,
    warnings: [],
    file: null,
    companyId: "",
  });

  const parseFile = useCallback(async (file: File) => {
    setState((prev) => ({
      ...prev,
      step: "parsing",
      error: null,
      warnings: [],
    }));

    try {
      // Validar arquivo
      const validation = validateOFXFile(file);
      if (!validation.valid) {
        setState((prev) => ({
          ...prev,
          step: "error",
          error: validation.error!,
        }));
        return;
      }

      // Ler conteúdo do arquivo
      const content = await file.text();

      // Parse do OFX
      const parseResult: OFXParseResult = parseOFX(content);

      if (!parseResult.success) {
        setState((prev) => ({
          ...prev,
          step: "error",
          error: parseResult.error!,
        }));
        return;
      }

      const { data, warnings = [] } = parseResult;

      // Detectar e remover duplicatas
      const uniqueTransactions = detectDuplicateTransactions(
        data!.transactions
      );
      const duplicatesRemoved =
        data!.transactions.length - uniqueTransactions.length;

      // Gerar relatório
      const report = generateImportReport(uniqueTransactions);
      report.duplicatesRemoved = duplicatesRemoved;

      setState((prev) => ({
        ...prev,
        step: "preview",
        transactions: uniqueTransactions,
        report,
        warnings,
        file,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        step: "error",
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao processar arquivo",
      }));
    }
  }, []);

  const confirmImport = useCallback(
    async (selectedTransactionIds: string[]) => {
      if (!state.file || !state.companyId) {
        setState((prev) => ({
          ...prev,
          step: "error",
          error: "Arquivo e empresa são obrigatórios",
        }));
        return;
      }

      setState((prev) => ({ ...prev, step: "importing" }));

      try {
        const formData = new FormData();
        formData.append("ofxFile", state.file);
        formData.append("companyId", state.companyId);
        formData.append(
          "selectedTransactions",
          JSON.stringify(selectedTransactionIds)
        );

        const response = await fetch("/home/import", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erro ao importar transações");
        }

        setState((prev) => ({
          ...prev,
          step: "success",
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          step: "error",
          error:
            error instanceof Error
              ? error.message
              : "Erro ao importar transações",
        }));
      }
    },
    [state.file, state.companyId]
  );

  const resetImport = useCallback(() => {
    setState({
      step: "idle",
      transactions: [],
      report: null,
      error: null,
      warnings: [],
      file: null,
      companyId: "",
    });
  }, []);

  const setCompanyId = useCallback((companyId: string) => {
    setState((prev) => ({ ...prev, companyId }));
  }, []);

  return {
    state,
    parseFile,
    confirmImport,
    resetImport,
    setCompanyId,
  };
}
