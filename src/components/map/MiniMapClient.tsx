"use client";
import dynamic from "next/dynamic";

const MiniMap = dynamic(() => import("./MiniMap"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />,
});

export default function MiniMapClient() {
  return <MiniMap />;
}
