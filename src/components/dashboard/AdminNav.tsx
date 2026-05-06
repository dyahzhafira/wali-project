"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, LogOut, Bell, UserCircle, Menu, X, PlusCircle } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/components/ui/cn";
import { AdminUser } from "@/types";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin_dinas: "Admin Dinas",
  petugas_lapangan: "Petugas Lapangan",
};

const ROLE_COLOR: Record<string, string> = {
  super_admin: "bg-purple-500/20 text-purple-200",
  admin_dinas: "bg-blue-500/20 text-blue-200",
  petugas_lapangan: "bg-wali-500/20 text-wali-300",
};

interface Props {
  userEmail?: string;
  adminUser?: AdminUser | null;
}

export default function AdminNav({ userEmail, adminUser }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifCount, setNotifCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => r.json())
      .then(d => setNotifCount(d.unverified ?? 0))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const navLinks = [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/laporan", label: "Laporan", icon: FileText },
    { href: "/admin/laporan/resmi/baru", label: "Lapor Resmi", icon: PlusCircle },
    { href: "/admin/notifikasi", label: "Notifikasi", icon: Bell, badge: notifCount },
    { href: "/admin/profil", label: "Profil Saya", icon: UserCircle },
  ];

  return (
    <nav className="bg-wali-900 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/admin/dashboard" className="flex items-center gap-2.5 shrink-0">
          <Image src="/logo.png" alt="WALI" width={32} height={32} className="rounded-full" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-base tracking-tight">WALI</span>
            <span className="text-wali-400 text-xs font-medium">Admin Portal</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map(({ href, label, icon: Icon, badge }) => (
            <Link key={href} href={href}
              className={cn(
                "relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-wali-700 text-white shadow-sm"
                  : "text-wali-300 hover:text-white hover:bg-wali-800"
              )}>
              <Icon size={15} />
              {label}
              {!!badge && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Right: user info + logout */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {adminUser && (
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-sm font-semibold text-white leading-none">{adminUser.full_name}</span>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                ROLE_COLOR[adminUser.role] || "bg-gray-500/20 text-gray-300")}>
                {ROLE_LABELS[adminUser.role] || adminUser.role}
              </span>
            </div>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-wali-300 hover:text-white hover:bg-wali-800 transition-colors font-medium">
            <LogOut size={14} /> Keluar
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(v => !v)}
          className="md:hidden p-2 rounded-lg text-wali-300 hover:text-white hover:bg-wali-800 transition-colors">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-wali-800 bg-wali-900 px-4 py-4 flex flex-col gap-2">
          {navLinks.map(({ href, label, icon: Icon, badge }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                pathname.startsWith(href)
                  ? "bg-wali-700 text-white"
                  : "text-wali-300 hover:text-white hover:bg-wali-800"
              )}>
              <Icon size={16} />
              {label}
              {!!badge && (
                <span className="ml-auto min-w-[20px] h-5 px-1 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          ))}
          {adminUser && (
            <div className="px-4 py-2 mt-1 border-t border-wali-800">
              <p className="text-sm font-semibold text-white">{adminUser.full_name}</p>
              <p className={cn("text-xs font-medium mt-0.5", ROLE_COLOR[adminUser.role]?.split(" ")[1] || "text-wali-400")}>
                {ROLE_LABELS[adminUser.role] || adminUser.role}
              </p>
            </div>
          )}
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-wali-800 transition-colors font-medium">
            <LogOut size={16} /> Keluar
          </button>
        </div>
      )}
    </nav>
  );
}
