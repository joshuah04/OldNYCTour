"use client";

import type { Coords } from "@/lib/types";

/**
 * Interactive map centered on the user's location.
 * Uses the Google Maps Embed API (needs NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
 * Without a key, shows coordinates and a link out to a maps app.
 */
export function MapView({ coords, label }: { coords: Coords; label?: string }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const q = `${coords.lat},${coords.lng}`;

  if (!key) {
    return (
      <div className="card" style={{ padding: "1rem" }}>
        <p className="font-bold" style={{ fontSize: "1.1rem" }}>
          📍 현재 위치
        </p>
        <p className="mt-1" style={{ color: "var(--text-soft)" }}>
          {label ?? `위도 ${coords.lat.toFixed(5)}, 경도 ${coords.lng.toFixed(5)}`}
        </p>
        <a
          className="big-button big-button--ghost mt-3"
          style={{ justifyContent: "center", minHeight: 60 }}
          href={`https://www.google.com/maps/search/?api=1&query=${q}`}
          target="_blank"
          rel="noreferrer"
        >
          🗺️ 지도 앱에서 보기
        </a>
      </div>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/place?key=${key}&q=${q}&zoom=16&language=ko`;

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: "hidden", borderRadius: 18 }}
    >
      <iframe
        title="현재 위치 지도"
        src={src}
        style={{ border: 0, width: "100%", height: 260, display: "block" }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
