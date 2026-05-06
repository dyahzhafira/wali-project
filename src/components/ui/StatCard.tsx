"use client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "./cn";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color?: "wali" | "red" | "yellow" | "green" | "blue" | "gray";
  className?: string;
}

const iconColors: Record<string, string> = {
  wali: "bg-wali-100 text-wali-700",
  red: "bg-red-100 text-red-700",
  yellow: "bg-yellow-100 text-yellow-700",
  green: "bg-green-100 text-green-700",
  blue: "bg-blue-100 text-blue-700",
  gray: "bg-gray-100 text-gray-700",
};

export function StatCard({ title, value, subtitle, icon, trend, color = "wali", className }: StatCardProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-gray-500 leading-snug">{title}</p>
        {icon && <span className={cn("shrink-0 rounded-lg p-2 flex items-center justify-center", iconColors[color])}>{icon}</span>}
      </div>
      <div className="flex items-end justify-between gap-2">
        <p className="text-3xl font-bold text-gray-900 tabular-nums leading-none">{value}</p>
        {trend && (
          <div className={cn("flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-0.5", trend.positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
            {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      {subtitle && <p className="text-xs text-gray-400 leading-snug">{subtitle}</p>}
    </div>
  );
}
