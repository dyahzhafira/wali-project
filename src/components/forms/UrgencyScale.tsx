"use client";
import { cn } from "@/components/ui/cn";

const LEVELS = [
  { scale: 1, emoji: "🐟", label: "1–5 Ekor", desc: "Terlihat beberapa ekor, belum mengganggu", color: "border-green-400 bg-green-50 text-green-700", active: "ring-2 ring-green-400" },
  { scale: 2, emoji: "🐟🐟", label: "5–20 Ekor", desc: "Mulai terlihat, belum mendominasi", color: "border-lime-400 bg-lime-50 text-lime-700", active: "ring-2 ring-lime-400" },
  { scale: 3, emoji: "🐟🐟🐟", label: "20–50 Ekor", desc: "Cukup banyak, mulai mengganggu", color: "border-yellow-400 bg-yellow-50 text-yellow-700", active: "ring-2 ring-yellow-400" },
  { scale: 4, emoji: "🐟🐟🐟🐟", label: "50–100 Ekor", desc: "Sangat banyak, mendominasi area perairan", color: "border-orange-400 bg-orange-50 text-orange-700", active: "ring-2 ring-orange-400" },
  { scale: 5, emoji: "🐟🐟🐟🐟🐟", label: ">100 Ekor / Seluruh Perairan", desc: "Invasif sangat parah, ikan memenuhi hampir seluruh perairan", color: "border-red-400 bg-red-50 text-red-700", active: "ring-2 ring-red-400" },
];

interface Props { value: number | null; onChange: (scale: number) => void; disabled?: boolean; }

export default function UrgencyScale({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
      {LEVELS.map(({ scale, emoji, label, desc, color, active }) => (
        <button
          key={scale}
          type="button"
          onClick={() => onChange(scale)}
          disabled={disabled}
          className={cn(
            "flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all cursor-pointer",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            color,
            value === scale ? active : "opacity-70 hover:opacity-100"
          )}
        >
          <span className="text-xl">{emoji}</span>
          <span className="font-semibold text-sm leading-tight">{label}</span>
          <span className="text-xs opacity-80">{desc}</span>
        </button>
      ))}
    </div>
  );
}
