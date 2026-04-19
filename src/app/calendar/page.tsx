"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import {
  addDays,
  CalendarEvent,
  colorForId,
  endOfWeek,
  formatMonthYear,
  formatRange,
  fromGoogleEvent,
  parseAppointmentTime,
  startOfWeek,
} from "@/lib/calendar";
import { useDashboardStore } from "@/lib/store";
import WeekGrid from "@/components/calendar/WeekGrid";
import ConnectGoogleButton from "@/components/calendar/ConnectGoogleButton";
import EventDetailsDialog from "@/components/calendar/EventDetailsDialog";
import NewEventDialog from "@/components/calendar/NewEventDialog";

type Tab = "all" | "events" | "meetings" | "tasks";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "All Scheduled", icon: <CalendarCheck size={13} /> },
  { id: "events", label: "Events", icon: <span className="w-1.5 h-1.5 rounded-full bg-violet-500" /> },
  { id: "meetings", label: "Meetings", icon: <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> },
  { id: "tasks", label: "Task Reminders", icon: <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> },
];

export default function CalendarPage() {
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [googleStatus, setGoogleStatus] = useState<{
    configured: boolean;
    connected: boolean;
    email: string | null;
  }>({ configured: false, connected: false, email: null });
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    day: Date | null;
    hour: number | null;
  }>({ open: false, day: null, hour: null });
  const [banner, setBanner] = useState<string | null>(null);

  const appointments = useDashboardStore((s) => s.appointments);
  const tasks = useDashboardStore((s) => s.tasks);

  const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate]);
  const weekEnd = useMemo(() => endOfWeek(anchorDate), [anchorDate]);

  // ----- React to OAuth callback redirect query string -----
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_connected")) {
      setBanner("Google Calendar connected.");
      window.history.replaceState({}, "", "/calendar");
    } else if (params.get("google_error")) {
      setBanner(`Couldn't connect Google: ${params.get("google_error")}`);
      window.history.replaceState({}, "", "/calendar");
    }
    if (banner) {
      const t = setTimeout(() => setBanner(null), 3500);
      return () => clearTimeout(t);
    }
  }, [banner]);

  // ----- Fetch Google connection status + events -----
  const refreshGoogle = useCallback(async () => {
    try {
      const statusRes = await fetch("/api/google/status", { cache: "no-store" });
      const status = await statusRes.json();
      setGoogleStatus({
        configured: !!status.configured,
        connected: !!status.connected,
        email: status.email ?? null,
      });

      if (!status.connected) {
        setGoogleEvents([]);
        return;
      }

      setLoadingGoogle(true);
      const params = new URLSearchParams({
        start: weekStart.toISOString(),
        end: weekEnd.toISOString(),
      });
      const res = await fetch(`/api/google/events?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      const items = Array.isArray(json.events) ? json.events : [];
      setGoogleEvents(items.map(fromGoogleEvent));
    } catch (err) {
      console.warn("[calendar] failed to load google data:", err);
    } finally {
      setLoadingGoogle(false);
    }
  }, [weekStart, weekEnd]);

  useEffect(() => {
    refreshGoogle();
  }, [refreshGoogle]);

  // ----- Convert Lofty appointments + tasks into CalendarEvents -----
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

    tasks.forEach((t) => {
      if (!t.time || t.time === "Anytime") return;
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

  // ----- Combined + filtered events -----
  const events = useMemo<CalendarEvent[]>(() => {
    const all = [...loftyEvents, ...googleEvents];
    return all.filter((ev) => {
      if (search && !ev.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (tab === "all") return true;
      if (tab === "tasks") return ev.id.startsWith("lofty_task_");
      if (tab === "meetings") return ev.source === "google";
      if (tab === "events") return ev.source === "lofty" && ev.id.startsWith("lofty_apt_");
      return true;
    });
  }, [loftyEvents, googleEvents, search, tab]);

  return (
    <div className="max-w-[1280px] mx-auto px-5 sm:px-6 py-6 space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[26px] font-semibold tracking-tight text-neutral-900">Calendar</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Stay organized and on track with your personalized real-estate calendar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ConnectGoogleButton
            connected={googleStatus.connected}
            configured={googleStatus.configured}
            email={googleStatus.email}
            onChange={refreshGoogle}
          />
        </div>
      </div>

      {banner && (
        <div className="text-xs px-3 py-2 rounded-lg bg-neutral-900 text-white inline-block">
          {banner}
        </div>
      )}

      {/* Tabs + actions row */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200/70 pb-2 flex-wrap">
        <div className="flex items-center gap-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-colors ${
                  active
                    ? "text-neutral-900 font-semibold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
                {active && (
                  <span className="absolute left-2 right-2 -bottom-2 h-[2px] rounded-full bg-neutral-900" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-7 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white focus:border-neutral-900 focus:outline-none w-40"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50">
            <Filter size={12} /> Filter
          </button>
          <button
            onClick={() => setCreateDialog({ open: true, day: new Date(), hour: 9 })}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <Plus size={12} /> New
          </button>
        </div>
      </div>

      {/* Toolbar: month + Today + nav + range */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-neutral-900">{formatMonthYear(weekStart)}</h2>
          <button
            onClick={() => setAnchorDate(new Date())}
            className="text-xs font-medium px-3 py-1 rounded-full text-neutral-700 border border-neutral-200 hover:border-neutral-900"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-full bg-neutral-100 p-0.5">
            {(["Day", "Week", "Month"] as const).map((v) => (
              <button
                key={v}
                disabled={v !== "Week"}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  v === "Week"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-400 cursor-not-allowed"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => setAnchorDate((d) => addDays(d, -7))}
              className="w-7 h-7 grid place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Previous week"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium text-neutral-700 min-w-[140px] text-center">
              {formatRange(weekStart, weekEnd)}
            </span>
            <button
              onClick={() => setAnchorDate((d) => addDays(d, 7))}
              className="w-7 h-7 grid place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Next week"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading hint */}
      {loadingGoogle && (
        <div className="text-[11px] text-neutral-400">Syncing Google Calendar…</div>
      )}

      {/* Week grid */}
      <WeekGrid
        weekStart={weekStart}
        events={events}
        onSelectEvent={setSelectedEvent}
        onSelectSlot={(s) =>
          setCreateDialog({ open: true, day: s.day, hour: s.hour })
        }
      />

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-neutral-500 pb-6">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-blue-100 border-l-2 border-blue-500" />
          Google Calendar
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-violet-100 border-l-2 border-violet-500" />
          Lofty appointments
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-100 border-l-2 border-amber-500" />
          Task reminders
        </div>
      </div>

      <EventDetailsDialog event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <NewEventDialog
        open={createDialog.open}
        initialDay={createDialog.day}
        initialHour={createDialog.hour}
        googleConnected={googleStatus.connected}
        onClose={() => setCreateDialog({ open: false, day: null, hour: null })}
        onCreated={refreshGoogle}
      />
    </div>
  );
}
