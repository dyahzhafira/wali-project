import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Fish, MapPin, Plus, CheckCircle, Clock, Award } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";
import PasswordChangeCard from "@/components/dashboard/PasswordChangeCard";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin_dinas: "Admin Dinas",
  petugas_lapangan: "Petugas Lapangan",
};

const ROLE_GRADIENT: Record<string, string> = {
  super_admin: "linear-gradient(135deg, #7c3aed 0%, #e6e9d8 100%)",
  admin_dinas: "linear-gradient(135deg, #1d4ed8 0%, #e6e9d8 100%)",
  petugas_lapangan: "linear-gradient(135deg, #066A5F 0%, #e6e9d8 100%)",
};

async function getProfileData(userId: string, userEmail?: string) {
  const supabase = await createClient();

  // Get admin user record, use auth user email as fallback if row not found
  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", userId)
    .single();

  const resolvedAdmin = adminUser ?? {
    id: userId,
    email: userEmail ?? "",
    full_name: userEmail?.split("@")[0] ?? "Admin",
    role: "admin_dinas" as const,
    created_at: new Date().toISOString(),
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  // Assigned reports
  const { data: assignedReports } = await supabase
    .from("reports")
    .select("id, location_name, status, urgency_scale, created_at, description")
    .eq("assigned_to", userId)
    .neq("status", "selesai")
    .order("urgency_scale", { ascending: false })
    .limit(10);

  // Progress logs by this officer
  const { data: myLogs } = await supabase
    .from("progress_logs")
    .select("id, report_id, description, fish_caught_count, logged_at, reports(location_name)")
    .eq("officer_id", userId)
    .order("logged_at", { ascending: false })
    .limit(20);

  const logs = myLogs ?? [];

  // Today's logs
  const todayLogs = logs.filter(l => new Date(l.logged_at) >= todayStart);

  // This month's fish caught
  const monthLogs = logs.filter(l => new Date(l.logged_at) >= monthStart);
  const monthFish = monthLogs.reduce((sum, l) => sum + (l.fish_caught_count || 0), 0);

  // Total fish caught all time
  const totalFish = logs.reduce((sum, l) => sum + (l.fish_caught_count || 0), 0);

  // Completed reports this month
  const { count: completedCount } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("assigned_to", userId)
    .eq("status", "selesai")
    .gte("created_at", monthStart.toISOString());

  return {
    adminUser: resolvedAdmin,
    assignedReports: assignedReports ?? [],
    recentLogs: logs.slice(0, 5),
    todayLogs,
    totalFish,
    monthFish,
    completedCount: completedCount ?? 0,
  };
}

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const data = await getProfileData(user.id, user.email);

  const { adminUser, assignedReports, recentLogs, todayLogs, totalFish, monthFish, completedCount } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Profile card */}
      <div className="rounded-3xl overflow-hidden shadow-lg mb-6">
        <div className="px-8 py-8 text-white relative overflow-hidden"
          style={{ background: ROLE_GRADIENT[adminUser.role] || ROLE_GRADIENT.petugas_lapangan }}>
          <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none">
            <Fish size={160} className="text-white" />
          </div>
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">
                {adminUser.full_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white drop-shadow">{adminUser.full_name}</h1>
            <p className="text-white/80 text-sm font-medium">{adminUser.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white backdrop-blur-sm">
              {ROLE_LABELS[adminUser.role] || adminUser.role}
            </span>
          </div>
        </div>

        {/* Today's contribution */}
        <div className="bg-white px-8 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Kontribusi Hari Ini</p>
            <p className="text-2xl font-bold text-wali-700 mt-0.5">
              {todayLogs.length} progress log
              {todayLogs.length > 0 && (
                <span className="text-base text-gray-500 font-medium ml-2">
                  · {todayLogs.reduce((s, l) => s + (l.fish_caught_count || 0), 0).toLocaleString("id")} ekor
                </span>
              )}
            </p>
          </div>
          {todayLogs.length === 0 && (
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Belum ada log hari ini</p>
              <Link href="/admin/laporan"
                className="btn-gradient text-white text-xs font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
                + Tambah Progress
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-4xl font-bold tabular-nums text-wali-700">{totalFish.toLocaleString("id")}</p>
          <p className="text-xs font-semibold text-gray-500 mt-1">Total Ikan Ditangkap</p>
          <p className="text-xs text-gray-400 mt-0.5">Sepanjang waktu</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-4xl font-bold tabular-nums text-blue-600">{monthFish.toLocaleString("id")}</p>
          <p className="text-xs font-semibold text-gray-500 mt-1">Ikan Bulan Ini</p>
          <p className="text-xs text-gray-400 mt-0.5">{format(new Date(), "MMMM yyyy", { locale: id })}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
          <p className="text-4xl font-bold tabular-nums text-green-600">{completedCount}</p>
          <p className="text-xs font-semibold text-gray-500 mt-1">Laporan Selesai</p>
          <p className="text-xs text-gray-400 mt-0.5">Bulan ini</p>
        </div>
      </div>

      {/* Account info + password change */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Info Akun</p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-semibold text-gray-800">{adminUser.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Role</p>
              <p className="text-sm font-semibold text-gray-800">{ROLE_LABELS[adminUser.role] || adminUser.role}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Bergabung</p>
              <p className="text-sm font-semibold text-gray-800">
                {format(new Date(adminUser.created_at), "d MMMM yyyy", { locale: id })}
              </p>
            </div>
          </div>
        </div>
        <PasswordChangeCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Assigned reports */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50"
            style={{ background: "#1b6560" }}>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Clock size={16} /> Laporan Ditugaskan
            </h2>
            <span className="text-xs font-bold text-white/70 bg-white/15 px-2 py-0.5 rounded-full">
              {assignedReports.length} aktif
            </span>
          </div>
          {assignedReports.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">Tidak ada laporan aktif yang ditugaskan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {assignedReports.map((report: any) => (
                <Link key={report.id} href={`/admin/laporan/${report.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {report.location_name || "Lokasi tidak tersedia"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id })}
                    </p>
                  </div>
                  <StatusBadge status={report.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent progress logs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-50"
            style={{ background: "#1b6560" }}>
            <h2 className="font-bold text-white flex items-center gap-2">
              <Award size={16} /> Log Progress Terbaru
            </h2>
          </div>
          {recentLogs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Fish className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">Belum ada progress log</p>
              <Link href="/admin/laporan"
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-wali-600 hover:underline">
                <Plus size={12} /> Tambah progress pertama
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin size={11} className="text-wali-500" />
                      <span className="truncate max-w-36">
                        {(log.reports as any)?.location_name || "Lokasi tidak tersedia"}
                      </span>
                    </div>
                    {(log.fish_caught_count ?? 0) > 0 && (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        🐟 {log.fish_caught_count?.toLocaleString("id")} ekor
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">{log.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {format(new Date(log.logged_at), "d MMM yyyy, HH:mm", { locale: id })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
