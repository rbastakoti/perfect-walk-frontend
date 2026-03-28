import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

// ── Distance ─────────────────────────────────────────────────────────────────
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

// ── Type label mapping ────────────────────────────────────────────────────────
const TYPE_MAP: Record<string, Record<string, string>> = {
  amenity: {
    restaurant: "Restaurant", cafe: "Café", bar: "Bar", fast_food: "Fast Food",
    pub: "Pub", bakery: "Bakery", food_court: "Food Court", museum: "Museum",
    theatre: "Theatre", cinema: "Cinema", nightclub: "Nightclub",
    arts_centre: "Arts Centre", pharmacy: "Pharmacy", hospital: "Hospital",
    clinic: "Clinic", dentist: "Dentist", library: "Library",
    community_centre: "Community Centre",
  },
  tourism: {
    museum: "Museum", attraction: "Attraction", gallery: "Art Gallery",
    theme_park: "Theme Park", zoo: "Zoo", aquarium: "Aquarium",
    viewpoint: "Viewpoint", artwork: "Artwork", hotel: "Hotel",
    hostel: "Hostel",
  },
  leisure: {
    park: "Park", fitness_centre: "Gym", spa: "Spa",
    swimming_pool: "Pool", stadium: "Stadium", sports_centre: "Sports Centre",
    golf_course: "Golf Course", bowling_alley: "Bowling",
  },
  shop: {
    mall: "Shopping Mall", department_store: "Department Store",
    clothes: "Clothing", books: "Bookstore", electronics: "Electronics",
    supermarket: "Supermarket", market: "Market", convenience: "Convenience",
    beauty: "Beauty", hairdresser: "Hair Salon",
  },
};

function getTypeInfo(tags: Record<string, string>): { label: string; category: string } {
  for (const [cat, values] of Object.entries(TYPE_MAP)) {
    if (tags[cat]) {
      return { label: values[tags[cat]] ?? tags[cat], category: cat };
    }
  }
  return { label: "Place", category: "place" };
}

// ── Overpass query builder ────────────────────────────────────────────────────
function buildQuery(lat: string, lon: string, category: string): string {
  // 8000m (~5 mi) radius so small towns still return results
  const r = `around:8000,${lat},${lon}`;
  const named = `["name"]`;

  const inner: Record<string, string> = {
    all: `
      node["leisure"~"^(park|nature_reserve|garden|playground|recreation_ground|dog_park|pitch|golf_course|sports_centre)$"]${named}(${r});
      node["tourism"~"^(museum|attraction|gallery|theme_park|zoo|aquarium|viewpoint|artwork|historic|trail)$"]${named}(${r});
      node["amenity"~"^(theatre|cinema|arts_centre|library|community_centre|place_of_worship)$"]${named}(${r});
      node["historic"]${named}(${r});
      node["natural"~"^(peak|waterfall|spring|cave_entrance|wood|water)$"]${named}(${r});
      way["leisure"~"^(park|nature_reserve|garden|recreation_ground|sports_centre)$"]${named}(${r});
      way["tourism"~"^(museum|attraction|gallery|theme_park|zoo|aquarium)$"]${named}(${r});
      way["natural"~"^(wood|water|wetland)$"]${named}(${r});
      relation["leisure"~"^(park|nature_reserve)$"]${named}(${r});
    `,
    parks: `
      node["leisure"~"^(park|nature_reserve|garden|playground|recreation_ground)$"]${named}(${r});
      node["natural"~"^(peak|waterfall|spring|wood|water)$"]${named}(${r});
      way["leisure"~"^(park|nature_reserve|garden|recreation_ground)$"]${named}(${r});
      way["natural"~"^(wood|water|wetland)$"]${named}(${r});
      relation["leisure"~"^(park|nature_reserve)$"]${named}(${r});
    `,
    attractions: `
      node["tourism"~"^(museum|attraction|gallery|theme_park|zoo|aquarium|viewpoint|artwork)$"]${named}(${r});
      node["amenity"~"^(theatre|cinema|arts_centre|library)$"]${named}(${r});
      node["historic"]${named}(${r});
      way["tourism"~"^(museum|attraction|gallery|theme_park|zoo|aquarium)$"]${named}(${r});
      way["amenity"~"^(theatre|cinema|arts_centre)$"]${named}(${r});
      way["historic"]${named}(${r});
    `,
  };

  return `[out:json][timeout:12]; ( ${inner[category] ?? inner.all} ); out center tags 50;`;
}

