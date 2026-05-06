import { ReportStatus, SituationCommentType } from "@/types";

export function calcPriorityScore(params: {
  react_count: number;
  still_there: number;
  increasing: number;
  decreasing: number;
  gone: number;
  urgency_scale: number;
  days_unhandled: number;
}): number {
  const { react_count, still_there, increasing, decreasing, gone, urgency_scale, days_unhandled } = params;
  return (
    react_count * 3 +
    still_there * 2 +
    increasing * 3 +
    decreasing * -1 +
    gone * -3 +
    urgency_scale * 1 +
    days_unhandled * 0.5
  );
}

export function statusLabel(status: ReportStatus): string {
  const map: Record<ReportStatus, string> = {
    baru: "Laporan Baru",
    terverifikasi: "Terverifikasi",
    proses: "Sedang Ditangani",
    selesai: "Selesai",
    dismissed: "Tidak Valid",
  };
  return map[status];
}

export function statusColor(status: ReportStatus): string {
  const map: Record<ReportStatus, string> = {
    baru: "bg-red-100 text-red-700 border-red-200",
    terverifikasi: "bg-blue-100 text-blue-700 border-blue-200",
    proses: "bg-yellow-100 text-yellow-700 border-yellow-200",
    selesai: "bg-green-100 text-green-700 border-green-200",
    dismissed: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return map[status];
}

export function commentLabel(type: SituationCommentType): string {
  const map: Record<SituationCommentType, string> = {
    still_there: "Masih ada di lokasi",
    increasing: "Jumlahnya bertambah",
    decreasing: "Jumlahnya berkurang",
    gone: "Sudah tidak ada",
  };
  return map[type];
}

export function urgencyLabel(scale: number): string {
  const labels = ["", "1–5 Ekor (Rendah)", "5–20 Ekor (Sedang)", "20–50 Ekor (Cukup Tinggi)", "50–100 Ekor (Tinggi)", ">100 Ekor / Seluruh Perairan (Darurat)"];
  return labels[scale] || "";
}

export function urgencyColor(scale: number): string {
  if (scale <= 1) return "text-green-600";
  if (scale <= 2) return "text-lime-600";
  if (scale <= 3) return "text-yellow-600";
  if (scale <= 4) return "text-orange-600";
  return "text-red-600";
}

export function getSupabaseImageUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}
