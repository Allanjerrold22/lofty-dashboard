"use client";

import { Sparkles } from "lucide-react";
import { assistantUi } from "@/lib/assistant-ui";

export default function AssistantOrb() {
  return (
    <button
      onClick={() => assistantUi.open("chat")}
      aria-label="Open AI assistant"
      style={{
        background: "linear-gradient(135deg, #3240FF 0%, #6089FF 100%)",
        boxShadow: "0 2px 10px -2px rgba(50, 64, 255, 0.45)",
      }}
      className="inline-flex items-center gap-1.5 pl-2.5 pr-3.5 py-2 rounded-full text-white hover:opacity-90 hover:-translate-y-[1px] active:translate-y-0 transition-all duration-150"
    >
      <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
      <span className="text-xs font-semibold tracking-tight">Ask Lofty</span>
    </button>
  );
}
