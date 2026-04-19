import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type Briefing = {
  greeting: string;
  summary: string;
  highlights: { id: string; text: string; tone: "hot" | "risk" | "win" | "info" }[];
  suggestedActions: { id: string; label: string; intent: string }[];
  spokenScript: string;
};

export async function GET() {
  const hour = new Date().getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const briefing: Briefing = {
    greeting: `Good ${part}, James`,
    summary: "Here is what matters today.",
    highlights: [
      { id: "h1", text: "2 leads went hot overnight — Rob Adam (88) and a new Facebook lead.", tone: "hot" },
      { id: "h2", text: "Closing on 3931 Via Montalvo in 4 days — escrow doc still missing.", tone: "risk" },
      { id: "h3", text: "Rob Adam replied to your message — answer within 2 hours to keep score above 85.", tone: "win" },
    ],
    suggestedActions: [
      { id: "a1", label: "Open Rob Adam", intent: "Open Rob Adam's profile and summarize his recent activity." },
      { id: "a2", label: "Send escrow reminder", intent: "Draft a text to the seller of 3931 Via Montalvo asking for the missing escrow document." },
      { id: "a3", label: "Plan my morning", intent: "Reorder my today's tasks so the highest-value follow-ups come first." },
    ],
    spokenScript:
      `Good ${part}, James. Two leads went hot overnight — Rob Adam at 88 and a fresh Facebook lead. ` +
      `You're closing on 3931 Via Montalvo in four days, but the escrow document is still missing — that's your highest risk today. ` +
      `Rob Adam also replied to your message; answer within two hours to keep his score above 85. ` +
      `Want me to plan your morning around these?`,
  };

  return NextResponse.json(briefing);
}
