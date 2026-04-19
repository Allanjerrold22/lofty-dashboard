"use client";

import {
  dashboardActions,
  findLeadByName,
  findTaskByTitle,
  getAllTasks,
  getDashboardStats,
  listToday,
} from "./store";
import { requestPermission } from "./permission-bus";

type ToolFn = (params: Record<string, unknown>) => Promise<string> | string;

const ok = (data: unknown) => JSON.stringify({ ok: true, ...((typeof data === "object" && data) || { data }) });
const fail = (reason: string) => JSON.stringify({ ok: false, error: reason });

export const clientTools: Record<string, ToolFn> = {
  // ---------- Read-only (auto) ----------
  get_dashboard_stats: () => ok({ stats: getDashboardStats() }),

  list_today: ({ kind }) => {
    if (kind !== "tasks" && kind !== "appointments" && kind !== "leads") {
      return fail("kind must be tasks | appointments | leads");
    }
    return ok({ kind, items: listToday(kind) });
  },

  summarize_lead: ({ name }) => {
    if (typeof name !== "string") return fail("name is required");
    const lead = findLeadByName(name);
    if (!lead) return fail(`No lead matching "${name}"`);
    return ok({ lead });
  },

  navigate_to: ({ section }) => {
    if (typeof section !== "string") return fail("section is required");
    const el = typeof document !== "undefined" ? document.getElementById(`section-${section}`) : null;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    dashboardActions.highlight(section);
    return ok({ navigated: section });
  },

  // ---------- Side-effecting (require approval) ----------
  create_task: async (params) => {
    const decision = await requestPermission({
      tool: "create_task",
      title: "Create a new task",
      description: "The assistant wants to add this task to your list.",
      params: {
        title: String(params.title ?? "Untitled task"),
        contact: String(params.contact ?? ""),
        time: String(params.time ?? "Anytime"),
      },
      editable: { title: "string", contact: "string", time: "string" },
    });
    if (!decision.approved) return fail("User cancelled");
    const id = dashboardActions.addTask({
      title: String(decision.params.title),
      contact: String(decision.params.contact),
      time: String(decision.params.time),
    });
    return ok({ task_id: id });
  },

  complete_task: async (params) => {
    const query = String(params.task_query ?? params.task_id ?? "");
    if (!query) return fail("task_query or task_id required");
    const task = findTaskByTitle(query) ?? getAllTasks().find((t) => t.id === query);
    if (!task) return fail(`No task matching "${query}"`);
    const decision = await requestPermission({
      tool: "complete_task",
      title: "Mark task complete",
      description: `${task.title} · ${task.contact}`,
      params: { task_id: task.id, title: task.title },
    });
    if (!decision.approved) return fail("User cancelled");
    dashboardActions.completeTask(task.id);
    return ok({ task_id: task.id });
  },

  draft_message: async (params) => {
    const channel = params.channel === "email" ? "email" : "sms";
    const decision = await requestPermission({
      tool: "draft_message",
      title: channel === "sms" ? "Send a text message" : "Send an email",
      description: "Review and edit the message before sending.",
      params: {
        contact: String(params.contact ?? ""),
        channel,
        body: String(params.body ?? ""),
      },
      editable: { contact: "string", body: "text" },
    });
    if (!decision.approved) return fail("User cancelled");
    dashboardActions.recordSentMessage({
      contact: String(decision.params.contact),
      channel: decision.params.channel as "sms" | "email",
      body: String(decision.params.body),
    });
    return ok({ sent: true });
  },

  schedule_appointment: async (params) => {
    const decision = await requestPermission({
      tool: "schedule_appointment",
      title: "Schedule an appointment",
      description: "Add this to your calendar?",
      params: {
        person: String(params.person ?? params.contact ?? ""),
        date: String(params.date ?? "Today"),
        time: String(params.time ?? ""),
        location: String(params.location ?? ""),
      },
      editable: { person: "string", date: "string", time: "string", location: "string" },
    });
    if (!decision.approved) return fail("User cancelled");
    const id = dashboardActions.addAppointment({
      person: String(decision.params.person),
      date: String(decision.params.date),
      time: String(decision.params.time),
      location: String(decision.params.location),
    });
    return ok({ appointment_id: id });
  },

  update_lead_priority: async (params) => {
    const name = String(params.lead_name ?? params.name ?? "");
    const priority = (String(params.priority ?? "high") as "low" | "normal" | "high");
    const lead = findLeadByName(name);
    if (!lead) return fail(`No lead matching "${name}"`);
    const decision = await requestPermission({
      tool: "update_lead_priority",
      title: "Update lead priority",
      description: `Set ${lead.name} to ${priority}.`,
      params: { lead_id: lead.id, lead_name: lead.name, priority },
    });
    if (!decision.approved) return fail("User cancelled");
    dashboardActions.updateLeadPriority(lead.id, priority);
    return ok({ lead_id: lead.id, priority });
  },
};

export const toolDescriptions = [
  { name: "get_dashboard_stats", purpose: "Get current KPIs for the dashboard." },
  { name: "list_today", purpose: "List today's tasks, appointments, or leads." },
  { name: "summarize_lead", purpose: "Look up a lead by name and return their profile." },
  { name: "navigate_to", purpose: "Scroll the user to a section: pipeline | tasks | appointments | leads | transactions." },
  { name: "create_task", purpose: "Create a new task (requires user approval)." },
  { name: "complete_task", purpose: "Mark a task complete (requires user approval)." },
  { name: "draft_message", purpose: "Draft an SMS or email to a contact (requires user approval before send)." },
  { name: "schedule_appointment", purpose: "Add an appointment (requires user approval)." },
  { name: "update_lead_priority", purpose: "Change a lead's priority (requires user approval)." },
];
