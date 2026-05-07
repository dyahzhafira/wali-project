# WALI: Warga Andil Lawan Invasif

> Platform interaktif pengawasan dan pelaporan ikan invasif berbasis partisipasi masyarakat.
> Dibangun untuk **IYREF Hackathon 2026 · SRE ITB**.

🌐 **Live:** https://wali-lake.vercel.app
🤖 **Bot Telegram:** [@YourWali_bot](https://t.me/YourWali_bot)

---

## Tentang WALI

WALI (Warga Andil Lawan Invasif) adalah platform yang menghubungkan warga dengan Dinas Lingkungan Hidup untuk mendeteksi, memetakan, dan menanggulangi ikan sapu-sapu (*Hypostomus plecostomus*) yang invasif di perairan Indonesia.

Warga dapat melaporkan temuan ikan invasif via web atau Telegram. Laporan masuk ke sistem dengan foto, koordinat GPS, dan tingkat urgensi, lalu dinas menindaklanjuti dengan sistem prioritas otomatis.

---

## Fitur Utama

### Publik (Warga)
- **Forum Laporan**: lihat semua laporan, beri reaksi, dan update situasi terkini dari lokasi
- **Buat Laporan**: submit laporan dengan foto, lokasi GPS, deskripsi, dan tingkat urgensi (1–5)
- **Peta Persebaran**: visualisasi interaktif titik laporan berdasarkan status & urgensi
- **Dashboard Publik**: statistik agregat: total laporan, ikan ditangkap, sebaran per status
- **Bot Telegram**: lapor & pantau status langsung via [@YourWali_bot](https://t.me/YourWali_bot)

### Admin / Portal Dinas (`/admin`)
- **Command Center**: dashboard dengan peta, chart tren, leaderboard petugas, aktivitas terbaru
- **Manajemen Laporan**: verifikasi, ubah status, assign petugas, filter wilayah, priority queue
- **Progress Log**: catat tindakan lapangan: deskripsi, jumlah ikan tertangkap, foto dokumentasi
- **Laporan Resmi**: buat laporan langsung dari dinas (langsung berstatus Terverifikasi)
- **Notifikasi**: laporan baru, backlog belum diverifikasi, update 24 jam terakhir
- **Priority Score**: skor otomatis penentu urutan penanganan

---

## Formula Priority Score

```
Score = (reaksi × 3) + (masih_ada × 2) + (bertambah × 3)
      + (berkurang × −1) + (tidak_ada × −3)
      + (urgensi × 1) + (hari_belum_ditangani × 0.5)
```

Semakin tinggi skor, semakin cepat laporan muncul di antrian prioritas dinas.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router), React, Tailwind CSS v4 |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (Postgres + Auth + Storage) |
| Map | Leaflet.js (dynamic import, SSR-safe) |
| Charts | Recharts |
| Bot | Telegram Bot API (webhook) |
| Rate Limiting | IP-based + FingerprintJS (anonymous) |
| Deployment | Vercel |

---

## Struktur Proyek

```
src/
├── app/
│   ├── (public)/          # Beranda, forum, peta, dashboard, sukses, telegram
│   ├── (admin)/admin/     # Portal dinas: dashboard, laporan, notifikasi, profil
│   └── api/               # API routes: reports, stats, webhook/telegram, admin
├── components/
│   ├── forum/             # ReportCard, SituationCommentPanel, ProgressTimeline
│   ├── forms/             # ReportForm, ProgressLogForm, PhotoUploader, LocationPicker
│   ├── map/               # MiniMap, AdminMapEmbed
│   ├── dashboard/         # DashboardCharts, AdminNav
│   └── ui/                # Badge, Button, Modal, UrgencyDisplay, StatCard
├── lib/
│   ├── supabase/          # Browser & server Supabase clients (BOM-safe)
│   └── telegram/          # Status notification helper
└── types/                 # TypeScript interfaces
```

---

## Setup Lokal

### 1. Clone & Install

```bash
git clone <repo-url>
cd wali
npm install
```

### 2. Environment Variables

Buat file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### 3. Jalankan Dev Server

```bash
npm run dev
```

### 4. Setup Webhook Telegram (setelah deploy)

```bash
curl -X POST \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=https://your-domain.com/api/webhook/telegram"
```

---

## Peran Admin

| Role | Akses |
|---|---|
| `super_admin` | Full akses semua fitur |
| `admin_dinas` | Dashboard, kelola laporan, notifikasi, laporan resmi |
| `petugas_lapangan` | Laporan yang ditugaskan, tambah progress log |

Login admin: `/admin/login`

---

## Lisensi

MIT, IYREF Hackathon 2026 · SRE ITB
