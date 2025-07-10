// app/domain/ofx/components/ofx-preview.tsx
import { useState, useMemo } from "react";
import {
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Download,
  Eye,
  EyeOff
} from "lucide-react";

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

// Função para formatar data de forma segura
function formatDateSafe(date: string | Date | null | undefined): string {
  if (!date) return 'Data inválida';

  try {
    let dateObj: Date;

    if (typeof date === 'string') {
      // Se for string, tenta parsear
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    // Verifica se a data é válida
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida';
    }

    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
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
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-indigo-600" />
        Resumo da Importação
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Total</p>
              <p className="text-lg font-bold text-blue-900">{report.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-4 border border-green-200/50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Únicas</p>
              <p className="text-lg font-bold text-green-900">{report.uniqueTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50/80 backdrop-blur-sm rounded-xl p-4 border border-yellow-200/50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">Duplicadas</p>
              <p className="text-lg font-bold text-yellow-900">{report.duplicatesFound}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-800">Total</p>
              <p className="text-lg font-bold text-purple-900">{formatCurrency(report.totalAmount)}</p>
            </div>
          </div>
        </div>
      </div>

      {report.dateRange && (
        <div className="mt-4 p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
          <p className="text-sm text-gray-600">
            <Calendar className="w-4 h-4 inline mr-1" />
            Período: {formatDateSafe(report.dateRange.start)} até {formatDateSafe(report.dateRange.end)}
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
    <tr className={`hover:bg-gray-50/50 transition-colors duration-200 ${isSelected ? 'bg-indigo-50/50' : ''}`}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(transaction.id)}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        />
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatDateSafe(transaction.date)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
        {transaction.description}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        <span className={`font-medium ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(transaction.amount)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {transaction.type || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
        {transaction.memo || '-'}
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

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full animate-pulse-decoration"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full animate-pulse-decoration"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Preview da Importação</h1>
              <p className="mt-2 text-gray-600">
                Revise as transações antes de confirmar a importação
              </p>
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <ReportStatsCard report={report} />

        {/* Transações */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Transações ({transactions.length})
              </h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
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
                <span className="text-sm text-gray-500">
                  {selectedStats.count} selecionadas - {formatCurrency(selectedStats.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200/50">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.size === transactions.length}
                      onChange={toggleAll}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Memo
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/30 divide-y divide-gray-200/50">
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
            <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-200/50 text-center">
              <p className="text-sm text-gray-500">
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
            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || selectedTransactions.size === 0}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
      </div>
    </div>
  );
}