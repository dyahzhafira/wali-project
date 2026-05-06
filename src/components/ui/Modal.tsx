"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "./cn";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" };

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className={cn("relative w-full rounded-2xl bg-white shadow-xl outline-none flex flex-col max-h-[90vh]", sizes[size])}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
