import { createClient, createServiceClient } from "@/lib/supabase/server";
import { Report } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const sort = searchParams.get("sort") ?? "created_at";
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);
  const location = searchParams.get("location");

  const supabase = await createClient();

  let query = supabase
    .from("reports")
    .select(
      `
      *,
      assigned_user:admin_users!assigned_to(full_name),
      situation_comments(type)
    `,
      { count: "exact" }
    )
    .order(sort === "priority_score" ? "priority_score" : "created_at", {
      ascending: false,
    })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }
  if (location) {
    query = query.ilike("location_name", `%${location}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const reports = (data ?? []).map((row: any) => {
    const comments: { type: string }[] = row.situation_comments ?? [];
    const comment_counts = {
      still_there: comments.filter((c) => c.type === "still_there").length,
      increasing: comments.filter((c) => c.type === "increasing").length,
      decreasing: comments.filter((c) => c.type === "decreasing").length,
      gone: comments.filter((c) => c.type === "gone").length,
    };
    const { situation_comments, ...rest } = row;
    return { ...rest, comment_counts };
  });

  return Response.json({ reports, total: count ?? 0 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    source,
    photos,
    description,
    location_lat,
    location_lng,
    location_name,
    water_body_type,
    urgency_scale,
    reporter_email,
    telegram_user_id,
  } = body;

  const supabase = await createServiceClient();

  // Skip rate limit for authenticated dinas/admin users
  const authClient = await createClient();
  const { data: { user: authUser } } = await authClient.auth.getUser();
  const isDinasUser = !!authUser;

  // ── CEK RATE LIMIT berbasis IP (hanya public web, bukan admin/telegram) ──
  // Pakai tabel rate_limits — counter HANYA ditambah setelah insert laporan sukses.
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (!isDinasUser && source !== "telegram") {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("fingerprint_hash", clientIp)
      .eq("action", "create_report")
      .gte("created_at", since);

    if ((count ?? 0) >= 10) {
      return Response.json(
        { error: "Batas laporan harian tercapai (10/hari). Coba lagi besok." },
        { status: 429 }
      );
    }
  }

  // ── INSERT LAPORAN ──
  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      source,
      photos: photos ?? [],
      description,
      location_lat,
      location_lng,
      location_name,
      water_body_type,
      urgency_scale,
      reporter_email,
      telegram_user_id: telegram_user_id ?? null,
      status: isDinasUser ? "terverifikasi" : "baru",
      verified_at: isDinasUser ? new Date().toISOString() : null,
      react_count: 0,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // ── CATAT RATE LIMIT — hanya setelah insert berhasil ──
  if (!isDinasUser && source !== "telegram") {
    await supabase.from("rate_limits").insert({
      fingerprint_hash: clientIp,
      action: "create_report",
    });
  }

  return Response.json({ report }, { status: 201 });
}
