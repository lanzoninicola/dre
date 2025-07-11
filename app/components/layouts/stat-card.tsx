// app/components/layouts/stat-card.tsx
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
  color?: "default" | "green" | "red" | "blue" | "yellow";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "default"
}: StatCardProps) {
  // Only apply color to icons and trend indicators - keep main content neutral
  const iconColors = {
    default: "text-gray-500 bg-gray-100",
    green: "text-green-600 bg-green-100",
    red: "text-red-600 bg-red-100",
    blue: "text-blue-600 bg-blue-100",
    yellow: "text-yellow-600 bg-yellow-100"
  };

  return (
    <GlassCard variant="stat" hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className={cn(
            "p-2 rounded-lg",
            iconColors[color]
          )}>
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 pt-4 border-t border-gray-200">
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