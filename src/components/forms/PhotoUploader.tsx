"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Camera } from "lucide-react";
import { cn } from "@/components/ui/cn";

interface Props {
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

async function compressImage(file: File): Promise<File> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 1200;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = (h / w) * MAX; w = MAX; }
          else { w = (w / h) * MAX; h = MAX; }
        }
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          if (blob) resolve(new File([blob], file.name, { type: "image/jpeg" }));
          else resolve(file);
        }, "image/jpeg", 0.8);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotoUploader({ value, onChange, maxFiles = 5, disabled }: Props) {
  const onDrop = useCallback(async (accepted: File[]) => {
    const remaining = maxFiles - value.length;
    const toAdd = accepted.slice(0, remaining);
    const compressed = await Promise.all(toAdd.map(compressImage));
    onChange([...value, ...compressed]);
  }, [value, onChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [] }, maxFiles, disabled: disabled || value.length >= maxFiles,
  });

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="flex flex-col gap-3">
      <div {...getRootProps()} className={cn(
        "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
        isDragActive ? "border-wali-500 bg-wali-50" : "border-gray-300 hover:border-wali-400 bg-gray-50",
        (disabled || value.length >= maxFiles) && "opacity-50 cursor-not-allowed"
      )}>
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600 font-medium">Seret foto ke sini atau klik untuk pilih</p>
        <p className="text-xs text-gray-400 mt-1">Maks {maxFiles} foto · Foto akan dikompres otomatis</p>
      </div>

      {/* Camera button for mobile */}
      <label className={cn("flex items-center gap-2 justify-center px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors", (disabled || value.length >= maxFiles) && "opacity-50 pointer-events-none")}>
        <Camera size={16} />
        <span>Gunakan Kamera</span>
        <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={async e => {
          if (e.target.files?.[0]) {
            const compressed = await compressImage(e.target.files[0]);
            onChange([...value, compressed]);
          }
        }} disabled={disabled || value.length >= maxFiles} />
      </label>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {value.map((file, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img src={URL.createObjectURL(file)} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              <button onClick={() => remove(i)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80">
                <X size={12} />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">
                {(file.size / 1024).toFixed(0)}KB
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500 text-right">{value.length}/{maxFiles} foto dipilih</p>
    </div>
  );
}
