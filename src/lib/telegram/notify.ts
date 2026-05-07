const clean = (s?: string) => (s ?? "").replace(/^﻿/, "");
const TOKEN = clean(process.env.TELEGRAM_BOT_TOKEN);
const BASE = `https://api.telegram.org/bot${TOKEN}`;

const STATUS_MESSAGES: Record<string, string> = {
  terverifikasi: "✅ *Laporan Anda telah diverifikasi* oleh dinas terkait dan akan segera ditindaklanjuti.",
  proses: "🔧 *Laporan Anda sedang ditangani* oleh petugas lapangan.",
  selesai: "🎉 *Laporan Anda telah selesai ditangani!* Terima kasih telah membantu menjaga ekosistem perairan.",
  dismissed: "❌ *Laporan Anda tidak dapat diproses* saat ini. Silakan hubungi dinas setempat untuk informasi lebih lanjut.",
};

export async function notifyReporterStatusChange(
  telegramUserId: string,
  reportId: string,
  newStatus: string,
  locationName?: string
) {
  if (!TOKEN || !telegramUserId) return;

  const statusMsg = STATUS_MESSAGES[newStatus];
  if (!statusMsg) return;

  const location = locationName ? `\n📍 Lokasi: *${locationName}*` : "";
  const appUrl = clean(process.env.NEXT_PUBLIC_APP_URL) || "https://wali-lake.vercel.app";
  const text = `🐟 *Update Laporan WALI*\n\n${statusMsg}${location}\n\n[Lihat detail laporan](${appUrl}/laporan/${reportId})`;

  try {
    await fetch(`${BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramUserId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // Non-blocking, don't fail the main request if Telegram is down
  }
}
