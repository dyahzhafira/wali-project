import { TrendingUp, AlertTriangle, CheckCircle, Clock, Fish } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

async function getDashboardData() {
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: recentRows },
    { data: allRows },
    totalResult,
    todayResult,
    inProgressResult,
    doneThisMonthResult,
  ] = await Promise.all([
    supabase.from("reports").select("created_at, status, urgency_scale").gte("created_at", since),
    supabase.from("reports").select("status, urgency_scale"),
    supabase.from("reports").select("*", { count: "exact", head: true }),
    supabase.from("reports").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "proses"),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "selesai").gte("created_at", monthStart),
  ]);

  const stats = {
    total_reports: totalResult.count ?? 0,
    reports_today: todayResult.count ?? 0,
    reports_in_progress: inProgressResult.count ?? 0,
    reports_done_this_month: doneThisMonthResult.count ?? 0,
  };

  const rows = recentRows ?? [];
  const all = allRows ?? [];

  const daily = days.map(day => ({
    label: new Date(day + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
    count: rows.filter(r => r.created_at.startsWith(day)).length,
  }));

  const byStatus = [
    { name: "Baru", value: all.filter(r => r.status === "baru").length, color: "#ef4444" },
    { name: "Terverifikasi", value: all.filter(r => r.status === "terverifikasi").length, color: "#3b82f6" },
    { name: "Proses", value: all.filter(r => r.status === "proses").length, color: "#f59e0b" },
    { name: "Selesai", value: all.filter(r => r.status === "selesai").length, color: "#10b981" },
  ];

  const urgencyColors = ["#10b981", "#84cc16", "#f59e0b", "#f97316", "#BA1A1A"];
  const byUrgency = [1, 2, 3, 4, 5].map((level, i) => ({
    level: `Urgensi ${level}`,
    count: all.filter(r => r.urgency_scale === level).length,
    fill: urgencyColors[i],
  }));

  return { stats, daily, byStatus, byUrgency };
}

