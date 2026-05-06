import { createClient } from "@/lib/supabase/server";
import { Stats } from "@/types";

export async function GET() {
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [totalResult, activeResult, todayResult, inProgressResult, doneThisMonthResult, unverifiedResult] =
    await Promise.all([
      supabase.from("reports").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("*", { count: "exact", head: true }).in("status", ["baru", "terverifikasi", "proses"]),
      supabase.from("reports").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "proses"),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "selesai").gte("created_at", monthStart),
      supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "baru"),
    ]);

  const stats = {
    total_reports: totalResult.count ?? 0,
    active_reports: activeResult.count ?? 0,
    reports_today: todayResult.count ?? 0,
    reports_in_progress: inProgressResult.count ?? 0,
    reports_done_this_month: doneThisMonthResult.count ?? 0,
    unverified: unverifiedResult.count ?? 0,
  };

  return Response.json(stats);
}
