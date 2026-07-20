"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Coords } from "@/lib/types";

interface GeoState {
  coords: Coords | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

/**
 * Live location tracking with a Korean-friendly error message.
 * Uses watchPosition so the tour updates as the user walks.
 */
export function useGeolocation(): GeoState & { refresh: () => void } {
  const [state, setState] = useState<GeoState>({
    coords: null,
    accuracy: null,
    error: null,
    loading: true,
  });
  const watchId = useRef<number | null>(null);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({
        ...s,
        loading: false,
        error: "이 기기에서는 위치 기능을 사용할 수 없습니다.",
      }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          error: null,
          loading: false,
        });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? "위치 사용이 허용되지 않았습니다. 휴대폰 설정에서 위치를 켜 주세요."
            : "위치를 찾지 못했습니다. 잠시 후 다시 시도해 주세요.";
        setState((s) => ({ ...s, loading: false, error: msg }));
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    );
  }, []);

  useEffect(() => {
    start();
    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [start]);

  return { ...state, refresh: start };
}
