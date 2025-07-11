// app/components/layouts/glass-card.tsx
import { ReactNode } from "react";
import { cn } from "~/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "stat";
  hover?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = "default",
  hover = false
}: GlassCardProps) {
  const baseClasses = "transition-all duration-200";

  const variants = {
    default: "bg-white border border-gray-200 rounded-lg shadow-sm",
    secondary: "bg-gray-50 border border-gray-200 rounded-lg shadow-sm",
    stat: "bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
  };

  const hoverClasses = hover ? "hover:shadow-md hover:border-gray-300" : "";

  return (
    <div className={cn(baseClasses, variants[variant], hoverClasses, className)}>
      {children}
    </div>
  );
}