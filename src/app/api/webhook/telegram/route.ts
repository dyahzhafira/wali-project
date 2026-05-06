const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://wali-lake.vercel.app";

type ConversationStep =
  | "idle"
  | "await_photo"
  | "await_location"
  | "await_water_body"
  | "await_description"
  | "await_urgency";

interface ConversationState {
  step: ConversationStep;
  photos: string[];
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  water_body_type?: string;
  description?: string;
}

const conversationState = new Map<string, ConversationState>();

// ─── Telegram API helpers ─────────────────────────────────────────────────────

async function sendMessage(chatId: number | string, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

async function answerCallback(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

async function downloadAndStorePhoto(fileId: string): Promise<string | null> {
  try {
    // 1. Get Telegram file path
    const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();
    if (!fileData.ok || !fileData.result?.file_path) return null;
    const telegramUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;

    // 2. Download photo bytes from Telegram
    const photoRes = await fetch(telegramUrl);
    if (!photoRes.ok) return null;
    const buffer = await photoRes.arrayBuffer();

    // 3. Upload to Supabase Storage so it persists permanently
    const { createServiceClient } = await import("@/lib/supabase/server");
    const supabase = await createServiceClient();
    const filename = `tg_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const { data, error } = await supabase.storage
      .from("report-photos")
      .upload(filename, buffer, { contentType: "image/jpeg" });

    if (error || !data) return telegramUrl; // fallback to Telegram URL if upload fails

    const { data: { publicUrl } } = supabase.storage.from("report-photos").getPublicUrl(data.path);
    return publicUrl;
  } catch { return null; }
}

// ─── State helpers ────────────────────────────────────────────────────────────

function getState(userId: string): ConversationState {
  return conversationState.get(userId) ?? { step: "idle", photos: [] };
}
function setState(userId: string, state: ConversationState) {
  conversationState.set(userId, state);
}
function clearState(userId: string) {
  conversationState.delete(userId);
}

// ─── Inline keyboards ─────────────────────────────────────────────────────────

const WATER_BODY_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "🏞 Sungai",  callback_data: "wb:sungai"  },
      { text: "🏔 Danau",   callback_data: "wb:danau"   },
      { text: "🏊 Kolam",   callback_data: "wb:kolam"   },
    ],
    [
      { text: "💧 Parit",   callback_data: "wb:parit"   },
      { text: "🌊 Lainnya", callback_data: "wb:lainnya" },
      { text: "⏭ Lewati",  callback_data: "wb:skip"    },
    ],
  ],
};

const URGENCY_KEYBOARD = {
  inline_keyboard: [
    [
      { text: "1 — Rendah (1–5 ekor)",            callback_data: "urg:1" },
    ],
    [
      { text: "2 — Sedang (5–20 ekor)",            callback_data: "urg:2" },
    ],
    [
      { text: "3 — Cukup Tinggi (20–50 ekor)",     callback_data: "urg:3" },
    ],
    [
      { text: "4 — Tinggi (50–100 ekor)",          callback_data: "urg:4" },
    ],
    [
      { text: "5 — Darurat (>100 ekor / masif)",   callback_data: "urg:5" },
    ],
  ],
};

// ─── Step messages ─────────────────────────────────────────────────────────────

async function askPhoto(chatId: number | string) {
  await sendMessage(chatId,
    `📸 <b>Langkah 1 dari 5 — Foto</b>\n\n` +
    `Kirimkan <b>foto ikan sapu-sapu</b> yang Anda temukan.\n\n` +
    `Tips foto yang baik:\n` +
    `• Ambil dari jarak dekat agar ikan terlihat jelas\n` +
    `• Sertakan latar belakang lokasi (sungai, tepi kali, dll.)\n` +
    `• Bisa kirim lebih dari 1 foto\n\n` +
    `Kirim foto sekarang, lalu ketik <b>lanjut</b> jika sudah selesai.`
  );
}

async function askLocation(chatId: number | string, photoCount: number) {
  await sendMessage(chatId,
    `✅ <b>${photoCount} foto diterima.</b>\n\n` +
    `📍 <b>Langkah 2 dari 5 — Lokasi</b>\n\n` +
    `Bagikan lokasi penemuan ikan dengan salah satu cara:\n\n` +
    `<b>Cara 1 (Akurat):</b> Tekan ikon 📎 Attachment → <b>Location</b> → Share My Location\n\n` +
    `<b>Cara 2 (Manual):</b> Ketik nama lokasi secara lengkap.\n` +
    `Contoh: <i>Kali Ciliwung dekat Jembatan Manggarai, Jakarta Selatan</i>`
  );
}

async function askWaterBody(chatId: number | string) {
  await sendMessage(chatId,
    `✅ <b>Lokasi diterima.</b>\n\n` +
    `💧 <b>Langkah 3 dari 5 — Jenis Perairan</b>\n\n` +
    `Pilih jenis badan air tempat Anda menemukan ikan:`,
    { reply_markup: WATER_BODY_KEYBOARD }
  );
}

async function askDescription(chatId: number | string) {
  await sendMessage(chatId,
    `✅ <b>Jenis perairan dicatat.</b>\n\n` +
    `📝 <b>Langkah 4 dari 5 — Deskripsi Situasi</b>\n\n` +
    `Ceritakan kondisi ikan yang Anda temukan. Semakin detail semakin baik.\n\n` +
    `Yang perlu dicantumkan:\n` +
    `• Perkiraan jumlah ikan\n` +
    `• Perilaku ikan (diam, aktif, bergerombol, dll.)\n` +
    `• Kondisi air (jernih, keruh, berbau, dll.)\n` +
    `• Informasi tambahan lain yang relevan\n\n` +
    `Contoh: <i>Sekitar 30 ekor ikan sapu-sapu bergerombol di pinggir kali. Air terlihat keruh kecoklatan dan berbau tidak sedap.</i>`
  );
}

async function askUrgency(chatId: number | string) {
  await sendMessage(chatId,
    `✅ <b>Deskripsi diterima.</b>\n\n` +
    `⚠️ <b>Langkah 5 dari 5 — Tingkat Urgensi</b>\n\n` +
    `Pilih tingkat urgensi berdasarkan <b>perkiraan jumlah ikan</b> yang Anda lihat:`,
    { reply_markup: URGENCY_KEYBOARD }
  );
}

// ─── Submit report ─────────────────────────────────────────────────────────────

async function submitReport(chatId: number | string, userId: string, state: ConversationState, urgency: number) {
  clearState(userId);

  const res = await fetch(`${BASE_URL}/api/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "telegram",
      photos: state.photos,
      description: state.description ?? "",
      location_lat: state.location_lat ?? 0,
      location_lng: state.location_lng ?? 0,
      location_name: state.location_name ?? "",
      water_body_type: state.water_body_type,
      urgency_scale: urgency,
      telegram_user_id: userId,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    await sendMessage(chatId,
      `❌ <b>Laporan gagal terkirim.</b>\n\n` +
      `${err.error ?? "Terjadi kesalahan pada server."}\n\n` +
      `Coba lagi dengan /lapor.`
    );
    return;
  }

  const { report } = await res.json();
  const token = report.unique_token ?? report.id;

  await sendMessage(chatId,
    `✅ <b>Laporan berhasil dikirim!</b>\n\n` +
    `🎫 <b>Token Laporan Anda:</b>\n<code>${token}</code>\n\n` +
    `Simpan token ini untuk memantau perkembangan laporan.\n\n` +
    `📋 <b>Ringkasan:</b>\n` +
    `• Lokasi: ${state.location_name ?? "Koordinat dibagikan"}\n` +
    `• Jenis perairan: ${state.water_body_type ?? "Tidak disebutkan"}\n` +
    `• Urgensi: ${urgency}/5\n` +
    `• Foto: ${state.photos.length} foto\n\n` +
    `Gunakan perintah berikut untuk cek status:\n` +
    `/status ${token}\n\n` +
    `Terima kasih telah membantu menjaga perairan kita! 🌊`
  );
}

// ─── Command handlers ──────────────────────────────────────────────────────────

async function handleStart(chatId: number | string, firstName?: string) {
  await sendMessage(chatId,
    `🐟 <b>Selamat datang di WALI Bot${firstName ? `, ${firstName}` : ""}!</b>\n\n` +
    `WALI (<b>Warga Andil Lawan Invasif</b>) adalah platform pelaporan ikan sapu-sapu invasif yang menghubungkan warga dengan Dinas Lingkungan Hidup.\n\n` +
    `<b>Apa yang bisa kamu lakukan di sini?</b>\n` +
    `📸 Laporkan temuan ikan sapu-sapu di sekitarmu\n` +
    `📍 Tandai lokasi penemuan secara akurat\n` +
    `📋 Pantau status penanganan laporanmu\n\n` +
    `<b>Daftar Perintah:</b>\n` +
    `/lapor — Buat laporan baru\n` +
    `/status <code>TOKEN</code> — Cek status laporan\n` +
    `/notif <code>on|off</code> — Atur notifikasi update\n` +
    `/info — Info tentang ikan sapu-sapu invasif\n` +
    `/bantuan — Tampilkan pesan ini\n\n` +
    `Ketik /lapor untuk mulai melaporkan! 👇`
  );
}

async function handleBantuan(chatId: number | string) {
  await sendMessage(chatId,
    `📖 <b>Panduan Lengkap WALI Bot</b>\n\n` +
    `<b>🐟 /lapor</b>\n` +
    `Membuat laporan baru. Bot akan memandu kamu melalui 5 langkah:\n` +
    `1. Kirim foto ikan\n` +
    `2. Bagikan lokasi\n` +
    `3. Pilih jenis perairan\n` +
    `4. Deskripsikan situasi\n` +
    `5. Pilih tingkat urgensi\n\n` +
    `<b>📋 /status TOKEN</b>\n` +
    `Cek status laporan berdasarkan token yang diterima setelah laporan berhasil dikirim.\n` +
    `Contoh: <code>/status ABC123</code>\n\n` +
    `<b>🔔 /notif on|off</b>\n` +
    `Aktifkan atau nonaktifkan notifikasi perkembangan laporan.\n` +
    `Contoh: <code>/notif on</code>\n\n` +
    `<b>ℹ️ /info</b>\n` +
    `Informasi lengkap tentang ikan sapu-sapu invasif dan dampaknya.\n\n` +
    `<b>📌 Tips Pelaporan:</b>\n` +
    `• Foto dari dekat agar ikan terlihat jelas\n` +
    `• Gunakan Share Location untuk akurasi GPS\n` +
    `• Sertakan perkiraan jumlah ikan dalam deskripsi\n` +
    `• Laporkan hanya kejadian nyata yang kamu temukan langsung`
  );
}

async function handleInfo(chatId: number | string) {
  await sendMessage(chatId,
    `ℹ️ <b>Ikan Sapu-Sapu Invasif</b>\n` +
    `<i>(Hypostomus plecostomus / Pterygoplichthys)</i>\n\n` +
    `<b>🔍 Ciri-ciri:</b>\n` +
    `• Tubuh pipih berlapis tulang/sisik keras\n` +
    `• Mulut berbentuk mangkuk (sucker mouth) di bawah kepala\n` +
    `• Ukuran 30–50 cm, warna coklat dengan bintik gelap\n` +
    `• Hidup di dasar sungai, melekat pada bebatuan\n\n` +
    `<b>⚠️ Dampak Negatif:</b>\n` +
    `• Mengancam ikan endemik lokal dari makanan dan ruang hidup\n` +
    `• Merusak tepian sungai dengan membuat lubang sarang\n` +
    `• Berkembang biak sangat cepat — ratusan telur per siklus\n` +
    `• Mengganggu ekosistem dasar sungai\n` +
    `• Mengurangi hasil tangkapan nelayan tradisional\n\n` +
    `<b>📜 Latar Belakang:</b>\n` +
    `Awalnya dipelihara sebagai ikan hias pembersih akuarium dari Amerika Selatan. Sejak dilepas ke perairan Jakarta sekitar tahun 2000-an, populasinya meledak dan kini mendominasi berbagai sungai dan kali di Jabodetabek.\n\n` +
    `<b>💡 Apa yang bisa kamu lakukan?</b>\n` +
    `Laporkan temuan ikan sapu-sapu di sekitarmu melalui /lapor agar tim dinas dapat segera menindaklanjuti.`
  );
}

async function handleNotif(chatId: number | string, arg: string) {
  if (arg === "on") {
    await sendMessage(chatId,
      `🔔 <b>Notifikasi Diaktifkan</b>\n\n` +
      `Kamu akan menerima pemberitahuan apabila ada pembaruan status pada laporan yang kamu kirimkan.\n\n` +
      `Untuk mematikan notifikasi, ketik /notif off.`
    );
  } else if (arg === "off") {
    await sendMessage(chatId,
      `🔕 <b>Notifikasi Dinonaktifkan</b>\n\n` +
      `Kamu tidak akan menerima pemberitahuan otomatis.\n\n` +
      `Kamu tetap bisa cek status laporan kapan saja dengan /status <code>TOKEN</code>.\n\n` +
      `Untuk mengaktifkan kembali, ketik /notif on.`
    );
  } else {
    await sendMessage(chatId,
      `🔔 <b>Pengaturan Notifikasi</b>\n\n` +
      `Gunakan perintah berikut:\n` +
      `/notif on — Aktifkan notifikasi\n` +
      `/notif off — Nonaktifkan notifikasi`
    );
  }
}

async function handleStatus(chatId: number | string, token: string) {
  const res = await fetch(`${BASE_URL}/api/reports/${token}`);
  if (!res.ok) {
    await sendMessage(chatId,
      `❌ <b>Laporan Tidak Ditemukan</b>\n\n` +
      `Token <code>${token}</code> tidak ditemukan dalam sistem.\n\n` +
      `Pastikan token yang kamu masukkan sudah benar. Token diberikan saat laporan berhasil dikirim.`
    );
    return;
  }

  const { report } = await res.json();

  const STATUS_LABEL: Record<string, string> = {
    baru: "🔴 Baru — Menunggu verifikasi",
    terverifikasi: "🔵 Terverifikasi — Siap ditindaklanjuti",
    proses: "🟡 Dalam Proses — Sedang ditangani petugas",
    selesai: "🟢 Selesai — Penanganan selesai",
  };

  const status = STATUS_LABEL[report.status] ?? report.status;
  const tanggal = new Date(report.created_at).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  });

  await sendMessage(chatId,
    `📋 <b>Status Laporan</b>\n\n` +
    `🎫 Token: <code>${token}</code>\n` +
    `📌 Status: ${status}\n` +
    `📍 Lokasi: ${report.location_name ?? "Tidak dicantumkan"}\n` +
    `⚠️ Urgensi: ${report.urgency_scale}/5\n` +
    `📅 Dilaporkan: ${tanggal}\n` +
    (report.assigned_user?.full_name
      ? `👤 Petugas: ${report.assigned_user.full_name}\n`
      : "") +
    `\nPantau juga di web:\n${BASE_URL}/laporan/${report.id}`
  );
}

