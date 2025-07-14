import React from 'react';
import { MoreHorizontal, ArrowUpDown, ChevronDown, Filter, Search, Plus } from 'lucide-react';

// TypeScript Interfaces
interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

// Status types
type StatusVariant = 'in-progress' | 'done' | 'pending' | 'error' | 'default';

interface StatusBadgeProps {
  status?: string;
  variant: StatusVariant;
}

// Column configuration
interface ColumnConfig<T = any> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  type?: 'text' | 'status' | 'user' | 'custom';
  className?: string;
  render?: (value: any, item: T) => React.ReactNode;
}

// Table data item (generic)
interface TableDataItem {
  id: string | number;
  [key: string]: any;
}

// Main table props
interface ModernDataTableProps<T extends TableDataItem> {
  data: T[];
  columns: ColumnConfig<T>[];
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
}

// Sort configuration
interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc';
}

// Simulated shadcn/ui table components
const Table: React.FC<TableProps> = ({ children, className = "" }) => (
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

const TableRow: React.FC<TableRowProps> = ({ children, className = "", onClick }) => (
  <tr
    className={`border-b border-gray-100 transition-colors hover:bg-gray-50/50 data-[state=selected]:bg-muted ${className}`}
    onClick={onClick}
  >
    {children}
  </tr>
);

const TableHead: React.FC<TableHeadProps> = ({ children, className = "", onClick }) => (
  <th
    className={`h-12 px-4 text-left align-middle font-medium text-gray-600 [&:has([role=checkbox])]:pr-0 ${className}`}
    onClick={onClick}
  >
    {children}
  </th>
);

const TableCell: React.FC<TableCellProps> = ({ children, className = "" }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </td>
);

// Status Badge Component
const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = "default" }) => {
  const variants: Record<StatusVariant, string> = {
    "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
    "done": "bg-green-50 text-green-700 border-green-200",
    "pending": "bg-yellow-50 text-yellow-700 border-yellow-200",
    "error": "bg-red-50 text-red-700 border-red-200",
    "default": "bg-gray-50 text-gray-700 border-gray-200"
  };

  const statusText: Record<StatusVariant, string> = {
    "in-progress": "In Progress",
    "done": "Done",
    "pending": "Pending",
    "error": "Error",
    "default": "Default"
  };

  const getDotColor = (variant: StatusVariant): string => {
    const colors: Record<StatusVariant, string> = {
      'in-progress': 'bg-blue-500',
      'done': 'bg-green-500',
      'pending': 'bg-yellow-500',
      'error': 'bg-red-500',
      'default': 'bg-gray-500'
    };
    return colors[variant];
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${variants[variant]}`}>
      <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getDotColor(variant)}`} />
      {statusText[variant] || status}
    </span>
  );
};

// Modern Data Table Component
const ModernDataTable = <T extends TableDataItem>({
  data = [],
  columns = [],
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
}: ModernDataTableProps<T>): React.ReactElement => {
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({
    column: null,
    direction: "asc"
  });
  const [currentPage, setCurrentPage] = React.useState<number>(1);

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

  const renderCellContent = (item: T, column: ColumnConfig<T>): React.ReactNode => {
    if (column.render) {
      return column.render(item[column.key], item);
    }

    if (column.type === 'status') {
      return <StatusBadge variant={item[column.key] as StatusVariant} status={String(item[column.key])} />;
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

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            {title && <h3 className="text-xl font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {searchable && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
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
            {columns.map((column: ColumnConfig<T>) => (
              <TableHead
                key={String(column.key)}
                className={sortable && column.sortable !== false ? "cursor-pointer hover:bg-gray-50" : ""}
                onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {sortable && column.sortable !== false && (
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </TableHead>
            ))}
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedData.map((item: T) => (
            <TableRow
              key={item.id}
              className={onRowClick ? "cursor-pointer" : ""}
              onClick={() => handleRowClick(item)}
            >
              {columns.map((column: ColumnConfig<T>) => (
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
          ))}
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

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page: number) => (
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
            ))}

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
  );
};

// Example interfaces for typed usage
interface ProjectSection {
  id: number;
  header: string;
  sectionType: string;
  status: StatusVariant;
  target: number;
  limit: number;
  reviewer: string;
}

interface TransactionItem {
  id: number;
  data: string;
  descricao: string;
  valor: number;
  conta: string;
  status: StatusVariant;
}


export { ModernDataTable, StatusBadge };
export type {
  ModernDataTableProps,
  ColumnConfig,
  TableDataItem,
  StatusVariant,
  ProjectSection,
  TransactionItem
};