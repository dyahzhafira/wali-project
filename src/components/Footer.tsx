import Link from "next/link";
import Image from "next/image";
import { Send } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-wali-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="flex flex-col gap-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="WALI" width={36} height={36} className="rounded-full" />
              <span className="text-xl font-bold">WALI</span>
            </div>
            <p className="text-wali-300 text-sm font-medium">Warga Andil Lawan Invasif</p>
            <p className="text-wali-400 text-xs leading-relaxed max-w-xs">
              Platform pengawasan ikan invasif berbasis komunitas. Bersama kita jaga ekosistem perairan Indonesia.
            </p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-wali-800 px-3 py-2 w-fit">
              <span className="text-xs font-semibold text-wali-100">IYREF Hackathon 2026 · SRE ITB</span>
            </div>
          </div>

          {/* Navigasi */}
          <div>
            <h3 className="text-xs font-semibold text-wali-400 uppercase tracking-wider mb-4">Platform</h3>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/laporan", label: "Forum Laporan" },
                { href: "/peta", label: "Peta Persebaran" },
                { href: "/dashboard", label: "Dashboard Publik" },
                { href: "/laporan/baru", label: "Buat Laporan" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-wali-300 hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Telegram */}
          <div>
            <h3 className="text-xs font-semibold text-wali-400 uppercase tracking-wider mb-4">Bot Telegram</h3>
            <p className="text-xs text-wali-400 mb-3 leading-relaxed">
              Laporkan langsung dari Telegram tanpa buka browser. Panduan lengkap tersedia.
            </p>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/telegram", label: "Cara Kerja Bot" },
                { href: "https://t.me/YourWali_bot", label: "Buka Bot @YourWali_bot", external: true },
              ].map(({ href, label, external }) => (
                <li key={href}>
                  {external ? (
                    <a href={href} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-wali-300 hover:text-white transition-colors">
                      <Send size={12} /> {label}
                    </a>
                  ) : (
                    <Link href={href} className="text-sm text-wali-300 hover:text-white transition-colors">{label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Portal Dinas */}
          <div>
            <h3 className="text-xs font-semibold text-wali-400 uppercase tracking-wider mb-4">Portal Dinas</h3>
            <p className="text-xs text-wali-400 mb-3 leading-relaxed">
              Akses untuk petugas lapangan, admin dinas, dan super admin.
            </p>
            <Link href="/admin/login"
              className="inline-flex items-center gap-2 bg-wali-700 hover:bg-wali-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
              Login Portal Dinas
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-wali-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-wali-500">© 2026 WALI — Warga Andil Lawan Invasif. IYREF Hackathon 2026.</p>
          <p className="text-xs text-wali-600">Nature-Based Solutions & Blue Economy</p>
        </div>
      </div>
    </footer>
  );
}
