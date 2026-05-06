"use client";
import { useEffect, useRef } from "react";

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (loc: { lat: number; lng: number }) => void;
}

export default function LocationMap({ value, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import("leaflet").then(L => {
      // Fix default icon
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const center: [number, number] = value ? [value.lat, value.lng] : [-6.2, 106.8];
      const map = L.map(mapRef.current!).setView(center, value ? 14 : 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      if (value) {
        markerRef.current = L.marker([value.lat, value.lng]).addTo(map);
      }

      map.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        if (markerRef.current) markerRef.current.setLatLng([lat, lng]);
        else markerRef.current = L.marker([lat, lng]).addTo(map);
        onChange({ lat, lng });
      });

      mapInstance.current = map;
    });

    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markerRef.current || !value) return;
    markerRef.current.setLatLng([value.lat, value.lng]);
    mapInstance.current.setView([value.lat, value.lng], 14);
  }, [value?.lat, value?.lng]);

  return (
    <div className="relative">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={mapRef} className="w-full h-64 rounded-xl z-0 border border-gray-200" />
      <p className="text-xs text-gray-500 mt-1 text-center">Klik pada peta untuk menandai lokasi</p>
    </div>
  );
}
