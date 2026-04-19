"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnthropicMessage,
  AnthropicContentBlock,
} from "@/lib/claude";
import {
  AppointmentProposal,
  AosToolName,
  DraftedEmail,
  runAosTool,
} from "@/lib/aos-tools";
import { dashboardActions } from "@/lib/store";
import MessageBubble from "./MessageBubble";
import ThinkingTimeline, { ThinkingStep } from "./ThinkingTimeline";
import LeadCardsReply from "./LeadCardsReply";
import EmailDraftCard from "./EmailDraftCard";
import AppointmentProposalCard from "./AppointmentProposalCard";
import SimulateReplyButton from "./SimulateReplyButton";
import ConnectorsPanel from "./ConnectorsPanel";
import Composer from "./Composer";

// ---------- UI message model (separate from Anthropic transcript) ----------

type RichBlock =
  | { kind: "leads"; leads: LeadSummary[] }
  | {
      kind: "email_draft";
      toolUseId: string;
      draft: DraftedEmail;
      resolved?: "sent" | "discarded";
      messageId?: string;
    }
  | {
      kind: "appointment";
      toolUseId: string;
      proposal: AppointmentProposal;
      resolved?: "created" | "discarded";
    };

type LeadSummary = {
  id: string;
  name: string;
  source: string;
  score: number;
  tags: string[];
  priority: string;
};

interface UiMessage {
  id: string;
  role: "user" | "agent";
  text?: string;
  streaming?: boolean;
  steps?: ThinkingStep[];
  blocks?: RichBlock[];
}

const SUGGESTIONS = [
  "Show me the leads for today",
  "Send Maria a follow up",
  "What's on my plate today?",
];

let uidCounter = 0;
const uid = (p: string) => `${p}_${++uidCounter}_${Date.now().toString(36)}`;

// ---------- Pending confirmations registry ----------
// When Claude asks send_email or propose_appointment, the tool execution
// awaits a Promise that the UI resolves when the user clicks Send/Confirm.
type EmailResolver = (
  v: { decision: "sent"; messageId: string } | { decision: "discarded" }
) => void;
type ApptResolver = (
  v: { decision: "created"; eventId: string } | { decision: "discarded" }
) => void;

