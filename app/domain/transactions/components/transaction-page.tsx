// components/TransactionsPage.tsx

import React, { useState, useMemo } from 'react';
import { Link } from '@remix-run/react';
import {
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Edit3,
  X,
  TrendingUp,
  TrendingDown,
  FileText,
  Tag,
  Clock,
  CheckCircle2,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { AccountPlan, BankTransaction, Company, Pagination, TransactionFilters, User } from '../transactions.types';

import { calculateTransactionStats, formatCurrency, getTransactionStatus } from '../transactions.utils';
import { useTableSelection, EnhancedColumnConfig, EnhancedDataTable } from './enhanced-data-table';
import formatDate from '~/utils/format-date';

// Importar o componente de tabela melhorado


interface TransactionsPageProps {
  transactions: BankTransaction[];
  accounts: AccountPlan[];
  company: Company;
  user: User;
  pagination: Pagination;
  onClassifyTransaction: (transactionId: string, accountId: string, notes?: string) => void;
  onBulkClassify: (transactionIds: string[], accountId: string) => void;
  onReconcileTransaction: (transactionId: string) => void;
  onUpdateFilters: (filters: Partial<TransactionFilters>) => void;
}

// Interface para adapter da tabela
interface TransactionTableItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  account: string;
  status: string;
  actions: string;
  // Dados originais para acesso nos handlers
  _original: BankTransaction;
}

