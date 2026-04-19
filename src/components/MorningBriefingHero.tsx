"use client";

import { useEffect, useState } from "react";
import { Sparkles, Flame, AlertTriangle, Trophy } from "lucide-react";
import type { Briefing } from "@/app/api/briefing/route";

const TONE_ICON: Record<Briefing["highlights"][number]["tone"], { Icon: typeof Flame; color: string }> = {
  hot: { Icon: Flame, color: "text-rose-500" },
  risk: { Icon: AlertTriangle, color: "text-amber-500" },
  win: { Icon: Trophy, color: "text-emerald-500" },
  info: { Icon: Sparkles, color: "text-neutral-700" },
};

export default function MorningBriefingHero() {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/briefing")
      .then((r) => r.json() as Promise<Briefing>)
      .then((b) => {
        if (cancelled) return;
        setBriefing(b);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!briefing) return;
    setRevealed(0);
    const total = briefing.highlights.length;
    const id = setInterval(() => {
      setRevealed((r) => {
        if (r >= total) {
          clearInterval(id);
          return r;
        }
        return r + 1;
      });
    }, 450);
    return () => clearInterval(id);
  }, [briefing]);

  return (
    <section className="relative">
      <div className="card rounded-[1.25rem] p-6 sm:p-7">
        <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 text-[11px] font-semibold tracking-wide text-neutral-700 uppercase">
                  <Sparkles className="w-3 h-3" /> Morning Briefing
                </span>
                <span className="text-[11px] text-neutral-400">
                  {new Date().toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>

              <h2 className="text-2xl sm:text-[28px] font-semibold tracking-tight leading-tight">
                {briefing ? (
                  <span className="shimmer-text">{briefing.greeting}</span>
                ) : (
                  <span className="inline-block h-7 w-64 rounded-md shimmer-bg" />
                )}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                {briefing?.summary ?? "Pulling your day together…"}
              </p>

              <ul className="mt-4 space-y-2.5 max-w-2xl">
                {(briefing?.highlights ?? Array.from({ length: 3 })).map((h, i) => {
                  if (!h || typeof h === "number") {
                    return (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full shimmer-bg mt-0.5" />
                        <div className="h-4 w-full max-w-md rounded-md shimmer-bg" />
                      </li>
                    );
                  }
                  const { Icon, color } = TONE_ICON[h.tone];
                  return (
                    <li
                      key={h.id}
                      className={`flex items-start gap-2.5 transition-opacity ${
                        i < revealed ? "text-stream opacity-100" : "opacity-0"
                      }`}
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                      <p className="text-sm text-neutral-800 leading-relaxed">{h.text}</p>
                    </li>
                  );
                })}
              </ul>
            </div>
        </div>
    </section>
  );
}
