import { NextResponse } from "next/server";
import { insforgeDb, isDbEnabled } from "@/lib/insforge";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbEnabled) {
    return NextResponse.json({ error: "InsForge not configured" }, { status: 503 });
  }

  try {
    const [leads, tasks, appointments, transactions] = await Promise.all([
      insforgeDb.select("leads"),
      insforgeDb.select("tasks"),
      insforgeDb.select("appointments"),
      insforgeDb.select("transactions"),
    ]);

    // Normalize leads: tags stored as JSON array in DB — parse if it arrived as string
    const normalizedLeads = leads.map((l) => ({
      ...l,
      tags: Array.isArray(l.tags) ? l.tags : (typeof l.tags === "string" ? JSON.parse(l.tags as string) : []),
      scoreColor: l.score_color ?? "bg-neutral-700",
    }));

    return NextResponse.json({ leads: normalizedLeads, tasks, appointments, transactions });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
