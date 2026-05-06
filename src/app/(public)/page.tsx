import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { StatusBadge } from "@/components/ui/Badge";
import MiniMapClient from "@/components/map/MiniMapClient";
import { MapPin, MessageSquare, ThumbsUp, Shield } from "lucide-react";

async function getStats() {
  const fallback = { total_reports: 0, active_reports: 0, reports_today: 0, reports_in_progress: 0, reports_done_this_month: 0 };
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/stats`, { next: { revalidate: 60 } });
    if (!res.ok) return fallback;
    return res.json();
  } catch { return fallback; }
}

async function getRecentReports() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/reports?limit=6&sort=created_at`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.reports || [];
  } catch { return []; }
}

export default async function LandingPage() {
  const [stats, reports] = await Promise.all([getStats(), getRecentReports()]);

  return (
    <div className="flex flex-col bg-white">

      {/* ── HERO (Mobile-first — fish z-0, card z-10) ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #03685E 0%, #239DCA 65%, #1a8ab5 100%)" }}>

        {/* Top text area */}
        <div className="relative z-10 px-6 pt-10 pb-2 max-w-lg mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/90 text-xs font-semibold tracking-wide">Platform Aktif — {stats.reports_today ?? 0} laporan hari ini</span>
          </div>
          <p className="text-white/70 text-sm font-semibold tracking-widest uppercase mb-2">halo, WARGA PEDULI!</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-3">
            Yuk basmi<br />
            <span style={{ color: "#67e8f9" }}>ikan invasif</span><br />
            bersama WALI!
          </h1>
          <p className="text-white/80 text-sm font-medium leading-relaxed max-w-sm mx-auto">
            WALI menghubungkan warga dan pemerintah untuk mendeteksi, memetakan, dan menanggulangi ikan sapu-sapu secara nyata.
          </p>
        </div>
        <div className="relative mx-auto w-64 pt-70">  
          {/* Fish + CTA card section */}
          <div className="relative mx-auto pb-0" style={{ minHeight: 350 }}>
            {/* Fish mascot — z-0, behind the card */}
            <div className="absolute inset-x-0 bottom-0 flex justify-center" style={{ zIndex: 0 }}>
              <Image
                src="/ikan.png"
                alt="Ikan Sapu-Sapu Maskot WALI"
                width={500}
                height={450}
                className="object-contain drop-shadow-2xl transform scale-150 origin-bottom"
                priority
              />
            </div>

            {/* CTA Card — z-10*/}
            <div className="relative mx-auto w-80 -translate-y-6 -translate-x-8" style={{ zIndex: 10 }}>
              <div className="bg-white rounded-3xl shadow-2xl px-6 py-5 text-center border border-white/80"
                style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}>
                <p className="text-wali-800 font-bold text-base mb-0.5 pb-1">Ayo Mulai Sekarang!</p>
                <div className="flex flex-col gap-2.5">
                  <Link href="/laporan/baru"
                    className="btn-gradient text-white font-bold px-6 py-3 rounded-2xl shadow-md hover:opacity-90 transition-opacity text-sm">
                    Mulai Laporan
                  </Link>
                  <Link href="/dashboard"
                    className="border-2 border-wali-200 text-wali-700 font-semibold px-6 py-2.5 rounded-2xl hover:bg-wali-50 transition-colors text-sm">
                    Cek Progress
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Spacer so fish image shows below card */}
          <div style={{ height: 80 }} />
        </div>

        {/* Wave divider */}
        <svg viewBox="0 0 1440 60" className="w-full block relative z-10" style={{ marginTop: -2 }} preserveAspectRatio="none">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="white" />
        </svg>
      </section>

      {/* ── STATS CARDS ── */}
      <section className="px-6 py-10 bg-white">
        <div className="max-w-3xl mx-auto grid grid-cols-3 gap-4">
          {[
            { value: stats.total_reports ?? 0, label: "Total Laporan", sub: "Masuk" },
            { value: stats.reports_in_progress ?? 0, label: "Sedang", sub: "Ditangani" },
            { value: stats.reports_done_this_month ?? 0, label: "Selesai", sub: "Bulan Ini" },
          ].map(({ value, label, sub }) => (
            <div key={label} className="rounded-2xl p-5 text-center shadow-sm border border-gray-100">
              <p className="text-3xl sm:text-4xl font-bold tabular-nums text-wali-700">{value.toLocaleString("id")}</p>
              <p className="text-sm font-semibold text-gray-700 mt-1">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── APA ITU IKAN INVASIF? ── */}
      <section className="px-6 py-10" style={{ background: "#f0fdfa" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            <div className="w-full sm:w-52 shrink-0 flex items-center justify-center">
              <Image src="/ikan.png" alt="Ikan Sapu-Sapu" width={220} height={220} className="object-contain drop-shadow-lg" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-wali-900 mb-3">Apa itu Ikan Invasif?</h2>
              <p className="text-gray-700 font-medium leading-relaxed mb-4">
                Ikan Invasif adalah spesies non-asli yang berkembang biak cepat dan merusak ekosistem, lingkungan, ekonomi, serta kesehatan. <strong>Ikan Sapu-Sapu (Hypostomus plecostomus)</strong> adalah salah satu yang paling dominan di perairan Jakarta sejak 2011.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "Mengancam ikan endemik",
                  "Berkembang sangat cepat",
                  "Merusak ekosistem sungai",
                  "Mengganggu nelayan lokal",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KARTU EDUKASI ── */}
      <section className="px-6 py-10 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kenali Ikan Sapu-Sapu</h2>
          <p className="text-gray-500 text-sm mb-6">Fakta penting yang perlu Anda tahu</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: "🔴",
                title: "Bahaya Invasif",
                desc: "Mendominasi perairan, bersaing dengan ikan asli untuk makanan, oksigen, dan ruang hidup.",
                color: "#fef2f2",
                border: "#fca5a5",
              },
              {
                icon: "🐟",
                title: "Ciri-ciri Fisik",
                desc: "Tubuh pipih berlapis tulang, mulut seperti mangkuk (sucker), ukuran 30–50 cm, warna coklat berbintik.",
                color: "#f0fdfa",
                border: "#6ee7d0",
              },
              {
                icon: "📍",
                title: "Cara Melaporkan",
                desc: "Foto ikan, tandai lokasi di peta, pilih tingkat urgensi, dan kirim. Petugas akan menindaklanjuti.",
                color: "#eff6ff",
                border: "#93c5fd",
              },
            ].map(({ icon, title, desc, color, border }) => (
              <div key={title} className="rounded-2xl p-5 border"
                style={{ background: color, borderColor: border }}>
                <span className="text-3xl block mb-3">{icon}</span>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MINI MAP ── */}
      <section className="px-6 py-10" style={{ background: "#f8fafc" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Peta Persebaran</h2>
              <p className="text-gray-500 text-sm mt-0.5">Laporan aktif dari seluruh wilayah</p>
            </div>
            <Link href="/peta" className="text-sm text-wali-700 font-semibold hover:underline">Lihat semua →</Link>
          </div>
          <div className="h-72 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
            <MiniMapClient />
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              { color: "#ef4444", label: "Baru" },
              { color: "#3b82f6", label: "Terverifikasi" },
              { color: "#f59e0b", label: "Proses" },
              { color: "#10b981", label: "Selesai" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LAPORAN TERBARU ── */}
      <section className="px-6 py-10 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Laporan Terbaru</h2>
              <p className="text-gray-500 text-sm mt-0.5">Update real-time dari warga</p>
            </div>
            <Link href="/laporan" className="text-sm text-wali-700 font-semibold hover:underline">Lihat semua →</Link>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Image src="/ikan.png" alt="Belum ada laporan" width={80} height={80} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Belum ada laporan. Jadilah yang pertama!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reports.map((report: any) => (
                <Link key={report.id} href={`/laporan/${report.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {report.photos?.[0] ? (
                      <img src={report.photos[0]} alt="Foto laporan"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image src="/ikan.png" alt="" width={64} height={64} className="opacity-20" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <StatusBadge status={report.status} />
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: id })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <MapPin size={11} className="text-wali-500 shrink-0" />
                      <span className="truncate">{report.location_name || "Lokasi tidak diketahui"}</span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                    <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-50">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <ThumbsUp size={12} /> {report.react_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <MessageSquare size={12} /> {report.comment_count ?? 0}
                      </span>
                      <span className="ml-auto text-xs font-semibold text-wali-600 group-hover:underline">Lihat Detail →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/laporan/baru"
              className="inline-flex items-center gap-2 btn-gradient text-white font-bold px-8 py-3.5 rounded-full shadow-md hover:opacity-90 transition-opacity text-base">
              Laporkan Sekarang
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA PORTAL DINAS ── */}
      <section className="px-6 py-10" style={{ background: "#239DCA" }}>
        <div className="max-w-3xl mx-auto text-center">
          <Shield size={36} className="text-white/60 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Apakah Anda Petugas Dinas?</h2>
          <p className="text-white/80 text-sm font-medium mb-6">
            Login ke portal dinas untuk verifikasi laporan, update progres penanganan, dan akses dashboard lengkap.
          </p>
          <Link href="/admin/login"
            className="inline-flex items-center gap-2 bg-white text-wali-700 font-bold px-8 py-3.5 rounded-full shadow-md hover:bg-wali-50 transition-colors text-base">
            <Shield size={18} /> Masuk Portal Dinas
          </Link>
        </div>
      </section>

    </div>
  );
}
