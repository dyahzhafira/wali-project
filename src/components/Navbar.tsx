"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Shield } from "lucide-react";
import { cn } from "./ui/cn";
import Image from "next/image";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/laporan", label: "Forum Laporan" },
  { href: "/peta", label: "Peta Persebaran" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/telegram", label: "Bot Telegram" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.png" alt="WALI" width={40} height={40} className="rounded-full" />
          <span className="text-xl font-bold text-wali-700 tracking-tight">WALI</span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link href={href}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-colors",
                  isActive(href)
                    ? "text-wali-700 bg-wali-100"
                    : "text-gray-600 hover:text-wali-700 hover:bg-wali-50"
                )}>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA buttons + hamburger */}
        <div className="flex items-center gap-2">
          {/* Login Dinas — desktop */}
          <Link href="/admin/login"
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full border border-wali-300 text-wali-700 font-semibold text-sm hover:bg-wali-50 transition-colors">
            <Shield size={14} />
            Portal Dinas
          </Link>
          {/* Mulai Laporan */}
          <Link href="/laporan/baru"
            className="hidden sm:flex items-center gap-2 btn-gradient text-white font-semibold px-5 py-2.5 rounded-full shadow-sm hover:opacity-90 transition-opacity text-sm">
            Mulai Laporan
          </Link>
          {/* Hamburger */}
          <button onClick={() => setOpen(v => !v)}
            className="md:hidden p-2 rounded-lg text-wali-700 hover:bg-wali-50 transition-colors"
            aria-label={open ? "Tutup menu" : "Buka menu"}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 flex flex-col gap-2">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn(
                "px-4 py-3 rounded-xl text-sm font-semibold",
                isActive(href) ? "text-wali-700 bg-wali-100" : "text-gray-600 hover:bg-wali-50"
              )}>
              {label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-3 mt-1 flex flex-col gap-2">
            <Link href="/admin/login" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-wali-300 text-wali-700 font-semibold text-sm text-center justify-center">
              <Shield size={15} /> Portal Dinas / Login
            </Link>
            <Link href="/laporan/baru" onClick={() => setOpen(false)}
              className="btn-gradient text-white font-semibold px-6 py-3 rounded-full text-center text-sm shadow-sm">
              Mulai Laporan
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
