"use client";
import dynamic from "next/dynamic";

const FullMap = dynamic(() => import("@/components/map/FullMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-wali-50 flex items-center justify-center">
      <div className="text-center text-wali-600">
        <div className="w-10 h-10 border-2 border-wali-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Memuat peta...</p>
      </div>
    </div>
  ),
});

const LEGEND = [
  { color: "#ef4444", label: "Baru" },
  { color: "#3b82f6", label: "Terverifikasi" },
  { color: "#f59e0b", label: "Proses" },
  { color: "#10b981", label: "Selesai" },
];

export default function MapPage() {
  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>

      {/* Header bar */}
      <div className="wali-gradient px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white drop-shadow">Peta Persebaran Ikan Invasif</h1>
          <p className="text-white/75 text-xs font-medium mt-0.5">Semua laporan aktif dari warga secara real-time</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2 border-white/40 shadow-sm" style={{ background: color }} />
              <span className="text-white/85 text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <FullMap />
      </div>

    </div>
  );
}
