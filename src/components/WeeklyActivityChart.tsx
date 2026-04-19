"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const data = [
  { day: "Mon", calls: 12, texts: 18, emails: 6 },
  { day: "Tue", calls: 14, texts: 22, emails: 9 },
  { day: "Wed", calls: 9, texts: 17, emails: 5 },
  { day: "Thu", calls: 18, texts: 24, emails: 11 },
  { day: "Fri", calls: 16, texts: 20, emails: 8 },
  { day: "Sat", calls: 6, texts: 9, emails: 2 },
  { day: "Sun", calls: 3, texts: 4, emails: 1 },
];

const goal = 30;

const palette = {
  calls: "#0a0a0a",
  texts: "#a78bfa",
  emails: "#34d399",
};

export default function WeeklyActivityChart() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">
          Weekly outreach
        </h3>
        <span className="text-[11px] text-neutral-400">Goal · {goal}/day</span>
      </div>
      <p className="text-xs text-neutral-500 mb-3">
        Calls, texts, and emails per day. Consistency wins.
      </p>

      <div className="h-44 -mx-2">
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#f4f4f5" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={24}
                tick={{ fontSize: 10, fill: "#9ca3af" }}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                contentStyle={{
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  fontSize: 12,
                  boxShadow: "0 6px 24px -6px rgba(0,0,0,0.12)",
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: "#6b7280", paddingTop: 4 }}
              />
              <Bar dataKey="calls" stackId="a" fill={palette.calls} radius={[0, 0, 0, 0]} />
              <Bar dataKey="texts" stackId="a" fill={palette.texts} radius={[0, 0, 0, 0]} />
              <Bar dataKey="emails" stackId="a" fill={palette.emails} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  );
}
