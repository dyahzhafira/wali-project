import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Try by UUID first, fall back to unique_token
  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      id
    );

  let query = supabase
    .from("reports")
    .select(
      `
      *,
      assigned_user:admin_users!assigned_to(full_name),
      progress_logs(*, admin_users(full_name)),
      situation_comments(type, id, created_at, fingerprint_hash)
    `
    );

  if (isUUID) {
    query = query.eq("id", id);
  } else {
    query = query.eq("unique_token", id);
  }

  const { data: row, error } = await query.maybeSingle();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!row) {
    return Response.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  const comments: { type: string }[] = row.situation_comments ?? [];
  const comment_counts = {
    still_there: comments.filter((c: any) => c.type === "still_there").length,
    increasing: comments.filter((c: any) => c.type === "increasing").length,
    decreasing: comments.filter((c: any) => c.type === "decreasing").length,
    gone: comments.filter((c: any) => c.type === "gone").length,
  };

  const { situation_comments, ...rest } = row;
  const report = { ...rest, comment_counts };

  return Response.json({ report });
}
