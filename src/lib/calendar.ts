// Shared calendar types + small date helpers used by the calendar UI.

export type EventSource = "google" | "lofty";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  source: EventSource;
  color: string;        // tailwind background class, e.g. "bg-violet-100"
  textColor: string;    // tailwind text class, e.g. "text-violet-700"
  border: string;       // tailwind border-l class
  location?: string;
  description?: string;
  organizer?: string;
  htmlLink?: string;
  attendees?: string[];
}

const PALETTE = [
  { color: "bg-violet-100", textColor: "text-violet-800", border: "border-l-violet-500" },
  { color: "bg-sky-100",    textColor: "text-sky-800",    border: "border-l-sky-500"    },
  { color: "bg-emerald-100",textColor: "text-emerald-800",border: "border-l-emerald-500"},
  { color: "bg-amber-100",  textColor: "text-amber-800",  border: "border-l-amber-500"  },
  { color: "bg-rose-100",   textColor: "text-rose-800",   border: "border-l-rose-500"   },
  { color: "bg-indigo-100", textColor: "text-indigo-800", border: "border-l-indigo-500" },
];

export function colorForId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

// ---------- Date helpers ----------

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

// Week starts on Monday to match the reference design.
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 = Sun
  const diff = (day + 6) % 7; // days since Monday
  x.setDate(x.getDate() - diff);
  return x;
}

export function endOfWeek(d: Date): Date {
  return addDays(startOfWeek(d), 7);
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  const fmtDay = (d: Date) => d.getDate();
  const fmtMonth = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short" });
  const lastDay = addDays(end, -1); // grid range is inclusive on the left
  if (sameMonth && sameYear) {
    return `${fmtDay(start)} – ${fmtDay(lastDay)} ${fmtMonth(start)} ${start.getFullYear()}`;
  }
  return `${fmtDay(start)} ${fmtMonth(start)} – ${fmtDay(lastDay)} ${fmtMonth(lastDay)} ${start.getFullYear()}`;
}

export function formatMonthYear(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

// ---------- Parse a Lofty appointment time string into Date pair ----------
// Examples: "11:00 AM – 2:00 PM", "3:00 PM – 3:30 PM", "10:00 AM"
const TIME_RE = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi;

export function parseAppointmentTime(
  baseDate: Date,
  rawTime: string
): { start: Date; end: Date } | null {
  if (!rawTime) return null;
  const matches = [...rawTime.matchAll(TIME_RE)];
  if (matches.length === 0) return null;

  const toDate = (m: RegExpMatchArray): Date => {
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    const meridiem = m[3].toUpperCase();
    if (meridiem === "PM" && h < 12) h += 12;
    if (meridiem === "AM" && h === 12) h = 0;
    const d = new Date(baseDate);
    d.setHours(h, min, 0, 0);
    return d;
  };

  const start = toDate(matches[0]);
  const end = matches[1]
    ? toDate(matches[1])
    : new Date(start.getTime() + 60 * 60 * 1000); // default 1 hour
  return { start, end };
}

// Convert a Google Calendar event JSON shape to our CalendarEvent.
export function fromGoogleEvent(e: {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  organizer?: { email?: string; displayName?: string };
  attendees?: { email?: string; displayName?: string }[];
}): CalendarEvent {
  const allDay = !!e.start.date && !e.start.dateTime;
  const start = new Date(e.start.dateTime ?? e.start.date ?? Date.now());
  const end = new Date(e.end.dateTime ?? e.end.date ?? start.getTime() + 60 * 60 * 1000);
  const palette = colorForId(e.id);
  return {
    id: `g_${e.id}`,
    title: e.summary || "(No title)",
    description: e.description,
    location: e.location,
    htmlLink: e.htmlLink,
    organizer: e.organizer?.displayName || e.organizer?.email,
    attendees: e.attendees?.map((a) => a.displayName || a.email || "").filter(Boolean),
    start,
    end,
    allDay,
    source: "google",
    ...palette,
  };
}
