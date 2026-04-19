"use client";

import { useSyncExternalStore } from "react";

export type AssistantTab = "chat" | "voice";

export type AssistantUiState = {
  open: boolean;
  tab: AssistantTab;
  pendingFirstMessage: string | null;
  autoStartVoice: boolean;
};

const initial: AssistantUiState = {
  open: false,
  tab: "chat",
  pendingFirstMessage: null,
  autoStartVoice: false,
};

let state: AssistantUiState = initial;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const assistantUi = {
  open(tab: AssistantTab = "chat", opts?: { firstMessage?: string; autoStartVoice?: boolean }) {
    state = {
      ...state,
      open: true,
      tab,
      pendingFirstMessage: opts?.firstMessage ?? null,
      autoStartVoice: !!opts?.autoStartVoice,
    };
    emit();
  },
  close() {
    state = { ...state, open: false, autoStartVoice: false };
    emit();
  },
  setTab(tab: AssistantTab) {
    state = { ...state, tab };
    emit();
  },
  consumeFirstMessage() {
    const msg = state.pendingFirstMessage;
    if (msg === null) return null;
    state = { ...state, pendingFirstMessage: null };
    emit();
    return msg;
  },
  consumeAutoStartVoice() {
    if (!state.autoStartVoice) return false;
    state = { ...state, autoStartVoice: false };
    emit();
    return true;
  },
};

export function useAssistantUi(): AssistantUiState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => state,
    () => initial
  );
}
