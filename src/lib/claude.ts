// Lightweight Anthropic Messages API streaming wrapper.
// We avoid the official SDK so the route stays edge-friendly and the bundle stays small.

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5";
export const isClaudeConfigured = Boolean(ANTHROPIC_API_KEY);

export type AnthropicTextBlock = { type: "text"; text: string };
export type AnthropicToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: unknown;
};
export type AnthropicToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string;
  is_error?: boolean;
};
export type AnthropicContentBlock =
  | AnthropicTextBlock
  | AnthropicToolUseBlock
  | AnthropicToolResultBlock;

export type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

export interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface CreateMessageParams {
  system?: string;
  messages: AnthropicMessage[];
  tools?: AnthropicTool[];
  max_tokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

export async function createMessageStream(params: CreateMessageParams): Promise<Response> {
  if (!isClaudeConfigured) {
    throw new Error("ANTHROPIC_API_KEY missing in .env.local");
  }
  const body = {
    model: ANTHROPIC_MODEL,
    max_tokens: params.max_tokens ?? 1024,
    temperature: params.temperature ?? 0.4,
    system: params.system,
    messages: params.messages,
    tools: params.tools,
    stream: true,
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
    signal: params.signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text}`);
  }
  return res;
}

// ---------- SSE parsing ----------

export type ParsedAnthropicEvent =
  | { type: "message_start"; message: unknown }
  | { type: "content_block_start"; index: number; content_block: AnthropicContentBlock }
  | { type: "content_block_delta"; index: number; delta: { type: "text_delta"; text: string } | { type: "input_json_delta"; partial_json: string } }
  | { type: "content_block_stop"; index: number }
  | { type: "message_delta"; delta: { stop_reason?: string }; usage?: unknown }
  | { type: "message_stop" }
  | { type: "ping" }
  | { type: "error"; error?: unknown };

export async function* parseAnthropicSse(
  response: Response
): AsyncGenerator<ParsedAnthropicEvent> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE messages are delimited by a blank line.
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const lines = raw.split("\n");
      let event: string | null = null;
      let dataStr = "";
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataStr += line.slice(5).trim();
      }
      if (!event || !dataStr) continue;
      try {
        const parsed = JSON.parse(dataStr);
        yield { type: event, ...parsed } as ParsedAnthropicEvent;
      } catch {
        // skip malformed line
      }
    }
  }
}
