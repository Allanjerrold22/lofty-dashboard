import { NextResponse } from "next/server";
import { GOOGLE_EMAIL_COOKIE, GOOGLE_REFRESH_COOKIE } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(GOOGLE_REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(GOOGLE_EMAIL_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
