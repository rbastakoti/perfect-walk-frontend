import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string | undefined;
  if (!accessToken) {
    return NextResponse.json({ error: "no_token" }, { status: 403 });
  }

  const now = new Date().toISOString();
  const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(now)}` +
    `&timeMax=${encodeURIComponent(weekLater)}` +
    `&singleEvents=true` +
    `&orderBy=startTime` +
    `&maxResults=15`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.error?.message ?? "Failed to fetch calendar" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json({ events: data.items ?? [] });
}
