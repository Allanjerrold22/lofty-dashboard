"use client";

import { useDashboardStore } from "@/lib/store";

const stages = [
  { key: "leads", label: "Leads", count: 124, value: 0 },
  { key: "qualified", label: "Qualified", count: 68, value: 0 },
  { key: "showing", label: "In Showing", count: 41, value: 1_840_000 },
  { key: "offer", label: "Offer", count: 18, value: 1_120_000 },
  { key: "closing", label: "Closing", count: 7, value: 620_000 },
];

const max = stages[0].count;

function fmtMoney(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
  return `$${n}`;
}

export default function PipelineFunnelChart() {
  const highlighted = useDashboardStore((s) => s.highlightedSection) === "pipeline";

  return (
    <div
      id="section-pipeline"
      className={`card p-5 transition-shadow ${
        highlighted ? "ring-2 ring-neutral-900 shadow-lg" : ""
      }`}
    >
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">
          Pipeline funnel
        </h3>
        <span className="text-[11px] text-neutral-400">Last 30 days</span>
      </div>
      <p className="text-xs text-neutral-500 mb-4">
        See where deals drop off. Biggest leak: Qualified → Showing.
      </p>

      <div className="space-y-2.5">
        {stages.map((s, i) => {
          const width = (s.count / max) * 100;
          const conversion = i === 0 ? 100 : Math.round((s.count / stages[i - 1].count) * 100);
          return (
            <div key={s.key} className="group">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-neutral-700">{s.label}</span>
                <span className="text-neutral-500 tabular">
                  <span className="font-semibold text-neutral-900">{s.count}</span>
                  {i > 0 && (
                    <span
                      className={`ml-2 ${
                        conversion < 50 ? "text-amber-600" : "text-neutral-400"
                      }`}
                    >
                      {conversion}%
                    </span>
                  )}
                  {s.value > 0 && (
                    <span className="ml-2 text-neutral-400">{fmtMoney(s.value)}</span>
                  )}
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