export function TransactionsPage({
  transactions,
  accounts,
  company,
  user,
  pagination,
  onClassifyTransaction,
  onBulkClassify,
  onReconcileTransaction,
  onUpdateFilters
}: TransactionsPageProps) {
  // Estados locais
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    dateFrom: '',
    dateTo: '',
    accountId: '',
    isClassified: '',
    isReconciled: '',
    transactionType: ''
  });

  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Estados do modal de classificação
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [transactionNotes, setTransactionNotes] = useState('');

  // Transformar dados para a tabela
  const tableData: TransactionTableItem[] = useMemo(() => {
    return transactions.map(transaction => ({
      id: transaction.id,
      date: formatDate(transaction.date),
      description: transaction.description,
      amount: transaction.amount,
      account: transaction.account?.name || 'Não classificado',
      status: transaction.isReconciled ? 'done' : transaction.isClassified ? 'in-progress' : 'pending',
      actions: 'actions',
      _original: transaction
    }));
  }, [transactions]);

  // Hook para gerenciar seleção da tabela
  const {
    selectedItems,
    handleSelectionChange,
    clearSelection,
    getSelectedObjects,
    hasSelection,
    selectionCount
  } = useTableSelection(tableData);

  // Estatísticas calculadas
  const stats = useMemo(() => calculateTransactionStats(transactions), [transactions]);

  // Configuração das colunas da tabela
  const columns: EnhancedColumnConfig<TransactionTableItem>[] = [
    {
      key: 'date',
      header: 'Data',
      sortable: true,
      type: 'text'
    },
    {
      key: 'description',
      header: 'Descrição',
      sortable: true,
      type: 'custom',
      render: (value, item) => (
        <div>
          <p className="font-medium text-gray-900">{value}</p>
          {item._original.documentNumber && (
            <p className="text-sm text-gray-500">Doc: {item._original.documentNumber}</p>
          )}
          {item._original.notes && (
            <p className="text-sm text-gray-600 mt-1">{item._original.notes}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Extrato: {item._original.statement.fileName}
          </p>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Valor',
      sortable: true,
      type: 'custom',
      className: 'text-right',
      render: (value) => (
        <span className={`font-medium ${value >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'account',
      header: 'Conta',
      sortable: true,
      type: 'custom',
      render: (value, item) => {
        const account = item._original.account;
        const classifiedBy = item._original.classifiedBy;

        if (account) {
          return (
            <div>
              <p className="font-medium text-gray-900">{account.name}</p>
              {account.code && (
                <p className="text-sm text-gray-500">{account.code}</p>
              )}
              {account.dreGroup && (
                <p className="text-xs text-gray-400">{account.dreGroup.name}</p>
              )}
              {classifiedBy && (
                <p className="text-xs text-gray-400 mt-1">
                  Por: {classifiedBy.name}
                </p>
              )}
            </div>
          );
        }

        return <span className="text-gray-400 italic">Não classificado</span>;
      }
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      type: 'custom',
      className: 'text-center',
      render: (value, item) => {
        const status = getTransactionStatus(item._original);
        const StatusIcon = status.variant === 'success' ? CheckCircle2 :
          status.variant === 'info' ? Tag : Clock;

        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Ações',
      sortable: false,
      type: 'custom',
      className: 'text-center',
      render: (value, item) => (
        <div className="flex items-center justify-center gap-2">
          <button
            className="text-gray-600 hover:text-indigo-600 p-1 rounded"
            onClick={(e) => {
              e.stopPropagation();
              handleEditTransaction(item._original);
            }}
            title="Classificar transação"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          {item._original.isClassified && !item._original.isReconciled && (
            <button
              className="text-gray-600 hover:text-green-600 p-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onReconcileTransaction(item._original.id);
              }}
              title="Reconciliar transação"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  // Handlers
  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onUpdateFilters(newFilters);
  };

  const handleEditTransaction = (transaction: BankTransaction) => {
    setEditingTransaction(transaction);
    setSelectedAccountId(transaction.account?.id || '');
    setTransactionNotes(transaction.notes || '');
  };

  const handleSaveClassification = () => {
    if (editingTransaction && selectedAccountId) {
      onClassifyTransaction(editingTransaction.id, selectedAccountId, transactionNotes);
      setEditingTransaction(null);
      setSelectedAccountId('');
      setTransactionNotes('');
    }
  };

  const handleBulkClassify = (accountId: string) => {
    if (selectedItems.length > 0 && accountId) {
      onBulkClassify(selectedItems, accountId);
      clearSelection();
    }
  };

  const handleRowClick = (item: TransactionTableItem) => {
    // Opcional: abrir modal de edição ao clicar na linha
    // handleEditTransaction(item._original);
  };

  // Ações da tabela
  const tableActions = (
    <>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`px-4 py-2 border rounded-md font-medium flex items-center gap-2 ${showFilters
          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
      >
        <Filter className="w-4 h-4" />
        Filtros
        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-md flex items-center gap-2">
        <Download className="w-4 h-4" />
        Exportar
      </button>
      <Link
        to={`/empresas/${company.id}/importar`}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-md flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Importar Extrato
      </Link>
    </>
  );

  // Ações em lote
  const bulkActions = (
    <select
      className="border border-indigo-300 rounded-md px-3 py-1 text-sm bg-white"
      onChange={(e) => {
        if (e.target.value) {
          handleBulkClassify(e.target.value);
          e.target.value = '';
        }
      }}
    >
      <option value="">Classificar em lote</option>
      {accounts.map(account => (
        <option key={account.id} value={account.id}>
          {account.code ? `${account.code} - ` : ''}{account.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Link to="/app/bank-transactions" className="hover:text-gray-900 flex items-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  Transações
                </Link>
                <span>/</span>
                <span className="text-gray-900">{company.name}</span>
              </nav>
              <h1 className="text-2xl font-semibold text-gray-900">Transações Bancárias</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-600">{company.name}</p>
                {company.cnpj && (
                  <span className="text-sm text-gray-500">CNPJ: {company.cnpj}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Transações</p>
                <p className="text-2xl font-semibold text-gray-900">{pagination.totalCount}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Entradas</p>
                <p className="text-2xl font-semibold text-green-600">{formatCurrency(stats.creditAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saídas</p>
                <p className="text-2xl font-semibold text-red-600">{formatCurrency(Math.abs(stats.debitAmount))}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros Expandidos */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filtros Avançados</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Inicial
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Final
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conta
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={filters.accountId}
                  onChange={(e) => handleFilterChange('accountId', e.target.value)}
                >
                  <option value="">Todas as contas</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.code ? `${account.code} - ` : ''}{account.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={filters.isClassified}
                  onChange={(e) => handleFilterChange('isClassified', e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="true">Classificadas</option>
                  <option value="false">Pendentes</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tabela Moderna com Seleção */}
        <EnhancedDataTable
          data={tableData}
          columns={columns}
          title="Transações"
          subtitle={`${pagination.totalCount} transações encontradas`}
          actions={tableActions}
          searchable={true}
          filterable={false} // Desabilitado pois temos filtros customizados
          sortable={true}
          pagination={false} // Usaremos a paginação server-side
          selectable={true}
          selectedItems={selectedItems}
          onSelectionChange={handleSelectionChange}
          bulkActions={bulkActions}
          onRowClick={handleRowClick}
          itemsPerPage={pagination.limit}
        />

        {/* Paginação Server-Side */}
        {pagination.totalPages > 1 && (
          <div className="bg-white border border-gray-200 rounded-lg mt-6 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{((pagination.currentPage - 1) * pagination.limit) + 1}</span> a{' '}
                <span className="font-medium">{Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)}</span> de{' '}
                <span className="font-medium">{pagination.totalCount}</span> transações
              </div>
              <div className="flex gap-2">
                {pagination.currentPage > 1 && (
                  <Link
                    to={`?${new URLSearchParams({ ...filters, page: (pagination.currentPage - 1).toString() }).toString()}`}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Anterior
                  </Link>
                )}

                <span className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-md">
                  {pagination.currentPage}
                </span>

                {pagination.currentPage < pagination.totalPages && (
                  <Link
                    to={`?${new URLSearchParams({ ...filters, page: (pagination.currentPage + 1).toString() }).toString()}`}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Próximo
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal de Classificação */}
        {editingTransaction && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Classificar Transação</h3>
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Detalhes da transação */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{editingTransaction.description}</p>
                    <p className="text-sm text-gray-600">{formatDate(editingTransaction.date)}</p>
                  </div>
                  <span className={`font-medium ${editingTransaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {formatCurrency(editingTransaction.amount)}
                  </span>
                </div>
                {editingTransaction.documentNumber && (
                  <p className="text-sm text-gray-500">Documento: {editingTransaction.documentNumber}</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conta do Plano de Contas *
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    required
                  >
                    <option value="">Selecione uma conta</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.code ? `${account.code} - ` : ''}{account.name}
                        {account.dreGroup && ` (${account.dreGroup.name})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações (opcional)
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Adicione observações sobre esta transação..."
                    value={transactionNotes}
                    onChange={(e) => setTransactionNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setEditingTransaction(null)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-4 py-2 rounded-md"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveClassification}
                    disabled={!selectedAccountId}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-md"
                  >
                    Classificar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}