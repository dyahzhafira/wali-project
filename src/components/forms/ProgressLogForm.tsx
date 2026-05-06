"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import PhotoUploader from "./PhotoUploader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Props { reportId: string; onSuccess: () => void; onCancel: () => void; }

export default function ProgressLogForm({ reportId, onSuccess, onCancel }: Props) {
  const [photos, setPhotos] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [fishCount, setFishCount] = useState("");
  const [loggedAt, setLoggedAt] = useState(new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { toast.error("Deskripsi tindakan wajib diisi"); return; }
    if (photos.length === 0) { toast.error("Minimal 1 foto dokumentasi diperlukan"); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const photoUrls: string[] = [];
      for (const file of photos) {
        const filename = `progress_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { data, error } = await supabase.storage.from("progress-photos").upload(filename, file, { contentType: "image/jpeg" });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from("progress-photos").getPublicUrl(data.path);
        photoUrls.push(publicUrl);
      }
      const res = await fetch(`/api/reports/${reportId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: photoUrls, description: description.trim(), fish_caught_count: fishCount ? parseInt(fishCount) : undefined, logged_at: new Date(loggedAt).toISOString() }),
      });
      if (!res.ok) throw new Error();
      toast.success("Progress log berhasil ditambahkan!");
      onSuccess();
    } catch {
      toast.error("Gagal menambahkan progress log");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-2">Foto Dokumentasi <span className="text-red-500">*</span></label>
        <PhotoUploader value={photos} onChange={setPhotos} maxFiles={10} />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Deskripsi Tindakan <span className="text-red-500">*</span></label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Jelaskan tindakan yang sudah dilakukan di lapangan..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-wali-500 focus:border-wali-500 outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Jumlah Ikan Tertangkap" type="number" min={0} value={fishCount} onChange={e => setFishCount(e.target.value)} placeholder="0" hint="Opsional" />
        <Input label="Tanggal & Waktu Kegiatan" type="datetime-local" value={loggedAt} onChange={e => setLoggedAt(e.target.value)} required />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading} className="flex-1">Batal</Button>
        <Button type="submit" loading={loading} className="flex-1">Simpan Progress</Button>
      </div>
    </form>
  );
}
