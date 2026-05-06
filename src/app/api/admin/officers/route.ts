import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const authClient = await createClient();
  const { data: { user }, error } = await authClient.auth.getUser();
  if (error || !user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServiceClient();
  const { data, error: dbErr } = await supabase
    .from("admin_users")
    .select("id, full_name, role")
    .eq("role", "petugas_lapangan")
    .order("full_name");

  if (dbErr) return Response.json({ officers: [] });
  return Response.json({ officers: data ?? [] });
}
