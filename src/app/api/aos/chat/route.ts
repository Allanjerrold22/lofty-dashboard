import { NextRequest } from "next/server";
import {
  AnthropicMessage,
  AnthropicTool,
  createMessageStream,
  isClaudeConfigured,
  parseAnthropicSse,
} from "@/lib/claude";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ---------- Tool catalog (schemas only; execution happens client-side) ----------

const TOOLS: AnthropicTool[] = [
  {
    name: "list_leads_today",
    description:
      "List today's new leads in the CRM. Use when the user asks about leads, who came in today, prospects to follow up with, etc. No arguments.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "draft_followup_email",
    description:
      "Draft a follow-up email for a lead. The drafted email is shown to the user for review and edit before sending. Use this BEFORE send_email.",
    input_schema: {
      type: "object",
      properties: {
        lead_name: { type: "string", description: "Full name of the lead" },
        intent: {
          type: "string",
          description:
            "Short purpose of the email, e.g. 'check in on listing they viewed', 'propose a showing time'.",
        },
        tone: {
          type: "string",
          enum: ["friendly", "professional", "warm"],
          description: "Optional tone hint, defaults to friendly.",
        },
      },
      required: ["lead_name", "intent"],
    },
  },
  {
    name: "send_email",
    description:
      "Actually send an email via the connected Gmail account. Only call this AFTER the user confirms a drafted email by clicking Send.",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string" },
        subject: { type: "string" },
        body: { type: "string" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "parse_reply_for_time",
    description:
      "Given the plain text of an email reply from a lead, extract the meeting time they propose and return ISO start/end timestamps. Returns null if no time found.",
    input_schema: {
      type: "object",
      properties: {
        reply_text: { type: "string" },
        lead_name: { type: "string" },
      },
      required: ["reply_text", "lead_name"],
    },
  },
  {
    name: "propose_appointment",
    description:
      "Propose adding a calendar appointment. Shows the user a confirmation card; do not assume it is created until you receive a tool_result.",
    input_schema: {
      type: "object",
      properties: {
        person: { type: "string" },
        start_iso: { type: "string", description: "ISO 8601 datetime" },
        end_iso: { type: "string", description: "ISO 8601 datetime" },
        location: { type: "string" },
        notes: { type: "string" },
      },
      required: ["person", "start_iso", "end_iso"],
    },
  },
];

const SYSTEM_PROMPT = `You are AOS, the agentic real-estate operating system for an agent named James.

You can call tools to read his CRM, draft + send emails through his connected Gmail, and book appointments on his Google Calendar.

Operating principles:
1. ALWAYS call list_leads_today when James asks about leads. Do not invent leads.
2. NEVER call send_email directly without first calling draft_followup_email and waiting for a confirmed tool_result. If the tool_result indicates the user discarded the draft, abort gracefully.
3. When James pastes or forwards an inbound email reply, call parse_reply_for_time. If a meeting time is found, immediately call propose_appointment.
4. Be concise. After tool calls, summarize what you did in one short sentence.
5. Refer to leads by first name once introduced.
6. Do not use Markdown formatting in user-facing text. Never output **bold**, bullet markers, backticks, or blockquotes (">"). Use plain sentences only.`;

// ---------- Route ----------

export async function POST(req: NextRequest) {
  if (!isClaudeConfigured) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY missing in .env.local" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  let payload: { messages: AnthropicMessage[] };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const upstream = await createMessageStream({
          system: SYSTEM_PROMPT,
          messages: payload.messages,
          tools: TOOLS,
          max_tokens: 1500,
        });

        // Track in-flight content blocks so we can assemble tool_use inputs.
        type Block =
          | { type: "text"; text: string }
          | { type: "tool_use"; id: string; name: string; jsonBuf: string };
        const blocks: Record<number, Block> = {};
        let stopReason: string | undefined;

        for await (const ev of parseAnthropicSse(upstream)) {
          switch (ev.type) {
            case "content_block_start": {
              const b = ev.content_block;
              if (!b) break;
              if (b.type === "text") {
                blocks[ev.index] = { type: "text", text: "" };
              } else if (b.type === "tool_use") {
                blocks[ev.index] = {
                  type: "tool_use",
                  id: b.id,
                  name: b.name,
                  jsonBuf: "",
                };
                send("thinking_step", {
                  id: b.id,
                  label: humanizeToolLabel(b.name),
                  status: "running",
                });
              }
              break;
            }
            case "content_block_delta": {
              const block = blocks[ev.index];
              if (!block || !ev.delta) break;
              if (block.type === "text" && ev.delta.type === "text_delta") {
                block.text += ev.delta.text;
                send("text", { delta: ev.delta.text });
              } else if (
                block.type === "tool_use" &&
                ev.delta.type === "input_json_delta"
              ) {
                block.jsonBuf += ev.delta.partial_json;
              }
              break;
            }
            case "content_block_stop": {
              const block = blocks[ev.index];
              if (block?.type === "tool_use") {
                let input: unknown = {};
                try {
                  input = block.jsonBuf ? JSON.parse(block.jsonBuf) : {};
                } catch {
                  // partial json, send as-is string for client to handle
                }
                send("tool_use", {
                  id: block.id,
                  name: block.name,
                  input,
                });
              }
              break;
            }
            case "message_delta": {
              stopReason = ev.delta?.stop_reason ?? stopReason;
              break;
            }
            case "message_stop": {
              send("stop", { stop_reason: stopReason ?? "end_turn" });
              send("done", {});
              controller.close();
              return;
            }
            case "error": {
              send("error", ev.error ?? {});
              controller.close();
              return;
            }
          }
        }

        send("done", {});
        controller.close();
      } catch (err) {
        send("error", { message: (err as Error).message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
      connection: "keep-alive",
    },
  });
}

function humanizeToolLabel(name: string): string {
  switch (name) {
    case "list_leads_today":
      return "Reading today's leads";
    case "draft_followup_email":
      return "Drafting follow-up email";
    case "send_email":
      return "Sending via Gmail";
    case "parse_reply_for_time":
      return "Reading the reply";
    case "propose_appointment":
      return "Proposing calendar event";
    default:
      return name.replace(/_/g, " ");
  }
}
