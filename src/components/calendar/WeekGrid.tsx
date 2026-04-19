"use client";

import { useMemo } from "react";
import { addDays, CalendarEvent, sameDay, startOfWeek } from "@/lib/calendar";

interface Props {
  weekStart: Date;
  events: CalendarEvent[];
  startHour?: number;
  endHour?: number;
  onSelectEvent?: (event: CalendarEvent) => void;
  onSelectSlot?: (slot: { day: Date; hour: number }) => void;
}

const HOUR_HEIGHT = 64; // px per hour

function formatHourLabel(h: number) {
  const meridiem = h >= 12 ? "PM" : "AM";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display} ${meridiem}`;
}

function dayLabel(d: Date) {
  return d
    .toLocaleDateString(undefined, { weekday: "short" })
    .toUpperCase()
    .slice(0, 3);
}

export default function WeekGrid({
  weekStart,
  events,
  startHour = 8,
  endHour = 20,
  onSelectEvent,
  onSelectSlot,
}: Props) {
  const ws = useMemo(() => startOfWeek(weekStart), [weekStart]);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(ws, i)),
    [ws]
  );
  const hours = useMemo(
    () => Array.from({ length: endHour - startHour }, (_, i) => startHour + i),
    [startHour, endHour]
  );

  const today = new Date();
  const totalHeight = (endHour - startHour) * HOUR_HEIGHT;

  // Group events by day index (0..6). Filter events to visible range.
  const eventsByDay = useMemo(() => {
    const buckets: CalendarEvent[][] = [[], [], [], [], [], [], []];
    for (const ev of events) {
      const dayIdx = days.findIndex((d) => sameDay(d, ev.start));
      if (dayIdx === -1) continue;
      buckets[dayIdx].push(ev);
    }
    return buckets;
  }, [days, events]);

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header row: empty corner + day labels */}
      <div
        className="grid border-b border-neutral-100 bg-neutral-50/40"
        style={{ gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))" }}
      >
        <div className="h-14" />
        {days.map((d) => {
          const isToday = sameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className={`h-14 flex flex-col items-center justify-center border-l border-neutral-100 ${
                isToday ? "text-neutral-900" : "text-neutral-500"
              }`}
            >
              <span className="text-[10px] font-semibold tracking-[0.08em]">
                {dayLabel(d)} {d.getDate()}
              </span>
              {isToday && (
                <span className="mt-0.5 inline-block w-1 h-1 rounded-full bg-neutral-900" />
              )}
            </div>
          );
        })}
      </div>

      {/* Body: time column + 7 day columns. Each column is positioned relative
          so events can be placed absolutely. */}
      <div
        className="relative grid"
        style={{
          gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))",
          height: `${totalHeight}px`,
        }}
      >
        {/* Time column */}
        <div className="relative border-r border-neutral-100">
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 flex justify-end pr-2"
              style={{ top: `${(h - startHour) * HOUR_HEIGHT - 6}px` }}
            >
              <span className="text-[10px] text-neutral-400 font-medium">
                {formatHourLabel(h)}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, di) => (
          <div
            key={day.toISOString()}
            className="relative border-l border-neutral-100"
          >
            {/* Hour rows (background lines + click targets) */}
            {hours.map((h) => (
              <button
                key={h}
                onClick={() => onSelectSlot?.({ day, hour: h })}
                className="absolute left-0 right-0 border-b border-neutral-100/80 hover:bg-neutral-50/60 transition-colors"
                style={{
                  top: `${(h - startHour) * HOUR_HEIGHT}px`,
                  height: `${HOUR_HEIGHT}px`,
                }}
                aria-label={`Add event ${day.toDateString()} ${formatHourLabel(h)}`}
              />
            ))}

            {/* Now indicator */}
            {sameDay(day, today) && (
              <NowIndicator startHour={startHour} endHour={endHour} />
            )}

            {/* Events */}
            {eventsByDay[di].map((ev) => {
              const startMin =
                (ev.start.getHours() - startHour) * 60 + ev.start.getMinutes();
              const endMin =
                (ev.end.getHours() - startHour) * 60 + ev.end.getMinutes();
              const top = Math.max(0, (startMin / 60) * HOUR_HEIGHT);
              const height = Math.max(
                26,
                ((Math.min(endMin, (endHour - startHour) * 60) - startMin) / 60) *
                  HOUR_HEIGHT - 2
              );
              const startTimeStr = ev.start.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              });
              const endTimeStr = ev.end.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              });
              return (
                <button
                  key={ev.id}
                  onClick={() => onSelectEvent?.(ev)}
                  className={`absolute left-1 right-1 rounded-md border-l-[3px] ${ev.color} ${ev.border} px-2 py-1 text-left overflow-hidden hover:shadow-sm hover:-translate-y-px transition-all`}
                  style={{ top: `${top}px`, height: `${height}px` }}
                >
                  <div className={`text-[10px] font-semibold ${ev.textColor}`}>
                    {startTimeStr} – {endTimeStr}
                  </div>
                  <div className={`text-[11px] leading-tight font-semibold ${ev.textColor} line-clamp-2 mt-0.5`}>
                    {ev.title}
                  </div>
                  {ev.location && height > 56 && (
                    <div className={`text-[10px] ${ev.textColor} opacity-80 mt-0.5 truncate`}>
                      {ev.location}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function NowIndicator({ startHour, endHour }: { startHour: number; endHour: number }) {
  const now = new Date();
  const minutes = (now.getHours() - startHour) * 60 + now.getMinutes();
  const max = (endHour - startHour) * 60;
  if (minutes < 0 || minutes > max) return null;
  const top = (minutes / 60) * HOUR_HEIGHT;
  return (
    <div
      className="absolute left-0 right-0 z-10 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="relative">
        <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-rose-500" />
        <div className="h-px bg-rose-500/80" />
      </div>
    </div>
  );
}
