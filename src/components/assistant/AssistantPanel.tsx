"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Send,
  X,
  Sparkles,
  MessageSquare,
  AudioLines,
  Square,
} from "lucide-react";
import { useAssistant } from "@/lib/use-assistant";
import { assistantUi, useAssistantUi } from "@/lib/assistant-ui";
import { AssistantMessage, ThinkingMessage } from "./AssistantMessage";

const SUGGESTIONS = [
  "How am I doing today?",
  "Summarize Rob Adam",
  "Draft a follow-up text to Michael Scott",
  "Plan my morning",
];

export default function AssistantPanel({ width = 420 }: { width?: number } = {}) {
  const ui = useAssistantUi();
  const {
    messages,
    pendingThinking,
    error,
    isConnected,
    isConnecting,
    isSpeaking,
    isMuted,
    setMuted,
    sendText,
    startVoice,
    stop,
  } = useAssistant();

  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sendTextRef = useRef(sendText);
  const startVoiceRef = useRef(startVoice);
  sendTextRef.current = sendText;
  startVoiceRef.current = startVoice;
  const prevOpenRef = useRef(ui.open);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, pendingThinking]);

  // Honor pending first message + auto-start when opened from outside
  useEffect(() => {
    if (!ui.open) return;
    if (ui.tab === "voice" && ui.autoStartVoice) {
      assistantUi.consumeAutoStartVoice();
      const first = assistantUi.consumeFirstMessage();
      void startVoiceRef.current({ firstMessage: first ?? undefined });
    } else if (ui.tab === "chat") {
      const first = assistantUi.consumeFirstMessage();
      if (first) void sendTextRef.current(first);
    }
  }, [ui.open, ui.tab, ui.autoStartVoice]);

  // Stop voice if the panel closes
  useEffect(() => {
    if (prevOpenRef.current && !ui.open) {
      stop();
    }
    prevOpenRef.current = ui.open;
  }, [ui.open, stop]);

  const submit = () => {
    if (!draft.trim()) return;
    sendText(draft);
    setDraft("");
  };

  return (
    <>
      {/* Docked panel — pushes layout, no overlay/backdrop */}
      <aside
        className={`fixed top-14 right-0 bottom-0 z-40 bg-white border-l border-neutral-200 transition-transform duration-300 ease-out flex flex-col ${
          ui.open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: `${width}px` }}
        aria-hidden={!ui.open}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-full overflow-hidden">
              <div className="aurora-orb absolute inset-0" />
              <div className="absolute inset-[2px] rounded-full bg-white flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
              </div>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-neutral-900">
                Lofty Assistant
              </p>
              <p className="text-[11px] text-neutral-500">
                {isConnected
                  ? isSpeaking
                    ? "Speaking…"
                    : "Listening"
                  : isConnecting
                  ? "Connecting…"
                  : "Ready"}
              </p>
            </div>
          </div>
          <button onClick={() => assistantUi.close()} className="btn-icon" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Tabs */}
        <div className="px-4 pt-3 shrink-0">
          <div className="inline-flex p-1 rounded-full bg-neutral-100 text-xs font-medium">
            <button
              onClick={() => assistantUi.setTab("chat")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                ui.tab === "chat" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Chat
            </button>
            <button
              onClick={() => assistantUi.setTab("voice")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                ui.tab === "voice" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500"
              }`}
            >
              <AudioLines className="w-3.5 h-3.5" /> Voice
            </button>
          </div>
        </div>

        {/* Body */}
        {ui.tab === "chat" ? (
          <ChatBody
            scrollRef={scrollRef}
            messages={messages}
            pendingThinking={pendingThinking}
            error={error}
            onSuggestion={(s) => sendText(s)}
            draft={draft}
            setDraft={setDraft}
            submit={submit}
          />
        ) : (
          <VoiceBody
            isConnected={isConnected}
            isConnecting={isConnecting}
            isSpeaking={isSpeaking}
            isMuted={isMuted}
            setMuted={setMuted}
            startVoice={startVoice}
            stop={stop}
            messages={messages}
            error={error}
          />
        )}
      </aside>
    </>
  );
}

function ChatBody({
  scrollRef,
  messages,
  pendingThinking,
  error,
  onSuggestion,
  draft,
  setDraft,
  submit,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  messages: ReturnType<typeof useAssistant>["messages"];
  pendingThinking: boolean;
  error: string | null;
  onSuggestion: (s: string) => void;
  draft: string;
  setDraft: (s: string) => void;
  submit: () => void;
}) {
  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-thin">
        {messages.length === 0 && !pendingThinking && (
          <div className="text-center py-8">
            <div className="relative w-12 h-12 mx-auto rounded-full overflow-hidden mb-3">
              <div className="aurora-orb absolute inset-0" />
              <div className="absolute inset-[3px] rounded-full bg-white flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-neutral-900" />
              </div>
            </div>
            <p className="text-sm font-semibold text-neutral-900 tracking-tight">
              How can I help, James?
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              I can summarize leads, draft messages, schedule appointments, and plan your day.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => onSuggestion(s)} className="chip">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <AssistantMessage key={m.id} msg={m} />
        ))}
        {pendingThinking && <ThinkingMessage />}

        {error && (
          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
      </div>

      <div className="px-3 pb-3 pt-2 border-t border-neutral-100 shrink-0">
        <div className="flex items-end gap-2 rounded-2xl border border-neutral-200 px-3 py-2 focus-within:border-neutral-900 transition-colors">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask anything…"
            rows={1}
            className="flex-1 resize-none text-sm focus:outline-none placeholder:text-neutral-400 bg-transparent max-h-32"
          />
          <button
            onClick={submit}
            disabled={!draft.trim()}
            className="btn-primary disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none px-3 py-2"
            aria-label="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-neutral-400 mt-1.5 text-center">
          Lofty AI can take actions only after you approve them.
        </p>
      </div>
    </>
  );
}

