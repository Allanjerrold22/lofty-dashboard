"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { approvePending, cancelPending, usePendingAction } from "@/lib/permission-bus";

export default function ConfirmActionDialog() {
  const pending = usePendingAction();
  const [params, setParams] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (pending) setParams(pending.params);
  }, [pending]);

  if (!pending) return null;

  const editable = pending.editable ?? {};

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 fade-in">
      <div className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm" onClick={cancelPending} />
      <div className="relative w-full max-w-md card p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">
                {pending.title}
              </h3>
              {pending.description && (
                <p className="text-xs text-neutral-500 mt-0.5">{pending.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={cancelPending}
            className="btn-icon"
            aria-label="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 mb-4">
          {Object.entries(params).map(([key, value]) => {
            const kind = editable[key];
            const display = String(value ?? "");
            if (!kind) {
              return (
                <div key={key} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="text-neutral-500 capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="text-neutral-900 font-medium text-right truncate max-w-[60%]">
                    {display}
                  </span>
                </div>
              );
            }
            return (
              <label key={key} className="block">
                <span className="text-[11px] uppercase tracking-wide text-neutral-500 capitalize">
                  {key.replace(/_/g, " ")}
                </span>
                {kind === "text" ? (
                  <textarea
                    value={display}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, [key]: e.target.value }))
                    }
                    rows={4}
                    className="mt-1 w-full text-sm rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:border-neutral-900 transition-colors resize-none"
                  />
                ) : (
                  <input
                    value={display}
                    onChange={(e) =>
                      setParams((p) => ({ ...p, [key]: e.target.value }))
                    }
                    className="mt-1 w-full text-sm rounded-xl border border-neutral-200 px-3 py-2 focus:outline-none focus:border-neutral-900 transition-colors"
                  />
                )}
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={cancelPending} className="btn-ghost">
            Cancel
          </button>
          <button onClick={() => approvePending(params)} className="btn-primary">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
