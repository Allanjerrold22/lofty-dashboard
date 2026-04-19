import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  GOOGLE_EMAIL_COOKIE,
  GOOGLE_REFRESH_COOKIE,
  isGoogleConfigured,
  refreshAccessToken,
} from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = await cookies();
  const refresh = store.get(GOOGLE_REFRESH_COOKIE)?.value;
  const email = store.get(GOOGLE_EMAIL_COOKIE)?.value ?? null;

  let scopes: string[] = [];
  if (refresh) {
    try {
      const tokens = await refreshAccessToken(refresh);
      scopes = (tokens.scope || "").split(" ").filter(Boolean);
    } catch {
      scopes = [];
    }
  }

  return NextResponse.json({
    configured: isGoogleConfigured,
    connected: Boolean(refresh),
    email,
    scopes,
    canSendEmail: scopes.includes("https://www.googleapis.com/auth/gmail.send"),
  });
}
