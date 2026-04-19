// Client-side execution of tools that the Claude AOS agent invokes.
// Some tools complete immediately (e.g. list_leads_today). Others (send_email,
// propose_appointment) require user confirmation in the UI before they finish;
// for those, the tool returns a "pending" sentinel and the UI resolves the
// promise when the user clicks Send / Confirm / Discard.

import { getAllLeads, Lead } from "@/lib/store";

export type AosToolName =
  | "list_leads_today"
  | "draft_followup_email"
  | "send_email"
  | "parse_reply_for_time"
  | "propose_appointment";

export interface DraftedEmail {
  to: string;
  subject: string;
  body: string;
  lead_name?: string;
}

export interface AppointmentProposal {
  person: string;
  start_iso: string;
  end_iso: string;
  location?: string;
  notes?: string;
}

export interface AosToolHandlers {
  // UI-driven confirmations. UI displays card and resolves with user's decision.
  awaitEmailConfirmation: (draft: DraftedEmail) => Promise<
    | { decision: "sent"; messageId: string }
    | { decision: "discarded" }
  >;
  awaitAppointmentConfirmation: (proposal: AppointmentProposal) => Promise<
    | { decision: "created"; eventId: string }
    | { decision: "discarded" }
  >;
}

/**
 * Make a fake email address from a lead name when none is on file.
 * Real production would pull from the CRM record.
 */
function fallbackEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  return `${slug}@example.com`;
}

export async function runAosTool(
  name: AosToolName,
  input: Record<string, unknown>,
  handlers: AosToolHandlers
): Promise<{ content: string; is_error?: boolean }> {
  switch (name) {
    case "list_leads_today": {
      const leads = getAllLeads().slice(0, 6);
      const summary = leads.map((l) => ({
        id: l.id,
        name: l.name,
        source: l.source,
        score: l.score,
        tags: l.tags,
        priority: l.priority ?? "normal",
      }));
      return { content: JSON.stringify({ count: leads.length, leads: summary }) };
    }

    case "draft_followup_email": {
      const leadName = String(input.lead_name ?? "");
      const intent = String(input.intent ?? "follow up");
      const tone = String(input.tone ?? "friendly");
      const lead: Lead | undefined = getAllLeads().find(
        (l) => l.name.toLowerCase() === leadName.toLowerCase()
      );
      const to = lead ? fallbackEmail(lead.name) : fallbackEmail(leadName);
      const firstName = leadName.split(" ")[0] || leadName;
      const subject = `Quick follow up`;
      const body = `Hi ${firstName},\n\nI wanted to ${intent.toLowerCase()}. ${
        tone === "professional"
          ? "When you have a moment, let me know what works for you."
          : "Just wanted to check in — happy to jump on a call whenever fits your schedule."
      }\n\nThanks,\nJames`;
      return {
        content: JSON.stringify({
          drafted: true,
          to,
          subject,
          body,
          lead_name: leadName,
        }),
      };
    }

    case "send_email": {
      const draft: DraftedEmail = {
        to: String(input.to ?? ""),
        subject: String(input.subject ?? ""),
        body: String(input.body ?? ""),
      };
      const decision = await handlers.awaitEmailConfirmation(draft);
      if (decision.decision === "discarded") {
        return {
          content: JSON.stringify({ sent: false, reason: "user_discarded" }),
        };
      }
      return {
        content: JSON.stringify({ sent: true, messageId: decision.messageId }),
      };
    }

    case "parse_reply_for_time": {
      // Cheap regex for an obvious meeting time. Real production would re-prompt Claude.
      const text = String(input.reply_text ?? "");
      const m = text.match(
        /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b[^\d]{0,12}(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i
      );
      if (!m) {
        return { content: JSON.stringify({ found: false }) };
      }
      const dayMap: Record<string, number> = {
        sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
      };
      const targetDow = dayMap[m[1].slice(0, 3).toLowerCase()];
      const hour12 = parseInt(m[2], 10);
      const minutes = m[3] ? parseInt(m[3], 10) : 0;
      const meridiem = (m[4] || (hour12 < 8 ? "pm" : "am")).toLowerCase();
      let hour = hour12 % 12;
      if (meridiem === "pm") hour += 12;

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const todayDow = today.getDay();
      let delta = (targetDow - todayDow + 7) % 7;
      if (delta === 0) delta = 7; // assume next week, not today
      const start = new Date(today);
      start.setDate(today.getDate() + delta);
      start.setHours(hour, minutes, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      return {
        content: JSON.stringify({
          found: true,
          start_iso: start.toISOString(),
          end_iso: end.toISOString(),
          lead_name: input.lead_name,
        }),
      };
    }

    case "propose_appointment": {
      const proposal: AppointmentProposal = {
        person: String(input.person ?? ""),
        start_iso: String(input.start_iso ?? ""),
        end_iso: String(input.end_iso ?? ""),
        location: input.location ? String(input.location) : undefined,
        notes: input.notes ? String(input.notes) : undefined,
      };
      const decision = await handlers.awaitAppointmentConfirmation(proposal);
      if (decision.decision === "discarded") {
        return {
          content: JSON.stringify({ created: false, reason: "user_discarded" }),
        };
      }
      return {
        content: JSON.stringify({ created: true, eventId: decision.eventId }),
      };
    }
  }
}
