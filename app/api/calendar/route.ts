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

  // Fetch all of today's events (midnight → midnight) so past events are included
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(todayStart.toISOString())}` +
    `&timeMax=${encodeURIComponent(todayEnd.toISOString())}` +
    `&singleEvents=true` +
    `&orderBy=startTime` +
    `&maxResults=50`;

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
