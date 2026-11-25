import * as Location from 'expo-location';

import type { Stop } from '@/data/trip';
import {
  angleDiff,
  bearingDegrees,
  compassWord,
  distanceMeters,
  spokenDistance,
  relativeDirection,
  walkMinutes,
  type LatLng,
} from './geo';
import { LANDMARKS, searchNearby, type Place } from './places';

// How wide the "you are pointing at it" cone is, and how far away a building can be
const FACING_HALF_ANGLE = 35;
const FACING_MAX_M = 400;

export type FacingGuess = {
  place: Place;
  meters: number;
  confident: boolean;
};

// Picks the landmark the phone is most likely pointed at, using GPS and the compass
export function guessFacing(from: LatLng, heading: number | null, places: Place[]): FacingGuess | null {
  const scored = places.map((place) => {
    const meters = distanceMeters(from, place.location);
    const off = heading === null ? 180 : Math.abs(angleDiff(bearingDegrees(from, place.location), heading));
    return { place, meters, off };
  });
  const inCone = scored
    .filter((s) => s.off <= FACING_HALF_ANGLE && s.meters <= FACING_MAX_M)
    .sort((a, b) => a.off / FACING_HALF_ANGLE + a.meters / FACING_MAX_M - (b.off / FACING_HALF_ANGLE + b.meters / FACING_MAX_M));
  if (inCone.length > 0) return { place: inCone[0].place, meters: inCone[0].meters, confident: true };
  const closest = [...scored].sort((a, b) => a.meters - b.meters)[0];
  return closest ? { place: closest.place, meters: closest.meters, confident: false } : null;
}

export async function nearbyLandmarks(from: LatLng): Promise<Place[]> {
  return searchNearby(from, { types: LANDMARKS, rank: 'POPULARITY', radius: 500, max: 15 });
}

// Words for where something is, like "on your left" or "to the north" when there is no compass
function whereIs(from: LatLng, to: LatLng, heading: number | null): string {
  const bearing = bearingDegrees(from, to);
  return heading === null ? `to the ${compassWord(bearing)}` : relativeDirection(bearing, heading);
}

export type Answer = {
  title: string;
  subtitle?: string;
  text: string;
};

// Text for the camera's "What's this?" mode
export async function describeFacing(from: LatLng, heading: number | null): Promise<Answer> {
  const places = await nearbyLandmarks(from);
  const guess = guessFacing(from, heading, places);
  if (!guess) {
    return {
      title: 'Nothing found',
      text: 'I could not find any landmarks near you. Try again when you are closer to a well known building.',
    };
  }
  const { place, meters } = guess;
  const distance = spokenDistance(meters);
  if (!guess.confident || heading === null) {
    const side = whereIs(from, place.location, heading);
    return {
      title: place.name,
      subtitle: place.primaryType,
      text: `I am not sure which building you are pointing at. The closest landmark is ${place.name}, about ${distance} away, ${side}.${place.summary ? ` ${place.summary}` : ''}`,
    };
  }
  const summary = place.summary ? ` ${place.summary}` : '';
  return {
    title: place.name,
    subtitle: [place.primaryType, place.address].filter(Boolean).join(' · '),
    text: `This looks like ${place.name}, about ${distance} in front of you.${summary}`,
  };
}

// Builds "West 32nd Street in Midtown" style text from the phone's own address lookup
function placeWords(a: Location.LocationGeocodedAddress | undefined): string {
  if (!a) return 'in New York';
  const street = a.street ?? a.name;
  const area = a.district ?? a.subregion ?? a.city;
  if (street && area) return `on ${street} in ${area}`;
  if (street) return `on ${street}`;
  if (area) return `in ${area}`;
  return 'in New York';
}

// Text for the camera's "Where am I?" mode and the big Home button
export async function describeWhereAmI(
  from: LatLng,
  heading: number | null,
  current: Stop | null,
): Promise<Answer> {
  const parts: string[] = [];
  let title = 'Where you are';

  // The address lookup runs on the phone and does not use the Google key
  let address: Location.LocationGeocodedAddress | undefined;
  try {
    [address] = await Location.reverseGeocodeAsync(from);
  } catch {
    address = undefined;
  }
  const where = placeWords(address);
  if (address?.street ?? address?.name) title = (address.street ?? address.name)!;
  const facing = heading === null ? '' : `, facing ${compassWord(heading)}`;
  parts.push(`You are ${where}${facing}.`);

  // Mention the closest well known place so the user can get their bearings
  try {
    const places = await nearbyLandmarks(from);
    const near = places
      .map((p) => ({ p, m: distanceMeters(from, p.location) }))
      .filter((x) => x.m <= 600)
      .sort((a, b) => a.m - b.m)[0];
    if (near) {
      parts.push(`${near.p.name} is ${spokenDistance(near.m)} away, ${whereIs(from, near.p.location, heading)}.`);
    }
  } catch {
    // The address alone is still useful if Google cannot be reached
  }

  if (current) {
    const m = distanceMeters(from, current.location);
    if (m <= 60) {
      parts.push(`You are at your current stop, ${current.name}.`);
    } else {
      parts.push(
        `Your next stop, ${current.name}, is ${spokenDistance(m)} ${whereIs(from, current.location, heading)}, about ${walkMinutes(m)} ${walkMinutes(m) === 1 ? 'minute' : 'minutes'} on foot.`,
      );
    }
  }

  return { title, subtitle: address?.district ?? address?.city ?? undefined, text: parts.join(' ') };
}
