"use client";

import { ConversationProvider } from "@elevenlabs/react";
import type { ReactNode } from "react";
import { clientTools } from "@/lib/assistant-tools";

export default function AssistantProvider({ children }: { children: ReactNode }) {
  return (
    <ConversationProvider clientTools={clientTools}>
      {children}
    </ConversationProvider>
  );
}
