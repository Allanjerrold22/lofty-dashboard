import { NextRequest, NextResponse } from "next/server";
import { insforgeDb, isDbEnabled } from "@/lib/insforge";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isDbEnabled) return NextResponse.json({ error: "InsForge not configured" }, { status: 503 });
  try {
    const body = await req.json();
    const rows = await insforgeDb.insert("tasks", [{ ...body, done: false }]);
    return NextResponse.json({ ok: true, task: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isDbEnabled) return NextResponse.json({ error: "InsForge not configured" }, { status: 503 });
  try {
    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const rows = await insforgeDb.update("tasks", id, fields);
    return NextResponse.json({ ok: true, task: rows[0] });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
