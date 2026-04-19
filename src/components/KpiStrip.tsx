"use client";

import { ArrowDownRight, ArrowUpRight, type LucideIcon, Users, Wallet, Sparkles, CheckCircle2 } from "lucide-react";
import { Area, AreaChart } from "recharts";

type Kpi = {
  label: string;
  value: string;
  delta: number;
  icon: LucideIcon;
  series: number[];
};

const kpis: Kpi[] = [
  { label: "New Leads", value: "23", delta: 12, icon: Users, series: [12, 14, 11, 18, 17, 22, 23] },
  { label: "Active Pipeline", value: "$4.28M", delta: 4.2, icon: Wallet, series: [3.6, 3.8, 3.9, 4.0, 4.05, 4.18, 4.28] },
  { label: "GCI · MTD", value: "$38.5K", delta: 18, icon: Sparkles, series: [4, 9, 14, 19, 22, 30, 38.5] },
  { label: "Tasks Done", value: "67%", delta: -3, icon: CheckCircle2, series: [60, 64, 70, 68, 72, 70, 67] },
];

export default function KpiStrip() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((k) => {
        const positive = k.delta >= 0;
        const Icon = k.icon;
        const data = k.series.map((y, i) => ({ x: i, y }));
        const gradId = `grad-${k.label.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}`;
        return (
          <div key={k.label} className="card p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">
                <Icon className="w-3.5 h-3.5" />
                {k.label}
              </div>
              <p className="text-[17px] font-semibold text-neutral-900 mt-1 tabular tracking-tight">
                {k.value}
              </p>
              <div
                className={`mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium ${
                  positive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {positive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {Math.abs(k.delta)}%
              </div>
            </div>
            <div className="shrink-0">
              <AreaChart
                width={64}
                height={32}
                data={data}
                margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3240FF" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#6089FF" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke="#3240FF"
                  strokeWidth={1.5}
                  fill={`url(#${gradId})`}
                  isAnimationActive={false}
                />
              </AreaChart>
            </div>
          </div>
        );
      })}
    </div>
  );
}
