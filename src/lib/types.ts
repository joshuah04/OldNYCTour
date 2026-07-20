export interface Coords {
  lat: number;
  lng: number;
}

export type PlaceKind = "restaurant" | "landmark";

export interface Place {
  id: string;
  name: string;
  kind: PlaceKind;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  /** Straight-line distance from the user, in meters. */
  distanceMeters?: number;
  /** Rough walking direction, e.g. "북쪽" (north). */
  bearing?: string;
  priceLevel?: number;
  openNow?: boolean;
  mapsUrl: string;
}

export interface GuideRequest {
  coords: Coords;
  /** Human-readable place/address for the user's current spot. */
  locationLabel?: string;
  /** What the user asked. Empty means "tell me about where I am". */
  question?: string;
  /** Nearby places we already looked up, to ground the guide's narration. */
  nearby?: Pick<Place, "name" | "kind" | "distanceMeters" | "bearing">[];
}
