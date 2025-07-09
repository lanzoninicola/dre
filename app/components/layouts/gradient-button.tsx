// components/ui/GradientButton.tsx
import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

export function GradientButton({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  iconPosition = "right",
  disabled,
  ...props
}: GradientButtonProps) {
  const baseClasses = "font-semibold rounded-xl transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2";

  const variants = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]",
    secondary: "bg-white/60 backdrop-blur-sm border border-gray-200 hover:bg-white hover:border-indigo-300 text-gray-700 shadow-sm hover:shadow-md transform hover:scale-[1.01]",
    ghost: "bg-transparent hover:bg-white/30 text-gray-600 hover:text-gray-800"
  };

  const sizes = {
    sm: "h-10 px-4 text-sm",
    md: "h-12 px-6",
    lg: "h-14 px-8 text-lg"
  };

  return (
    <button
      className={cn(baseClasses, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Carregando...
        </>
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          {children}
          {icon && iconPosition === "right" && (
            <span className="group-hover:translate-x-1 transition-transform duration-200">
              {icon}
            </span>
          )}
        </>
      )}
    </button>
  );
}