import { GOOGLE_MAPS_API_KEY, PLACES_LANGUAGE } from './config';
import { distanceMeters, type LatLng } from './geo';

export type CategoryId = 'food' | 'cafe' | 'buildings';

export type Category = {
  id: CategoryId;
  label: string;
  types: string[];
  rank: 'DISTANCE' | 'POPULARITY';
};

// Landmark style places, also used by the camera to guess what the user is facing
export const LANDMARKS = [
  'tourist_attraction',
  'historical_landmark',
  'museum',
  'church',
  'library',
  'monument',
  'cultural_landmark',
  'observation_deck',
];

// The three lists on the Map tab
export const CATEGORIES: Category[] = [
  { id: 'food', label: 'Restaurants', types: ['restaurant'], rank: 'DISTANCE' },
  {
    id: 'cafe',
    label: 'Cafes, bakeries & desserts',
    types: [
      'cafe',
      'bakery',
      'dessert_shop',
      'ice_cream_shop',
      'coffee_shop',
      'tea_house',
      'donut_shop',
      'confectionery',
    ],
    rank: 'DISTANCE',
  },
  {
    id: 'buildings',
    label: 'Buildings',
    types: LANDMARKS,
    rank: 'POPULARITY',
  },
];

export type Place = {
  id: string;
  name: string;
  location: LatLng;
  address?: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: string;
  summary?: string;
  primaryType?: string;
  openNow?: boolean;
  mapsUrl?: string;
};

export class MissingKeyError extends Error {
  constructor() {
    super('Google Maps key is missing. Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env and restart Expo.');
  }
}

// Only ask Google for the fields the app shows (fewer fields keeps the request cheaper)
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.shortFormattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.editorialSummary',
  'places.primaryTypeDisplayName',
  'places.currentOpeningHours.openNow',
  'places.googleMapsUri',
].join(',');

type RawPlace = {
  id: string;
  displayName?: { text: string };
  location?: LatLng;
  shortFormattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  editorialSummary?: { text: string };
  primaryTypeDisplayName?: { text: string };
  currentOpeningHours?: { openNow?: boolean };
  googleMapsUri?: string;
};

// Results are kept for a while so moving around a little does not cost another request
const CACHE_MS = 10 * 60 * 1000;
const CACHE_MOVE_M = 110;
const cache = new Map<string, { at: number; center: LatLng; places: Place[] }>();

export type NearbyOptions = {
  types: string[];
  rank: 'DISTANCE' | 'POPULARITY';
  radius?: number;
  max?: number;
};

// Calls Google Places (New) Nearby Search around a point
export async function searchNearby(center: LatLng, opts: NearbyOptions): Promise<Place[]> {
  if (!GOOGLE_MAPS_API_KEY) throw new MissingKeyError();
  const radius = opts.radius ?? 800;
  const max = opts.max ?? 15;
  const key = `${opts.types.join(',')}|${opts.rank}|${radius}|${max}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS && distanceMeters(hit.center, center) < CACHE_MOVE_M) {
    return hit.places;
  }

  const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: opts.types,
      maxResultCount: max,
      rankPreference: opts.rank,
      languageCode: PLACES_LANGUAGE,
      locationRestriction: { circle: { center, radius } },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Places error ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { places?: RawPlace[] };
  const places = (json.places ?? [])
    .filter((p) => p.location && p.displayName)
    .map(toPlace);
  cache.set(key, { at: Date.now(), center, places });
  return places;
}

function toPlace(p: RawPlace): Place {
  return {
    id: p.id,
    name: p.displayName!.text,
    location: p.location!,
    address: p.shortFormattedAddress,
    rating: p.rating,
    ratingCount: p.userRatingCount,
    priceLevel: p.priceLevel,
    summary: p.editorialSummary?.text,
    primaryType: p.primaryTypeDisplayName?.text,
    openNow: p.currentOpeningHours?.openNow,
    mapsUrl: p.googleMapsUri,
  };
}

// Turns "PRICE_LEVEL_MODERATE" into "$$"
export function priceLabel(level?: string): string | undefined {
  switch (level) {
    case 'PRICE_LEVEL_INEXPENSIVE':
      return '$';
    case 'PRICE_LEVEL_MODERATE':
      return '$$';
    case 'PRICE_LEVEL_EXPENSIVE':
      return '$$$';
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return '$$$$';
    default:
      return undefined;
  }
}
