"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { getFingerprint } from "@/lib/fingerprint";
import { cn } from "@/components/ui/cn";
import { SituationCommentType } from "@/types";

const OPTIONS: {
  type: SituationCommentType;
  label: string;
  emoji: string;
  color: string;
  desc: string;
}[] = [
  {
    type: "still_there",
    label: "Masih ada di lokasi",
    emoji: "📍",
    color: "bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400",
    desc: "Ikan masih terlihat di lokasi yang sama",
  },
  {
    type: "increasing",
    label: "Jumlahnya bertambah",
    emoji: "📈",
    color: "bg-red-50 border-red-200 text-red-700 hover:border-red-400",
    desc: "Populasi ikan semakin banyak dari sebelumnya",
  },
  {
    type: "decreasing",
    label: "Jumlahnya berkurang",
    emoji: "📉",
    color: "bg-yellow-50 border-yellow-200 text-yellow-700 hover:border-yellow-400",
    desc: "Populasi ikan terlihat berkurang",
  },
  {
    type: "gone",
    label: "Sudah tidak ada",
    emoji: "✅",
    color: "bg-green-50 border-green-200 text-green-700 hover:border-green-400",
    desc: "Tidak ada ikan lagi di lokasi tersebut",
  },
];

interface Props {
  reportId: string;
  counts: { still_there: number; increasing: number; decreasing: number; gone: number };
}

export default function SituationCommentPanel({ reportId, counts: initialCounts }: Props) {
  const [counts, setCounts] = useState(initialCounts);
  const [loading, setLoading] = useState<SituationCommentType | null>(null);
  const [voted, setVoted] = useState<SituationCommentType | null>(null);

  const handleComment = async (type: SituationCommentType) => {
    if (loading) return;
    setLoading(type);
    try {
      const fp = await getFingerprint();
      const res = await fetch(`/api/reports/${reportId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, fingerprint_hash: fp }),
      });
      if (res.status === 429) { toast.error("Batas komentar harian tercapai (25/hari)"); return; }
      if (!res.ok) throw new Error();
      setCounts(prev => ({ ...prev, [type]: prev[type] + 1 }));
      setVoted(type);
      toast.success("Terima kasih atas updatenya! Ini membantu menentukan prioritas penanganan.");
    } catch {
      toast.error("Gagal mengirim komentar");
    } finally {
      setLoading(null);
    }
  };

  const totalVotes = counts.still_there + counts.increasing + counts.decreasing + counts.gone;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500 leading-relaxed">
        Pilih kondisi terkini yang Anda lihat di lokasi ini. Respons Anda membantu menentukan prioritas penanganan oleh dinas.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {OPTIONS.map(({ type, label, emoji, color, desc }) => {
          const isVoted = voted === type;
          const count = counts[type as keyof typeof counts];
          const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;

          return (
            <button
              key={type}
              onClick={() => handleComment(type)}
              disabled={!!loading || !!voted}
              className={cn(
                "flex flex-col gap-1.5 px-3 py-3 rounded-xl border text-sm font-medium transition-all disabled:opacity-60 text-left",
                isVoted ? "ring-2 ring-offset-1" : "",
                color
              )}
            >
              <span className="flex items-center gap-1.5 font-semibold">
                <span>{emoji}</span>
                <span>{label}</span>
              </span>
              <p className="text-xs opacity-70">{desc}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-1 rounded-full bg-white/50 overflow-hidden">
                  <div className="h-full rounded-full bg-current transition-all duration-500"
                    style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold opacity-70 w-6 text-right">{count}</span>
              </div>
            </button>
          );
        })}
      </div>

      {voted && (
        <div className="text-xs text-center text-green-600 font-medium bg-green-50 rounded-lg py-2">
          ✓ Terima kasih! Respons Anda membantu menentukan prioritas penanganan laporan ini.
        </div>
      )}
    </div>
  );
}
