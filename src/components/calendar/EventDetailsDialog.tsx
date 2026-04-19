"use client";

import { CalendarEvent } from "@/lib/calendar";
import { Calendar, ExternalLink, MapPin, Users, X } from "lucide-react";

interface Props {
  event: CalendarEvent | null;
  onClose: () => void;
}

export default function EventDetailsDialog({ event, onClose }: Props) {
  if (!event) return null;

  const dateLabel = event.start.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeLabel = `${event.start.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })} – ${event.end.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-5 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className={`w-1 h-10 rounded-full ${event.border.replace("border-l-", "bg-")}`} />
            <div>
              <h3 className="text-base font-semibold text-neutral-900 leading-snug">
                {event.title}
              </h3>
              <span
                className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  event.source === "google"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-neutral-900 text-white"
                }`}
              >
                {event.source === "google" ? "Google Calendar" : "Lofty"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 grid place-items-center rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-2.5 text-sm text-neutral-700">
          <div className="flex items-center gap-2.5">
            <Calendar size={14} className="text-neutral-400" />
            <span>
              {dateLabel} · <span className="text-neutral-500">{timeLabel}</span>
            </span>
          </div>
          {event.location && (
            <div className="flex items-start gap-2.5">
              <MapPin size={14} className="text-neutral-400 mt-0.5" />
              <span>{event.location}</span>
            </div>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <div className="flex items-start gap-2.5">
              <Users size={14} className="text-neutral-400 mt-0.5" />
              <span className="text-neutral-600">{event.attendees.join(", ")}</span>
            </div>
          )}
          {event.description && (
            <p className="text-[13px] text-neutral-600 leading-relaxed pt-2 border-t border-neutral-100">
              {event.description}
            </p>
          )}
        </div>

        {event.htmlLink && (
          <div className="mt-5 pt-4 border-t border-neutral-100 flex justify-end">
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-900"
            >
              Open in Google Calendar <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
