"use client";

import { ChevronRight, AlertTriangle, AlertCircle } from "lucide-react";
import { useDashboardStore } from "@/lib/store";

export default function TransactionsCard() {
  const transactions = useDashboardStore((s) => s.transactions);
  const highlighted = useDashboardStore((s) => s.highlightedSection) === "transactions";

  return (
    <div
      id="section-transactions"
      className={`card p-5 transition-shadow ${
        highlighted ? "ring-2 ring-neutral-900 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">
          Transactions
        </h3>
        <button className="text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-0.5">
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-neutral-200/80 px-3 py-2">
          <p className="text-xl font-semibold text-neutral-900 tabular">3</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Near deadline</p>
        </div>
        <div className="rounded-xl border border-neutral-200/80 px-3 py-2">
          <p className="text-xl font-semibold text-neutral-900 tabular">2</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">Expired</p>
        </div>
      </div>

      <ul className="space-y-2.5">
        {transactions.slice(0, 4).map((tx) => (
          <li
            key={tx.id}
            className="border-b border-neutral-100 pb-2.5 last:border-0 last:pb-0"
          >
            <p className="text-sm font-medium text-neutral-900 truncate">{tx.address}</p>
            <div className="flex items-start gap-1.5 mt-1">
              {tx.type === "deadline" ? (
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <p className="text-[11px] text-neutral-500 truncate">{tx.warning}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
