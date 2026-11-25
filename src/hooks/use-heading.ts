import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

import { angleDiff } from '@/lib/geo';

// Compass heading in degrees (0 = north) while active, null until the phone reports one
export function useHeading(active: boolean): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!active) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    Location.watchHeadingAsync((h) => {
      // trueHeading is -1 when the phone cannot work it out, so fall back to magnetic north
      const value = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
      if (value < 0) return;
      // Small wobbles are ignored so screens do not redraw constantly
      setHeading((prev) => (prev !== null && Math.abs(angleDiff(value, prev)) < 4 ? prev : value));
    })
      .then((s) => {
        if (cancelled) s.remove();
        else sub = s;
      })
      .catch(() => setHeading(null));
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [active]);

  return heading;
}
