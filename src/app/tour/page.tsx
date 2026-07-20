"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useListener, useSpeaker } from "@/hooks/useSpeech";
import { useSettings } from "@/components/SettingsProvider";
import { MapView } from "@/components/MapView";
import { PlacesList } from "@/components/PlacesList";
import type { Coords, Place } from "@/lib/types";

type Tab = "guide" | "landmark" | "restaurant";

export default function TourPage() {
  const { coords, error, loading } = useGeolocation();

  if (loading && !coords) {
    return <Centered>📍 위치를 확인하고 있습니다…</Centered>;
  }
  if (error && !coords) {
    return (
      <Centered>
        <p style={{ fontSize: "1.2rem" }}>{error}</p>
        <Link
          href="/"
          className="big-button big-button--ghost mt-4"
          style={{ justifyContent: "center" }}
        >
          처음으로
        </Link>
      </Centered>
    );
  }
  if (!coords) return <Centered>📍 위치를 확인하고 있습니다…</Centered>;

  return <TourInner coords={coords} />;
}

function TourInner({ coords }: { coords: Coords }) {
  const { autoSpeak, setAutoSpeak } = useSettings();
  const { speak, stop, speaking, supported: canSpeak } = useSpeaker();

  const [label, setLabel] = useState<string | undefined>();
  const [tab, setTab] = useState<Tab>("guide");

  const [guideText, setGuideText] = useState<string>("");
  const [guideLoading, setGuideLoading] = useState(false);

  const [restaurants, setRestaurants] = useState<Place[]>([]);
  const [landmarks, setLandmarks] = useState<Place[]>([]);
  const [placesConfigured, setPlacesConfigured] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(true);

  // Keep the latest coords in a ref so callbacks aren't recreated as the user walks.
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  // Reverse-geocode + fetch nearby places when we first have a location.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const geo = await fetch(
          `/api/geocode?lat=${coords.lat}&lng=${coords.lng}`,
        ).then((r) => r.json());
        if (!cancelled && geo.label) setLabel(geo.label);
      } catch {
        /* label is optional */
      }

      setPlacesLoading(true);
      try {
        const [r, l] = await Promise.all([
          fetchPlaces(coords, "restaurant"),
          fetchPlaces(coords, "landmark"),
        ]);
        if (cancelled) return;
        setRestaurants(r.places);
        setLandmarks(l.places);
        setPlacesConfigured(r.configured && l.configured);
      } finally {
        if (!cancelled) setPlacesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only run for the first fix; live updates keep the map moving without refetching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askGuide = useCallback(
    async (question: string) => {
      setTab("guide");
      setGuideLoading(true);
      setGuideText("");
      stop();
      try {
        const nearby = [...landmarks, ...restaurants]
          .slice(0, 8)
          .map((p) => ({
            name: p.name,
            kind: p.kind,
            distanceMeters: p.distanceMeters,
            bearing: p.bearing,
          }));
        const res = await fetch("/api/guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            coords: coordsRef.current,
            locationLabel: label,
            question,
            nearby,
          }),
        }).then((r) => r.json());
        setGuideText(res.text);
        if (autoSpeak && res.text) speak(res.text);
      } catch {
        setGuideText("죄송합니다. 지금은 안내를 불러오지 못했습니다.");
      } finally {
        setGuideLoading(false);
      }
    },
    [landmarks, restaurants, label, autoSpeak, speak, stop],
  );

  const { start: startListening, listening, supported: canListen } = useListener(
    (text) => askGuide(text),
  );

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-5">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="big-button big-button--ghost"
          style={{ width: "auto", minHeight: 52, padding: "0.5rem 1rem", fontSize: "1rem" }}
        >
          ← 처음으로
        </Link>
        <button
          onClick={() => setAutoSpeak(!autoSpeak)}
          className="big-button big-button--ghost"
          style={{ width: "auto", minHeight: 52, padding: "0.5rem 1rem", fontSize: "1rem" }}
          aria-pressed={autoSpeak}
        >
          {autoSpeak ? "🔊 소리 켜짐" : "🔇 소리 꺼짐"}
        </button>
      </div>

      <MapView coords={coords} label={label} />

      {/* Ask by voice — the primary, biggest action */}
      <button
        onClick={() => (listening ? undefined : startListening())}
        disabled={!canListen}
        className="big-button big-button--primary"
        style={{ justifyContent: "center", minHeight: 96, fontSize: "1.4rem" }}
      >
        {listening ? "🎙️ 듣고 있어요… 말씀하세요" : "🎙️ 음성으로 물어보기"}
      </button>
      {!canListen && (
        <p style={{ color: "var(--text-soft)", fontSize: "0.9rem" }}>
          이 브라우저는 음성 입력을 지원하지 않습니다. 아래에서 글로 물어보세요.
        </p>
      )}

      <QuickAsk onAsk={askGuide} />

      {/* Tabs */}
      <nav className="flex gap-2" aria-label="보기 선택">
        <TabButton active={tab === "guide"} onClick={() => setTab("guide")}>
          🗣️ 안내
        </TabButton>
        <TabButton active={tab === "landmark"} onClick={() => setTab("landmark")}>
          🏛️ 명소
        </TabButton>
        <TabButton active={tab === "restaurant"} onClick={() => setTab("restaurant")}>
          🍜 맛집
        </TabButton>
      </nav>

      {tab === "guide" && (
        <GuidePanel
          text={guideText}
          loading={guideLoading}
          speaking={speaking}
          canSpeak={canSpeak}
          onReplay={() => guideText && speak(guideText)}
          onStop={stop}
          onDescribeHere={() => askGuide("")}
        />
      )}
      {tab === "landmark" && (
        <PlacesList
          places={landmarks}
          loading={placesLoading}
          configured={placesConfigured}
          emptyKind="landmark"
        />
      )}
      {tab === "restaurant" && (
        <PlacesList
          places={restaurants}
          loading={placesLoading}
          configured={placesConfigured}
          emptyKind="restaurant"
        />
      )}
    </main>
  );
}

