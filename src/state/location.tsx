import * as Location from 'expo-location';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DEMO_SPOT } from '@/data/trip';
import { distanceMeters, type LatLng } from '@/lib/geo';

export type LocationStatus = 'checking' | 'granted' | 'denied' | 'error';

type LocationState = {
  status: LocationStatus;
  coords: LatLng | null;
  realCoords: LatLng | null;
  accuracy: number | null;
  farFromNyc: boolean;
  usingDemoSpot: boolean;
  setUseDemoSpot: (value: boolean) => void;
  requestPermission: () => Promise<void>;
};

const LocationContext = createContext<LocationState | null>(null);

// Midtown Manhattan, used to tell if the user is outside the city
const MIDTOWN: LatLng = { latitude: 40.754, longitude: -73.984 };
const FAR_FROM_NYC_M = 25000;

export function LocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>('checking');
  const [realCoords, setRealCoords] = useState<LatLng | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [useDemoSpot, setUseDemoSpot] = useState(false);

  const requestPermission = useCallback(async () => {
    try {
      const res = await Location.requestForegroundPermissionsAsync();
      setStatus(res.granted ? 'granted' : 'denied');
    } catch {
      setStatus('error');
    }
  }, []);

  // Ask once on launch, iOS shows its own permission popup the first time
  useEffect(() => {
    Location.requestForegroundPermissionsAsync()
      .then((res) => setStatus(res.granted ? 'granted' : 'denied'))
      .catch(() => setStatus('error'));
  }, []);

  // Follow the user while the app is open
  useEffect(() => {
    if (status !== 'granted') return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 8, timeInterval: 3000 },
      (pos) => {
        setRealCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy ?? null);
      },
      () => setStatus('error'),
    )
      .then((s) => {
        if (cancelled) s.remove();
        else sub = s;
      })
      .catch(() => setStatus('error'));
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [status]);

  const farFromNyc = realCoords ? distanceMeters(realCoords, MIDTOWN) > FAR_FROM_NYC_M : false;
  const coords = useDemoSpot ? DEMO_SPOT : realCoords;

  const value = useMemo(
    () => ({
      status: useDemoSpot ? ('granted' as const) : status,
      coords,
      realCoords,
      accuracy: useDemoSpot ? null : accuracy,
      farFromNyc,
      usingDemoSpot: useDemoSpot,
      setUseDemoSpot,
      requestPermission,
    }),
    [status, coords, realCoords, accuracy, farFromNyc, useDemoSpot, requestPermission],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useUserLocation(): LocationState {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useUserLocation must be used inside LocationProvider');
  return ctx;
}
