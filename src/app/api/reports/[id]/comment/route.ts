import { createServiceClient } from "@/lib/supabase/server";
import { SituationCommentType } from "@/types";

const VALID_TYPES: SituationCommentType[] = [
  "still_there",
  "increasing",
  "decreasing",
  "gone",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { type, fingerprint_hash } = await request.json();

  if (!fingerprint_hash) {
    return Response.json({ error: "fingerprint_hash diperlukan" }, { status: 400 });
  }

  if (!VALID_TYPES.includes(type)) {
    return Response.json({ error: "Tipe komentar tidak valid" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Rate limit: max 5 comments per 24h per fingerprint_hash
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("situation_comments")
    .select("*", { count: "exact", head: true })
    .eq("fingerprint_hash", fingerprint_hash)
    .gte("created_at", since);

  if ((count ?? 0) >= 5) {
    return Response.json(
      { error: "Terlalu banyak komentar. Coba lagi dalam 24 jam." },
      { status: 429 }
    );
  }

  const { data: comment, error } = await supabase
    .from("situation_comments")
    .insert({ report_id: id, type, fingerprint_hash })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Update priority score via RPC
  await supabase.rpc("update_priority_score", { report_id: id });

  return Response.json({ comment }, { status: 201 });
}
