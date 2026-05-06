"use client";
import { cn } from "./cn";
import { statusLabel, statusColor } from "@/lib/supabase/helpers";
import type { ReportStatus } from "@/types";

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", statusColor(status), className)}>
      {statusLabel(status)}
    </span>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", className)}>
      {children}
    </span>
  );
}
