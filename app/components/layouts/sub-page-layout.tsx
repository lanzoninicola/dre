import React, { ReactNode } from 'react';
import { Link } from '@remix-run/react';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { SearchInput } from '../search-input/search-input';


export interface ActionButton {
  to?: string;
  onClick?: () => void;
  icon: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
}

export interface SearchFilter {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface SelectFilter {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
}

export interface SubpageLayoutProps {
  // Navegação
  backTo: string;
  title: string;

  // Ações do header
  actions?: ActionButton[];

  // Sistema de busca
  searchConfig?: {
    searchFilter?: SearchFilter;
    selectFilter?: SelectFilter;
    additionalFilters?: ReactNode;
  };

  // Controle de visibilidade da busca
  showSearch?: boolean;
  onToggleSearch?: () => void;

  // Conteúdo da página
  children: ReactNode;

  // Classes customizadas
  className?: string;
  headerClassName?: string;
}

export function SubpageLayout({
  backTo,
  title,
  actions = [],
  searchConfig,
  showSearch = false,
  onToggleSearch,
  children,
  className = "",
  headerClassName = ""
}: SubpageLayoutProps) {
  const hasSearchConfig = searchConfig && (searchConfig.searchFilter || searchConfig.selectFilter || searchConfig.additionalFilters);

  return (
    <div className={`max-w-7xl mx-auto mb-6 flex flex-col gap-2 ${className}`}>
      {/* Header Principal */}
      <div className={`flex items-center justify-between ${headerClassName}`}>
        {/* Lado Esquerdo: Navegação e Título */}
        <div className="flex items-center gap-4">
          <Link
            to={backTo}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-xl font-semibold text-gray-900">
            {title}
          </h1>
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex items-center gap-4">
          {/* Botão de busca se há configuração de busca */}
          {hasSearchConfig && (
            <Button
              variant="outline"
              onClick={onToggleSearch}
              className="flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Buscar
            </Button>
          )}

          {/* Ações customizadas */}
          {actions.map((action, index) => (
            <ActionButton key={index} {...action} />
          ))}
        </div>
      </div>

      {/* Filtros de Busca (condicionalmente renderizados) */}
      {hasSearchConfig && showSearch && (
        <div className="flex justify-between items-center mt-4 transition-all duration-200">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {/* Campo de busca */}
            {searchConfig.searchFilter && (
              <div className="flex-1">
                <SearchInput {...searchConfig.searchFilter} />
              </div>
            )}

            {/* Filtros adicionais */}
            <div className="flex gap-4">
              {/* Select Filter */}
              {searchConfig.selectFilter && (
                <select
                  value={searchConfig.selectFilter.value}
                  onChange={searchConfig.selectFilter.onChange}
                  className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {searchConfig.selectFilter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Filtros customizados adicionais */}
              {searchConfig.additionalFilters}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Página */}
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}

// Componente auxiliar para botões de ação
function ActionButton({ to, onClick, icon, children, variant = 'default' }: ActionButton) {
  const buttonContent = (
    <>
      {icon}
      {children}
    </>
  );

  if (to) {
    return (
      <Button asChild variant={variant}>
        <Link to={to} className="flex items-center gap-2">
          {buttonContent}
        </Link>
      </Button>
    );
  }

  return (
    <Button onClick={onClick} variant={variant} className="flex items-center gap-2">
      {buttonContent}
    </Button>
  );
}

// Hook personalizado para gerenciar estado de busca
export function useSubpageSearch() {
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchTerm("");
    }
  };

  return {
    showSearch,
    searchTerm,
    setSearchTerm,
    toggleSearch
  };
}