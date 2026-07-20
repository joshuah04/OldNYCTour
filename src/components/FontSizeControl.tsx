"use client";

import { useSettings, type FontScale } from "./SettingsProvider";

const OPTIONS: { value: FontScale; label: string; sample: string }[] = [
  { value: "normal", label: "보통", sample: "가" },
  { value: "large", label: "크게", sample: "가" },
  { value: "xlarge", label: "아주 크게", sample: "가" },
];

/** Big, obvious font-size picker for seniors. */
export function FontSizeControl() {
  const { fontScale, setFontScale } = useSettings();
  return (
    <div className="card" aria-labelledby="font-size-heading">
      <p id="font-size-heading" className="mb-3 font-bold" style={{ fontSize: "1.15rem" }}>
        글자 크기
      </p>
      <div role="radiogroup" aria-label="글자 크기 선택" className="flex gap-3">
        {OPTIONS.map((o) => {
          const active = fontScale === o.value;
          return (
            <button
              key={o.value}
              role="radio"
              aria-checked={active}
              onClick={() => setFontScale(o.value)}
              className="big-button"
              style={{
                justifyContent: "center",
                background: active ? "var(--accent)" : "var(--surface)",
                color: active ? "var(--accent-ink)" : "var(--text)",
                border: active ? "2px solid var(--accent)" : "2px solid var(--border)",
                flexDirection: "column",
                gap: "0.25rem",
                minHeight: 88,
              }}
            >
              <span
                style={{
                  fontSize:
                    o.value === "normal" ? "1.1rem" : o.value === "large" ? "1.5rem" : "2rem",
                }}
              >
                {o.sample}
              </span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
