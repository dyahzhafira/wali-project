"use client";
import { useState, useEffect, useCallback } from "react";
import { Fish, SlidersHorizontal } from "lucide-react";
import ReportCard from "@/components/forum/ReportCard";
import { Report } from "@/types";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "", label: "Semua Status" },
  { value: "baru", label: "Laporan Baru" },
  { value: "terverifikasi", label: "Terverifikasi" },
  { value: "proses", label: "Sedang Ditangani" },
  { value: "selesai", label: "Selesai" },
];

const SORT_OPTIONS = [
  { value: "created_at", label: "Terbaru" },
  { value: "priority_score", label: "Prioritas Tertinggi" },
];

export default function ForumPage() {
  const [reports, setReports] = useState<(Report & { comment_count?: number })[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("created_at");
  const [offset, setOffset] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const LIMIT = 12;

  const fetchReports = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(reset ? 0 : offset), sort });
      if (status) params.set("status", status);
      const res = await fetch(`/api/reports?${params}`);
      const data = await res.json();
      if (reset) { setReports(data.reports || []); setOffset(0); }
      else setReports(prev => [...prev, ...(data.reports || [])]);
      setTotal(data.total || 0);
    } catch { } finally { setLoading(false); }
  }, [status, sort, offset]);

  useEffect(() => { fetchReports(true); }, [status, sort]);

  const loadMore = () => {
    const newOffset = offset + LIMIT;
    setOffset(newOffset);
    fetchReports(false);
  };

  return (
    <div className="flex flex-col">

      {/* ── HEADER ── */}
      <div className="wali-gradient px-6 py-10">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Forum Laporan</h1>
          <p className="text-white/80 font-medium text-sm mb-6">
            {total > 0 ? `${total} laporan dari seluruh wilayah` : "Laporan ikan invasif dari warga"}
          </p>
          {/* Filter bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <button onClick={() => setShowFilters(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-colors backdrop-blur-sm">
              <SlidersHorizontal size={15} />
              {showFilters ? "Tutup Filter" : "Filter"}
            </button>
            {STATUS_OPTIONS.filter(o => o.value).map(o => (
              <button key={o.value} onClick={() => setStatus(s => s === o.value ? "" : o.value)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  status === o.value
                    ? "bg-white text-wali-700 shadow-sm"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}>
                {o.label}
              </button>
            ))}
            <Link href="/laporan/baru"
              className="ml-auto btn-gradient text-white font-semibold px-5 py-2.5 rounded-full shadow-sm hover:opacity-90 transition-opacity text-sm">
              + Laporan Baru
            </Link>
          </div>

          {showFilters && (
            <div className="mt-4 bg-white/15 backdrop-blur-sm rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-white/80 mb-1.5 block">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}
                  className="w-full rounded-xl border-0 bg-white/20 text-white px-3 py-2 text-sm focus:ring-2 focus:ring-white/40 outline-none">
                  {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value} className="text-gray-900">{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-white/80 mb-1.5 block">Urutkan</label>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="w-full rounded-xl border-0 bg-white/20 text-white px-3 py-2 text-sm focus:ring-2 focus:ring-white/40 outline-none">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="text-gray-900">{o.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="bg-wali-50 flex-1 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {loading && reports.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 h-36 animate-pulse" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Fish className="w-14 h-14 mx-auto mb-4 opacity-20" />
              <p className="font-semibold text-gray-600">Belum ada laporan</p>
              <p className="text-sm mt-1">Coba ubah filter atau buat laporan pertama!</p>
              <Link href="/laporan/baru"
                className="mt-6 inline-block btn-gradient text-white font-semibold px-6 py-3 rounded-full shadow-sm hover:opacity-90 transition-opacity text-sm">
                Buat Laporan
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reports.map(report => (
                  <ReportCard key={report.id} report={report} />
                ))}
              </div>
              {reports.length < total && (
                <div className="text-center mt-10">
                  <button onClick={loadMore} disabled={loading}
                    className="btn-gradient text-white font-semibold px-8 py-3 rounded-full shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                    {loading ? "Memuat..." : "Muat Lebih Banyak"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

    </div>
  );
}
