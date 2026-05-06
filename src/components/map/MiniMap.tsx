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

export default function MiniMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [reports, setReports] = useState<ReportPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch reports on mount
  useEffect(() => {
    fetch("/api/reports?limit=100&sort=priority_score")
      .then(r => r.json())
      .then(d => {
        setReports(d.reports || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    import("leaflet").then(L => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const container = mapRef.current!;
      if ((container as any)._leaflet_id) delete (container as any)._leaflet_id;
      const map = L.map(container, { zoomControl: true, scrollWheelZoom: false }).setView([-6.2, 106.8], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);
      mapInstance.current = map;
    });
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  // Add markers after both map and reports are ready
  useEffect(() => {
    if (!mapInstance.current || loading || reports.length === 0) return;
    import("leaflet").then(L => {
      reports.forEach(report => {
        const color = STATUS_COLORS[report.status] || "#94a3b8";
        const size = 10 + (report.urgency_scale || 1) * 2;
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        L.marker([report.location_lat, report.location_lng], { icon })
          .bindPopup(
            `<div style="min-width:160px;font-family:sans-serif">
              <b style="font-size:13px">${report.location_name || "Lokasi"}</b><br/>
              <span style="font-size:11px;color:#6b7280">Status: ${report.status} · Urgensi ${report.urgency_scale}/5</span><br/>
              <a href="/laporan/${report.id}" style="color:#1b6560;font-weight:600;font-size:12px">Lihat Detail →</a>
            </div>`
          )
          .addTo(mapInstance.current);
      });
    });
  }, [reports, loading]);

  return (
    <div className="w-full h-full relative">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={mapRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 bg-wali-50 flex items-center justify-center rounded-2xl">
          <div className="text-center text-wali-600">
            <div className="w-8 h-8 border-2 border-wali-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium">Memuat peta...</p>
          </div>
        </div>
      )}
      {!loading && reports.length > 0 && (
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
          {reports.length} laporan aktif
        </div>
      )}
    </div>
  );
}
