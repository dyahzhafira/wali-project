"use client";
import { ProgressLog } from "@/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Fish, User } from "lucide-react";
import { useState } from "react";

interface Props {
  logs: ProgressLog[];
}

export default function ProgressTimeline({ logs }: Props) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Fish className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Belum ada update dari petugas lapangan.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Progress" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
      <div className="space-y-6">
        {logs.map((log, i) => (
          <div key={log.id} className="relative flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-wali-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {i + 1}
              </div>
              {i < logs.length - 1 && <div className="w-0.5 bg-wali-200 flex-1 mt-2" />}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3.5 h-3.5 text-wali-600" />
                <span className="text-sm font-medium text-wali-700">
                  {log.admin_users?.full_name || "Petugas"}
                </span>
                <span className="text-xs text-gray-400">
                  {format(new Date(log.logged_at), "d MMM yyyy, HH:mm", { locale: id })}
                </span>
              </div>
              <p className="text-gray-700 text-sm mb-2">{log.description}</p>
              {log.fish_caught_count != null && log.fish_caught_count > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-wali-700 font-medium mb-2">
                  <Fish className="w-4 h-4" />
                  <span>{log.fish_caught_count.toLocaleString("id")} ekor tertangkap</span>
                </div>
              )}
              {log.photos?.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {log.photos.slice(0, 4).map((photo, j) => (
                    <button
                      key={j}
                      onClick={() => setLightbox(photo)}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
                    >
                      <img src={photo} alt={`Progress ${j + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
