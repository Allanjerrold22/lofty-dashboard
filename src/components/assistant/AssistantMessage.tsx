"use client";

import { Sparkles } from "lucide-react";
import type { AssistantMessage as AssistantMessageType } from "@/lib/use-assistant";

export function AssistantMessage({ msg }: { msg: AssistantMessageType }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 mt-0.5">
          <div className="aurora-orb absolute inset-0" />
          <div className="absolute inset-[2px] rounded-full bg-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
          </div>
        </div>
      )}
      <div
        className={`max-w-[78%] text-sm leading-relaxed rounded-2xl px-3.5 py-2.5 ${
          isUser
            ? "bg-neutral-900 text-white rounded-br-md"
            : "bg-neutral-100 text-neutral-900 rounded-bl-md"
        }`}
      >
        {msg.text}
      </div>
    </div>
  );
}

export function ThinkingMessage() {
  return (
    <div className="flex gap-2 justify-start">
      <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 mt-0.5">
        <div className="aurora-orb absolute inset-0" />
        <div className="absolute inset-[2px] rounded-full bg-white flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
        </div>
      </div>
      <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5">
        <div className="shimmer-bg h-3 w-32 rounded-full" />
      </div>
    </div>
  );
}