function GuidePanel({
  text,
  loading,
  speaking,
  canSpeak,
  onReplay,
  onStop,
  onDescribeHere,
}: {
  text: string;
  loading: boolean;
  speaking: boolean;
  canSpeak: boolean;
  onReplay: () => void;
  onStop: () => void;
  onDescribeHere: () => void;
}) {
  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      {!text && !loading && (
        <button
          onClick={onDescribeHere}
          className="big-button big-button--accent"
          style={{ justifyContent: "center", minHeight: 80, fontSize: "1.25rem" }}
        >
          📖 여기가 어디인지 안내해 주세요
        </button>
      )}

      {loading && (
        <p className="card" style={{ color: "var(--text-soft)" }}>
          안내를 준비하고 있습니다…
        </p>
      )}

      {text && (
        <div className="card">
          <p style={{ fontSize: "1.2rem", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
            {text}
          </p>
          {canSpeak && (
            <div className="mt-4 flex gap-3">
              {speaking ? (
                <button
                  onClick={onStop}
                  className="big-button big-button--ghost"
                  style={{ justifyContent: "center", minHeight: 60 }}
                >
                  ⏹️ 멈추기
                </button>
              ) : (
                <button
                  onClick={onReplay}
                  className="big-button big-button--ghost"
                  style={{ justifyContent: "center", minHeight: 60 }}
                >
                  🔊 다시 듣기
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function QuickAsk({ onAsk }: { onAsk: (q: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) {
          onAsk(q);
          setValue("");
        }
      }}
      className="flex gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="글로 물어보기 (예: 가까운 화장실)"
        aria-label="질문 입력"
        style={{
          flex: 1,
          minHeight: 60,
          padding: "0.5rem 1rem",
          fontSize: "1.1rem",
          borderRadius: 14,
          border: "2px solid var(--border)",
          background: "var(--surface)",
          color: "var(--text)",
        }}
      />
      <button
        type="submit"
        className="big-button big-button--accent"
        style={{ width: "auto", padding: "0 1.25rem", minHeight: 60 }}
      >
        보내기
      </button>
    </form>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="big-button"
      style={{
        justifyContent: "center",
        minHeight: 60,
        fontSize: "1.1rem",
        background: active ? "var(--surface-2)" : "var(--surface)",
        color: "var(--text)",
        border: active ? "2px solid var(--text)" : "2px solid var(--border)",
      }}
    >
      {children}
    </button>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <div style={{ fontSize: "1.3rem" }}>{children}</div>
    </main>
  );
}

async function fetchPlaces(
  coords: Coords,
  kind: "restaurant" | "landmark",
): Promise<{ places: Place[]; configured: boolean }> {
  const res = await fetch("/api/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coords, kind }),
  }).then((r) => r.json());
  return { places: res.places ?? [], configured: res.configured !== false };
}
