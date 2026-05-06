# WALI — Warga Andil Lawan Invasif

Platform pengawasan ikan invasif (ikan sapu-sapu) berbasis komunitas untuk Indonesia. Dibangun untuk IYREF Hackathon 2026 · SRE ITB.

## Tentang WALI

WALI memungkinkan warga melaporkan keberadaan ikan invasif (terutama ikan sapu-sapu/pleco) di perairan Indonesia. Laporan dikumpulkan, divisualisasikan di peta, dan ditindaklanjuti oleh dinas terkait — dengan sistem prioritas otomatis berdasarkan reaksi komunitas.

## Fitur Utama

### Publik (Warga)
- **Forum Laporan** — lihat semua laporan, beri reaksi (like), dan update situasi terkini dari lokasi
- **Buat Laporan** — submit laporan lengkap dengan foto, lokasi GPS, dan tingkat urgensi
- **Peta Persebaran** — visualisasi interaktif semua titik laporan dengan warna berdasarkan urgensi
- **Dashboard Publik** — statistik agregat: total laporan, ikan ditangkap, sebaran per status
- **Bot Telegram** — lapor langsung via `@wali_invasif_bot` tanpa buka browser, terima notifikasi update status

### Admin / Portal Dinas
- **Command Center** — dashboard admin dengan peta, charts tren, leaderboard petugas, aktivitas terbaru
- **Manajemen Laporan** — verifikasi, ubah status, assign ke petugas, filter by lokasi/wilayah
- **Progress Log** — petugas catat tindakan lapangan: jumlah ikan ditangkap, foto dokumentasi
- **Notifikasi Harian** — laporan baru, backlog belum diverifikasi, update 24 jam terakhir
- **Priority Score** — skor otomatis untuk menentukan urutan penanganan

## Formula Priority Score

```
Priority Score = react×3 + masih_ada×2 + bertambah×3 + berkurang×(−1) + tidak_ada×(−3) + urgensi×1
```

Tingkat urgensi dipengaruhi oleh jumlah laporan di suatu area dan banyaknya reaksi warga.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router), React, Tailwind CSS v4 |
| Backend | Next.js API Routes, Supabase (Postgres + Auth + Storage) |
| Map | Leaflet.js (dynamic import, SSR-safe) |
| Charts | Recharts |
| Bot | Telegram Bot API (webhook) |
| Rate limiting | FingerprintJS (anonymous) |
| Deployment | Vercel (recommended) |

## Setup

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

### 4. Setup Telegram Bot (opsional)

1. Buat bot via `@BotFather` di Telegram, dapatkan token
2. Set `TELEGRAM_BOT_TOKEN` di `.env.local`
3. Daftarkan webhook (jalankan sekali setelah deploy):

```bash
curl -X POST \
  "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=https://your-domain.com/api/webhook/telegram"
```

## Struktur Proyek

```
src/
├── app/
│   ├── (public)/          # Halaman publik (beranda, forum, peta, dashboard, telegram)
│   ├── (admin)/admin/     # Portal dinas (dashboard, laporan, notifikasi)
│   └── api/               # API routes (reports, stats, webhook/telegram, dll)
├── components/
│   ├── forum/             # ReportCard, SituationCommentPanel, ProgressTimeline, dll
│   ├── forms/             # ReportForm, ProgressLogForm, PhotoUploader
│   ├── map/               # MiniMap, AdminMapEmbed
│   ├── dashboard/         # DashboardCharts, AdminNav
│   └── ui/                # Badge, Button, Modal, UrgencyDisplay, dll
├── lib/
│   ├── supabase/          # Client & server Supabase helpers
│   ├── fingerprint/       # FingerprintJS wrapper
│   └── telegram/          # Telegram notification helper
└── types/                 # TypeScript interfaces
```

## Peran Admin

| Role | Akses |
|---|---|
| `super_admin` | Full akses semua fitur |
| `admin_dinas` | Dashboard, kelola laporan, lihat notifikasi |
| `petugas_lapangan` | Lihat laporan yang ditugaskan, tambah progress log |

## Lisensi

MIT — IYREF Hackathon 2026 · SRE ITB
