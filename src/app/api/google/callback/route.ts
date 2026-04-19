import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getUserEmail,
  GOOGLE_EMAIL_COOKIE,
  GOOGLE_REFRESH_COOKIE,
  isGoogleConfigured,
} from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const origin = url.origin;

  if (!isGoogleConfigured) {
    return NextResponse.redirect(`${origin}/calendar?google_error=not_configured`);
  }
  if (error) {
    return NextResponse.redirect(`${origin}/calendar?google_error=${encodeURIComponent(error)}`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/calendar?google_error=missing_code`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const email = (await getUserEmail(tokens.access_token)) ?? "";

    const res = NextResponse.redirect(`${origin}/calendar?google_connected=1`);

    // refresh_token is sometimes only sent on first consent.
    if (tokens.refresh_token) {
      res.cookies.set(GOOGLE_REFRESH_COOKIE, tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 180, // 180 days
      });
    }
    if (email) {
      res.cookies.set(GOOGLE_EMAIL_COOKIE, email, {
        httpOnly: false, // readable by client to display the connected account
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 180,
      });
    }
    return res;
  } catch (err) {
    return NextResponse.redirect(
      `${origin}/calendar?google_error=${encodeURIComponent((err as Error).message)}`
    );
  }
}
