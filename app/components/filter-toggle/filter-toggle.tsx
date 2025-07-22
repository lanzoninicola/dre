import { LucideIcon, Grid3X3, List, DollarSign, BarChart3, Shield } from 'lucide-react';

interface FilterOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
  shortLabel?: string; // Label para telas pequenas
}

interface FilterToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: FilterOption<T>[];
  className?: string;
}

export const FilterToggle = <T extends string>({
  value,
  onChange,
  options,
  className = ''
}: FilterToggleProps<T>) => {
  return (
    <div className={`flex bg-gray-100 rounded-lg p-1 ${className}`}>
      {options.map((option) => {
        const IconComponent = option.icon;
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${isActive
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
          </button>
        );
      })}
    </div>
  );
};