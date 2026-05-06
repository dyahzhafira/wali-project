"use client";
import { useEffect, useRef, useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  baru: "#ef4444",
  terverifikasi: "#3b82f6",
  proses: "#f59e0b",
  selesai: "#10b981",
};

interface ReportPoint {
  id: string;
  location_lat: number;
  location_lng: number;
  location_name: string;
  status: string;
  urgency_scale: number;
}

export default function AdminMapEmbed() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersLayer = useRef<any>(null);
  const heatLayer = useRef<any>(null);
  const [reports, setReports] = useState<ReportPoint[]>([]);
  const [heatmap, setHeatmap] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/reports?limit=300&sort=priority_score")
      .then(r => r.json())
      .then(d => {
        const pts = (d.reports || []) as ReportPoint[];
        setReports(pts);
        setCount(pts.length);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    import("leaflet").then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const container = mapRef.current!;
      if ((container as any)._leaflet_id) delete (container as any)._leaflet_id;
      const map = L.map(container, { zoomControl: true }).setView([-6.2, 106.8], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);
      mapInstance.current = map;
      markersLayer.current = L.layerGroup().addTo(map);
    });
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;
    import("leaflet").then(L => {
      markersLayer.current.clearLayers();
      const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);
      filtered.forEach(r => {
        const color = STATUS_COLORS[r.status] || "#94a3b8";
        const size = 10 + r.urgency_scale * 2;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);cursor:pointer;transition:transform .1s" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        L.marker([r.location_lat, r.location_lng], { icon })
          .bindPopup(
            `<div style="min-width:190px;font-family:sans-serif">
              <div style="font-weight:700;margin-bottom:4px">${r.location_name || "Lokasi"}</div>
              <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
                <span style="background:${color};color:white;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600">${r.status}</span>
                <span style="font-size:11px;color:#6b7280">Urgensi ${r.urgency_scale}/5</span>
              </div>
              <a href="/admin/laporan/${r.id}" style="color:#1b6560;font-weight:600;font-size:12px">Lihat Detail →</a>
            </div>`
          )
          .addTo(markersLayer.current);
      });
    });
  }, [reports, filter]);

  const toggleHeatmap = async () => {
    if (!mapInstance.current) return;
    const L = await import("leaflet");
    if (heatmap && heatLayer.current) {
      mapInstance.current.removeLayer(heatLayer.current);
      heatLayer.current = null;
      setHeatmap(false);
      return;
    }
    const layer = (L as any).layerGroup(
      reports.map(r => (L as any).circle([r.location_lat, r.location_lng], {
        radius: 250 + r.urgency_scale * 80,
        color: "transparent",
        fillColor: STATUS_COLORS[r.status] || "#ef4444",
        fillOpacity: 0.18,
      }))
    ).addTo(mapInstance.current);
    heatLayer.current = layer;
    setHeatmap(true);
  };

  const STATUS_FILTERS = [
    { key: "all", label: "Semua", color: "#6b7280" },
    { key: "baru", label: "Baru", color: "#ef4444" },
    { key: "terverifikasi", label: "Terverifikasi", color: "#3b82f6" },
    { key: "proses", label: "Proses", color: "#f59e0b" },
    { key: "selesai", label: "Selesai", color: "#10b981" },
  ];

  return (
    <div className="relative w-full h-full min-h-[360px] rounded-2xl overflow-hidden">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={mapRef} className="w-full h-full" />

      {/* Controls overlay */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {/* Status filters */}
        <div className="bg-white rounded-xl shadow-md px-2 py-1.5 flex flex-wrap gap-1">
          {STATUS_FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: filter === f.key ? f.color : "transparent",
                color: filter === f.key ? "white" : "#374151",
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right controls */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <button onClick={toggleHeatmap}
          className="px-3 py-2 rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
          style={{
            background: heatmap ? "#1b6560" : "white",
            color: heatmap ? "white" : "#374151",
          }}>
          <span>🌡</span> Heatmap
        </button>
        <div className="bg-white rounded-xl shadow-md px-3 py-2 text-xs font-medium text-gray-600 text-center">
          {filter === "all" ? count : reports.filter(r => r.status === filter).length} titik
        </div>
      </div>
    </div>
  );
}
