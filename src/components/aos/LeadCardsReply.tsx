"use client";

import { EnvelopeSimple, Phone } from "@phosphor-icons/react";

interface LeadSummary {
  id: string;
  name: string;
  source: string;
  score: number;
  tags: string[];
  priority: string;
}

interface Props {
  leads: LeadSummary[];
  onFollowUp: (leadName: string) => void;
  onCall: (leadName: string) => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function scoreColor(score: number) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-500";
  return "bg-neutral-400";
}

function avatarSvg(name: string) {
  const hue =
    name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 360;
  const bg1 = `hsl(${hue} 78% 86%)`;
  const bg2 = `hsl(${(hue + 24) % 360} 72% 78%)`;
  const skin = `hsl(${(hue + 320) % 360} 42% 82%)`;
  const hair = `hsl(${(hue + 260) % 360} 22% 34%)`;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="bg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop stop-color="${bg1}" />
          <stop offset="1" stop-color="${bg2}" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="32" fill="url(#bg)" />
      <circle cx="32" cy="25" r="12.5" fill="${skin}" />
      <path d="M20 49c2.5-8 8-12 12-12s9.5 4 12 12" fill="${skin}" />
      <path d="M18 24.5c0-7.5 6.5-13 14-13 8.5 0 14 5.5 14 12.5 0 1.5-.5 3.5-1.5 5.5-1-5.5-4.5-8.5-8.5-8.5-2 0-4 1-5.5 2.5-1.5 1.5-3.5 2.5-5.5 2.5-2 0-4-.5-6-1.5-.25-.5-.5-1.25-.5-2z" fill="${hair}" />
      <circle cx="27.5" cy="25.5" r="1.1" fill="${hair}" />
      <circle cx="36.5" cy="25.5" r="1.1" fill="${hair}" />
      <path d="M28.5 31c1 1 2 1.5 3.5 1.5s2.5-.5 3.5-1.5" stroke="${hair}" stroke-width="1.4" stroke-linecap="round" />
      <circle cx="47" cy="17" r="7" fill="rgba(255,255,255,.35)" />
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function LeadCardsReply({ leads, onFollowUp, onCall }: Props) {
  if (!leads.length) {
    return (
      <div className="text-[13px] text-neutral-500">No leads found for today.</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="card p-3 flex items-center gap-3 hover:shadow-sm transition-all fade-in"
          style={{
            animationDuration: "320ms",
            animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 bg-neutral-100 ring-1 ring-neutral-200/70">
            <img
              src={avatarSvg(lead.name)}
              alt={`${lead.name} profile`}
              className="w-full h-full object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white grid place-items-center text-[8px] font-semibold text-neutral-700 ring-1 ring-neutral-200">
              {initials(lead.name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-neutral-900 truncate">
                {lead.name}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${scoreColor(lead.score)}`}
                aria-label={`Score ${lead.score}`}
              />
            </div>
            <div className="text-[11px] text-neutral-500 truncate">
              {lead.source} · {lead.tags.join(", ")}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onCall(lead.name)}
              aria-label={`Call ${lead.name}`}
              title={`Call ${lead.name}`}
              className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 grid place-items-center hover:bg-neutral-900 hover:text-white transition"
            >
              <Phone size={14} weight="regular" />
            </button>
            <button
              onClick={() => onFollowUp(lead.name)}
              aria-label={`Email ${lead.name}`}
              title={`Email ${lead.name}`}
              className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 grid place-items-center hover:bg-neutral-900 hover:text-white transition"
            >
              <EnvelopeSimple size={14} weight="regular" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
