"use client";
import { useState, useEffect } from "react";
import { ThumbsUp } from "lucide-react";
import toast from "react-hot-toast";
import { getFingerprint } from "@/lib/fingerprint";
import { cn } from "@/components/ui/cn";

interface Props { reportId: string; initialCount: number; initialReacted?: boolean; }

export default function ReactButton({ reportId, initialCount, initialReacted = false }: Props) {
  const [reacted, setReacted] = useState(initialReacted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`react_${reportId}`);
    if (stored === "1") setReacted(true);
  }, [reportId]);

  const handleReact = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const fp = await getFingerprint();
      const res = await fetch(`/api/reports/${reportId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint_hash: fp }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReacted(data.reacted);
      setCount(data.react_count);
      localStorage.setItem(`react_${reportId}`, data.reacted ? "1" : "0");
    } catch {
      toast.error("Gagal memperbarui reaksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleReact}
      disabled={loading}
      title="Saya juga lihat ini!"
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
        "border disabled:opacity-50",
        reacted
          ? "bg-wali-50 border-wali-400 text-wali-700"
          : "bg-white border-gray-200 text-gray-500 hover:border-wali-300 hover:text-wali-600"
      )}
    >
      <ThumbsUp size={15} className={reacted ? "fill-wali-600 text-wali-600" : ""} />
      <span>{count}</span>
    </button>
  );
}
