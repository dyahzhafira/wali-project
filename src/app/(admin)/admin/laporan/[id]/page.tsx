"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Clock, User, Fish, CheckCircle, Plus, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import toast from "react-hot-toast";
import { StatusBadge } from "@/components/ui/Badge";
import { UrgencyDisplay } from "@/components/ui/UrgencyDisplay";
import PhotoCarousel from "@/components/forum/PhotoCarousel";
import StatusTracker from "@/components/forum/StatusTracker";
import ProgressTimeline from "@/components/forum/ProgressTimeline";
import ProgressLogForm from "@/components/forms/ProgressLogForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AdminReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: reportId } = use(params);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [officers, setOfficers] = useState<{ id: string; full_name: string }[]>([]);
  const [note, setNote] = useState("");
  const router = useRouter();

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) { router.push("/admin/laporan"); return; }
      const data = await res.json();
      const r = data.report ?? data;
      setReport(r); setNewStatus(r.status);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchReport();
    fetch("/api/admin/officers").then(r => r.ok ? r.json() : { officers: [] }).then(d => setOfficers(d.officers ?? [])).catch(() => {});
  }, [reportId]);

  const handleStatusUpdate = async () => {
    setUpdating(true);
    try {
      const body: any = { status: newStatus, note };
      if (assignTo) body.assigned_to = assignTo;
      const res = await fetch(`/api/reports/${reportId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { toast.error("Gagal memperbarui status"); return; }
      toast.success("Status berhasil diperbarui!");
      setNote(""); fetchReport();
    } catch { toast.error("Terjadi kesalahan"); } finally { setUpdating(false); }
  };

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="h-64 bg-gray-100 rounded-2xl animate-pulse mb-4" />
      <div className="grid grid-cols-3 gap-4"><div className="col-span-2 h-32 bg-gray-100 rounded-xl animate-pulse" /><div className="h-32 bg-gray-100 rounded-xl animate-pulse" /></div>
    </div>
  );
  if (!report) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/laporan" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Detail Laporan</h1>
          <p className="text-xs text-gray-400 font-mono">ID: {report.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <PhotoCarousel photos={report.photos || []} />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <StatusBadge status={report.status} />
                <span className="text-xs text-gray-400 capitalize">via {report.source}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <MapPin size={14} className="text-wali-500" />
                <span>{report.location_name || `${report.location_lat?.toFixed(5)}, ${report.location_lng?.toFixed(5)}`}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                <Clock size={14} className="text-wali-500" />
                <span>{format(new Date(report.created_at), "d MMMM yyyy, HH:mm", { locale: id })}</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{report.description}</p>
            </div>
          </div>

          {/* Progress Logs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Progress Penanganan</h2>
              <Button size="sm" onClick={() => setShowProgressModal(true)}>
                <Plus size={14} /> Tambah Progress
              </Button>
            </div>
            <ProgressTimeline logs={report.progress_logs || []} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">
          {/* Status Update */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Kelola Status</h3>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-wali-500 outline-none">
              {["baru", "terverifikasi", "proses", "selesai", "dismissed"].map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            {officers.length > 0 && (
              <>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Tugaskan ke Petugas</label>
                <select value={assignTo} onChange={e => setAssignTo(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-wali-500 outline-none">
                  <option value="">Tidak ditugaskan</option>
                  {officers.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
                </select>
              </>
            )}
            {report.assigned_user?.full_name && (
              <p className="text-xs text-wali-600 bg-wali-50 rounded-lg px-3 py-1.5 mb-3">
                👤 Saat ini ditugaskan ke: <strong>{report.assigned_user.full_name}</strong>
              </p>
            )}
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Catatan verifikasi (opsional)" rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none mb-3 focus:ring-2 focus:ring-wali-500 outline-none" />
            <Button className="w-full" onClick={handleStatusUpdate} loading={updating}>
              <CheckCircle size={14} /> Update Status
            </Button>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-50" style={{ background: "linear-gradient(135deg, #1b6560 0%, #2a9e8e 100%)" }}>
              <h3 className="text-sm font-semibold text-white">Statistik Laporan</h3>
            </div>
            <div className="p-4">
              {/* Priority Score: prominent badge */}
              <div className="flex flex-col items-center bg-wali-50 border border-wali-100 rounded-xl p-4 mb-4">
                <p className="text-xs text-wali-600 font-semibold uppercase tracking-wider mb-1">Priority Score</p>
                <p className="text-5xl font-extrabold tabular-nums" style={{
                  color: report.priority_score >= 20 ? "#BA1A1A" : report.priority_score >= 10 ? "#f97316" : report.priority_score >= 5 ? "#f59e0b" : "#10b981"
                }}>
                  {(report.priority_score || 0).toFixed(0)}
                </p>
                <p className="text-xs text-wali-500 mt-1">
                  {report.priority_score >= 20 ? "Prioritas Darurat" : report.priority_score >= 10 ? "Prioritas Tinggi" : report.priority_score >= 5 ? "Prioritas Sedang" : "Prioritas Rendah"}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                  <span className="text-gray-500 text-xs">Reaksi Warga</span>
                  <span className="font-semibold text-gray-800">👍 {report.react_count ?? 0}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-gray-500 text-xs">Update Situasi</span>
                  <span className="font-semibold text-gray-800">💬 {
                    Object.values(report.comment_counts ?? {}).reduce<number>((s, v) => s + (Number(v) || 0), 0)
                  }</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Urgensi Pelapor</h3>
            <UrgencyDisplay scale={report.urgency_scale} />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Tracker</h3>
            <StatusTracker status={report.status} created_at={report.created_at} verified_at={report.verified_at} />
          </div>

          {report.reporter_email && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Email Pelapor</h3>
              <p className="text-sm text-gray-600">{report.reporter_email}</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showProgressModal} onClose={() => setShowProgressModal(false)} title="Tambah Progress Log" size="lg">
        <ProgressLogForm
          reportId={reportId}
          onSuccess={() => { setShowProgressModal(false); fetchReport(); }}
          onCancel={() => setShowProgressModal(false)}
        />
      </Modal>
    </div>
  );
}
