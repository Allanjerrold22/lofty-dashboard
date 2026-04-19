import { NextResponse } from "next/server";
import { buildAuthUrl, isGoogleConfigured } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isGoogleConfigured) {
    return NextResponse.json(
      { error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local." },
      { status: 500 }
    );
  }
  return NextResponse.redirect(buildAuthUrl("calendar"));
}
