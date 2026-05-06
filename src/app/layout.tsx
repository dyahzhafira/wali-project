import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "WALI — Warga Andil Lawan Invasif",
  description: "Platform interaktif pengawasan ikan invasif berbasis partisipasi masyarakat",
  keywords: ["ikan sapu-sapu", "invasif", "laporan", "lingkungan", "WALI"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={montserrat.className}>
      <body className="min-h-screen flex flex-col bg-white text-gray-900">
        <Toaster
          position="top-center"
          toastOptions={{
            style: { borderRadius: "8px", background: "#1b6560", color: "#fff" },
            success: { style: { background: "#1b6560" } },
            error: { style: { background: "#dc2626" } },
          }}
        />
        {children}
      </body>
    </html>
  );
}
