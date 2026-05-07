"use client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { MapPin, ImageOff, ChevronRight } from "lucide-react";
import { Report } from "@/types";
import { StatusBadge } from "@/components/ui/Badge";
import { UrgencyDisplay } from "@/components/ui/UrgencyDisplay";
import ReactButton from "./ReactButton";

interface Props { report: Report; }

const URGENCY_BG: Record<number, string> = {
  1: "#f0fdf4", 2: "#f7fee7", 3: "#fefce8", 4: "#fff7ed", 5: "#fef2f2",
};

export default function ReportCard({ report }: Props) {
  const firstPhoto = report.photos?.[0];
  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id });

  const borderColor: Record<string, string> = {
    baru: "#f87171",
    terverifikasi: "#60a5fa",
    proses: "#fbbf24",
    selesai: "#34d399",
    dismissed: "#d1d5db",
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor[report.status] || "#d1d5db" }}>

      {/* Photo */}
      {firstPhoto ? (
        <Link href={`/laporan/${report.id}`} className="block aspect-video overflow-hidden bg-gray-100">
          <img src={firstPhoto} alt="Foto laporan"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </Link>
      ) : (
        <Link href={`/laporan/${report.id}`}
          className="flex aspect-video items-center justify-center bg-gray-50">
          <ImageOff className="w-8 h-8 text-gray-300" />
        </Link>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <StatusBadge status={report.status} />
          <span className="text-xs text-gray-400 shrink-0">{timeAgo}</span>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <MapPin size={11} className="text-wali-500 shrink-0" />
          <span className="truncate font-medium">
            {report.location_name || `${report.location_lat?.toFixed(4)}, ${report.location_lng?.toFixed(4)}`}
          </span>
        </div>

        <p className="text-sm text-gray-700 line-clamp-2 mb-3 leading-relaxed">{report.description}</p>

        <UrgencyDisplay scale={report.urgency_scale} size="sm" showLabel />
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-50 bg-gray-50/50">
        {/* Like button: fungsional, tidak navigate ke detail */}
        <div onClick={e => e.stopPropagation()}>
          <ReactButton
            reportId={report.id}
            initialCount={report.react_count ?? 0}
          />
        </div>

        {/* Tombol Detail yang jelas */}
        <Link href={`/laporan/${report.id}`}
          className="ml-auto flex items-center gap-1 text-xs font-semibold text-wali-700 bg-wali-50 hover:bg-wali-100 px-3 py-1.5 rounded-full transition-colors">
          Lihat Detail <ChevronRight size={13} />
        </Link>
      </div>
    </div>
  );
}
