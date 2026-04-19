"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useDashboardStore } from "@/lib/store";
import {
  CalendarEvent,
  colorForId,
  fromGoogleEvent,
  parseAppointmentTime,
  sameDay,
} from "@/lib/calendar";

function formatTime(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function sourceLabel(ev: CalendarEvent) {
  if (ev.source === "google") return "Google";
  if (ev.id.startsWith("lofty_task_")) return "Task";
  return "Lofty";
}

export default function AppointmentsCard() {
  const appointments = useDashboardStore((s) => s.appointments);
  const tasks = useDashboardStore((s) => s.tasks);
  const highlighted = useDashboardStore((s) => s.highlightedSection) === "appointments";

  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);

  // Fetch today's Google Calendar events once on mount
  useEffect(() => {
    async function load() {
      try {
        const statusRes = await fetch("/api/google/status", { cache: "no-store" });
        const status = await statusRes.json();
        if (!status.connected) return;

        const today = new Date();
        const start = new Date(today);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);

        const params = new URLSearchParams({
          start: start.toISOString(),
          end: end.toISOString(),
        });
        const res = await fetch(`/api/google/events?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await res.json();
        const items = Array.isArray(json.events) ? json.events : [];
        setGoogleEvents(items.map(fromGoogleEvent));
      } catch {
        // silently ignore — not connected or API not configured
      }
    }
    load();
  }, []);

  // Convert Lofty appointments + tasks to CalendarEvents for today
  const loftyEvents = useMemo<CalendarEvent[]>(() => {
    const today = new Date();
    const result: CalendarEvent[] = [];

    appointments.forEach((apt) => {
      const parsed = parseAppointmentTime(today, apt.time);
      if (!parsed) return;
      const palette = colorForId(apt.id);
      result.push({
        id: `lofty_apt_${apt.id}`,
        title: apt.person,
        description: apt.note,
        start: parsed.start,
        end: parsed.end,
        source: "lofty",
        ...palette,
      });
    });

    tasks
      .filter((t) => !t.done && t.time && t.time !== "Anytime")
      .forEach((t) => {
        const parsed = parseAppointmentTime(today, t.time);
        if (!parsed) return;
        result.push({
          id: `lofty_task_${t.id}`,
          title: `${t.title} · ${t.contact}`,
          start: parsed.start,
          end: new Date(parsed.start.getTime() + 30 * 60 * 1000),
          source: "lofty",
          color: "bg-amber-100",
          textColor: "text-amber-800",
          border: "border-l-amber-500",
        });
      });

    return result;
  }, [appointments, tasks]);

  // Merge + sort all events for today
  const allEvents = useMemo<CalendarEvent[]>(() => {
    const today = new Date();
    const combined = [...loftyEvents, ...googleEvents].filter(
      (ev) => sameDay(ev.start, today)
    );
    combined.sort((a, b) => a.start.getTime() - b.start.getTime());
    return combined;
  }, [loftyEvents, googleEvents]);

  const total = allEvents.length;

  return (
    <div
      id="section-appointments"
      className={`card p-5 transition-shadow ${
        highlighted ? "ring-2 ring-neutral-900 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900">Today&apos;s Schedule</h3>
        <Link
          href="/calendar"
          className="text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-0.5"
        >
          View calendar <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <p className="text-[11px] text-neutral-500 mb-4 tabular">
        <span className="font-semibold text-neutral-900">{total}</span>{" "}
        {total === 1 ? "event" : "events"} today
        {googleEvents.length > 0 && (
          <span className="text-neutral-400 ml-1">
            · {googleEvents.length} from Google
          </span>
        )}
      </p>

      {total === 0 ? (
        <p className="text-[12px] text-neutral-400 py-4 text-center">
          Nothing scheduled today.{" "}
          <Link href="/calendar" className="underline hover:text-neutral-700">
            Open calendar
          </Link>
        </p>
      ) : (
        <ul className="space-y-2.5">
          {allEvents.slice(0, 5).map((ev) => (
            <li key={ev.id} className="border-b border-neutral-100 pb-2.5 last:border-0 last:pb-0">
              <Link href="/calendar" className="flex items-start gap-2.5 group">
                {/* Color strip */}
                <div
                  className={`w-1 self-stretch rounded-full shrink-0 ${
                    ev.border.replace("border-l-", "bg-")
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-neutral-600 transition-colors">
                      {ev.title}
                    </p>
                    <span
                      className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${ev.color} ${ev.textColor}`}
                    >
                      {sourceLabel(ev)}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-neutral-500 mt-0.5">
                    {formatTime(ev.start)} – {formatTime(ev.end)}
                  </p>
                  {ev.description && (
                    <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                      {ev.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-500 shrink-0 mt-1 transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {total > 5 && (
        <Link
          href="/calendar"
          className="mt-3 text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-0.5"
        >
          +{total - 5} more <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