function VoiceBody({
  isConnected,
  isConnecting,
  isSpeaking,
  isMuted,
  setMuted,
  startVoice,
  stop,
  messages,
  error,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  setMuted: (m: boolean) => void;
  startVoice: (opts?: { firstMessage?: string }) => Promise<boolean>;
  stop: () => void;
  messages: ReturnType<typeof useAssistant>["messages"];
  error: string | null;
}) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const lastAgent = [...messages].reverse().find((m) => m.role === "agent");

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* Aura orb — no hard edges, pure blurred layered gradients */}
        <div
          className="relative mb-6 flex items-center justify-center"
          style={{ width: "200px", height: "200px" }}
        >
          {/* Far outer halo — very wide and soft */}
          <div
            className="absolute"
            style={{
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(20,40,200,0.28) 0%, rgba(56,100,255,0.14) 45%, transparent 72%)",
              filter: "blur(14px)",
              animation: isSpeaking ? "orb-breathe 1.2s ease-in-out infinite" : "orb-breathe 4s ease-in-out infinite",
            }}
          />
          {/* Mid aura blob 1 — drifting ellipse */}
          <div
            className="absolute"
            style={{
              width: "160px",
              height: "140px",
              borderRadius: "60% 40% 55% 45% / 50% 60% 40% 50%",
              background: "radial-gradient(ellipse at 40% 60%, rgba(18,40,220,0.75) 0%, rgba(56,120,255,0.45) 40%, rgba(100,180,255,0.15) 70%, transparent 90%)",
              filter: "blur(18px)",
              opacity: isSpeaking ? 0.95 : 0.65,
              transition: "opacity 600ms ease",
              animation: isSpeaking ? "orb-spin 2.4s linear infinite" : "orb-spin 9s linear infinite",
            }}
          />
          {/* Mid aura blob 2 — counter-drifting, light-blue accent */}
          <div
            className="absolute"
            style={{
              width: "130px",
              height: "150px",
              borderRadius: "45% 55% 40% 60% / 55% 45% 60% 40%",
              background: "radial-gradient(ellipse at 60% 40%, rgba(100,180,255,0.7) 0%, rgba(50,100,240,0.45) 40%, rgba(20,40,200,0.2) 70%, transparent 90%)",
              filter: "blur(8px)",
              opacity: isSpeaking ? 0.9 : 0.6,
              transition: "opacity 600ms ease",
              animation: isSpeaking ? "orb-spin-rev 1.8s linear infinite" : "orb-spin-rev 11s linear infinite",
            }}
          />
          {/* Inner core glow — brightest center */}
          <div
            className="absolute"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(160,210,255,0.9) 0%, rgba(60,110,255,0.65) 40%, transparent 75%)",
              filter: "blur(18px)",
              animation: isSpeaking ? "orb-breathe 0.9s ease-in-out infinite" : "orb-breathe 3.5s ease-in-out infinite",
            }}
          />
        </div>

        <p className="text-sm font-semibold text-neutral-900 tracking-tight">
          {isConnected
            ? isSpeaking
              ? "Lofty is speaking…"
              : "I'm listening"
            : isConnecting
            ? "Connecting…"
            : "Tap start to talk"}
        </p>

        <div className="mt-6 w-full max-w-sm space-y-3">
          {lastUser && (
            <div className="text-xs text-neutral-500">
              <span className="font-semibold text-neutral-700">You: </span>
              {lastUser.text}
            </div>
          )}
          {lastAgent && (
            <div className="text-sm text-neutral-900 leading-relaxed">{lastAgent.text}</div>
          )}
          {error && (
            <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4">
        {isConnected ? (
          <>
            <button
              onClick={() => setMuted(!isMuted)}
              className={`btn-ghost ${isMuted ? "border-neutral-900" : ""}`}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isMuted ? "Muted" : "Mic on"}
            </button>
            <button onClick={stop} className="btn-primary">
              <Square className="w-3.5 h-3.5" />
              End call
            </button>
          </>
        ) : (
          <button
            onClick={() => startVoice()}
            disabled={isConnecting}
            className="btn-primary disabled:opacity-50"
          >
            <Mic className="w-3.5 h-3.5" />
            {isConnecting ? "Connecting…" : "Start voice"}
          </button>
        )}
      </div>
    </div>
  );
}
