import { notFound } from "next/navigation";
import { MapPin, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import ReportDetailTabs from "@/components/forum/ReportDetailTabs";

interface Props { params: Promise<{ id: string }> }

async function getReport(id: string) {
  try {
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/^﻿/, "") || "https://wali-lake.vercel.app";
    const res = await fetch(`${baseUrl}/api/reports/${id}`, { next: { revalidate: 10 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.report ?? null;
  } catch { return null; }
}

const URGENCY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Rendah", color: "#10b981" },
  2: { label: "Sedang", color: "#84cc16" },
  3: { label: "Cukup Tinggi", color: "#f59e0b" },
  4: { label: "Tinggi", color: "#f97316" },
  5: { label: "Darurat", color: "#BA1A1A" },
};

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const urgency = URGENCY_LABELS[report.urgency_scale] || URGENCY_LABELS[3];

  return (
    <div className="flex flex-col">
      {/* ── HEADER ── */}
      <div className="wali-gradient px-6 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Urgency badge (top-right): red gradient pill for "Darurat" */}
          <div className="flex justify-end mb-3">
            <span
              className="px-5 py-1.5 rounded-full text-white font-semibold text-sm shadow-sm"
              style={{ background: urgency.color }}
            >
              {urgency.label}
            </span>
          </div>

          {/* Location name: SemiBold/Bold 48px white */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-2 drop-shadow">
            {report.location_name || "Lokasi Laporan"}
          </h1>

          {/* Address + time: Medium 20px white */}
          <div className="flex flex-col gap-1 mb-4">
            {report.location_name && (
              <div className="flex items-center gap-2 text-white/90 font-medium">
                <MapPin size={16} className="shrink-0" />
                <span className="text-sm">{report.location_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-white/80 font-medium">
              <Clock size={16} className="shrink-0" />
              <span className="text-sm">
                {format(new Date(report.created_at), "EEEE, d MMMM yyyy", { locale: idLocale })}
              </span>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="relative h-2 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.25)" }}>
            <div
              className="absolute left-0 top-0 h-2 rounded-full"
              style={{
                width: `${(["baru","terverifikasi","proses","selesai"].indexOf(report.status) + 1) * 25}%`,
                background: "rgba(255,255,255,0.9)"
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full shadow-md border-2 border-wali-700"
              style={{
                left: `calc(${(["baru","terverifikasi","proses","selesai"].indexOf(report.status) + 1) * 25}% - 10px)`
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/70 font-medium">
            <span>Baru</span>
            <span>Verifikasi</span>
            <span>Proses</span>
            <span>Selesai</span>
          </div>
        </div>
      </div>

      {/* ── TABS + CONTENT ── */}
      <div className="max-w-3xl mx-auto w-full px-6 py-6">
        <ReportDetailTabs report={report} />
      </div>
    </div>
  );
}
