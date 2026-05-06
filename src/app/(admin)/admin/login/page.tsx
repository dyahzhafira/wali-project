"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError("Email atau password salah"); return; }
      router.push("/admin/dashboard");
      router.refresh();
    } catch { setError("Terjadi kesalahan. Coba lagi."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen wali-gradient relative flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full opacity-25"
          style={{ background: "#e6e9d8", filter: "blur(80px)" }} />
        <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: "#e6e9d8", filter: "blur(100px)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-10"
          style={{ background: "#066A5F", filter: "blur(120px)" }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4"
            style={{ filter: "drop-shadow(0 8px 24px rgba(6,106,95,0.45))" }}>
            <Image src="/logo.png" alt="WALI" width={88} height={88} className="rounded-full" />
          </div>
          <h1 className="text-5xl font-bold text-white drop-shadow-lg tracking-tight mb-1">WALI</h1>
          <p className="text-white/80 text-sm font-semibold">Portal Pemerintah & Dinas</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl px-8 py-8"
          style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          <h2 className="text-xl font-bold text-wali-900 mb-1">Selamat Datang</h2>
          <p className="text-sm text-gray-500 mb-6">Masuk sebagai petugas, admin dinas, atau super admin</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="petugas@dinas.go.id"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-wali-500 focus:border-wali-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm focus:ring-2 focus:ring-wali-500 focus:border-wali-500 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-gradient text-white font-semibold py-3.5 rounded-xl shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 mt-1 flex items-center justify-center gap-2 text-base">
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> Masuk...</>
                : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Demo: admin@wali.id / Admin@2025!</p>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          © 2025 WALI — Warga Andil Lawan Invasif
        </p>
      </div>
    </div>
  );
}
