import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check
  const authClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { photos, description, fish_caught_count, logged_at } =
    await request.json();

  const supabase = await createServiceClient();

  // Fetch current report status
  const { data: currentReport } = await supabase
    .from("reports")
    .select("status")
    .eq("id", id)
    .single();

  if (!currentReport) {
    return Response.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  const { data: log, error } = await supabase
    .from("progress_logs")
    .insert({
      report_id: id,
      officer_id: user.id,
      photos: photos ?? [],
      description,
      fish_caught_count: fish_caught_count ?? null,
      logged_at: logged_at ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Auto-advance status from terverifikasi → proses when a log is added
  if (currentReport.status === "terverifikasi") {
    await supabase
      .from("reports")
      .update({ status: "proses" })
      .eq("id", id);
  }

  return Response.json({ log }, { status: 201 });
}
