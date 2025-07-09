import { ChevronDown } from "lucide-react";

interface GlassSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function GlassSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione uma opção...",
  icon,
  error,
  required = false,
  disabled = false,
  className = ""
}: GlassSelectProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Ícone à esquerda */}
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {icon}
          </div>
        )}

        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          className={`
            h-12 w-full rounded-xl border border-gray-200
            bg-white/50 backdrop-blur-sm
            focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10
            hover:bg-white/70 hover:border-gray-300
            disabled:bg-gray-50/50 disabled:text-gray-400 disabled:cursor-not-allowed
            transition-all duration-200
            text-gray-900 text-sm
            appearance-none cursor-pointer
            ${icon ? 'pl-11 pr-10' : 'px-4 pr-10'}
            ${error ? 'border-red-300 focus:border-red-400 focus:ring-red-400/10' : ''}
            ${disabled ? 'opacity-60' : ''}
          `}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Ícone do chevron */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}