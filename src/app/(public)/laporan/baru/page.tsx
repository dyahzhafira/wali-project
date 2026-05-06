"use client";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import ReportForm from "@/components/forms/ReportForm";

export default function NewReportPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col">

      {/* ── HEADER ── */}
      <div className="wali-gradient px-6 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm mb-5 shadow">
            <ClipboardList size={28} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow mb-3">
            Lengkapi Data Temuan Ikan Invasif
          </h1>
          <p className="text-white/85 font-medium text-base leading-relaxed">
            Laporkan kemunculan ikan sapu-sapu atau spesies invasif lainnya di sekitar Anda.
            Data Anda membantu pemerintah merespons lebih cepat.
          </p>
        </div>
      </div>

      {/* ── FORM ── */}
      <div className="bg-wali-50 px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <ReportForm onSuccess={(token: string, _reportId: string) => router.push(`/sukses/${token}`)} />
        </div>
      </div>

    </div>
  );
}