export default function AosChat() {
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: uid("m"),
      role: "agent",
      text: "I'm AOS — your real-estate operating system. Ask me to surface today's leads, draft a follow-up, or just say what you want to get done.",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLeadName, setLastLeadName] = useState<string>("");
  const transcriptRef = useRef<AnthropicMessage[]>([]);
  const emailResolversRef = useRef<Record<string, EmailResolver>>({});
  const apptResolversRef = useRef<Record<string, ApptResolver>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on message change
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // ---------- Helpers to mutate the active agent message ----------
  const updateLastAgent = useCallback(
    (mutator: (m: UiMessage) => UiMessage) => {
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i--) {
          if (next[i].role === "agent") {
            next[i] = mutator(next[i]);
            break;
          }
        }
        return next;
      });
    },
    []
  );

  const ensureFreshAgentMessage = useCallback(() => {
    const id = uid("m");
    setMessages((prev) => [
      ...prev,
      { id, role: "agent", text: "", streaming: true, steps: [], blocks: [] },
    ]);
  }, []);

  // ---------- Run one streaming turn ----------
  const runTurn = useCallback(async () => {
    setBusy(true);
    setError(null);
    ensureFreshAgentMessage();

    const res = await fetch("/api/aos/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: transcriptRef.current }),
    });

    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => "");
      setError(`Chat failed: ${res.status} ${t}`);
      updateLastAgent((m) => ({ ...m, streaming: false }));
      setBusy(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // Per-turn assistant content blocks accumulator
    const assistantBlocks: AnthropicContentBlock[] = [];
    let currentText = "";
    const pendingToolUses: { id: string; name: string; input: unknown }[] = [];

    const flushSseChunk = (raw: string) => {
      const lines = raw.split("\n");
      let event: string | null = null;
      let dataStr = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
      }
      if (!event) return;
      let data: Record<string, unknown> = {};
      try {
        data = dataStr ? JSON.parse(dataStr) : {};
      } catch {}

      switch (event) {
        case "text": {
          const delta = String(data.delta ?? "");
          currentText += delta;
          updateLastAgent((m) => ({ ...m, text: (m.text ?? "") + delta }));
          break;
        }
        case "thinking_step": {
          const step: ThinkingStep = {
            id: String(data.id ?? uid("s")),
            label: String(data.label ?? "…"),
            status: (data.status as ThinkingStep["status"]) ?? "running",
          };
          updateLastAgent((m) => {
            const steps = m.steps ? [...m.steps] : [];
            // Mark any previous running steps as done
            steps.forEach((s, i) => {
              if (s.status === "running") steps[i] = { ...s, status: "done" };
            });
            steps.push(step);
            return { ...m, steps };
          });
          break;
        }
        case "tool_use": {
          pendingToolUses.push({
            id: String(data.id),
            name: String(data.name),
            input: data.input,
          });
          break;
        }
        case "stop":
        case "done":
          break;
        case "error":
          setError(String((data as { message?: string }).message ?? "Unknown error"));
          break;
      }
    };

    // Pump SSE
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const raw = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        flushSseChunk(raw);
      }
    }

    // Finalize text styling
    updateLastAgent((m) => {
      const steps = (m.steps ?? []).map((s) =>
        s.status === "running" ? { ...s, status: "done" as const } : s
      );
      return { ...m, streaming: false, steps };
    });

    // Append assistant message to transcript
    if (currentText) assistantBlocks.push({ type: "text", text: currentText });
    for (const tu of pendingToolUses) {
      assistantBlocks.push({
        type: "tool_use",
        id: tu.id,
        name: tu.name,
        input: tu.input ?? {},
      });
    }
    if (assistantBlocks.length > 0) {
      transcriptRef.current.push({
        role: "assistant",
        content: assistantBlocks,
      });
    }

    // ---------- Execute tools client-side (may await user confirmation) ----------
    if (pendingToolUses.length > 0) {
      const toolResults: AnthropicContentBlock[] = [];
      for (const tu of pendingToolUses) {
        const result = await runAosTool(
          tu.name as AosToolName,
          (tu.input as Record<string, unknown>) ?? {},
          {
            awaitEmailConfirmation: (draft) =>
              new Promise((resolve) => {
                // Push the draft as a rich block onto the agent message, store resolver
                const pkg: { id: string; resolver: EmailResolver } = {
                  id: tu.id,
                  resolver: resolve,
                };
                emailResolversRef.current[tu.id] = pkg.resolver;
                updateLastAgent((m) => ({
                  ...m,
                  blocks: [
                    ...(m.blocks ?? []),
                    { kind: "email_draft", toolUseId: tu.id, draft },
                  ],
                }));
              }),
            awaitAppointmentConfirmation: (proposal) =>
              new Promise((resolve) => {
                apptResolversRef.current[tu.id] = resolve;
                updateLastAgent((m) => ({
                  ...m,
                  blocks: [
                    ...(m.blocks ?? []),
                    { kind: "appointment", toolUseId: tu.id, proposal },
                  ],
                }));
              }),
          }
        );

        // Render lead cards after list_leads_today
        if (tu.name === "list_leads_today") {
          try {
            const parsed = JSON.parse(result.content) as {
              leads: LeadSummary[];
            };
            updateLastAgent((m) => ({
              ...m,
              blocks: [
                ...(m.blocks ?? []),
                { kind: "leads", leads: parsed.leads },
              ],
            }));
          } catch {}
        }

        // Render email draft card immediately after draft_followup_email (BUGFIX)
        if (tu.name === "draft_followup_email") {
          try {
            const parsed = JSON.parse(result.content) as {
              drafted?: boolean;
              to?: string;
              subject?: string;
              body?: string;
              lead_name?: string;
            };
            if (parsed.drafted && parsed.to && parsed.subject && parsed.body) {
              const draft: DraftedEmail = {
                to: parsed.to,
                subject: parsed.subject,
                body: parsed.body,
                lead_name: parsed.lead_name,
              };
              // Store resolver so Send button works exactly like send_email flow
              const resolverPlaceholder: EmailResolver = () => {};
              emailResolversRef.current[tu.id] = resolverPlaceholder;
              updateLastAgent((m) => ({
                ...m,
                blocks: [
                  ...(m.blocks ?? []),
                  { kind: "email_draft", toolUseId: tu.id, draft },
                ],
              }));
            }
          } catch {}
        }

        // Mark thinking step as done
        updateLastAgent((m) => {
          const steps = (m.steps ?? []).map((s) =>
            s.id === tu.id ? { ...s, status: "done" as const } : s
          );
          return { ...m, steps };
        });

        toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: result.content,
          is_error: result.is_error,
        });
      }

      transcriptRef.current.push({
        role: "user",
        content: toolResults,
      });

      // Continue the loop with another model call
      await runTurn();
      return;
    }

    setBusy(false);
  }, [ensureFreshAgentMessage, updateLastAgent]);

  // ---------- Public actions ----------
  const sendUserText = useCallback(
    (text: string) => {
      setMessages((prev) => [
        ...prev,
        { id: uid("m"), role: "user", text },
      ]);
      transcriptRef.current.push({ role: "user", content: text });
      runTurn();
    },
    [runTurn]
  );

  const sendInboundEmailReply = useCallback(
    ({ leadName, replyText }: { leadName: string; replyText: string }) => {
      setLastLeadName(leadName);
      const wrapped = `[Inbound email reply from ${leadName}]\n\n${replyText}`;
      setMessages((prev) => [
        ...prev,
        { id: uid("m"), role: "user", text: wrapped },
      ]);
      transcriptRef.current.push({ role: "user", content: wrapped });
      runTurn();
    },
    [runTurn]
  );

  // ---------- Email draft confirmation ----------
  const handleEmailSend = useCallback(
    async (toolUseId: string, finalDraft: DraftedEmail) => {
      const res = await fetch("/api/google/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalDraft),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Send failed (${res.status})`);
      }
      const j = await res.json();
      const messageId = String(j.messageId ?? "");
      updateLastAgent((m) => ({
        ...m,
        blocks: (m.blocks ?? []).map((b) =>
          b.kind === "email_draft" && b.toolUseId === toolUseId
            ? { ...b, resolved: "sent", messageId, draft: finalDraft }
            : b
        ),
      }));
      const resolver = emailResolversRef.current[toolUseId];
      if (resolver) {
        resolver({ decision: "sent", messageId });
        delete emailResolversRef.current[toolUseId];
      }
    },
    [updateLastAgent]
  );

  const handleEmailDiscard = useCallback(
    (toolUseId: string) => {
      updateLastAgent((m) => ({
        ...m,
        blocks: (m.blocks ?? []).map((b) =>
          b.kind === "email_draft" && b.toolUseId === toolUseId
            ? { ...b, resolved: "discarded" }
            : b
        ),
      }));
      const resolver = emailResolversRef.current[toolUseId];
      if (resolver) {
        resolver({ decision: "discarded" });
        delete emailResolversRef.current[toolUseId];
      }
    },
    [updateLastAgent]
  );

  // ---------- Appointment confirmation ----------
  const handleAppointmentConfirm = useCallback(
    async (toolUseId: string, proposal: AppointmentProposal) => {
      const res = await fetch("/api/google/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: `Meeting with ${proposal.person}`,
          description: proposal.notes,
          location: proposal.location,
          start: proposal.start_iso,
          end: proposal.end_iso,
        }),
      });
      let eventId = "";
      if (res.ok) {
        const j = await res.json();
        eventId = String(j.event?.id ?? "");
      }
      // Always mirror into Lofty store too
      const startStr = new Date(proposal.start_iso).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      const endStr = new Date(proposal.end_iso).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      dashboardActions.addAppointment({
        person: proposal.person,
        time: `${startStr} – ${endStr}`,
        location: proposal.location,
      });

      updateLastAgent((m) => ({
        ...m,
        blocks: (m.blocks ?? []).map((b) =>
          b.kind === "appointment" && b.toolUseId === toolUseId
            ? { ...b, resolved: "created" }
            : b
        ),
      }));
      const resolver = apptResolversRef.current[toolUseId];
      if (resolver) {
        resolver({
          decision: "created",
          eventId: eventId || `local_${Date.now()}`,
        });
        delete apptResolversRef.current[toolUseId];
      }
    },
    [updateLastAgent]
  );

  const handleAppointmentDiscard = useCallback(
    (toolUseId: string) => {
      updateLastAgent((m) => ({
        ...m,
        blocks: (m.blocks ?? []).map((b) =>
          b.kind === "appointment" && b.toolUseId === toolUseId
            ? { ...b, resolved: "discarded" }
            : b
        ),
      }));
      const resolver = apptResolversRef.current[toolUseId];
      if (resolver) {
        resolver({ decision: "discarded" });
        delete apptResolversRef.current[toolUseId];
      }
    },
    [updateLastAgent]
  );

  // ---------- Render ----------
  return (
    <div className="relative flex flex-col h-[calc(100vh-56px)]">
      {/* Scrollable messages — bottom padding keeps last message above the floating bar */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-thin px-6 md:px-10 pt-6 pb-48">
        <div className="max-w-3xl mx-auto space-y-5">
          {messages.map((m) => (
            <div key={m.id}>
              <MessageBubble
                role={m.role}
                text={m.role === "user" ? m.text : m.text ?? ""}
                streaming={m.streaming && (m.text?.length ?? 0) > 0}
              >
                {m.role === "agent" && (
                  <div className="space-y-3">
                    {m.steps && m.steps.length > 0 && (
                      <ThinkingTimeline steps={m.steps} />
                    )}
                    {(m.blocks ?? []).map((b, i) => {
                      if (b.kind === "leads") {
                        return (
                          <LeadCardsReply
                            key={i}
                            leads={b.leads}
                            onFollowUp={(name) => {
                              setLastLeadName(name);
                              sendUserText(`Send a follow up email to ${name}`);
                            }}
                            onCall={(name) => {
                              setLastLeadName(name);
                              sendUserText(`Create a call follow-up task for ${name} and tell me the best outreach angle.`);
                            }}
                          />
                        );
                      }
                      if (b.kind === "email_draft") {
                        return (
                          <EmailDraftCard
                            key={i}
                            draft={b.draft}
                            resolved={b.resolved}
                            sentMessageId={b.messageId}
                            onSend={(final) => handleEmailSend(b.toolUseId, final)}
                            onDiscard={() => handleEmailDiscard(b.toolUseId)}
                          />
                        );
                      }
                      if (b.kind === "appointment") {
                        return (
                          <AppointmentProposalCard
                            key={i}
                            proposal={b.proposal}
                            resolved={b.resolved}
                            onConfirm={(final) =>
                              handleAppointmentConfirm(b.toolUseId, final)
                            }
                            onDiscard={() =>
                              handleAppointmentDiscard(b.toolUseId)
                            }
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </MessageBubble>
            </div>
          ))}
          {error && (
            <div className="text-[12px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Bottom cloudy fade — soft white gradient over the lower 10% of the screen */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.82) 28%, rgba(255,255,255,0.45) 58%, rgba(255,255,255,0) 100%), radial-gradient(70% 90% at 50% 100%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.36) 52%, rgba(255,255,255,0) 100%)",
        }}
      />

      {/* Floating composer — absolutely positioned, transparent background */}
      <div className="absolute bottom-8 left-0 right-0 pointer-events-none">
        <div className="max-w-3xl mx-auto px-6 md:px-10 pb-6 pointer-events-auto">
          <div className="flex items-center gap-2 mb-2">
            <ConnectorsPanel />
            <SimulateReplyButton
              defaultLeadName={lastLeadName}
              disabled={busy}
              onSubmit={sendInboundEmailReply}
            />
          </div>
          <Composer
            busy={busy}
            onSend={sendUserText}
            suggestions={SUGGESTIONS}
            onSuggestion={sendUserText}
          />
        </div>
      </div>
    </div>
  );
}
