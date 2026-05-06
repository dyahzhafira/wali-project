"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function PasswordChangeCard() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) { toast.error("Password minimal 8 karakter"); return; }
    if (next !== confirm) { toast.error("Konfirmasi password tidak cocok"); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success("Password berhasil diubah!");
      setCurrent(""); setNext(""); setConfirm(""); setOpen(false);
    } catch (e: any) {
      toast.error(e?.message || "Gagal mengubah password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <KeyRound size={16} className="text-wali-600" />
          <span className="font-semibold text-gray-900 text-sm">Ubah Password</span>
        </div>
        <span className="text-xs text-wali-600 font-medium">{open ? "Tutup" : "Ubah"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-3 border-t border-gray-50">
          <div className="mt-3">
            <label className="text-xs font-medium text-gray-500 block mb-1">Password Baru</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={next}
                onChange={e => setNext(e.target.value)}
                placeholder="Min. 8 karakter"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-wali-500 outline-none"
                required
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Konfirmasi Password Baru</label>
            <input
              type={showPw ? "text" : "password"}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-wali-500 outline-none"
              required
            />
          </div>
          <Button type="submit" loading={loading} className="w-full mt-1">
            Simpan Password Baru
          </Button>
        </form>
      )}
    </div>
  );
}
