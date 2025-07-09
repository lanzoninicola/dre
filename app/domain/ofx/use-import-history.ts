import { useState, useCallback } from "react";

// Hook adicional para histórico de importações
export function useImportHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/import-history");
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteImport = useCallback(
    async (importId: string) => {
      try {
        await fetch(`/api/import-history/${importId}`, {
          method: "DELETE",
        });
        await fetchHistory(); // Recarregar lista
      } catch (error) {
        console.error("Erro ao deletar importação:", error);
      }
    },
    [fetchHistory]
  );

  return {
    history,
    loading,
    fetchHistory,
    deleteImport,
  };
}
