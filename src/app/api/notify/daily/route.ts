import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  // Protect with a shared secret header
  const secret = request.headers.get("x-notify-secret");
  if (!secret || secret !== process.env.NOTIFY_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Count today's new reports
  const { count: todayCount } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  // Get distinct reporter emails
  const { data: reporters } = await supabase
    .from("reports")
    .select("reporter_email")
    .not("reporter_email", "is", null);

  const emails: string[] = [
    ...new Set(
      (reporters ?? [])
        .map((r: { reporter_email: string | null }) => r.reporter_email)
        .filter(Boolean) as string[]
    ),
  ];

  if (emails.length === 0) {
    return Response.json({ sent: 0 });
  }

  const dateStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  let sent = 0;
  for (const email of emails) {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "WALI <noreply@wali.id>",
      to: email,
      subject: `Ringkasan Harian WALI — ${dateStr}`,
      text: `${todayCount ?? 0} laporan baru masuk hari ini. Pantau laporan Anda di link yang sudah diberikan sebelumnya.`,
    });
    if (!error) sent++;
  }

  return Response.json({ sent });
}
