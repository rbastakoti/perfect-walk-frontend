import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

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
    [out:json][timeout:25];
    (
      node["leisure"="park"](around:${radius},${lat},${lon});
      way["leisure"="park"](around:${radius},${lat},${lon});
      relation["leisure"="park"](around:${radius},${lat},${lon});
    );
    out center;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: new URLSearchParams({ data: query }),
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to fetch parks" }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
