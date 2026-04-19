import { NextRequest, NextResponse } from "next/server";
import { insforgeDb, isDbEnabled } from "@/lib/insforge";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isDbEnabled) return NextResponse.json({ error: "InsForge not configured" }, { status: 503 });
  try {
    const body = await req.json();
    const rows = await insforgeDb.insert("appointments", [{ ...body, done: false }]);
    return NextResponse.json({ ok: true, appointment: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
