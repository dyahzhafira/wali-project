import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Bell, MapPin, Clock, CheckCircle, AlertTriangle, Fish } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/Badge";

const URGENCY_COLOR: Record<number, string> = {
  1: "#10b981", 2: "#84cc16", 3: "#f59e0b", 4: "#f97316", 5: "#BA1A1A",
};

async function getNotifications() {
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // New reports today (need verification)
  const { data: newToday } = await supabase
    .from("reports")
    .select("id, location_name, description, urgency_scale, status, created_at, photos")
    .eq("status", "baru")
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false });

  // All unverified reports (backlog)
  const { data: unverified, count: unverifiedCount } = await supabase
    .from("reports")
    .select("id, location_name, description, urgency_scale, status, created_at, photos", { count: "exact" })
    .eq("status", "baru")
    .order("urgency_scale", { ascending: false })
    .limit(20);

  // Recent status changes (last 24h, not "baru")
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentUpdates } = await supabase
    .from("reports")
    .select("id, location_name, status, urgency_scale, created_at")
    .neq("status", "baru")
    .gte("created_at", since24h)
    .order("created_at", { ascending: false })
    .limit(10);

  return {
    newToday: newToday ?? [],
    unverified: unverified ?? [],
    unverifiedCount: unverifiedCount ?? 0,
    recentUpdates: recentUpdates ?? [],
  };
}

export default async function NotifikasiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { newToday, unverified, unverifiedCount, recentUpdates } = await getNotifications();

  const todayStr = format(new Date(), "EEEE, d MMMM yyyy", { locale: id });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-wali-700 flex items-center justify-center shadow-sm">
          <Bell size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifikasi Harian</h1>
          <p className="text-sm text-gray-500">{todayStr}</p>
        </div>
        {unverifiedCount > 0 && (
          <span className="ml-auto bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full">
            {unverifiedCount} perlu verifikasi
          </span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600 tabular-nums">{newToday.length}</p>
          <p className="text-sm font-semibold text-red-700 mt-1">Laporan Baru Hari Ini</p>
        </div>
        <div className="bg-wali-50 border border-wali-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-wali-700 tabular-nums">{unverifiedCount}</p>
          <p className="text-sm font-semibold text-wali-700 mt-1">Belum Diverifikasi</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600 tabular-nums">{recentUpdates.length}</p>
          <p className="text-sm font-semibold text-blue-700 mt-1">Update 24 Jam Terakhir</p>
        </div>
      </div>

      {/* New reports today */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-red-500" />
          <h2 className="text-lg font-bold text-gray-900">Laporan Baru Hari Ini</h2>
          <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
            {newToday.length} laporan
          </span>
        </div>

        {newToday.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">Tidak ada laporan baru hari ini</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {newToday.map((report: any) => (
              <Link key={report.id} href={`/admin/laporan/${report.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex gap-4 p-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                  {report.photos?.[0]
                    ? <img src={report.photos[0]} alt="" className="w-full h-full object-cover" />
                    : <Fish className="w-7 h-7 text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">BARU</span>
                    <div className="w-3 h-3 rounded-full border border-white/60"
                      style={{ background: URGENCY_COLOR[report.urgency_scale] || "#f59e0b" }} />
                    <span className="text-xs text-gray-400 font-medium">
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id })}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {report.location_name || "Lokasi tidak tersedia"}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{report.description}</p>
                </div>
                <div className="text-xs text-wali-600 font-semibold shrink-0 self-center">Verifikasi →</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Unverified backlog */}
      {unverifiedCount > newToday.length && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-wali-600" />
              <h2 className="text-lg font-bold text-gray-900">Backlog Belum Diverifikasi</h2>
            </div>
            <Link href="/admin/laporan?status=baru"
              className="text-sm text-wali-600 font-semibold hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {unverified.filter((r: any) => !newToday.find((n: any) => n.id === r.id)).slice(0, 8).map((report: any) => (
              <Link key={report.id} href={`/admin/laporan/${report.id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3 px-4 py-3">
                <div className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: URGENCY_COLOR[report.urgency_scale] || "#f59e0b" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {report.location_name || "Lokasi tidak tersedia"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(report.created_at), "d MMM yyyy, HH:mm", { locale: id })}
                  </p>
                </div>
                <StatusBadge status={report.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent status updates */}
      {recentUpdates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={16} className="text-green-500" />
            <h2 className="text-lg font-bold text-gray-900">Update Status 24 Jam Terakhir</h2>
          </div>
          <div className="flex flex-col gap-2">
            {recentUpdates.map((report: any) => (
              <Link key={report.id} href={`/admin/laporan/${report.id}`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {report.location_name || "Lokasi tidak tersedia"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id })}
                  </p>
                </div>
                <StatusBadge status={report.status} />
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
