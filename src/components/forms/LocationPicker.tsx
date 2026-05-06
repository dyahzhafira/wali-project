"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/cn";

const LocationMap = dynamic(() => import("./LocationMap"), { ssr: false, loading: () => <div className="h-64 rounded-xl bg-gray-100 animate-pulse" /> });

interface Location { lat: number; lng: number; name?: string; }
interface Props { value: Location | null; onChange: (loc: Location) => void; }

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    const data = await res.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function LocationPicker({ value, onChange }: Props) {
  const [mode, setMode] = useState<"gps" | "map" | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleGPS = async () => {
    if (!navigator.geolocation) { setGpsError("Browser Anda tidak mendukung GPS."); return; }
    setGpsLoading(true); setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const name = await reverseGeocode(lat, lng);
        onChange({ lat, lng, name });
        setGpsLoading(false); setMode("gps");
      },
      () => { setGpsError("Gagal mendapatkan lokasi GPS. Coba pin manual."); setGpsLoading(false); }
    );
  };

  const handleMapChange = async (loc: { lat: number; lng: number }) => {
    const name = await reverseGeocode(loc.lat, loc.lng);
    onChange({ ...loc, name });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button type="button" onClick={handleGPS} disabled={gpsLoading}
          className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all", mode === "gps" && value ? "border-wali-500 bg-wali-50 text-wali-700" : "border-gray-200 hover:border-wali-300 text-gray-600")}>
          {gpsLoading ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
          Gunakan GPS
        </button>
        <button type="button" onClick={() => setMode("map")}
          className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all", mode === "map" ? "border-wali-500 bg-wali-50 text-wali-700" : "border-gray-200 hover:border-wali-300 text-gray-600")}>
          <MapPin size={16} />
          Pin di Peta
        </button>
      </div>

      {gpsError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{gpsError}</p>}

      {value && (
        <div className="flex items-start gap-2 bg-wali-50 border border-wali-200 rounded-lg px-3 py-2">
          <MapPin size={16} className="text-wali-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-wali-800">{value.name || "Lokasi dipilih"}</p>
            <p className="text-xs text-wali-600">{value.lat.toFixed(6)}, {value.lng.toFixed(6)}</p>
          </div>
        </div>
      )}

      {mode === "map" && (
        <LocationMap value={value} onChange={handleMapChange} />
      )}
    </div>
  );
}
