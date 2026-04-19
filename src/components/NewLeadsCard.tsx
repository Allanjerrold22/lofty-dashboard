"use client";

import { ChevronRight, Flame } from "lucide-react";
import { useDashboardStore } from "@/lib/store";

function ScoreBadge({ score, color }: { score: number; color: string }) {
  return (
    <div
      className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0 tabular`}
    >
      {score}
    </div>
  );
}

export default function NewLeadsCard() {
  const leads = useDashboardStore((s) => s.leads);
  const highlighted = useDashboardStore((s) => s.highlightedSection) === "leads";

  const total = 23;
  const untouched = 12;
  const touchedPct = ((total - untouched) / total) * 100;

  return (
    <div
      id="section-leads"
      className={`card p-5 transition-shadow ${
        highlighted ? "ring-2 ring-neutral-900 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">
          Today&apos;s New Leads
        </h3>
        <button className="text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-0.5">
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="mb-4">
        <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-neutral-900 h-1.5 rounded-full transition-all"
            style={{ width: `${touchedPct}%` }}
          />
        </div>
        <p className="text-[11px] text-neutral-500 mt-1.5 tabular">
          Total <span className="font-semibold text-neutral-900">{total}</span>
          <span className="text-amber-600 ml-1.5">({untouched} untouched)</span>
        </p>
      </div>

      <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">
        Waiting for touch
      </p>

      <ul className="space-y-3 max-h-[360px] overflow-y-auto scroll-thin pr-1">
        {leads.slice(0, 25).map((lead) => (
          <li key={lead.id} className="flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium text-neutral-900 truncate">{lead.name}</p>
                {lead.priority === "high" && (
                  <Flame className="w-3 h-3 text-rose-500" />
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5 mb-0.5">
                {lead.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-neutral-400">{lead.source}</p>
            </div>
            <ScoreBadge score={lead.score} color={lead.scoreColor} />
          </li>
        ))}
      </ul>
    </div>
  );
}
