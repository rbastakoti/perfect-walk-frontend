import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dPhi = ((lat2 - lat1) * Math.PI) / 180;
  const dLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function enrichWithGooglePlaces(
  name: string,
  lat: number,
  lon: number,
  apiKey: string
): Promise<{ description: string | null; photoRef: string | null }> {
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
      `?input=${encodeURIComponent(name)}` +
      `&inputtype=textquery` +
      `&fields=editorial_summary,photos` +
      `&locationbias=circle:2000@${lat},${lon}` +
      `&key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const data = await res.json();
    const candidate = data.candidates?.[0];
    return {
      description: candidate?.editorial_summary?.overview ?? null,
      photoRef: candidate?.photos?.[0]?.photo_reference ?? null,
    };
  } catch {
    return { description: null, photoRef: null };
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const radius = searchParams.get("radius") || "5000";

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const query = `
    [out:json][timeout:20];
    (
      node["leisure"="park"](around:${radius},${lat},${lon});
      way["leisure"="park"](around:${radius},${lat},${lon});
      relation["leisure"="park"](around:${radius},${lat},${lon});
    );
    out center;
  `;

  const overpassEndpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  ];

  let response: Response | null = null;
  for (const endpoint of overpassEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      response = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        next: { revalidate: 600 },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (response.ok) break;
    } catch {
      continue;
    }
  }

  if (!response || !response.ok) {
    return NextResponse.json({ error: "Failed to fetch parks" }, { status: 503 });
  }

  const data = await response.json();
  const elements: any[] = data.elements || [];

  // Sort by distance and take top 10
  const userLat = parseFloat(lat);
  const userLon = parseFloat(lon);
  const top10 = elements
    .map((park) => {
      const pLat = park.lat ?? park.center?.lat;
      const pLon = park.lon ?? park.center?.lon;
      const distance = pLat && pLon ? getDistance(userLat, userLon, pLat, pLon) : Infinity;
      return { ...park, distance };
    })
    .filter((p) => p.distance < Infinity)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);

  // Enrich with Google Places if API key is available
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (apiKey) {
    const enriched = await Promise.all(
      top10.map(async (park) => {
        const name = park.tags?.name || park.tags?.["name:en"];
        if (!name) return { ...park, googleDescription: null, photoRef: null };
        const pLat = park.lat ?? park.center?.lat;
        const pLon = park.lon ?? park.center?.lon;
        const { description, photoRef } = await enrichWithGooglePlaces(name, pLat, pLon, apiKey);
        return { ...park, googleDescription: description, photoRef };
      })
    );
    return NextResponse.json({ elements: enriched });
  }

  return NextResponse.json({ elements: top10 });
}
