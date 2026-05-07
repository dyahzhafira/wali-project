"use client";
import Link from "next/link";
import { CheckCircle, Copy, Share2, Fish } from "lucide-react";
import { useParams } from "next/navigation";

export default function SuccessPage() {
  const { token } = useParams<{ token: string }>();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/^﻿/, "") || "https://wali-lake.vercel.app";
  const reportUrl = `${appUrl}/laporan/${token}`;

  return (
    <div className="min-h-screen bg-wali-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Laporan Terkirim!</h1>
        <p className="text-gray-500 mb-6">Terima kasih telah berpartisipasi menjaga ekosistem perairan Indonesia 🎉</p>

        <div className="bg-wali-50 border border-wali-200 rounded-xl p-4 mb-6">
          <p className="text-xs font-medium text-wali-700 mb-2">Link laporan Anda:</p>
          <p className="text-sm font-mono text-wali-800 break-all mb-3">{reportUrl}</p>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(reportUrl)}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-wali-200 rounded-lg text-sm text-wali-700 hover:bg-wali-50 transition-colors"
            >
              <Copy size={14} /> Salin Link
            </button>
            <a
              href={`https://wa.me/?text=Saya%20melaporkan%20ikan%20sapu-sapu%20invasif!%20Pantau%20statusnya%20di:%20${encodeURIComponent(reportUrl)}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 rounded-lg text-sm text-white hover:bg-green-600 transition-colors"
            >
              <Share2 size={14} /> WhatsApp
            </a>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-medium text-blue-800 mb-1">📬 Ingin notifikasi update?</p>
          <p className="text-xs text-blue-600">Simpan link di atas atau ikuti Bot Telegram WALI untuk mendapat update langsung di HP Anda.</p>
        </div>

        <div className="flex flex-col gap-2">
          <Link href="/laporan" className="w-full py-3 bg-wali-700 hover:bg-wali-800 text-white rounded-xl font-medium transition-colors">
            Lihat Forum Laporan
          </Link>
          <Link href="/laporan/baru" className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-colors">
            Buat Laporan Lain
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-wali-600">
            <Fish size={16} />
            <p className="text-xs text-gray-400">Laporan Anda membantu pemerintah bertindak lebih cepat dan tepat!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
