// Telegram webhook handler for WALI bot
// Conversation state is stored in a module-level Map (acceptable for MVP)

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://wali.vercel.app";

type ConversationStep =
  | "idle"
  | "await_photo"
  | "await_location"
  | "await_description"
  | "await_urgency";

interface ConversationState {
  step: ConversationStep;
  photos: string[];
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  description?: string;
}

// Module-level conversation state Map keyed by telegram_user_id
const conversationState = new Map<string, ConversationState>();

async function sendMessage(chatId: number | string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function getPhotoUrl(fileId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    const data = await res.json();
    if (!data.ok || !data.result?.file_path) return null;
    return `https://api.telegram.org/file/bot${BOT_TOKEN}/${data.result.file_path}`;
  } catch { return null; }
}

function getState(userId: string): ConversationState {
  return conversationState.get(userId) ?? { step: "idle", photos: [] };
}

function setState(userId: string, state: ConversationState) {
  conversationState.set(userId, state);
}

function clearState(userId: string) {
  conversationState.delete(userId);
}

async function handleUpdate(update: any) {
  const message = update.message;
  if (!message) return;

  const chatId: number = message.chat.id;
  const userId = String(message.from?.id ?? chatId);
  const text: string = message.text ?? "";
  const state = getState(userId);

  // --- Handle commands ---
  if (text.startsWith("/lapor")) {
    setState(userId, { step: "await_photo", photos: [] });
    await sendMessage(
      chatId,
      "📸 <b>Langkah 1/4 — Foto</b>\n\nKirimkan foto ikan sapu-sapu yang Anda temukan. Anda bisa kirim lebih dari satu foto."
    );
    return;
  }

  if (text.startsWith("/status")) {
    const token = text.split(" ")[1]?.trim();
    if (!token) {
      await sendMessage(chatId, "Gunakan: /status TOKEN_LAPORAN");
      return;
    }
    const res = await fetch(`${BASE_URL}/api/reports/${token}`);
    if (!res.ok) {
      await sendMessage(chatId, "❌ Laporan tidak ditemukan. Periksa token Anda.");
      return;
    }
    const { report } = await res.json();
    await sendMessage(
      chatId,
      `📋 <b>Status Laporan</b>\n\nToken: <code>${report.unique_token}</code>\nStatus: <b>${report.status}</b>\nLokasi: ${report.location_name ?? "Tidak disebutkan"}\nDilaporkan: ${new Date(report.created_at).toLocaleDateString("id-ID")}`
    );
    return;
  }

  if (text.startsWith("/notif")) {
    const arg = text.split(" ")[1]?.trim().toLowerCase();
    if (arg === "on") {
      await sendMessage(chatId, "🔔 Notifikasi diaktifkan. Anda akan mendapat update laporan Anda.");
    } else if (arg === "off") {
      await sendMessage(chatId, "🔕 Notifikasi dinonaktifkan.");
    } else {
      await sendMessage(chatId, "Gunakan: /notif on atau /notif off");
    }
    return;
  }

  if (text === "/info") {
    await sendMessage(
      chatId,
      `ℹ️ <b>Tentang Ikan Sapu-Sapu (Pterygoplichthys)</b>\n\nIkan sapu-sapu adalah ikan air tawar invasif yang berasal dari Amerika Selatan. Ikan ini dapat:\n• Merusak ekosistem sungai lokal\n• Bersaing dengan ikan endemik untuk makanan\n• Berkembang biak dengan sangat cepat\n• Mengganggu aktivitas nelayan\n\nLaporkan keberadaannya dengan /lapor agar petugas dapat menanganinya.`
    );
    return;
  }

  if (text === "/bantuan" || text === "/start") {
    await sendMessage(
      chatId,
      `🐟 <b>Selamat datang di WALI Bot!</b>\n\nWALI membantu melaporkan ikan sapu-sapu invasif di perairan Jakarta.\n\n<b>Perintah:</b>\n/lapor — Buat laporan baru\n/status TOKEN — Cek status laporan\n/notif on|off — Atur notifikasi\n/info — Info tentang ikan sapu-sapu\n/bantuan — Tampilkan perintah ini`
    );
    return;
  }

  // --- Handle conversation flow ---

  if (state.step === "await_photo") {
    if (message.photo || message.document) {
      const fileId: string = message.photo
        ? message.photo[message.photo.length - 1].file_id
        : message.document.file_id;

      const photoUrl = await getPhotoUrl(fileId);
      const updatedPhotos = photoUrl ? [...state.photos, photoUrl] : state.photos;
      setState(userId, { ...state, photos: updatedPhotos });

      // If user sends another photo, accumulate; detect via caption or wait for text
      const photoMsg = photoUrl
        ? `✅ Foto diterima (${updatedPhotos.length}).`
        : `⚠️ Foto tidak dapat diproses, lanjut tanpa foto.`;
      await sendMessage(
        chatId,
        `${photoMsg} Kirim foto lagi atau lanjut ke lokasi.\n\n📍 <b>Langkah 2/4 — Lokasi</b>\n\nBagikan lokasi Anda menggunakan tombol Attachment → Location, atau ketik nama lokasi (contoh: Sungai Ciliwung, Depok).`
      );
      setState(userId, { ...state, photos: updatedPhotos, step: "await_location" });
    } else {
      await sendMessage(chatId, "Mohon kirimkan foto terlebih dahulu.");
    }
    return;
  }

  if (state.step === "await_location") {
    if (message.location) {
      setState(userId, {
        ...state,
        location_lat: message.location.latitude,
        location_lng: message.location.longitude,
        location_name: "Lokasi dibagikan via Telegram",
        step: "await_description",
      });
    } else if (text) {
      setState(userId, {
        ...state,
        location_lat: 0,
        location_lng: 0,
        location_name: text,
        step: "await_description",
      });
    } else {
      await sendMessage(chatId, "Mohon bagikan lokasi atau ketik nama lokasi.");
      return;
    }
    await sendMessage(
      chatId,
      "✅ Lokasi diterima.\n\n📝 <b>Langkah 3/4 — Deskripsi</b>\n\nDeskripsikan situasinya (contoh: banyak ikan sapu-sapu di pinggir sungai, kira-kira 20 ekor)."
    );
    return;
  }

  if (state.step === "await_description") {
    if (!text) {
      await sendMessage(chatId, "Mohon ketik deskripsi situasi.");
      return;
    }
    setState(userId, { ...state, description: text, step: "await_urgency" });
    await sendMessage(
      chatId,
      "✅ Deskripsi diterima.\n\n⚠️ <b>Langkah 4/4 — Tingkat Urgensi</b>\n\nPilih angka 1–5 sesuai perkiraan jumlah ikan:\n1 — 1–5 Ekor (belum mengganggu)\n2 — 5–20 Ekor (mulai terlihat)\n3 — 20–50 Ekor (cukup banyak)\n4 — 50–100 Ekor (mendominasi area)\n5 — &gt;100 Ekor / seluruh perairan terdampak"
    );
    return;
  }

  if (state.step === "await_urgency") {
    const urgency = parseInt(text, 10);
    if (isNaN(urgency) || urgency < 1 || urgency > 5) {
      await sendMessage(chatId, "Masukkan angka antara 1 sampai 5.");
      return;
    }

    // Submit report to /api/reports
    const reportPayload = {
      source: "telegram",
      photos: state.photos,
      description: state.description ?? "",
      location_lat: state.location_lat ?? 0,
      location_lng: state.location_lng ?? 0,
      location_name: state.location_name ?? "",
      urgency_scale: urgency,
      telegram_user_id: userId,
      fingerprint_hash: `tg_${userId}`,
    };

    clearState(userId);

    const res = await fetch(`${BASE_URL}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportPayload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      await sendMessage(
        chatId,
        `❌ Gagal membuat laporan: ${errData.error ?? "Terjadi kesalahan server."}`
      );
      return;
    }

    const { report } = await res.json();
    await sendMessage(
      chatId,
      `✅ <b>Laporan berhasil dibuat!</b>\n\nToken laporan Anda: <code>${report.unique_token}</code>\n\nGunakan /status ${report.unique_token} untuk cek perkembangan laporan.\n\nTerima kasih sudah membantu menjaga perairan Jakarta! 🌊`
    );
    return;
  }

  // Default fallback
  await sendMessage(
    chatId,
    "Ketik /bantuan untuk melihat daftar perintah yang tersedia."
  );
}

export async function POST(request: Request) {
  // Verify Telegram secret token if configured
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  if (
    process.env.TELEGRAM_WEBHOOK_SECRET &&
    secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = await request.json();

  // Process asynchronously — respond 200 immediately to Telegram
  handleUpdate(update).catch(console.error);

  return Response.json({ ok: true });
}