export default async function PublicDashboardPage() {
  const { stats, daily, byStatus, byUrgency } = await getDashboardData();

  const totalHandled = (stats.reports_in_progress ?? 0) + (stats.reports_done_this_month ?? 0);
  const completionRate = stats.total_reports
    ? Math.round(((stats.reports_done_this_month ?? 0) / Math.max(stats.total_reports, 1)) * 100)
    : 0;

  return (
    <div className="flex flex-col">

      {/* ── HERO ── */}
      <section className="wali-gradient px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow">
              <TrendingUp size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white drop-shadow-md">Dashboard Publik</h1>
              <p className="text-white/80 font-medium text-sm">Transparansi data penanganan ikan invasif secara real-time</p>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Laporan", value: stats.total_reports ?? 0, icon: Fish, sub: "Sepanjang waktu" },
              { label: "Laporan Hari Ini", value: stats.reports_today ?? 0, icon: AlertTriangle, sub: "Masuk hari ini" },
              { label: "Sedang Ditangani", value: stats.reports_in_progress ?? 0, icon: Clock, sub: "Aktif diproses" },
              { label: "Selesai Bulan Ini", value: stats.reports_done_this_month ?? 0, icon: CheckCircle, sub: "Berhasil ditangani" },
            ].map(({ label, value, icon: Icon, sub }) => (
              <div key={label} className="rounded-2xl p-5 flex flex-col gap-1 shadow-sm bg-white/15 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={16} className="text-white/80" />
                  <p className="text-xs font-semibold text-white/80">{label}</p>
                </div>
                <p className="text-4xl font-bold tabular-nums text-white">{value.toLocaleString("id")}</p>
                <p className="text-xs text-white/70">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CHARTS ── */}
      <section className="bg-gray-50 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-wali-900">Tren & Distribusi Laporan</h2>
            <p className="text-gray-500 text-sm mt-1">Analisis laporan 7 hari terakhir dan sebaran berdasarkan status</p>
          </div>
          <DashboardCharts daily={daily} byStatus={byStatus} byUrgency={byUrgency} />
        </div>
      </section>

      {/* ── PROGRESS RING ── */}
      <section className="wali-gradient px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white drop-shadow mb-3">Tingkat Penyelesaian</h2>
              <p className="text-white/80 font-medium leading-relaxed">
                Persentase laporan yang berhasil ditangani oleh tim dinas dan petugas lapangan dari total laporan yang masuk.
              </p>
              <div className="flex gap-6 mt-6">
                <div>
                  <p className="text-4xl font-bold text-white">{totalHandled.toLocaleString("id")}</p>
                  <p className="text-white/70 text-sm font-medium">Laporan ditangani</p>
                </div>
                <div className="w-px bg-white/20" />
                <div>
                  <p className="text-4xl font-bold text-white">{(stats.total_reports ?? 0).toLocaleString("id")}</p>
                  <p className="text-white/70 text-sm font-medium">Total laporan</p>
                </div>
              </div>
            </div>
            <div className="bg-white/15 rounded-3xl p-8 backdrop-blur-sm">
              <p className="text-7xl font-bold text-white text-center mb-4">{completionRate}%</p>
              <div className="h-4 rounded-full bg-white/20 overflow-hidden">
                <div className="h-4 rounded-full transition-all duration-1000"
                  style={{
                    width: `${completionRate}%`,
                    background: "rgba(255,255,255,0.9)"
                  }} />
              </div>
              <p className="text-white/60 text-xs text-center mt-3 font-medium">Selesai dari total laporan</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── URGENCY INFO ── */}
      <section className="bg-white px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Skala Urgensi</h2>
          <p className="text-gray-500 text-sm mb-8">Laporan dikategorikan berdasarkan perkiraan jumlah ikan yang ditemukan warga</p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { level: 1, label: "1–5 Ekor", sublabel: "Rendah", desc: "Terlihat beberapa ekor, belum mengganggu ekosistem", color: "#10b981" },
              { level: 2, label: "5–20 Ekor", sublabel: "Sedang", desc: "Mulai terlihat dalam jumlah, belum mendominasi area", color: "#84cc16" },
              { level: 3, label: "20–50 Ekor", sublabel: "Cukup Tinggi", desc: "Cukup banyak, mulai mengganggu aktivitas dan ekosistem", color: "#f59e0b" },
              { level: 4, label: "50–100 Ekor", sublabel: "Tinggi", desc: "Sangat banyak, mendominasi hampir seluruh area perairan", color: "#f97316" },
              { level: 5, label: ">100 Ekor", sublabel: "Darurat", desc: "Ikan memenuhi hampir seluruh perairan, invasif sangat parah", color: "#BA1A1A" },
            ].map(({ level, label, sublabel, desc, color }) => (
              <div key={level} className="rounded-2xl border border-gray-100 p-4 text-center shadow-sm">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ background: `${color}22` }}>
                  <span className="text-lg font-bold" style={{ color }}>{level}</span>
                </div>
                <p className="font-bold text-gray-900 text-sm">{sublabel}</p>
                <p className="text-xs font-semibold mb-1" style={{ color }}>{label}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CARA PENENTUAN PRIORITAS ── */}
      <section className="bg-gray-50 px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cara Penentuan Prioritas Penanganan</h2>
          <p className="text-gray-500 text-sm mb-8">Setiap laporan mendapat skor prioritas untuk menentukan urutan penanganan oleh dinas</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: "👍", title: "Dukungan Warga", desc: "Semakin banyak warga yang mendukung (upvote) laporan, semakin tinggi prioritasnya" },
              { icon: "🐟", title: "Jumlah Ikan Terlihat", desc: "Perkiraan jumlah ikan yang dilaporkan turut menentukan seberapa mendesak penanganannya" },
              { icon: "💬", title: "Update Situasi", desc: "Update terbaru dari warga di sekitar lokasi: masih ada, bertambah, atau berkurang" },
              { icon: "⏱️", title: "Lama Belum Ditangani", desc: "Laporan yang sudah lama belum mendapat respons mendapat bobot tambahan agar tidak terlupakan" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <span className="text-3xl block mb-3">{icon}</span>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="wali-gradient px-6 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <Image src="/ikan.png" alt="" width={80} height={80} className="mx-auto mb-4 opacity-60" />
          <h2 className="text-3xl font-bold text-white drop-shadow mb-3">
            Temukan Ikan Invasif? Laporkan Sekarang!
          </h2>
          <p className="text-white/80 font-medium mb-8">
            Data laporan Anda membantu pemerintah merespons lebih cepat dan akurat.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/laporan/baru"
              className="btn-gradient text-white font-semibold px-8 py-3.5 rounded-full shadow-md hover:opacity-90 transition-opacity text-center text-base">
              Buat Laporan Sekarang
            </Link>
            <Link href="/laporan"
              className="bg-white/20 hover:bg-white/30 text-white font-semibold px-8 py-3.5 rounded-full transition-colors text-center text-base backdrop-blur-sm">
              Lihat Forum Laporan
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
