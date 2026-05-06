"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, MapPin, FileText, Building2, Camera } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import LocationPicker from "@/components/forms/LocationPicker";
import PhotoUploader from "@/components/forms/PhotoUploader";
import { createClient } from "@/lib/supabase/client";

const URGENCY_OPTIONS = [
  { value: 1, label: "1 — 1–5 Ekor (Rendah)", color: "#10b981" },
  { value: 2, label: "2 — 5–20 Ekor (Sedang)", color: "#84cc16" },
  { value: 3, label: "3 — 20–50 Ekor (Cukup Tinggi)", color: "#f59e0b" },
  { value: 4, label: "4 — 50–100 Ekor (Tinggi)", color: "#f97316" },
  { value: 5, label: "5 — >100 Ekor / Seluruh Perairan (Darurat)", color: "#BA1A1A" },
];

export default function LaporanResmiBaruPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [form, setForm] = useState({
    unit_kerja: "",
    nomor_surat: "",
    description: "",
    urgency_scale: 3,
    water_body_type: "",
    tindakan: "",
    reporter_email: "",
  });

  const handleChange = (field: string, value: string | number) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) { toast.error("Lokasi wajib dipilih"); return; }
    if (!form.description.trim() || form.description.length < 20) {
      toast.error("Deskripsi minimal 20 karakter"); return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const photoUrls: string[] = [];
      for (const file of photos) {
        const filename = `dinas_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
        const { data, error } = await supabase.storage.from("report-photos").upload(filename, file, { contentType: "image/jpeg" });
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage.from("report-photos").getPublicUrl(data.path);
          photoUrls.push(publicUrl);
        }
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "web",
          photos: photoUrls,
          description: `[LAPORAN RESMI — ${form.unit_kerja}${form.nomor_surat ? ` | No. Surat: ${form.nomor_surat}` : ""}]\n\n${form.description.trim()}${form.tindakan ? `\n\nTindakan yang telah dilakukan: ${form.tindakan}` : ""}`,
          location_lat: location.lat,
          location_lng: location.lng,
          location_name: location.name,
          water_body_type: form.water_body_type || undefined,
          urgency_scale: form.urgency_scale,
          reporter_email: form.reporter_email || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal membuat laporan");
      }

      const { report } = await res.json();
      toast.success("Laporan resmi berhasil dibuat!");
      router.push(`/admin/laporan/${report.id}`);
    } catch (e: any) {
      toast.error(e?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/laporan" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buat Laporan Resmi Dinas</h1>
          <p className="text-xs text-gray-500">Laporan dari instansi/dinas terkait</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-wali-50 border border-wali-100 rounded-2xl p-4 mb-6 flex gap-3">
        <FileText size={20} className="text-wali-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-wali-800 mb-0.5">Laporan Resmi</p>
          <p className="text-xs text-wali-600 leading-relaxed">
            Laporan ini dibuat oleh petugas/admin dinas dan langsung masuk ke sistem dengan status <strong>Terverifikasi</strong>. Tidak ada batas pengiriman untuk laporan resmi.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Unit Kerja */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-wali-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Identitas Instansi</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Unit Kerja / Instansi *"
              value={form.unit_kerja}
              onChange={e => handleChange("unit_kerja", e.target.value)}
              placeholder="Contoh: Dinas LH Jakarta Selatan"
              required
            />
            <Input
              label="Nomor Surat (opsional)"
              value={form.nomor_surat}
              onChange={e => handleChange("nomor_surat", e.target.value)}
              placeholder="Contoh: 500/123/DLH/2025"
            />
          </div>
          <div className="mt-3">
            <Input
              label="Email Pelapor (opsional)"
              type="email"
              value={form.reporter_email}
              onChange={e => handleChange("reporter_email", e.target.value)}
              placeholder="petugas@dinas.go.id"
            />
          </div>
        </div>

        {/* Dokumentasi Foto */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Camera size={16} className="text-wali-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Dokumentasi Foto (opsional)</h2>
          </div>
          <PhotoUploader value={photos} onChange={setPhotos} maxFiles={5} />
        </div>

        {/* Lokasi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-wali-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Lokasi Temuan *</h2>
          </div>
          <LocationPicker value={location} onChange={setLocation} />
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Jenis Perairan</label>
            <select
              value={form.water_body_type}
              onChange={e => handleChange("water_body_type", e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-wali-500 outline-none"
            >
              <option value="">Pilih jenis perairan (opsional)</option>
              {["sungai", "danau", "kolam", "parit", "lainnya"].map(v => (
                <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Deskripsi & Urgensi */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Detail Temuan</h2>
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Deskripsi Situasi <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={e => handleChange("description", e.target.value)}
              rows={4}
              placeholder="Deskripsikan kondisi ikan invasif yang ditemukan: jumlah estimasi, kondisi ekosistem, potensi dampak, dll."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-wali-500 outline-none"
              required
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.description.length} karakter</p>
          </div>

          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 block mb-1">Tindakan yang Telah Dilakukan (opsional)</label>
            <textarea
              value={form.tindakan}
              onChange={e => handleChange("tindakan", e.target.value)}
              rows={2}
              placeholder="Contoh: Sudah dilakukan survei awal, belum ada penanganan lebih lanjut"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-wali-500 outline-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Tingkat Urgensi <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-col gap-2">
              {URGENCY_OPTIONS.map(opt => (
                <label key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    form.urgency_scale === opt.value
                      ? "border-wali-500 bg-wali-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}>
                  <input
                    type="radio"
                    name="urgency"
                    value={opt.value}
                    checked={form.urgency_scale === opt.value}
                    onChange={() => handleChange("urgency_scale", opt.value)}
                    className="hidden"
                  />
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ background: opt.color }} />
                  <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" loading={loading} className="w-full py-4 text-base rounded-2xl">
          <Send size={16} /> Kirim Laporan Resmi
        </Button>
      </form>
    </div>
  );
}
