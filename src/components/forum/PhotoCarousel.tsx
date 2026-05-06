"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X, ImageOff } from "lucide-react";
import { cn } from "@/components/ui/cn";

interface Props { photos: string[]; alt?: string; }

export default function PhotoCarousel({ photos, alt = "Foto laporan" }: Props) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!photos || photos.length === 0) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2">
        <ImageOff className="w-10 h-10 opacity-40" />
        <p className="text-sm">Tidak ada foto</p>
      </div>
    );
  }

  const prev = () => setCurrent(i => (i - 1 + photos.length) % photos.length);
  const next = () => setCurrent(i => (i + 1) % photos.length);

  return (
    <div className="flex flex-col gap-2">
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"><X size={24} /></button>
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-4 text-white hover:text-gray-300 p-2 bg-black/30 rounded-full"><ChevronLeft size={28} /></button>
              <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-4 text-white hover:text-gray-300 p-2 bg-black/30 rounded-full"><ChevronRight size={28} /></button>
            </>
          )}
          <img src={photos[current]} alt={alt} className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
          <p className="absolute bottom-4 text-white text-sm">{current + 1} / {photos.length}</p>
        </div>
      )}

      <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden cursor-pointer" onClick={() => setLightbox(true)}>
        <img src={photos[current]} alt={`${alt} ${current + 1}`} className="w-full h-full object-cover" />
        {photos.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"><ChevronLeft size={18} /></button>
            <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"><ChevronRight size={18} /></button>
            <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">{current + 1}/{photos.length}</span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={cn("shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all", i === current ? "border-wali-500" : "border-transparent opacity-60 hover:opacity-100")}>
              <img src={photo} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
