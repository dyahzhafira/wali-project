"use client";
import FingerprintJS from "@fingerprintjs/fingerprintjs";

let cachedVisitorId: string | null = null;

export async function getFingerprint(): Promise<string> {
  if (cachedVisitorId) return cachedVisitorId;
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    cachedVisitorId = result.visitorId;
  } catch {
    cachedVisitorId = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
  return cachedVisitorId!;
}
