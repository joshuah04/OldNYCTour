import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { DEMO_TRIP, type Stop, type Trip } from '@/data/trip';
import { distanceMeters } from '@/lib/geo';
import { say } from '@/lib/speech';
import { useUserLocation } from './location';

type TripState = {
  trip: Trip;
  currentIndex: number;
  current: Stop | null;
  next: Stop | null;
  finished: boolean;
  isDone: (index: number) => boolean;
  completeCurrent: () => void;
  goTo: (index: number) => void;
  restart: () => void;
};

const TripContext = createContext<TripState | null>(null);

// How close the user has to be for the app to announce a stop
const ARRIVE_M = 45;

export function TripProvider({ children }: { children: ReactNode }) {
  const trip = DEMO_TRIP;
  // The demo starts at stop 2 so the Koreatown lunch reads as already done
  const [currentIndex, setCurrentIndex] = useState(1);
  const { coords } = useUserLocation();
  const announced = useRef<Set<string>>(new Set());

  const current = trip.stops[currentIndex] ?? null;
  const next = trip.stops[currentIndex + 1] ?? null;
  const finished = currentIndex >= trip.stops.length;

  const completeCurrent = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, trip.stops.length));
  }, [trip.stops.length]);

  const goTo = useCallback((index: number) => setCurrentIndex(index), []);

  const restart = useCallback(() => {
    announced.current.clear();
    setCurrentIndex(0);
  }, []);

  const isDone = useCallback((index: number) => index < currentIndex, [currentIndex]);

  // Speaks the stop's story once when the user walks up to it
  useEffect(() => {
    if (!coords || !current || announced.current.has(current.id)) return;
    if (distanceMeters(coords, current.location) <= ARRIVE_M) {
      announced.current.add(current.id);
      say(`You have arrived at ${current.name}. ${current.story}`);
    }
  }, [coords, current]);

  const value = useMemo(
    () => ({ trip, currentIndex, current, next, finished, isDone, completeCurrent, goTo, restart }),
    [trip, currentIndex, current, next, finished, isDone, completeCurrent, goTo, restart],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripState {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used inside TripProvider');
  return ctx;
}
