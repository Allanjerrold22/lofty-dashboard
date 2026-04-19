"use client";

import { useSyncExternalStore } from "react";

export type PendingAction = {
  id: string;
  tool: string;
  title: string;
  description?: string;
  params: Record<string, unknown>;
  editable?: Record<string, "string" | "text" | "number">;
  resolve: (decision: { approved: boolean; params: Record<string, unknown> }) => void;
};

let pending: PendingAction | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function requestPermission(input: Omit<PendingAction, "id" | "resolve">) {
  return new Promise<{ approved: boolean; params: Record<string, unknown> }>((resolve) => {
    pending = {
      ...input,
      id: `act_${Math.random().toString(36).slice(2, 9)}`,
      resolve: (decision) => {
        pending = null;
        emit();
        resolve(decision);
      },
    };
    emit();
  });
}

export function approvePending(params?: Record<string, unknown>) {
  if (!pending) return;
  pending.resolve({ approved: true, params: params ?? pending.params });
}

export function cancelPending() {
  if (!pending) return;
  pending.resolve({ approved: false, params: pending.params });
}

export function usePendingAction(): PendingAction | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => pending,
    () => null
  );
}
