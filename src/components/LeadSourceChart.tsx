"use client";

import { Cell, Pie, PieChart } from "recharts";

const data = [
  { name: "Zillow", value: 38, color: "#0a0a0a" },
  { name: "Website", value: 26, color: "#52525b" },
  { name: "Facebook Ads", value: 18, color: "#a78bfa" },
  { name: "Referral", value: 12, color: "#34d399" },
  { name: "Open House", value: 6, color: "#f59e0b" },
];

const total = data.reduce((s, d) => s + d.value, 0);

export default function LeadSourceChart() {
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">
          Lead source mix
        </h3>
        <span className="text-[11px] text-neutral-400">This month</span>
      </div>
      <p className="text-xs text-neutral-500 mb-4">
        Where your leads come from — invest where the score is highest.
      </p>

      <div className="flex items-center gap-4">
        <div className="relative w-32 h-32 shrink-0">
          <PieChart width={128} height={128}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={62}
              strokeWidth={2}
              stroke="#ffffff"
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-[10px] uppercase tracking-wide text-neutral-400 font-semibold">
              Total
            </p>
            <p className="text-lg font-semibold text-neutral-900 tabular leading-none">
              {total}
            </p>
          </div>
        </div>

        <ul className="flex-1 space-y-1.5 min-w-0">
          {data.map((d) => (
            <li key={d.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="flex-1 text-neutral-700 truncate">{d.name}</span>
              <span className="text-neutral-500 tabular">
                {Math.round((d.value / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