// ─── Main update handler ───────────────────────────────────────────────────────

async function handleUpdate(update: any) {
  // Handle inline keyboard callbacks
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId: number = cb.message.chat.id;
    const userId = String(cb.from?.id ?? chatId);
    const data: string = cb.data ?? "";
    const state = getState(userId);

    await answerCallback(cb.id);

    // Water body selection
    if (data.startsWith("wb:") && state.step === "await_water_body") {
      const value = data.replace("wb:", "");
      const label: Record<string, string> = {
        sungai: "Sungai", danau: "Danau", kolam: "Kolam",
        parit: "Parit", lainnya: "Lainnya", skip: "Tidak disebutkan",
      };
      setState(userId, {
        ...state,
        water_body_type: value === "skip" ? undefined : value,
        step: "await_description",
      });
      await sendMessage(chatId, `✅ Jenis perairan: <b>${label[value]}</b>`);
      await askDescription(chatId);
      return;
    }

    // Urgency selection
    if (data.startsWith("urg:") && state.step === "await_urgency") {
      const urgency = parseInt(data.replace("urg:", ""), 10);
      await sendMessage(chatId, `✅ Tingkat urgensi: <b>${urgency}/5</b>`);
      await submitReport(chatId, userId, state, urgency);
      return;
    }

    return;
  }

  // Handle regular messages
  const message = update.message;
  if (!message) return;

  const chatId: number = message.chat.id;
  const userId = String(message.from?.id ?? chatId);
  const text: string = (message.text ?? "").trim();
  const state = getState(userId);
  const firstName: string = message.from?.first_name ?? "";

  // ── Commands ──
  if (text === "/start") {
    clearState(userId);
    await handleStart(chatId, firstName);
    return;
  }

  if (text === "/bantuan") {
    await handleBantuan(chatId);
    return;
  }

  if (text === "/info") {
    await handleInfo(chatId);
    return;
  }

  if (text.startsWith("/notif")) {
    const arg = text.split(" ")[1]?.trim().toLowerCase() ?? "";
    await handleNotif(chatId, arg);
    return;
  }

  if (text.startsWith("/lapor")) {
    setState(userId, { step: "await_photo", photos: [] });
    await askPhoto(chatId);
    return;
  }

  if (text.startsWith("/status")) {
    const token = text.split(" ")[1]?.trim();
    if (!token) {
      await sendMessage(chatId,
        `📋 <b>Cek Status Laporan</b>\n\n` +
        `Gunakan perintah:\n/status <code>TOKEN_LAPORAN</code>\n\n` +
        `Token diberikan saat laporan berhasil dikirim.`
      );
      return;
    }
    await handleStatus(chatId, token);
    return;
  }

  // ── Conversation flow ──

  if (state.step === "await_photo") {
    if (message.photo || message.document) {
      const fileId: string = message.photo
        ? message.photo[message.photo.length - 1].file_id
        : message.document.file_id;

      const photoUrl = await downloadAndStorePhoto(fileId);
      const updatedPhotos = photoUrl ? [...state.photos, photoUrl] : state.photos;
      setState(userId, { ...state, photos: updatedPhotos });

      if (photoUrl) {
        await sendMessage(chatId,
          `✅ Foto ke-${updatedPhotos.length} diterima.\n\n` +
          `Kirim foto lagi jika ingin menambahkan, atau ketik <b>lanjut</b> untuk ke langkah berikutnya.`
        );
      } else {
        await sendMessage(chatId, `⚠️ Foto tidak dapat diproses. Coba kirim ulang.`);
      }
      return;
    }

    if (text.toLowerCase() === "lanjut") {
      if (state.photos.length === 0) {
        await sendMessage(chatId, `⚠️ Minimal 1 foto diperlukan. Kirimkan foto terlebih dahulu.`);
        return;
      }
      setState(userId, { ...state, step: "await_location" });
      await askLocation(chatId, state.photos.length);
      return;
    }

    await sendMessage(chatId, `Kirim foto ikan sapu-sapu yang Anda temukan, atau ketik <b>lanjut</b> jika sudah selesai mengirim foto.`);
    return;
  }

  if (state.step === "await_location") {
    if (message.location) {
      setState(userId, {
        ...state,
        location_lat: message.location.latitude,
        location_lng: message.location.longitude,
        location_name: `GPS: ${message.location.latitude.toFixed(5)}, ${message.location.longitude.toFixed(5)}`,
        step: "await_water_body",
      });
    } else if (text) {
      setState(userId, {
        ...state,
        location_lat: 0,
        location_lng: 0,
        location_name: text,
        step: "await_water_body",
      });
    } else {
      await sendMessage(chatId, `Mohon bagikan lokasi atau ketik nama lokasi secara lengkap.`);
      return;
    }
    await askWaterBody(chatId);
    return;
  }

  if (state.step === "await_water_body") {
    // Allow text fallback if user types instead of clicking button
    const textMap: Record<string, string> = {
      sungai: "sungai", danau: "danau", kolam: "kolam",
      parit: "parit", lainnya: "lainnya", lewati: "skip", skip: "skip",
    };
    const matched = textMap[text.toLowerCase()];
    if (matched) {
      setState(userId, {
        ...state,
        water_body_type: matched === "skip" ? undefined : matched,
        step: "await_description",
      });
      await askDescription(chatId);
    } else {
      await sendMessage(chatId,
        `Pilih jenis perairan menggunakan tombol di atas, atau ketik salah satu:\n` +
        `<code>sungai</code> / <code>danau</code> / <code>kolam</code> / <code>parit</code> / <code>lainnya</code> / <code>lewati</code>`,
        { reply_markup: WATER_BODY_KEYBOARD }
      );
    }
    return;
  }

  if (state.step === "await_description") {
    if (!text) {
      await sendMessage(chatId, `Mohon ketik deskripsi situasi ikan yang Anda temukan.`);
      return;
    }
    if (text.length < 15) {
      await sendMessage(chatId, `⚠️ Deskripsi terlalu singkat. Ceritakan lebih detail — minimal 15 karakter.`);
      return;
    }
    setState(userId, { ...state, description: text, step: "await_urgency" });
    await askUrgency(chatId);
    return;
  }

  if (state.step === "await_urgency") {
    // Text fallback: user types number directly
    const urgency = parseInt(text, 10);
    if (!isNaN(urgency) && urgency >= 1 && urgency <= 5) {
      await submitReport(chatId, userId, state, urgency);
      return;
    }
    await sendMessage(chatId,
      `Pilih tingkat urgensi menggunakan tombol di atas, atau ketik angka 1–5.`,
      { reply_markup: URGENCY_KEYBOARD }
    );
    return;
  }

  // Default fallback
  await sendMessage(chatId,
    `Ketik /bantuan untuk melihat daftar perintah yang tersedia.`
  );
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
  if (
    process.env.TELEGRAM_WEBHOOK_SECRET &&
    secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = await request.json();
  handleUpdate(update).catch(console.error);
  return Response.json({ ok: true });
}
