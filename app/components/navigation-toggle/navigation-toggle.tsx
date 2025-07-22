import { Link, useLocation } from '@remix-run/react';
import { LucideIcon } from 'lucide-react';

interface NavigationOption<T extends string> {
  value: T;
  label: string;
  path: string;
  icon?: LucideIcon;
  shortLabel?: string;
}

interface NavigationToggleProps<T extends string> {
  options: NavigationOption<T>[];
  className?: string;
  activePathMatcher?: (currentPath: string, optionPath: string) => boolean;
}

export const NavigationToggle = <T extends string>({
  options,
  className = '',
  activePathMatcher
}: NavigationToggleProps<T>) => {
  const location = useLocation();

  // Função padrão para determinar se uma opção está ativa
  const defaultMatcher = (currentPath: string, optionPath: string) => {
    // Exact match para paths iguais
    if (currentPath === optionPath) return true;

    // Para paths base, verifica se é a raiz e não tem subpaths
    if (optionPath.endsWith('/') || !optionPath.includes('/', 1)) {
      return currentPath === optionPath || currentPath === optionPath.replace(/\/$/, '');
    }

    return false;
  };

  const isActive = (optionPath: string) => {
    const matcher = activePathMatcher || defaultMatcher;
    return matcher(location.pathname, optionPath);
  };

  return (
    <div className={`flex bg-gray-100 rounded-lg p-1 ${className}`}>
      {options.map((option) => {
        const IconComponent = option.icon;
        const active = isActive(option.path);

        return (
          <Link
            key={option.value}
            to={option.path}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${active
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {IconComponent && <IconComponent className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {option.label}
            </span>
            {option.shortLabel && (
              <span className="sm:hidden">
                {option.shortLabel}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};