"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import PhotoUploader from "./PhotoUploader";
import LocationPicker from "./LocationPicker";
import UrgencyScale from "./UrgencyScale";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/components/ui/cn";

interface Props { onSuccess: (token: string, reportId: string) => void; }

const STEPS = ["Foto", "Lokasi & Detail", "Tingkat Urgensi", "Review & Kirim"];

export default function ReportForm({ onSuccess }: Props) {
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<File[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [description, setDescription] = useState("");
  const [waterBody, setWaterBody] = useState("");
  const [urgency, setUrgency] = useState<number | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0 && photos.length === 0) e.photos = "Minimal 1 foto diperlukan";
    if (step === 1) {
      if (!location) e.location = "Lokasi wajib diisi";
      if (description.trim().length < 20) e.description = "Deskripsi minimal 20 karakter";
    }
    if (step === 2 && !urgency) e.urgency = "Pilih tingkat urgensi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => s + 1); };
  const back = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Upload photos
      const photoUrls: string[] = [];
      for (const file of photos) {
        const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { data, error } = await supabase.storage.from("report-photos").upload(filename, file, { contentType: "image/jpeg" });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("report-photos").getPublicUrl(data.path);
        photoUrls.push(publicUrl);
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "web",
          photos: photoUrls,
          description: description.trim(),
          location_lat: location!.lat,
          location_lng: location!.lng,
          location_name: location!.name,
          water_body_type: waterBody || undefined,
          urgency_scale: urgency,
          reporter_email: email.trim() || undefined,
        }),
      });

      if (res.status === 429) { toast.error("Batas laporan harian tercapai (maks 3/hari)"); return; }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Gagal mengirim laporan");
      }

      const { report } = await res.json();
      toast.success("Laporan berhasil dikirim!");
      onSuccess(report.unique_token ?? report.id, report.id);
    } catch (e: any) {
      toast.error(e?.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors", i < step ? "bg-wali-500 text-white" : i === step ? "bg-wali-700 text-white ring-2 ring-wali-200" : "bg-gray-200 text-gray-500")}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={cn("text-xs mt-1 font-medium hidden sm:block", i === step ? "text-wali-700" : "text-gray-400")}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={cn("flex-1 h-0.5 mx-1", i < step ? "bg-wali-400" : "bg-gray-200")} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Step 0: Photos */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Foto Ikan Sapu-Sapu</h2>
              <p className="text-sm text-gray-500">Ambil atau unggah foto ikan yang Anda temukan (min. 1 foto, maks. 5)</p>
            </div>
            <PhotoUploader value={photos} onChange={setPhotos} maxFiles={5} />
            {errors.photos && <p className="text-sm text-red-600">⚠ {errors.photos}</p>}
          </div>
        )}

        {/* Step 1: Location & Details */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Lokasi & Deskripsi</h2>
              <p className="text-sm text-gray-500">Tandai lokasi penemuan dan ceritakan situasinya</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Lokasi <span className="text-red-500">*</span></label>
              <LocationPicker value={location} onChange={setLocation} />
              {errors.location && <p className="text-sm text-red-600 mt-1">⚠ {errors.location}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Jenis Perairan</label>
              <select value={waterBody} onChange={e => setWaterBody(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-wali-500 focus:border-wali-500 outline-none">
                <option value="">Pilih jenis perairan (opsional)</option>
                {["sungai", "danau", "kolam", "parit", "lainnya"].map(v => (
                  <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Deskripsi Situasi <span className="text-red-500">*</span></label>
              <textarea
                value={description} onChange={e => setDescription(e.target.value)}
                rows={4} placeholder="Contoh: Saya melihat sekitar 20-30 ekor ikan sapu-sapu di Kali Ciliwung dekat jembatan X. Airnya keruh dan ikan terlihat sangat aktif di permukaan..."
                className={cn("w-full rounded-lg border px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-wali-500 focus:border-wali-500 outline-none", errors.description ? "border-red-400" : "border-gray-300")}
              />
              <div className="flex justify-between mt-1">
                {errors.description ? <p className="text-xs text-red-600">⚠ {errors.description}</p> : <span />}
                <p className="text-xs text-gray-400">{description.length} karakter</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Urgency */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Tingkat Urgensi</h2>
              <p className="text-sm text-gray-500">Seberapa parah situasi ikan invasif di lokasi tersebut?</p>
            </div>
            <UrgencyScale value={urgency} onChange={setUrgency} />
            {errors.urgency && <p className="text-sm text-red-600">⚠ {errors.urgency}</p>}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Review & Kirim</h2>
              <p className="text-sm text-gray-500">Periksa data laporan Anda sebelum dikirim</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.slice(0, 3).map((f, i) => (
                <img key={i} src={URL.createObjectURL(f)} alt={`Preview ${i+1}`} className="aspect-square rounded-lg object-cover" />
              ))}
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
              <p><span className="font-medium">Lokasi:</span> {location?.name || `${location?.lat.toFixed(4)}, ${location?.lng.toFixed(4)}`}</p>
              <p><span className="font-medium">Deskripsi:</span> {description}</p>
              <p><span className="font-medium">Urgensi:</span> {urgency}/5</p>
              {waterBody && <p><span className="font-medium">Perairan:</span> {waterBody}</p>}
            </div>
            <Input label="Email untuk notifikasi (opsional)" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" hint="Kami akan mengirim update laporan Anda ke email ini" />
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
          {step > 0 ? (
            <Button variant="ghost" onClick={back} disabled={loading}>← Kembali</Button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Lanjut →</Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>🚀 Kirim Laporan</Button>
          )}
        </div>
      </div>
    </div>
  );
}
