// components/ui/GlassInput.tsx
import { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export function GlassInput({
  label,
  error,
  helperText,
  icon,
  iconPosition = "left",
  className,
  id,
  ...props
}: GlassInputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1">
      {label && (
        <Label htmlFor={inputId} className="text-sm font-medium text-gray-700 ml-1">
          {label}
        </Label>
      )}

      <div className="relative">
        {icon && iconPosition === "left" && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            "h-12 w-full border border-gray-200 rounded-xl bg-white/50 backdrop-blur-sm focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200",
            icon && iconPosition === "left" ? "pl-10 pr-4" : "px-4",
            icon && iconPosition === "right" ? "pr-10" : "",
            error && "border-red-300 focus:border-red-400 focus:ring-red-100",
            className
          )}
          {...props}
        />

        {icon && iconPosition === "right" && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 ml-1">{error}</p>
      )}

      {helperText && !error && (
        <p className="text-sm text-gray-500 ml-1">{helperText}</p>
      )}
    </div>
  );
}
