"use client";

import { Check, Loader } from "lucide-react";

export type ThinkingStep = {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
};

interface Props {
  steps: ThinkingStep[];
}

export default function ThinkingTimeline({ steps }: Props) {
  if (steps.length === 0) return null;
  return (
    <div className="relative pl-2 py-1">
      {/* Vertical rail line */}
      <div
        className="absolute left-[15px] top-3 bottom-3 w-px bg-neutral-200"
        aria-hidden
      />
      <ul className="space-y-2.5">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center gap-3">
            <span
              className={`relative z-10 grid place-items-center w-[14px] h-[14px] rounded-full ${
                step.status === "done"
                  ? "bg-neutral-900 text-white"
                  : step.status === "error"
                  ? "bg-rose-500 text-white"
                  : step.status === "running"
                  ? "bg-white border-2 border-neutral-900"
                  : "bg-white border border-neutral-300"
              }`}
            >
              {step.status === "done" && <Check size={9} strokeWidth={3} />}
              {step.status === "running" && (
                <Loader size={8} className="animate-spin text-neutral-900" />
              )}
            </span>
            <span
              className={`text-[13px] leading-none ${
                step.status === "done"
                  ? "text-neutral-700"
                  : step.status === "running"
                  ? "text-neutral-900 font-medium"
                  : step.status === "error"
                  ? "text-rose-700"
                  : "text-neutral-400"
              }`}
            >
              {step.label}
            </span>
            {step.status === "running" && (
              <span className="ml-1 inline-flex gap-0.5">
                <Dot />
                <Dot delay={150} />
                <Dot delay={300} />
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="w-1 h-1 rounded-full bg-neutral-400 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
