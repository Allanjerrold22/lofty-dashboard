"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  initialDay?: Date | null;
  initialHour?: number | null;
  googleConnected: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewEventDialog({
  open,
  initialDay,
  initialHour,
  googleConnected,
  onClose,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [target, setTarget] = useState<"google" | "lofty">("lofty");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const day = initialDay ?? new Date();
    const hour = initialHour ?? new Date().getHours();
    const s = new Date(day);
    s.setHours(hour, 0, 0, 0);
    const e = new Date(s);
    e.setHours(hour + 1, 0, 0, 0);
    setStart(toLocalInput(s));
    setEnd(toLocalInput(e));
    setTitle("");
    setLocation("");
    setErr(null);
    setTarget(googleConnected ? "google" : "lofty");
  }, [open, initialDay, initialHour, googleConnected]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      if (target === "google") {
        const res = await fetch("/api/google/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: title.trim(),
            location: location || undefined,
            start: new Date(start).toISOString(),
            end: new Date(end).toISOString(),
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Failed (${res.status})`);
        }
      } else {
        const startD = new Date(start);
        const endD = new Date(end);
        const fmt = (d: Date) =>
          d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        const res = await fetch("/api/db/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            person: title.trim(),
            time: `${fmt(startD)} – ${fmt(endD)}`,
            note: location ? `Meet at ${location}` : "Scheduled from calendar.",
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || `Failed (${res.status})`);
        }
      }
      onCreated();
      onClose();
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-900/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-md p-5 space-y-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-neutral-900">New event</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 grid place-items-center rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
          >
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Title</label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Showing with Maria Lopez"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Start</label>
              <input
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">End</label>
              <input
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Location (optional)</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="87 Valencia ST, Half Moon Bay"
              className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-200 focus:border-neutral-900 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">Save to</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTarget("lofty")}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors ${
                  target === "lofty"
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                }`}
              >
                Lofty
              </button>
              <button
                type="button"
                disabled={!googleConnected}
                onClick={() => setTarget("google")}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  target === "google"
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                }`}
              >
                Google Calendar
              </button>
            </div>
            {!googleConnected && (
              <p className="text-[10px] text-neutral-400 mt-1.5">
                Connect Google Calendar to create events there.
              </p>
            )}
          </div>
        </div>

        {err && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
            {err}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-full text-neutral-700 hover:bg-neutral-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !title.trim()}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Create event"}
          </button>
        </div>
      </form>
    </div>
  );
}
