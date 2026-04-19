import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createEvent,
  GOOGLE_REFRESH_COOKIE,
  isGoogleConfigured,
  listEvents,
  refreshAccessToken,
} from "@/lib/google";

export const dynamic = "force-dynamic";

async function getAccessToken(): Promise<string | null> {
  const store = await cookies();
  const refresh = store.get(GOOGLE_REFRESH_COOKIE)?.value;
  if (!refresh) return null;
  const tokens = await refreshAccessToken(refresh);
  return tokens.access_token;
}

export async function GET(req: NextRequest) {
  if (!isGoogleConfigured) {
    return NextResponse.json({ error: "google_not_configured", events: [] }, { status: 200 });
  }
  const accessToken = await getAccessToken().catch((e) => {
    console.warn("[google/events] refresh failed:", (e as Error).message);
    return null;
  });
  if (!accessToken) {
    return NextResponse.json({ connected: false, events: [] });
  }

  const url = new URL(req.url);
  const timeMin = url.searchParams.get("start") ?? new Date().toISOString();
  const timeMax =
    url.searchParams.get("end") ??
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const events = await listEvents(accessToken, { timeMin, timeMax });
    return NextResponse.json({ connected: true, events });
  } catch (err) {
    return NextResponse.json(
      { connected: true, events: [], error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isGoogleConfigured) {
    return NextResponse.json({ error: "google_not_configured" }, { status: 400 });
  }
  const accessToken = await getAccessToken().catch(() => null);
  if (!accessToken) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      summary: string;
      description?: string;
      location?: string;
      start: string;
      end: string;
      attendees?: string[];
    };
    const event = await createEvent(accessToken, body);
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
