"use client";

import type { Place } from "@/lib/types";
import { distanceKo } from "@/lib/geo";

export function PlacesList({
  places,
  loading,
  configured,
  emptyKind,
}: {
  places: Place[];
  loading: boolean;
  configured: boolean;
  emptyKind: "restaurant" | "landmark";
}) {
  if (!configured) {
    return (
      <p className="card" style={{ color: "var(--text-soft)" }}>
        장소 찾기 기능은 지도 설정(GOOGLE_MAPS_API_KEY)이 준비되면 사용할 수 있습니다.
      </p>
    );
  }
  if (loading) {
    return (
      <p className="card" style={{ color: "var(--text-soft)" }}>
        근처를 찾고 있습니다…
      </p>
    );
  }
  if (places.length === 0) {
    return (
      <p className="card" style={{ color: "var(--text-soft)" }}>
        {emptyKind === "restaurant"
          ? "근처에서 식당을 찾지 못했습니다."
          : "근처에서 명소를 찾지 못했습니다."}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3" aria-label="근처 장소 목록">
      {places.map((p) => (
        <li key={p.id} className="card" style={{ padding: "1rem" }}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold" style={{ fontSize: "1.2rem" }}>
              {p.name}
            </p>
            {p.openNow != null && (
              <span
                style={{
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                  color: p.openNow ? "var(--accent)" : "var(--primary)",
                }}
              >
                {p.openNow ? "지금 영업 중" : "영업 종료"}
              </span>
            )}
          </div>

          <p className="mt-1" style={{ color: "var(--text-soft)" }}>
            {p.bearing && p.distanceMeters != null && (
              <span>
                {p.bearing}으로 {distanceKo(p.distanceMeters)}
              </span>
            )}
            {p.rating != null && (
              <span>
                {"  ·  "}⭐ {p.rating.toFixed(1)}
                {p.userRatingsTotal ? ` (${p.userRatingsTotal})` : ""}
              </span>
            )}
            {p.priceLevel != null && <span>{"  ·  " + "$".repeat(p.priceLevel)}</span>}
          </p>

          {p.address && (
            <p className="mt-1" style={{ color: "var(--text-soft)", fontSize: "0.95rem" }}>
              {p.address}
            </p>
          )}

          <a
            className="big-button big-button--ghost mt-3"
            style={{ justifyContent: "center", minHeight: 58 }}
            href={p.mapsUrl}
            target="_blank"
            rel="noreferrer"
          >
            🧭 길 안내 받기
          </a>
        </li>
      ))}
    </ul>
  );
}
