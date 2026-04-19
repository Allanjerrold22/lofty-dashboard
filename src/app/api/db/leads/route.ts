import { NextRequest, NextResponse } from "next/server";
import { insforgeDb, isDbEnabled } from "@/lib/insforge";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  if (!isDbEnabled) return NextResponse.json({ error: "InsForge not configured" }, { status: 503 });
  try {
    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const rows = await insforgeDb.update("leads", id, fields);
    return NextResponse.json({ ok: true, lead: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
