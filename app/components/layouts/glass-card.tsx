// components/ui/GlassCard.tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "stat";
  hover?: boolean;
}

export function GlassCard({ children, className, variant = "primary", hover = false }: GlassCardProps) {
  const baseClasses = "border border-white/20 transition-all duration-200";

  const variants = {
    primary: "bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl",
    secondary: "bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg",
    stat: "bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-sm"
  };

  const hoverClasses = hover ? "hover:shadow-xl hover:scale-[1.02]" : "";

  return (
    <div className={cn(baseClasses, variants[variant], hoverClasses, className)}>
      {children}
    </div>
  );
}






