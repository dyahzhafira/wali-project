"use client";
import { useEffect, useRef, useState } from "react";
import { Report } from "@/types";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  baru: "#ef4444", terverifikasi: "#3b82f6", proses: "#f59e0b", selesai: "#10b981",
};

export default function FullMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [heatmap, setHeatmap] = useState(false);
  const heatLayer = useRef<any>(null);

  useEffect(() => {
    fetch("/api/reports?limit=200&sort=priority_score")
      .then(r => r.json()).then(d => setReports(d.reports || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    import("leaflet").then(async L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const container = mapRef.current!;
      if ((container as any)._leaflet_id) delete (container as any)._leaflet_id;
      const map = L.map(container).setView([-6.2, 106.8], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);

      reports.forEach(r => {
        const color = STATUS_COLORS[r.status] || "#94a3b8";
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3);cursor:pointer"></div>`,
          iconSize: [16, 16], iconAnchor: [8, 8],
        });
        L.marker([r.location_lat, r.location_lng], { icon })
          .bindPopup(`<div style="min-width:180px"><b>${r.location_name || "Lokasi"}</b><br/><small>Urgensi: ${r.urgency_scale}/5 · ${r.react_count} reaksi</small><br/><a href="/laporan/${r.id}" style="color:#1b6560;font-weight:600">Lihat Detail →</a></div>`)
          .addTo(map);
      });

      mapInstance.current = map;
    });
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, [reports]);

  const toggleHeatmap = async () => {
    if (!mapInstance.current) return;
    if (heatmap && heatLayer.current) {
      mapInstance.current.removeLayer(heatLayer.current);
      heatLayer.current = null;
      setHeatmap(false);
      return;
    }
    const L = await import("leaflet");
    // Fallback: use circle markers for heatmap effect since leaflet.heat requires extra setup
    const points = reports.map(r => [r.location_lat, r.location_lng, r.urgency_scale / 5]);
    // Simple heatmap using circle markers with opacity
    const layer = (L as any).layerGroup(
      reports.map(r => (L as any).circle([r.location_lat, r.location_lng], {
        radius: 300, color: "transparent",
        fillColor: STATUS_COLORS[r.status] || "#ef4444",
        fillOpacity: 0.3,
      }))
    ).addTo(mapInstance.current);
    heatLayer.current = layer;
    setHeatmap(true);
  };

  return (
    <div className="relative w-full h-full">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={mapRef} className="w-full h-full" />
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button onClick={toggleHeatmap} className={`px-3 py-2 rounded-lg text-xs font-medium shadow-md transition-colors ${heatmap ? "bg-wali-700 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}>
          {heatmap ? "🌡️ Heatmap ON" : "🌡️ Heatmap OFF"}
        </button>
        <div className="bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600">
          {reports.length} laporan aktif
        </div>
      </div>
    </div>
  );
}
