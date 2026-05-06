"use client";
import { useState } from "react";
import { cn } from "@/components/ui/cn";
import ProgressTimeline from "./ProgressTimeline";
import ReactButton from "./ReactButton";
import SituationCommentPanel from "./SituationCommentPanel";
import { UrgencyDisplay } from "@/components/ui/UrgencyDisplay";
import { StatusBadge } from "@/components/ui/Badge";
import PhotoCarousel from "./PhotoCarousel";
import { Fish, Copy, Share2, Check, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface Props { report: any; }

const STATUS_LABELS: Record<string, string> = {
  baru: "Laporan Baru",
  terverifikasi: "Terverifikasi",
  proses: "Sedang Ditindaklanjuti",
  selesai: "Selesai Ditindaklanjuti",
  dismissed: "Ditolak",
};

const STATUS_COLOR: Record<string, string> = {
  baru: "#ef4444",
  terverifikasi: "#3b82f6",
  proses: "#0284c7",
  selesai: "#10b981",
  dismissed: "#9ca3af",
};

export default function ReportDetailTabs({ report }: Props) {
  const [tab, setTab] = useState<"diskusi" | "tindak">("diskusi");
  const [copied, setCopied] = useState(false);

  const reportUrl = typeof window !== "undefined"
    ? window.location.href
    : `${process.env.NEXT_PUBLIC_APP_URL || ""}/laporan/${report.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      toast.success("Link disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin link");
    }
  };

  const commentCounts = report.comment_counts ?? {
    still_there: (report.situation_comments || []).filter((c: any) => c.type === "still_there").length,
    increasing: (report.situation_comments || []).filter((c: any) => c.type === "increasing").length,
    decreasing: (report.situation_comments || []).filter((c: any) => c.type === "decreasing").length,
    gone: (report.situation_comments || []).filter((c: any) => c.type === "gone").length,
  };

  const totalFishCaught = (report.progress_logs || []).reduce(
    (sum: number, log: any) => sum + (log.fish_caught_count || 0), 0
  );

  return (
    <div className="flex flex-col gap-4">
      {/* ── SHARE BAR ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Bagikan Laporan Ini</p>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? "Disalin!" : "Salin Link"}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Lihat laporan ikan invasif ini di WALI: ${reportUrl}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors">
            <Share2 size={14} /> WhatsApp
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(reportUrl)}&text=${encodeURIComponent("Laporan ikan sapu-sapu invasif di WALI:")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "#2ca5e0", color: "white" }}>
            <ExternalLink size={14} /> Telegram
          </a>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button onClick={() => setTab("diskusi")}
            className={cn("flex-1 py-4 text-sm font-semibold transition-colors",
              tab === "diskusi" ? "text-white bg-wali-700" : "text-wali-700 hover:bg-wali-50")}>
            Diskusi Warga
          </button>
          <button onClick={() => setTab("tindak")}
            className={cn("flex-1 py-4 text-sm font-semibold transition-colors",
              tab === "tindak" ? "text-white bg-wali-700" : "text-wali-700 hover:bg-wali-50")}>
            Tindak Lanjut Dinas
          </button>
        </div>

        {/* ── DISKUSI TAB ── */}
        {tab === "diskusi" && (
          <div className="p-5 flex flex-col gap-5">
            {/* Main report card */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              <PhotoCarousel photos={report.photos || []} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">Anonim</p>
                    <p className="text-xs text-gray-400">Laporan asli</p>
                  </div>
                  <ReactButton reportId={report.id} initialCount={report.react_count} />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
              </div>
              <div className="px-5 py-3 flex items-center justify-between bg-gray-50 border-t border-gray-100">
                <StatusBadge status={report.status} />
                <span className="text-xs font-semibold text-wali-700">👍 {report.react_count} orang setuju</span>
              </div>
            </div>

            {/* Situation update */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Update Situasi dari Warga</h3>
              <p className="text-xs text-gray-400 mb-4">
                Pilih kondisi terkini yang Anda lihat di lokasi ini. Setiap pilihan membantu dinas menentukan prioritas penanganan.
              </p>
              <SituationCommentPanel reportId={report.id} counts={commentCounts} />
            </div>

          </div>
        )}

        {/* ── TINDAK LANJUT TAB ── */}
        {tab === "tindak" && (
          <div className="p-5 flex flex-col gap-5">
            {/* Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Penanganan</h3>
              <div className="w-full py-3 rounded-full text-white font-semibold text-center text-sm shadow-sm"
                style={{ background: STATUS_COLOR[report.status] || "#9ca3af" }}>
                {STATUS_LABELS[report.status] || report.status}
              </div>
            </div>

            {/* Fish count */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 text-center">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Jumlah Ikan Ditangkap</h3>
              <p className="text-5xl font-bold tabular-nums" style={{ color: "#BA1A1A" }}>
                {totalFishCaught.toLocaleString("id")}
              </p>
              <p className="text-sm text-gray-400 mt-1">ekor ikan</p>
            </div>

            {/* Priority notice */}
            <div className="bg-wali-50 rounded-2xl border border-wali-100 px-5 py-4 flex items-start gap-3">
              <span className="text-xl mt-0.5">💬</span>
              <p className="text-sm text-wali-700 leading-relaxed">
                <strong>Respons dan dukungan warga</strong> membantu dinas menentukan prioritas penanganan laporan ini. Semakin banyak warga yang merespons, semakin cepat ditangani.
              </p>
            </div>

            {/* Urgency */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Tingkat Urgensi</h4>
              <UrgencyDisplay scale={report.urgency_scale} />
            </div>

            {/* Berita terkini */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4" style={{ background: "#1b6560" }}>
                <h3 className="text-base font-bold text-white">Berita Terkini dari Petugas</h3>
              </div>
              {(report.progress_logs || []).length === 0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">
                  <Fish className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>Belum ada update dari petugas</p>
                </div>
              ) : (
                <ProgressTimeline logs={report.progress_logs || []} />
              )}
            </div>

            {/* Assigned officer */}
            {report.assigned_user && (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Ditangani oleh</h4>
                <p className="text-sm font-semibold text-wali-700">{report.assigned_user.full_name}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
