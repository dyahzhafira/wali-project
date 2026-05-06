"use client";
import dynamic from "next/dynamic";

const AdminMapEmbed = dynamic(() => import("./AdminMapEmbed"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[360px] rounded-2xl bg-wali-50 flex items-center justify-center">
      <div className="text-center text-wali-600">
        <div className="w-8 h-8 border-2 border-wali-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs font-medium">Memuat peta...</p>
      </div>
    </div>
  ),
});

export default function AdminMapEmbedClient() {
  return <AdminMapEmbed />;
}
