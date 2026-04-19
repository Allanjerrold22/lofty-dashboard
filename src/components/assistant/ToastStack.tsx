"use client";

import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { dashboardActions, useDashboardStore } from "@/lib/store";

export default function ToastStack() {
  const toasts = useDashboardStore((s) => s.toasts);
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[90] flex flex-col gap-2 w-80">
      {toasts.map((t) => {
        const Icon =
          t.tone === "success" ? CheckCircle2 : t.tone === "warning" ? AlertTriangle : Info;
        const iconColor =
          t.tone === "success"
            ? "text-emerald-600"
            : t.tone === "warning"
            ? "text-amber-600"
            : "text-neutral-700";
        return (
          <div
            key={t.id}
            className="card p-3 flex items-start gap-2.5 fade-in"
          >
            <Icon className={`w-4 h-4 ${iconColor} mt-0.5 shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900">{t.title}</p>
              {t.description && (
                <p className="text-xs text-neutral-500 mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dashboardActions.dismissToast(t.id)}
              className="text-neutral-400 hover:text-neutral-700"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
