"use client";
import { cn } from "./cn";
import { urgencyLabel, urgencyColor } from "@/lib/supabase/helpers";

const dotBg: Record<string, string> = {
  "text-green-600": "bg-green-500",
  "text-lime-600": "bg-lime-500",
  "text-yellow-600": "bg-yellow-500",
  "text-orange-600": "bg-orange-500",
  "text-red-600": "bg-red-500",
};

interface Props { scale: number; showLabel?: boolean; size?: "sm" | "md"; className?: string; }

export function UrgencyDisplay({ scale, showLabel = true, size = "md", className }: Props) {
  const s = Math.max(1, Math.min(5, Math.round(scale)));
  const colorClass = urgencyColor(s);
  const activeDot = dotBg[colorClass] ?? "bg-gray-400";
  const dotSize = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={cn("rounded-full transition-colors", dotSize, i < s ? activeDot : "bg-gray-200")} />
        ))}
        <span className={cn("ml-1 font-semibold tabular-nums", size === "sm" ? "text-xs" : "text-sm", colorClass)}>{s}/5</span>
      </div>
      {showLabel && <span className={cn("leading-tight", size === "sm" ? "text-xs" : "text-sm", colorClass)}>{urgencyLabel(s)}</span>}
    </div>
  );
}
