import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ReportStatus } from "@/types";
import { notifyReporterStatusChange } from "@/lib/telegram/notify";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Auth check via session client
  const authClient = await createClient();
  const {
    data: { user },
    error: authError,
  } = await authClient.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Tidak terautentikasi" }, { status: 401 });
  }

  const { status, assigned_to, note } = await request.json();

  const VALID_STATUSES: ReportStatus[] = [
    "baru",
    "terverifikasi",
    "proses",
    "selesai",
    "dismissed",
  ];

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const updatePayload: Record<string, unknown> = { status };
  if (assigned_to !== undefined) updatePayload.assigned_to = assigned_to;
  if (status === "terverifikasi") updatePayload.verified_at = new Date().toISOString();

  const { data: report, error } = await supabase
    .from("reports")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (!report) {
    return Response.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
  }

  // Log the action
  await supabase.from("progress_logs").insert({
    report_id: id,
    officer_id: user.id,
    photos: [],
    description: note ?? `Status diubah menjadi: ${status}`,
    logged_at: new Date().toISOString(),
  });

  // Telegram notification for reporters who used the bot
  if (report.telegram_user_id) {
    void notifyReporterStatusChange(
      report.telegram_user_id,
      id,
      status,
      report.location_name
    );
  }

  return Response.json({ report });
}
