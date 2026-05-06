"use client";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  baru: "#ef4444",
  terverifikasi: "#3b82f6",
  proses: "#f59e0b",
  selesai: "#10b981",
  dismissed: "#9ca3af",
};

const STATUS_LABELS: Record<string, string> = {
  baru: "Baru",
  terverifikasi: "Terverifikasi",
  proses: "Proses",
  selesai: "Selesai",
  dismissed: "Dismissed",
};

const URGENCY_COLORS = ["#10b981", "#84cc16", "#f59e0b", "#f97316", "#ef4444"];

interface DailyPoint { label: string; count: number }
interface StatusPoint { name: string; value: number; color: string }
interface UrgencyPoint { level: string; count: number; fill: string }

interface Props {
  daily: DailyPoint[];
  byStatus: StatusPoint[];
  byUrgency: UrgencyPoint[];
}

export default function DashboardCharts({ daily, byStatus, byUrgency }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Daily trend */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Laporan 7 Hari Terakhir</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={daily} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              formatter={(v: number) => [v, "Laporan"]}
            />
            <Line type="monotone" dataKey="count" stroke="#1b6560" strokeWidth={2.5} dot={{ fill: "#1b6560", r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Status donut */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Laporan</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={byStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
              {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} formatter={(v: number, _: string, props: any) => [v, props.payload.name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1 mt-2">
          {byStatus.filter(s => s.value > 0).map(s => (
            <div key={s.name} className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                {s.name}
              </div>
              <span className="font-semibold tabular-nums">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Urgency bar */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribusi Urgensi</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={byUrgency} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="level" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} formatter={(v: number) => [v, "Laporan"]} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {byUrgency.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
