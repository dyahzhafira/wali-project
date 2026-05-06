"use client";
import { ReportStatus } from "@/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CheckCircle, Circle, Clock } from "lucide-react";

const STEPS: { key: ReportStatus | "start"; label: string }[] = [
  { key: "start", label: "Laporan Masuk" },
  { key: "terverifikasi", label: "Terverifikasi" },
  { key: "proses", label: "Sedang Ditangani" },
  { key: "selesai", label: "Selesai" },
];

const STATUS_ORDER: Record<string, number> = {
  baru: 0,
  terverifikasi: 1,
  proses: 2,
  selesai: 3,
};

interface Props {
  status: ReportStatus;
  created_at: string;
  verified_at?: string;
}

export default function StatusTracker({ status, created_at, verified_at }: Props) {
  const currentStep = STATUS_ORDER[status] ?? 0;

  const stepDates = [
    created_at,
    verified_at,
    undefined,
    undefined,
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-wali-500 z-0 transition-all duration-500"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        />
        {STEPS.map((step, i) => {
          const done = i <= currentStep;
          const active = i === currentStep;
          return (
            <div key={step.key} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  done
                    ? "bg-wali-700 text-white"
                    : "bg-gray-200 text-gray-400"
                } ${active ? "ring-2 ring-wali-300 ring-offset-2" : ""}`}
              >
                {done ? (
                  i === currentStep && status !== "selesai" ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </div>
              <p className={`mt-2 text-xs font-medium text-center ${done ? "text-wali-700" : "text-gray-400"}`}>
                {step.label}
              </p>
              {stepDates[i] && done && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {format(new Date(stepDates[i]!), "d MMM", { locale: id })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
