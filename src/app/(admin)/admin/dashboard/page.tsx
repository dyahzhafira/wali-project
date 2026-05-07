import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Fish, AlertTriangle, Clock, CheckCircle, TrendingUp, MapPin,
  Plus, Bell, Award, Users, BarChart2, Flame,
} from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import { UrgencyDisplay } from "@/components/ui/UrgencyDisplay";
import { formatDistanceToNow, format } from "date-fns";
import { id } from "date-fns/locale";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import AdminMapEmbedClient from "@/components/map/AdminMapEmbedClient";

async function getDashboardData(userId: string, role: string, wilayah?: string) {
  const supabase = await createClient();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/^﻿/, "") || "https://wali-lake.vercel.app";

  const topUrl = `${baseUrl}/api/reports?sort=priority_score&limit=10${wilayah ? `&location=${encodeURIComponent(wilayah)}` : ""}`;
  const [statsRes, topRes] = await Promise.all([
    fetch(`${baseUrl}/api/stats`, { next: { revalidate: 30 } }),
    fetch(topUrl, { cache: "no-store" }),
  ]);

  const stats = statsRes.ok ? await statsRes.json() : {};
  const topReports = topRes.ok ? (await topRes.json()).reports ?? [] : [];

  // 7-day chart data
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const [
    { data: recentRows },
    { data: allRows },
    { data: fishLogs },
    { data: todayLogs },
    { data: forumTop },
    { data: unverifiedRows },
    { data: leaderboardRaw },
    { data: recentActivityRaw },
  ] = await Promise.all([
    supabase.from("reports").select("created_at, status, urgency_scale").gte("created_at", since7d),
    supabase.from("reports").select("status, urgency_scale"),
    supabase.from("progress_logs").select("fish_caught_count"),
    supabase.from("progress_logs").select("fish_caught_count").gte("logged_at", todayStart.toISOString()),
    supabase.from("reports")
      .select("id, location_name, status, urgency_scale, react_count, created_at")
      .order("react_count", { ascending: false })
      .limit(5),
    supabase.from("reports")
      .select("id, location_name, urgency_scale, created_at, photos")
      .eq("status", "baru")
      .order("urgency_scale", { ascending: false })
      .limit(6),
    supabase.from("progress_logs")
      .select("officer_id, fish_caught_count, admin_users(full_name)")
      .gte("logged_at", monthStart.toISOString()),
    supabase.from("progress_logs")
      .select("id, description, fish_caught_count, logged_at, admin_users(full_name), reports(location_name)")
      .order("logged_at", { ascending: false })
      .limit(8),
  ]);

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
    { name: "Dismissed", value: all.filter(r => r.status === "dismissed").length, color: "#9ca3af" },
  ];

  const urgencyColors = ["#10b981", "#84cc16", "#f59e0b", "#f97316", "#BA1A1A"];
  const byUrgency = [1, 2, 3, 4, 5].map((level, i) => ({
    level: `Urgensi ${level}`,
    count: all.filter(r => r.urgency_scale === level).length,
    fill: urgencyColors[i],
  }));

  // Fish caught totals
  const totalFishAll = (fishLogs ?? []).reduce((s, l) => s + (l.fish_caught_count || 0), 0);
  const totalFishToday = (todayLogs ?? []).reduce((s, l) => s + (l.fish_caught_count || 0), 0);

  // Leaderboard: aggregate by officer
  const lbMap = new Map<string, { name: string; fish: number }>();
  for (const log of leaderboardRaw ?? []) {
    const name = (log.admin_users as any)?.full_name ?? "Petugas";
    const cur = lbMap.get(log.officer_id) ?? { name, fish: 0 };
    lbMap.set(log.officer_id, { name: cur.name, fish: cur.fish + (log.fish_caught_count || 0) });
  }
  const leaderboard = Array.from(lbMap.values())
    .sort((a, b) => b.fish - a.fish)
    .slice(0, 5);

  // Petugas-specific data
  let assignedReports: any[] = [];
  let myTodayLogs: any[] = [];
  let myTotalFish = 0;

  if (role === "petugas_lapangan") {
    const { data: assigned } = await supabase
      .from("reports")
      .select("id, location_name, status, urgency_scale, created_at, priority_score")
      .eq("assigned_to", userId)
      .neq("status", "selesai")
      .order("urgency_scale", { ascending: false })
      .limit(8);
    assignedReports = assigned ?? [];

    const { data: myLogs } = await supabase
      .from("progress_logs")
      .select("id, fish_caught_count, description, logged_at")
      .eq("officer_id", userId)
      .gte("logged_at", todayStart.toISOString());
    myTodayLogs = myLogs ?? [];
    myTotalFish = myTodayLogs.reduce((s, l) => s + (l.fish_caught_count || 0), 0);
  }

  const recentActivity = (recentActivityRaw ?? []).map((log: any) => ({
    id: log.id,
    description: log.description,
    fish_caught_count: log.fish_caught_count,
    logged_at: log.logged_at,
    officer_name: log.admin_users?.full_name ?? "Petugas",
    location_name: log.reports?.location_name ?? "-",
  }));

  return {
    stats, topReports, daily, byStatus, byUrgency,
    totalFishAll, totalFishToday,
    forumTop: forumTop ?? [],
    unverifiedRows: unverifiedRows ?? [],
    leaderboard, recentActivity,
    assignedReports, myTodayLogs, myTotalFish,
  };
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ wilayah?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const role = adminUser?.role ?? "admin_dinas";
  const { wilayah } = await searchParams;
  const {
    stats, topReports, daily, byStatus, byUrgency,
    totalFishAll, totalFishToday,
    forumTop, unverifiedRows, leaderboard, recentActivity,
    assignedReports, myTodayLogs, myTotalFish,
  } = await getDashboardData(user.id, role, wilayah);

  const isPetugas = role === "petugas_lapangan";
  const greeting = format(new Date(), "EEEE, d MMMM yyyy", { locale: id });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isPetugas ? `Selamat datang, ${adminUser?.full_name?.split(" ")[0]}` : "Command Center"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{greeting}</p>
        </div>
        <Link href="/" className="text-sm text-wali-600 hover:underline font-medium">← Sisi Publik</Link>
      </div>

      {/* ── PETUGAS: contribution banner ── */}
      {isPetugas && (
        <div className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg, #1b6560 0%, #2a9e8e 100%)" }}>
          <div>
            <p className="text-white/75 text-xs font-semibold uppercase tracking-wider mb-1">Kontribusi Hari Ini</p>
            <p className="text-3xl font-bold text-white">
              {myTodayLogs.length} log progress
              {myTotalFish > 0 && (
                <span className="text-xl ml-2 text-white/80">· {myTotalFish.toLocaleString("id")} ekor</span>
              )}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/admin/laporan"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
              <Plus size={15} /> Tambah Progress
            </Link>
            <Link href="/admin/profil"
              className="flex items-center gap-2 bg-white text-wali-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-wali-50 transition-colors">
              Lihat Profil
            </Link>
          </div>
        </div>
      )}

      {/* ── KPI CARDS ── */}
      <div className={`grid gap-4 mb-6 ${isPetugas ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"}`}>
        <StatCard title="Total Laporan" value={stats.total_reports ?? 0}
          icon={<Fish size={18} />} color="wali" subtitle="Sepanjang waktu" />
        <StatCard title="Belum Diverifikasi" value={stats.unverified ?? 0}
          icon={<AlertTriangle size={18} />} color="red" subtitle="Perlu tindakan" />
        <StatCard title="Sedang Ditangani" value={stats.reports_in_progress ?? 0}
          icon={<Clock size={18} />} color="yellow" subtitle="Dalam proses" />
        <StatCard title="Selesai Bulan Ini" value={stats.reports_done_this_month ?? 0}
          icon={<CheckCircle size={18} />} color="green" subtitle="Berhasil" />
        {!isPetugas && (
          <>
            <StatCard title="Laporan Hari Ini" value={stats.reports_today ?? 0}
              icon={<Bell size={18} />} color="wali" subtitle="Masuk hari ini" />
            <StatCard title="Ikan Ditangkap" value={totalFishAll}
              icon={<Fish size={18} />} color="green" subtitle="Total sepanjang waktu" />
          </>
        )}
      </div>

      {/* ── PRIORITY SCORE FORMULA (admin/super admin) ── */}
      {!isPetugas && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #1b6560 0%, #2a9e8e 100%)" }}>
            <BarChart2 size={15} className="text-white" />
            <h2 className="font-bold text-white text-sm">Formula Kalkulasi Priority Score</h2>
          </div>
          <div className="p-5">
            <p className="text-xs text-gray-500 mb-4">
              Setiap laporan mendapat skor otomatis berdasarkan komponen berikut. Skor menentukan urutan penanganan pada antrian prioritas.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-100 rounded-tl-lg">Komponen</th>
                    <th className="text-center px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-100">Bobot</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 border border-gray-100 rounded-tr-lg">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Reaksi Warga (react)", weight: "+3 / reaksi", desc: "Setiap like/upvote dari warga menambah 3 poin", positive: true },
                    { label: "Update: Masih Ada (still_there)", weight: "+2 / update", desc: "Warga mengkonfirmasi ikan masih ada di lokasi", positive: true },
                    { label: "Update: Bertambah (increasing)", weight: "+3 / update", desc: "Warga melaporkan jumlah ikan bertambah", positive: true },
                    { label: "Tingkat Urgensi Pelapor", weight: "+1 / skala", desc: "Urgensi 1–5 yang dipilih saat melapor", positive: true },
                    { label: "Lama Belum Ditangani", weight: "+0.5 / hari", desc: "Setiap hari tanpa penanganan menambah bobot", positive: true },
                    { label: "Update: Berkurang (decreasing)", weight: "−1 / update", desc: "Warga melaporkan jumlah ikan mulai berkurang", positive: false },
                    { label: "Update: Tidak Ada (gone)", weight: "−3 / update", desc: "Warga melaporkan ikan sudah tidak terlihat", positive: false },
                  ].map(({ label, weight, desc, positive }) => (
                    <tr key={label} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2.5 border border-gray-100 text-gray-800 font-medium text-xs">{label}</td>
                      <td className="px-3 py-2.5 border border-gray-100 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-mono ${positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {weight}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 border border-gray-100 text-gray-500 text-xs">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-1">Formula Lengkap:</p>
              <code className="text-xs text-wali-700 font-mono">
                Score = (react×3) + (still_there×2) + (bertambah×3) + (berkurang×−1) + (tidak_ada×−3) + (urgensi×1) + (hari_belum_ditangani×0.5)
              </code>
            </div>
          </div>
        </div>
      )}

      {/* ── ADMIN/SUPER ADMIN full dashboard ── */}
      {!isPetugas && (
        <>
          {/* Fish caught today highlight */}
          <div className="rounded-2xl p-5 mb-6 flex items-center gap-6"
            style={{ background: "linear-gradient(135deg, #066A5F 0%, #1d8a7a 100%)" }}>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Fish size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white/75 text-xs font-semibold uppercase tracking-wider mb-0.5">Ikan Ditangkap Hari Ini</p>
              <p className="text-4xl font-bold text-white tabular-nums">{totalFishToday.toLocaleString("id")} <span className="text-xl font-medium text-white/70">ekor</span></p>
            </div>
            <div className="text-right shrink-0 hidden sm:block">
              <p className="text-white/60 text-xs font-medium mb-0.5">Total keseluruhan</p>
              <p className="text-2xl font-bold text-white/90">{totalFishAll.toLocaleString("id")} ekor</p>
            </div>
          </div>

          {/* ── MAP COMMAND CENTER ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50"
              style={{ background: "linear-gradient(135deg, #1b6560 0%, #2a9e8e 100%)" }}>
              <h2 className="font-bold text-white flex items-center gap-2">
                <MapPin size={16} /> Peta Persebaran Laporan
              </h2>
              <Link href="/peta" className="text-xs text-white/70 hover:text-white font-medium">Buka peta penuh →</Link>
            </div>
            <div style={{ height: 400 }}>
              <AdminMapEmbedClient />
            </div>
          </div>

          {/* ── CHARTS + NOTIF FEED (2-col) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Charts: 2/3 width */}
            <div className="lg:col-span-2">
              <DashboardCharts daily={daily} byStatus={byStatus} byUrgency={byUrgency} />
            </div>

            {/* Notification / Alert feed: 1/3 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50"
                style={{ background: "#1b6560" }}>
                <h2 className="font-bold text-white flex items-center gap-2">
                  <Bell size={15} /> Notifikasi Terbaru
                </h2>
                {stats.unverified > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {stats.unverified}
                  </span>
                )}
              </div>
              {unverifiedRows.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle className="w-10 h-10 text-green-400 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Semua laporan terverifikasi</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {unverifiedRows.map((r: any) => (
                    <Link key={r.id} href={`/admin/laporan/${r.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                        {r.photos?.[0]
                          ? <img src={r.photos[0]} alt="" className="w-full h-full object-cover" />
                          : <Fish className="w-4 h-4 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {r.location_name || "Lokasi tidak tersedia"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: id })}
                        </p>
                      </div>
                      <UrgencyDisplay scale={r.urgency_scale} size="sm" showLabel={false} />
                    </Link>
                  ))}
                </div>
              )}
              <div className="px-4 py-3 border-t border-gray-50">
                <Link href="/admin/notifikasi"
                  className="w-full text-center block text-xs font-semibold text-wali-600 hover:underline">
                  Lihat semua notifikasi →
                </Link>
              </div>
            </div>
          </div>

          {/* ── SUMMARY ROW ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-wali-50 rounded-2xl border border-wali-100 p-5">
              <p className="text-xs font-semibold text-wali-700 uppercase tracking-wide mb-1">Laporan Hari Ini</p>
              <p className="text-4xl font-bold text-wali-900 tabular-nums">{stats.reports_today ?? 0}</p>
            </div>
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Laporan Aktif</p>
              <p className="text-4xl font-bold text-blue-900 tabular-nums">{stats.active_reports ?? 0}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tingkat Penyelesaian</p>
              <p className="text-4xl font-bold text-gray-900 tabular-nums">
                {stats.total_reports
                  ? Math.round(((stats.total_reports - (stats.active_reports ?? 0)) / stats.total_reports) * 100)
                  : 0}%
              </p>
            </div>
          </div>

          {/* ── AKTIVITAS TERBARU DINAS ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50"
              style={{ background: "#1b6560" }}>
              <h2 className="font-bold text-white flex items-center gap-2">
                <TrendingUp size={15} /> Aktivitas Terbaru Dinas
              </h2>
            </div>
            {recentActivity.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Fish className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Belum ada aktivitas tercatat</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentActivity.map((act: any) => (
                  <div key={act.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-wali-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Fish size={14} className="text-wali-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-gray-800">{act.officer_name}</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500 truncate">{act.location_name}</span>
                        {act.fish_caught_count > 0 && (
                          <span className="text-xs font-bold text-wali-700 bg-wali-50 px-1.5 py-0.5 rounded-full">
                            🐟 {act.fish_caught_count.toLocaleString("id")} ekor
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{act.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatDistanceToNow(new Date(act.logged_at), { addSuffix: true, locale: id })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── LEADERBOARD + FORUM SUMMARY (2-col) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Leaderboard */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-2 border-b border-gray-50"
                style={{ background: "#1b6560" }}>
                <Award size={15} className="text-white" />
                <h2 className="font-bold text-white">Top Kontributor Bulan Ini</h2>
              </div>
              {leaderboard.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Belum ada data kontribusi</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {leaderboard.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          background: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : i === 2 ? "#cd7c3f" : "#e5e7eb",
                          color: i < 3 ? "white" : "#6b7280",
                        }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">{entry.name}</p>
                        <p className="text-xs text-gray-400">Petugas Lapangan</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-wali-700">{entry.fish.toLocaleString("id")}</p>
                        <p className="text-xs text-gray-400">ekor ikan</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Forum activity summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50"
                style={{ background: "#1b6560" }}>
                <div className="flex items-center gap-2">
                  <Flame size={15} className="text-white" />
                  <h2 className="font-bold text-white">Forum Paling Aktif</h2>
                </div>
                <Link href="/admin/laporan" className="text-xs text-white/70 hover:text-white font-medium">Lihat semua →</Link>
              </div>
              {forumTop.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <BarChart2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Belum ada laporan</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {forumTop.map((r: any) => (
                    <Link key={r.id} href={`/admin/laporan/${r.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <StatusBadge status={r.status} />
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: id })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {r.location_name || "Lokasi tidak tersedia"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-bold text-orange-500">{r.react_count ?? 0}</span>
                        <span className="text-xs text-gray-400">reaksi</span>
                        <UrgencyDisplay scale={r.urgency_scale} size="sm" showLabel={false} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── PETUGAS: assigned reports ── */}
      {isPetugas && assignedReports.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ background: "#1b6560" }}>
            <h2 className="font-bold text-white">Laporan Ditugaskan ke Anda</h2>
            <Link href="/admin/laporan" className="text-xs text-white/70 hover:text-white font-medium">Lihat semua →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {assignedReports.map((report: any) => (
              <Link key={report.id} href={`/admin/laporan/${report.id}`}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <StatusBadge status={report.status} />
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {report.location_name || "Lokasi tidak tersedia"}
                  </p>
                </div>
                <UrgencyDisplay scale={report.urgency_scale} size="sm" showLabel={false} />
                <Plus size={16} className="text-wali-500 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── PRIORITY QUEUE (all roles) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-wali-600" />
            {isPetugas ? "Laporan Prioritas Tinggi" : "Queue Prioritas Tinggi"}
            {wilayah && <span className="text-xs bg-wali-100 text-wali-700 px-2 py-0.5 rounded-full font-medium">Filter: {wilayah}</span>}
          </h2>
          <div className="flex items-center gap-2">
            <form method="GET" action="/admin/dashboard" className="flex items-center gap-2">
              <input
                name="wilayah"
                defaultValue={wilayah ?? ""}
                placeholder="Filter wilayah..."
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-wali-500 focus:border-wali-500 outline-none w-36"
              />
              <button type="submit" className="text-xs bg-wali-600 text-white px-3 py-1.5 rounded-lg hover:bg-wali-700 transition-colors font-medium">Cari</button>
              {wilayah && (
                <a href="/admin/dashboard" className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">✕</a>
              )}
            </form>
            <Link href="/admin/laporan" className="text-sm text-wali-600 hover:underline font-medium whitespace-nowrap">Lihat semua →</Link>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {topReports.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">Belum ada laporan</div>
          ) : topReports.map((report: any) => (
            <Link key={report.id} href={`/admin/laporan/${report.id}`}
              className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="shrink-0 w-10 h-10 rounded-xl overflow-hidden bg-gray-100">
                {report.photos?.[0]
                  ? <img src={report.photos[0]} alt="" className="w-full h-full object-cover" />
                  : <Fish className="w-5 h-5 m-2.5 text-gray-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <StatusBadge status={report.status} />
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={11} className="text-wali-400" />
                  <span className="truncate">{report.location_name || "Lokasi tidak tersedia"}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <UrgencyDisplay scale={report.urgency_scale} size="sm" showLabel={false} />
                <div className="text-right">
                  <p className="text-sm font-bold text-wali-700">{(report.priority_score || 0).toFixed(0)}</p>
                  <p className="text-xs text-gray-400">skor</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
