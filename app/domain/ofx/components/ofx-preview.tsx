// app/domain/ofx/components/ofx-preview.tsx
import { useState, useMemo } from "react";
import {
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Download,
  Eye,
  EyeOff
} from "lucide-react";
import formatDate from "~/utils/format-date";

interface Transaction {
  id: string;
  date: string | Date;
  description: string;
  amount: number;
  type?: string;
  memo?: string;
  checkNumber?: string;
  referenceNumber?: string;
}

interface Report {
  totalTransactions: number;
  duplicatesFound: number;
  uniqueTransactions: number;
  totalAmount: number;
  dateRange: {
    start: string;
    end: string;
  };
}

interface OFXPreviewProps {
  transactions: Transaction[];
  report: Report;
  onConfirm: (selectedTransactionIds: string[]) => void;
  onCancel: () => void;
  loading?: boolean;
}



// Função para formatar valor monetário
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);
}

// Componente para o card de estatísticas do relatório
function ReportStatsCard({ report }: { report: Report }) {
  return (
    <div className="card-default p-6 mb-8">
      <h3 className="text-heading-3 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-indigo-600" />
        Resumo da Importação
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card-stat">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-small">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{report.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="card-stat">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-small">Únicas</p>
              <p className="text-2xl font-semibold text-gray-900">{report.uniqueTransactions}</p>
            </div>
          </div>
        </div>

        <div className="card-stat">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-small">Duplicadas</p>
              <p className="text-2xl font-semibold text-gray-900">{report.duplicatesFound}</p>
            </div>
          </div>
        </div>

        <div className="card-stat">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-small">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(report.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {report.dateRange && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600 flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Período: {formatDate(report.dateRange.start)} até {formatDate(report.dateRange.end)}
          </p>
        </div>
      )}
    </div>
  );
}

// Componente para linha da transação
function TransactionRow({
  transaction,
  isSelected,
  onToggle
}: {
  transaction: Transaction;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}>
      <td className="py-3 px-6">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(transaction.id)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
      </td>
      <td className="py-3 px-6 text-body">
        {formatDate(transaction.date)}
      </td>
      <td className="py-3 px-6 text-body max-w-xs">
        <div className="truncate">
          {transaction.description}
        </div>
      </td>
      <td className="py-3 px-6 text-right">
        <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(transaction.amount)}
        </span>
      </td>
      <td className="py-3 px-6 text-body">
        {transaction.type || '-'}
      </td>
      <td className="py-3 px-6 text-body max-w-xs">
        <div className="truncate">
          {transaction.memo || '-'}
        </div>
      </td>
    </tr>
  );
}

// Componente principal
export function OFXPreview({
  transactions,
  report,
  onConfirm,
  onCancel,
  loading = false
}: OFXPreviewProps) {
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set(transactions.map(t => t.id))
  );
  const [showAll, setShowAll] = useState(false);

  // Filtrar transações para exibição
  const displayTransactions = useMemo(() => {
    if (showAll) return transactions;
    return transactions.slice(0, 10);
  }, [transactions, showAll]);

  // Funções para gerenciar seleção
  const toggleTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAll = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map(t => t.id)));
    }
  };

  const handleConfirm = () => {
    const selectedIds = Array.from(selectedTransactions);
    onConfirm(selectedIds);
  };

  // Calcular estatísticas das transações selecionadas
  const selectedStats = useMemo(() => {
    const selectedTxs = transactions.filter(t => selectedTransactions.has(t.id));
    const totalAmount = selectedTxs.reduce((sum, t) => sum + t.amount, 0);
    return {
      count: selectedTxs.length,
      totalAmount
    };
  }, [transactions, selectedTransactions]);

  const isAllSelected = selectedTransactions.size === transactions.length;
  const isIndeterminate = selectedTransactions.size > 0 && selectedTransactions.size < transactions.length;

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-heading-1">Preview da Importação</h1>
              <p className="text-muted mt-2">
                Revise as transações antes de confirmar a importação
              </p>
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              className="btn-secondary flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <ReportStatsCard report={report} />

        {/* Transações */}
        <div className="card-default">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-heading-3">
                Transações ({transactions.length})
              </h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="btn-ghost flex items-center text-sm"
                >
                  {showAll ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-1" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      Mostrar todas
                    </>
                  )}
                </button>
                <span className="text-small">
                  {selectedStats.count} selecionadas - {formatCurrency(selectedStats.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left text-small font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={toggleAll}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="py-3 px-6 text-left text-small font-medium text-gray-700">
                    Data
                  </th>
                  <th className="py-3 px-6 text-left text-small font-medium text-gray-700">
                    Descrição
                  </th>
                  <th className="py-3 px-6 text-right text-small font-medium text-gray-700">
                    Valor
                  </th>
                  <th className="py-3 px-6 text-left text-small font-medium text-gray-700">
                    Tipo
                  </th>
                  <th className="py-3 px-6 text-left text-small font-medium text-gray-700">
                    Memo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    isSelected={selectedTransactions.has(transaction.id)}
                    onToggle={toggleTransaction}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {!showAll && transactions.length > 10 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
              <p className="text-small">
                Mostrando 10 de {transactions.length} transações.{' '}
                <button
                  onClick={() => setShowAll(true)}
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Ver todas
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="mt-8 flex items-center justify-end space-x-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || selectedTransactions.size === 0}
            className="btn-primary flex items-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Confirmar Importação ({selectedStats.count})
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}