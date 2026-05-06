import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Send, CheckCircle, MapPin, Camera, AlertTriangle, ArrowRight, Shield, Info } from "lucide-react";

const STEPS = [
  {
    icon: Send,
    step: "1",
    title: "Mulai Chat Bot",
    desc: "Cari @YourWali_bot di Telegram lalu tekan Start atau ketik /start. Bot akan menyambut Anda.",
    code: "/start",
  },
  {
    icon: Camera,
    step: "2",
    title: "Kirim Perintah /lapor",
    desc: "Ketik /lapor untuk memulai laporan baru. Bot akan memandu Anda langkah demi langkah.",
    code: "/lapor",
  },
  {
    icon: Camera,
    step: "3",
    title: "Kirim Foto Ikan",
    desc: "Ambil foto ikan sapu-sapu yang Anda temukan dan kirim ke bot. Bisa lebih dari 1 foto.",
    code: "📷 [kirim foto]",
  },
  {
    icon: MapPin,
    step: "4",
    title: "Bagikan Lokasi",
    desc: "Gunakan tombol Attachment → Location untuk berbagi lokasi GPS, atau ketik nama lokasi.",
    code: "📍 [bagikan lokasi]",
  },
  {
    icon: MessageCircle,
    step: "5",
    title: "Deskripsikan Situasi",
    desc: "Ceritakan kondisi ikan di sana — jumlah, perilaku, kondisi air, dsb.",
    code: "Contoh: ~20 ekor di tepi sungai...",
  },
  {
    icon: AlertTriangle,
    step: "6",
    title: "Pilih Tingkat Urgensi",
    desc: "Ketik angka 1-5 sesuai tingkat urgensi. 1 = sedikit, 5 = darurat.",
    code: "1 | 2 | 3 | 4 | 5",
  },
  {
    icon: CheckCircle,
    step: "7",
    title: "Laporan Terkirim!",
    desc: "Bot mengirim token laporan unik. Simpan untuk cek status laporan kapan saja.",
    code: "/status TOKEN_ANDA",
  },
];

const COMMANDS = [
  { cmd: "/start atau /bantuan", desc: "Tampilkan daftar perintah" },
  { cmd: "/lapor", desc: "Buat laporan ikan invasif baru" },
  { cmd: "/status TOKEN", desc: "Cek status laporan berdasarkan token" },
  { cmd: "/notif on|off", desc: "Aktifkan/nonaktifkan notifikasi update" },
  { cmd: "/info", desc: "Info tentang ikan sapu-sapu invasif" },
];

export default function TelegramPage() {
  return (
    <div className="flex flex-col bg-white">

      {/* Header */}
      <div className="wali-gradient px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-5">
            <Send size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Lapor via Telegram</h1>
          <p className="text-white/85 font-medium leading-relaxed">
            Laporkan ikan sapu-sapu invasif langsung dari aplikasi Telegram Anda — tanpa harus buka browser.
          </p>
          <a
            href="https://t.me/YourWali_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 bg-white text-wali-700 font-bold px-8 py-3.5 rounded-full shadow-md hover:bg-wali-50 transition-colors">
            <Send size={18} /> Buka @YourWali_bot
          </a>
        </div>
      </div>

      {/* How it works */}
      <div className="px-6 py-12 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Cara Kerjanya</h2>
          <p className="text-gray-500 text-sm mb-8">7 langkah mudah untuk membuat laporan via Telegram</p>

          <div className="flex flex-col gap-4">
            {STEPS.map(({ icon: Icon, step, title, desc, code }) => (
              <div key={step} className="flex gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-wali-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {step}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={15} className="text-wali-500 shrink-0" />
                    <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{desc}</p>
                  <code className="text-xs bg-gray-100 text-wali-700 px-2.5 py-1 rounded-lg font-mono">{code}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Commands reference */}
      <div className="px-6 py-12 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Daftar Perintah Bot</h2>
          <p className="text-gray-500 text-sm mb-6">Semua perintah yang tersedia di WALI Bot</p>
          <div className="rounded-2xl border border-gray-100 overflow-hidden">
            {COMMANDS.map(({ cmd, desc }, i) => (
              <div key={cmd} className={`flex items-center gap-4 px-5 py-4 ${i < COMMANDS.length - 1 ? "border-b border-gray-50" : ""}`}>
                <code className="text-sm font-mono font-semibold text-wali-700 bg-wali-50 px-3 py-1 rounded-lg whitespace-nowrap">{cmd}</code>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rate limiting explanation */}
      <div className="px-6 py-12 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={20} className="text-wali-700" />
            <h2 className="text-2xl font-bold text-gray-900">Sistem Batas Pelaporan</h2>
          </div>
          <p className="text-gray-500 text-sm mb-6">Bagaimana WALI mencegah laporan spam di Telegram vs. Web</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Telegram */}
            <div className="bg-white rounded-2xl border border-wali-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-wali-50 flex items-center justify-center">
                  <Send size={16} className="text-wali-700" />
                </div>
                <h3 className="font-bold text-gray-900">Via Telegram</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Identitas pelapor diverifikasi langsung dari <strong>Telegram User ID</strong> — angka unik yang ditetapkan Telegram untuk setiap akun. Tidak bisa dipalsukan atau diubah.
              </p>
              <div className="bg-wali-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-wali-700 mb-1">Mekanisme:</p>
                <ul className="text-xs text-wali-600 space-y-1">
                  <li>• Setiap laporan ditandai dengan Telegram User ID Anda</li>
                  <li>• Laporan dari akun yang sama terdeteksi secara otomatis</li>
                  <li>• Tidak perlu fingerprint browser — identitas sudah pasti</li>
                </ul>
              </div>
            </div>

            {/* Web */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Info size={16} className="text-gray-500" />
                </div>
                <h3 className="font-bold text-gray-900">Via Web</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Karena web bersifat anonim (tidak perlu login), sistem menggunakan kombinasi <strong>IP Address</strong> dan <strong>fingerprint browser</strong> untuk membatasi laporan spam.
              </p>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">Mekanisme:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• IP Address dicatat di setiap laporan</li>
                  <li>• Batas: 12 laporan per IP per hari</li>
                  <li>• Petugas dinas tidak dibatasi (sudah login)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-amber-100 p-4 flex gap-3">
            <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-600 leading-relaxed">
              Laporan yang terindikasi spam atau tidak valid dapat dihapus oleh admin. Harap laporkan kejadian nyata yang Anda temukan secara langsung.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-10 bg-white text-center">
        <div className="max-w-sm mx-auto">
          <p className="text-gray-700 font-semibold mb-4">Mau lapor sekarang dari web?</p>
          <Link href="/laporan/baru"
            className="inline-flex items-center gap-2 btn-gradient text-white font-bold px-8 py-3.5 rounded-full shadow-md hover:opacity-90 transition-opacity">
            Buat Laporan di Web <ArrowRight size={16} />
          </Link>
        </div>
      </div>

    </div>
  );
}
