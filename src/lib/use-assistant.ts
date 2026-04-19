"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";

export type AssistantMessage = {
  id: string;
  role: "user" | "agent";
  text: string;
  pending?: boolean;
};

export type StartOptions = {
  textOnly?: boolean;
  firstMessage?: string;
};

type SignedUrlResponse = { signedUrl?: string; agentId?: string; error?: string };

async function fetchSignedUrl(): Promise<SignedUrlResponse> {
  try {
    const res = await fetch("/api/elevenlabs/signed-url", { cache: "no-store" });
    return (await res.json()) as SignedUrlResponse;
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export function useAssistant() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingThinking, setPendingThinking] = useState(false);
  const sessionStartingRef = useRef(false);

  const conversation = useConversation({
    onMessage: ({ message, role }) => {
      setPendingThinking(false);
      setMessages((m) => [
        ...m,
        {
          id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          role,
          text: message,
        },
      ]);
    },
    onError: (msg) => {
      setError(msg);
      setPendingThinking(false);
    },
    onDisconnect: () => {
      setPendingThinking(false);
    },
  });

  const status = conversation.status;
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const isSpeaking = conversation.isSpeaking;
  const mode = conversation.mode;

  const ensureSession = useCallback(
    async (opts: StartOptions = {}): Promise<boolean> => {
      if (status === "connected" || status === "connecting") return true;
      if (sessionStartingRef.current) return true;
      sessionStartingRef.current = true;
      setError(null);

      try {
        const { signedUrl, agentId, error: errMsg } = await fetchSignedUrl();
        if (errMsg || !signedUrl) {
          // No backend yet — surface a friendly hint and fail open in chat with a mock.
          setError(
            errMsg ||
              "Add ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID to .env.local to enable the live assistant."
          );
          return false;
        }

        const overrides = opts.firstMessage
          ? { agent: { firstMessage: opts.firstMessage } }
          : undefined;

        await conversation.startSession({
          signedUrl,
          agentId,
          textOnly: opts.textOnly ?? false,
          ...(overrides ? { overrides } : {}),
        } as Parameters<typeof conversation.startSession>[0]);

        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      } finally {
        sessionStartingRef.current = false;
      }
    },
    [conversation, status]
  );

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setMessages((m) => [
        ...m,
        { id: `user_local_${Date.now()}`, role: "user", text: trimmed },
      ]);
      setPendingThinking(true);

      const ok = await ensureSession({ textOnly: true });
      if (!ok) {
        setPendingThinking(false);
        setMessages((m) => [
          ...m,
          {
            id: `agent_mock_${Date.now()}`,
            role: "agent",
            text: "I'm in offline preview mode. Once you add your ElevenLabs key, I can take real actions.",
          },
        ]);
        return;
      }

      conversation.sendUserMessage(trimmed);
    },
    [conversation, ensureSession]
  );

  const startVoice = useCallback(
    async (opts: { firstMessage?: string } = {}) => {
      setPendingThinking(true);
      const ok = await ensureSession({ textOnly: false, firstMessage: opts.firstMessage });
      if (!ok) {
        setPendingThinking(false);
        return false;
      }
      return true;
    },
    [ensureSession]
  );

  const stop = useCallback(() => {
    setPendingThinking(false);
    conversation.endSession();
  }, [conversation]);

  // Reset on unmount
  useEffect(() => {
    return () => {
      try {
        conversation.endSession();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    messages,
    pendingThinking,
    error,
    status,
    isConnected,
    isConnecting,
    isSpeaking,
    mode,
    isMuted: conversation.isMuted,
    setMuted: conversation.setMuted,
    sendText,
    startVoice,
    stop,
  };
}
