import { NextRequest, NextResponse } from "next/server";
import type { Coords, Place, PlaceKind } from "@/lib/types";
import { bearingKo, distanceMeters } from "@/lib/geo";

/**
 * Nearby restaurants and landmarks via Google Places API (New).
 * Falls back to a clear "not configured" response so the app still runs
 * end-to-end before a key is added.
 */
export async function POST(req: NextRequest) {
  const { coords, kind = "restaurant", radius = 600 } = (await req.json()) as {
    coords: Coords;
    kind?: PlaceKind;
    radius?: number;
  };

  if (!coords?.lat || !coords?.lng) {
    return NextResponse.json({ error: "위치 정보가 필요합니다." }, { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ places: [], configured: false });
  }

  const includedTypes =
    kind === "landmark"
      ? ["tourist_attraction", "museum", "park", "historical_landmark"]
      : ["restaurant"];

  try {
    const res = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.rating",
            "places.userRatingCount",
            "places.location",
            "places.priceLevel",
            "places.currentOpeningHours.openNow",
            "places.googleMapsUri",
          ].join(","),
        },
        body: JSON.stringify({
          includedTypes,
          maxResultCount: 12,
          languageCode: "ko",
          rankPreference: "DISTANCE",
          locationRestriction: {
            circle: {
              center: { latitude: coords.lat, longitude: coords.lng },
              radius,
            },
          },
        }),
      },
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error("Places API error", res.status, detail);
      return NextResponse.json(
        { error: "근처 장소를 불러오지 못했습니다.", configured: true },
        { status: 502 },
      );
    }

    const data = (await res.json()) as { places?: RawPlace[] };
    const places: Place[] = (data.places ?? []).map((p) => {
      const to: Coords = { lat: p.location.latitude, lng: p.location.longitude };
      const dist = distanceMeters(coords, to);
      return {
        id: p.id,
        name: p.displayName?.text ?? "이름 없음",
        kind,
        address: p.formattedAddress,
        rating: p.rating,
        userRatingsTotal: p.userRatingCount,
        distanceMeters: dist,
        bearing: bearingKo(coords, to),
        priceLevel: priceToNumber(p.priceLevel),
        openNow: p.currentOpeningHours?.openNow,
        mapsUrl:
          p.googleMapsUri ??
          `https://www.google.com/maps/search/?api=1&query=${to.lat},${to.lng}`,
      };
    });

    places.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
    return NextResponse.json({ places, configured: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "근처 장소를 불러오지 못했습니다.", configured: true },
      { status: 502 },
    );
  }
}

interface RawPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  location: { latitude: number; longitude: number };
  priceLevel?: string;
  currentOpeningHours?: { openNow?: boolean };
  googleMapsUri?: string;
}

function priceToNumber(level?: string): number | undefined {
  switch (level) {
    case "PRICE_LEVEL_INEXPENSIVE":
      return 1;
    case "PRICE_LEVEL_MODERATE":
      return 2;
    case "PRICE_LEVEL_EXPENSIVE":
      return 3;
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return 4;
    default:
      return undefined;
  }
}
