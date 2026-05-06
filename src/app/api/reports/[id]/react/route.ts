import { createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { fingerprint_hash } = await request.json();

  if (!fingerprint_hash) {
    return Response.json({ error: "fingerprint_hash diperlukan" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Rate limit: max 25 new likes per 24h per fingerprint (un-like doesn't count toward limit)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: likeCount } = await supabase
    .from("reacts")
    .select("*", { count: "exact", head: true })
    .eq("fingerprint_hash", fingerprint_hash)
    .gte("created_at", since);

  // Check if react already exists
  const { data: existing } = await supabase
    .from("reacts")
    .select("id")
    .eq("report_id", id)
    .eq("fingerprint_hash", fingerprint_hash)
    .maybeSingle();

  let reacted: boolean;

  if (existing) {
    await supabase.from("reacts").delete().eq("id", existing.id);
    const { error: rpcErr } = await supabase.rpc("decrement_react_count", { report_id: id });
    if (rpcErr) {
      const { data: cur } = await supabase.from("reports").select("react_count").eq("id", id).single();
      await supabase.from("reports").update({ react_count: Math.max(0, (cur?.react_count ?? 1) - 1) }).eq("id", id);
    }
    reacted = false;
  } else {
    if ((likeCount ?? 0) >= 25) {
      return Response.json({ error: "Batas like harian tercapai (25/hari)." }, { status: 429 });
    }
    await supabase.from("reacts").insert({ report_id: id, fingerprint_hash });
    const { error: rpcErr } = await supabase.rpc("increment_react_count", { report_id: id });
    if (rpcErr) {
      const { data: cur } = await supabase.from("reports").select("react_count").eq("id", id).single();
      await supabase.from("reports").update({ react_count: (cur?.react_count ?? 0) + 1 }).eq("id", id);
    }
    reacted = true;
  }

  const { data: report } = await supabase
    .from("reports")
    .select("react_count")
    .eq("id", id)
    .single();

  return Response.json({ reacted, react_count: report?.react_count ?? 0 });
}
