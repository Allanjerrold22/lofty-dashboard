"use client";

import { ChevronDown, LayoutGrid } from "lucide-react";
import { Sparkles } from "lucide-react";
import { assistantUi } from "@/lib/assistant-ui";

export default function DashboardHeader() {
  return (
    <div className="flex items-center justify-between mb-6 mt-2">
      <div className="flex items-end gap-3">
        <h1 className="text-[26px] font-semibold text-neutral-900 tracking-tight leading-none">
          Dashboard
        </h1>
        <button className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 border border-neutral-200 rounded-full px-3 py-1.5 hover:bg-white transition-colors">
          <span>My Dashboard</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-ghost text-xs">
          <span>Today&apos;s Priorities</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        <button className="btn-icon border border-neutral-200" aria-label="Layout">
          <LayoutGrid className="w-4 h-4" />
        </button>

        {/* Ask Lofty — context-aware: seeds the assistant with a live dashboard snapshot */}
        <button
          onClick={() => assistantUi.open("chat")}
          aria-label="Open AI assistant"
          style={{
            background: "linear-gradient(135deg, #3240FF 0%, #6089FF 100%)",
            boxShadow: "0 2px 10px -2px rgba(50, 64, 255, 0.45)",
          }}
          className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 rounded-full text-white hover:opacity-90 hover:-translate-y-[1px] active:translate-y-0 transition-all duration-150 ml-1"
        >
          <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
          <span className="text-xs font-semibold tracking-tight">Ask Lofty</span>
        </button>
      </div>
    </div>
  );
}