// ── Wikipedia / Wikidata enrichment ──────────────────────────────────────────
async function enrichPlace(tags: Record<string, string>): Promise<{
  description: string | null;
  imageUrl: string | null;
  wikiUrl: string | null;
}> {
  // Wikipedia REST API — description + thumbnail in one call
  if (tags.wikipedia) {
    const colonIdx = tags.wikipedia.indexOf(":");
    const lang = colonIdx > 0 ? tags.wikipedia.slice(0, colonIdx) : "en";
    const title = colonIdx > 0 ? tags.wikipedia.slice(colonIdx + 1) : tags.wikipedia;
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { signal: controller.signal, next: { revalidate: 86400 } }
      );
      clearTimeout(t);
      if (res.ok) {
        const d = await res.json();
        if (d.type !== "disambiguation") {
          return {
            description: d.extract || null,
            imageUrl: d.thumbnail?.source?.replace(/\/\d+px-/, "/400px-") ?? null,
            wikiUrl: d.content_urls?.desktop?.page ?? null,
          };
        }
      }
    } catch { /* timeout / network error */ }
  }

  // Wikidata — description + image claim (P18)
  if (tags.wikidata) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(
        `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${encodeURIComponent(tags.wikidata)}&format=json&props=descriptions%7Cclaims&languages=en`,
        { signal: controller.signal, next: { revalidate: 86400 } }
      );
      clearTimeout(t);
      if (res.ok) {
        const d = await res.json();
        const entity = d.entities?.[tags.wikidata];
        const description: string | null = entity?.descriptions?.en?.value ?? null;
        const imageFile: string | undefined =
          entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
        const imageUrl = imageFile
          ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFile)}?width=400`
          : null;
        if (description || imageUrl) {
          return {
            description,
            imageUrl,
            wikiUrl: `https://www.wikidata.org/wiki/${tags.wikidata}`,
          };
        }
      }
    } catch { /* timeout */ }
  }

  // Wikimedia Commons tag — image only
  if (tags.wikimedia_commons) {
    const filename = tags.wikimedia_commons.replace(/^(File|Category):/, "");
    return {
      description: null,
      imageUrl: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=400`,
      wikiUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`,
    };
  }

  return { description: null, imageUrl: null, wikiUrl: null };
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");
  const category = searchParams.get("category") || "all";

  if (!lat || !lon) {
    return NextResponse.json({ error: "Missing lat/lon" }, { status: 400 });
  }

  const query = buildQuery(lat, lon, category);

  const overpassEndpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  ];

  let response: Response | null = null;
  for (const endpoint of overpassEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      response = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams({ data: query }),
        signal: controller.signal,
        next: { revalidate: 600 },
      });
      clearTimeout(timeoutId);
      if (response.ok) break;
    } catch {
      continue;
    }
  }

  if (!response || !response.ok) {
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 503 });
  }

  const data = await response.json();
  const elements: any[] = data.elements || [];

  const userLat = parseFloat(lat);
  const userLon = parseFloat(lon);

  const top20 = elements
    .filter((el) => el.tags?.name)
    .map((el) => {
      const eLat = el.lat ?? el.center?.lat;
      const eLon = el.lon ?? el.center?.lon;
      return { ...el, _lat: eLat, _lon: eLon, distance: getDistance(userLat, userLon, eLat, eLon) };
    })
    .filter((el) => el._lat && el._lon)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 12);

  // Enrich only the first 8 with Wikipedia/Wikidata — the rest get name+type only
  const enriched = await Promise.all(
    top20.map(async (el, i) => {
      const tags: Record<string, string> = el.tags || {};
      const { label: typeLabel, category: typeCategory } = getTypeInfo(tags);
      // Only hit Wikipedia/Wikidata for the top 8 results to cap latency
      const { description, imageUrl, wikiUrl } = i < 8 ? await enrichPlace(tags) : { description: null, imageUrl: null, wikiUrl: null };
      return {
        id: `${el.type}/${el.id}`,
        name: tags.name,
        lat: el._lat,
        lon: el._lon,
        distance: el.distance,
        tags,
        typeLabel,
        typeCategory,
        description,
        imageUrl,
        wikiUrl,
        osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
      };
    })
  );

  return NextResponse.json({ places: enriched });
}
