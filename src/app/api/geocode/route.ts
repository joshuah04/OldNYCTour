import { NextRequest, NextResponse } from "next/server";

/** Reverse-geocode current coordinates into a Korean-readable label. */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  if (!lat || !lng) {
    return NextResponse.json({ error: "위치가 필요합니다." }, { status: 400 });
  }

  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json({ label: null, configured: false });
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("latlng", `${lat},${lng}`);
    url.searchParams.set("language", "ko");
    url.searchParams.set("key", key);

    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = (await res.json()) as {
      results?: { formatted_address: string }[];
      status: string;
    };

    const label = data.results?.[0]?.formatted_address ?? null;
    return NextResponse.json({ label, configured: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ label: null, configured: true });
  }
}
