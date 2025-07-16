// components/ui/enhanced-data-table.tsx
// Extensão do ModernDataTable com funcionalidades específicas para transações

import React from 'react';
import { MoreHorizontal, ArrowUpDown, ChevronDown, Filter, Search, Plus } from 'lucide-react';
import { ColumnConfig, TableDataItem } from '~/components/data-table/data-table';
import { SearchInput } from '~/components/search-input/search-input';


// Props estendidas para seleção múltipla
interface EnhancedDataTableProps<T extends TableDataItem> {
  data: T[];
  columns: EnhancedColumnConfig<T>[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  searchable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  onRowClick?: (item: T) => void;
  className?: string;
  itemsPerPage?: number;
  // Funcionalidades de seleção
  selectable?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  bulkActions?: React.ReactNode;
}

// Column configuration estendida para checkbox
interface EnhancedColumnConfig<T = any> extends ColumnConfig<T> {
  type?: 'text' | 'status' | 'user' | 'custom' | 'checkbox';
}

// Sort configuration
interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc';
}

// Componentes de tabela customizados
const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`w-full overflow-auto ${className}`}>
    <table className="w-full caption-bottom text-sm">
      {children}
    </table>
  </div>
);

const TableHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="[&_tr]:border-b">{children}</thead>
);

const TableBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="[&_tr:last-child]:border-0">{children}</tbody>
);

const TableRow: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <tr
    className={`border-b border-gray-100 transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-muted ${className}`}
    onClick={onClick}
  >
    {children}
  </tr>
);

const TableHead: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <th
    className={`h-12 px-4 text-left align-middle font-medium text-gray-600 [&:has([role=checkbox])]:pr-0 ${className}`}
    onClick={onClick}
  >
    {children}
  </th>
);

const TableCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </td>
);

export function EnhancedDataTable<T extends TableDataItem>({
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  bulkActions,
  columns,
  data = [],
  title,
  subtitle,
  actions,
  searchable = true,
  filterable = true,
  sortable = true,
  pagination = true,
  onRowClick,
  className = "",
  itemsPerPage = 10
}: EnhancedDataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    column: null,
    direction: "asc"
  });
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  // Handlers para seleção
  const handleItemSelection = React.useCallback((itemId: string, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedItems, itemId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== itemId));
    }
  }, [selectedItems, onSelectionChange]);

  const handleSelectAll = React.useCallback((checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange(data.map(item => String(item.id)));
    } else {
      onSelectionChange([]);
    }
  }, [data, onSelectionChange]);

  // Adicionar coluna de checkbox se selecionável
  const enhancedColumns: EnhancedColumnConfig<T>[] = React.useMemo(() => {
    if (!selectable) return columns;

    const checkboxColumn: EnhancedColumnConfig<T> = {
      key: '__checkbox' as keyof T,
      header: '',
      sortable: false,
      type: 'checkbox',
      className: 'w-12',
      render: (_, item) => {
        const isSelected = selectedItems.includes(String(item.id));

        return (
          <input
            type="checkbox"
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              handleItemSelection(String(item.id), e.target.checked);
            }}
          />
        );
      }
    };

    return [checkboxColumn, ...columns];
  }, [selectable, columns, selectedItems, handleItemSelection]);

  // Filter data based on search term
  const filteredData = React.useMemo((): T[] => {
    if (!searchTerm) return data;
    return data.filter((item: T) =>
      Object.values(item).some((value: any) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = React.useMemo((): T[] => {
    if (!sortConfig.column) return filteredData;

    return [...filteredData].sort((a: T, b: T) => {
      const aValue = a[sortConfig.column as keyof T];
      const bValue = b[sortConfig.column as keyof T];

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = React.useMemo((): T[] => {
    if (!pagination) return sortedData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, pagination, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (columnKey: keyof T): void => {
    if (!sortable) return;

    setSortConfig(prev => ({
      column: String(columnKey),
      direction: prev.column === String(columnKey) && prev.direction === "asc" ? "desc" : "asc"
    }));
  };

  const renderCellContent = (item: T, column: EnhancedColumnConfig<T>): React.ReactNode => {
    if (column.render) {
      return column.render(item[column.key], item);
    }

    if (column.type === 'status') {
      return <span className="status-badge">{String(item[column.key])}</span>;
    }

    if (column.type === 'user') {
      const userName = String(item[column.key]);
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
            {userName.charAt(0)?.toUpperCase() || '?'}
          </div>
          <span>{userName}</span>
        </div>
      );
    }

    return String(item[column.key]);
  };

  const handleRowClick = (item: T): void => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  const handlePageChange = (page: number): void => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Renderizar ações em lote se houver itens selecionados
  const BulkActionsBar = React.useMemo(() => {
    if (!selectable || selectedItems.length === 0 || !bulkActions) return null;

    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-indigo-900">
            {selectedItems.length} item(s) selecionado(s)
          </span>
          <div className="flex items-center gap-2">
            {bulkActions}
            <button
              onClick={() => onSelectionChange?.([])}
              className="text-indigo-700 hover:text-indigo-900 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }, [selectable, selectedItems, bulkActions, onSelectionChange]);

  // Header checkbox para selecionar todos
  const isAllSelected = data.length > 0 && selectedItems.length === data.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < data.length;

  return (
    <div className={className}>
      {BulkActionsBar}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-xl font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-3">
              {searchable && (
                <SearchInput
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                />
              )}

              {filterable && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <Filter className="w-4 h-4" />
                  Filter
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}

              {actions}
            </div>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              {enhancedColumns.map((column: EnhancedColumnConfig<T>) => (
                <TableHead
                  key={String(column.key)}
                  className={`${sortable && column.sortable !== false ? "cursor-pointer hover:bg-gray-50" : ""} ${column.className || ""}`}
                  onClick={() => {
                    if (column.key === '__checkbox') return;
                    if (sortable && column.sortable !== false) handleSort(column.key);
                  }}
                >
                  {column.key === '__checkbox' && selectable ? (
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {column.header}
                      {sortable && column.sortable !== false && column.key !== '__checkbox' && (
                        <ArrowUpDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  )}
                </TableHead>
              ))}
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" style={{ gridColumn: `1 / ${enhancedColumns.length + 2}` }}>
                  <div className="text-gray-500">Nenhum item encontrado</div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item: T) => (
                <TableRow
                  key={item.id}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => handleRowClick(item)}
                >
                  {enhancedColumns.map((column: EnhancedColumnConfig<T>) => (
                    <TableCell key={String(column.key)} className={column.className || ""}>
                      {renderCellContent(item, column)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm rounded-md ${currentPage === page
                      ? "bg-indigo-600 text-white"
                      : "text-gray-600 border border-gray-300 hover:bg-gray-50"
                      }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Hook personalizado para gerenciar seleção
function useTableSelection<T extends TableDataItem>(items: T[]) {
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);

  const handleSelectionChange = React.useCallback((selectedIds: string[]) => {
    setSelectedItems(selectedIds);
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedItems([]);
  }, []);

  const getSelectedObjects = React.useCallback(() => {
    return items.filter(item => selectedItems.includes(String(item.id)));
  }, [items, selectedItems]);

  return {
    selectedItems,
    handleSelectionChange,
    clearSelection,
    getSelectedObjects,
    hasSelection: selectedItems.length > 0,
    selectionCount: selectedItems.length
  };
}

export type { EnhancedDataTableProps, EnhancedColumnConfig };
export { useTableSelection };