// components/ui/StatCard.tsx
import { ReactNode } from "react";
import { GlassCard } from "./glass-card";
import { cn } from "~/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "indigo" | "purple" | "green" | "yellow" | "red";
}

export function StatCard({ title, value, subtitle, icon, trend, color = "indigo" }: StatCardProps) {
  const colorClasses = {
    indigo: "text-indigo-600",
    purple: "text-purple-600",
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600"
  };

  return (
    <GlassCard variant="stat" hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={cn("text-2xl font-bold mb-1", colorClasses[color])}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className={cn("p-2 rounded-lg", `bg-${color}-100`)}>
            <div className={colorClasses[color]}>
              {icon}
            </div>
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <div className="flex items-center gap-1">
            <span className={cn(
              "text-sm font-medium",
              trend.isPositive ? "text-green-600" : "text-red-600"
            )}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-sm text-gray-500">vs mês anterior</span>
          </div>
        </div>
      )}
    </GlassCard>
  );
}