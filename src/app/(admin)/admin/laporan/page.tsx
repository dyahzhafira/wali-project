"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Fish } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import toast from "react-hot-toast";
import { StatusBadge } from "@/components/ui/Badge";
import { UrgencyDisplay } from "@/components/ui/UrgencyDisplay";
import { Button } from "@/components/ui/Button";
import { Report } from "@/types";

const STATUS_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "baru", label: "Baru" },
  { value: "terverifikasi", label: "Terverifikasi" },
  { value: "proses", label: "Proses" },
  { value: "selesai", label: "Selesai" },
];

export default function AdminReportListPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("priority_score");
  const [location, setLocation] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const LIMIT = 20;

  const fetch_reports = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT), offset: String(reset ? 0 : offset), sort });
      if (status) params.set("status", status);
      if (location) params.set("location", location);
      const res = await fetch(`/api/reports?${params}`);
      const data = await res.json();
      if (reset) { setReports(data.reports || []); setOffset(0); }
      else setReports(prev => [...prev, ...(data.reports || [])]);
      setTotal(data.total || 0);
    } catch { } finally { setLoading(false); }
  }, [status, sort, offset]);

  useEffect(() => { fetch_reports(true); }, [status, sort, location]);

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelected(reports.map(r => r.id));
  const clearSelect = () => setSelected([]);

  const bulkUpdate = async (newStatus: string) => {
    if (!selected.length) return;
    try {
      await Promise.all(selected.map(id => fetch(`/api/reports/${id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })));
      toast.success(`${selected.length} laporan berhasil diperbarui ke "${newStatus}"`);
    } catch {
      toast.error("Gagal memperbarui beberapa laporan");
    }
    clearSelect();
    fetch_reports(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manajemen Laporan</h1>
          <p className="text-sm text-gray-500">{total} laporan total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-wali-500 outline-none">
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Urutkan</label>
          <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-wali-500 outline-none">
            <option value="priority_score">Prioritas Tertinggi</option>
            <option value="created_at">Terbaru</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Cari Wilayah / Lokasi</label>
          <form onSubmit={e => { e.preventDefault(); setLocation(locationInput); }} className="flex gap-1">
            <input
              type="text"
              value={locationInput}
              onChange={e => setLocationInput(e.target.value)}
              placeholder="Nama lokasi / kecamatan..."
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-wali-500 outline-none w-52"
            />
            <button type="submit" className="px-3 py-1.5 rounded-lg bg-wali-700 text-white text-sm font-medium hover:bg-wali-800 transition-colors">Cari</button>
            {location && (
              <button type="button" onClick={() => { setLocation(""); setLocationInput(""); }}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">✕</button>
            )}
          </form>
        </div>
        {selected.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-600">{selected.length} dipilih</span>
            <Button size="sm" variant="secondary" onClick={() => bulkUpdate("terverifikasi")}>Verifikasi</Button>
            <Button size="sm" variant="secondary" onClick={() => bulkUpdate("dismissed")}>Dismiss</Button>
            <Button size="sm" variant="ghost" onClick={clearSelect}>Batal</Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selected.length === reports.length && reports.length > 0} onChange={() => selected.length === reports.length ? clearSelect() : selectAll()} className="rounded" />
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Laporan</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Urgensi</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Skor</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Reaksi</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Waktu</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && reports.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : reports.map(report => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(report.id)} onChange={() => toggleSelect(report.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {report.photos?.[0] ? <img src={report.photos[0]} alt="" className="w-full h-full object-cover" /> : <Fish className="w-4 h-4 m-2 text-gray-300" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-48">{report.location_name || "Lokasi tidak tersedia"}</p>
                        <p className="text-xs text-gray-400 truncate max-w-48">{report.description.slice(0, 50)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
                  <td className="px-4 py-3"><UrgencyDisplay scale={report.urgency_scale} size="sm" showLabel={false} /></td>
                  <td className="px-4 py-3 text-right font-bold text-wali-700">{(report.priority_score || 0).toFixed(0)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">👍 {report.react_count}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id })}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/laporan/${report.id}`} className="text-xs text-wali-600 font-medium hover:underline">Detail →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {reports.length < total && (
          <div className="px-4 py-3 border-t border-gray-100 text-center">
            <Button variant="secondary" size="sm" onClick={() => { setOffset(offset + LIMIT); fetch_reports(); }} loading={loading}>Muat Lebih</Button>
          </div>
        )}
      </div>
    </div>
  );
}
