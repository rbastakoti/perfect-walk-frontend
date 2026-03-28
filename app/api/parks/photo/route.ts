import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) {
    return new NextResponse("Missing ref", { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return new NextResponse("Not configured", { status: 503 });
  }

  const url =
    `https://maps.googleapis.com/maps/api/place/photo` +
    `?maxwidth=600` +
    `&photoreference=${encodeURIComponent(ref)}` +
    `&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    return new NextResponse("Failed to fetch photo", { status: res.status });
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
