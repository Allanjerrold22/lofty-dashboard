"use client";

import { useSyncExternalStore } from "react";

export type Task = {
  id: string;
  title: string;
  contact: string;
  time: string;
  done: boolean;
  priority?: "low" | "normal" | "high";
};

export type Appointment = {
  id: string;
  person: string;
  time: string;
  note: string;
  done: boolean;
};

export type Lead = {
  id: string;
  name: string;
  tags: string[];
  source: string;
  score: number;
  scoreColor: string;
  priority?: "low" | "normal" | "high";
};

export type Transaction = {
  id: string;
  address: string;
  warning: string;
  type: "deadline" | "caution";
};

export type Toast = {
  id: string;
  title: string;
  description?: string;
  tone: "success" | "info" | "warning";
};

export type DashboardState = {
  tasks: Task[];
  appointments: Appointment[];
  leads: Lead[];
  transactions: Transaction[];
  highlightedSection: string | null;
  toasts: Toast[];
};

const initialState: DashboardState = {
  tasks: [
    { id: "t1", title: "Call back for more information", contact: "Rob Adams", time: "10:00 AM", done: false, priority: "high" },
    { id: "t2", title: "Call Back", contact: "James Adam", time: "Anytime", done: true, priority: "normal" },
    { id: "t3", title: "Spanish-speaking follow up", contact: "Michael Scott", time: "12:00 PM", done: false, priority: "normal" },
    { id: "t4", title: "Text contract reminder", contact: "Dav Smith", time: "2:00 PM", done: false, priority: "normal" },
  ],
  appointments: [
    { id: "a1", person: "William Johnson, Annie Campbell", time: "11:00 AM – 2:00 PM", note: "Discuss the showing details from last Friday.", done: false },
    { id: "a2", person: "Maria Lopez", time: "3:00 PM – 3:30 PM", note: "Quick call to align on offer terms.", done: false },
    { id: "a3", person: "Daniel Park", time: "4:00 PM – 5:00 PM", note: "Walkthrough at 87 Valencia ST.", done: true },
  ],
  leads: [
    { id: "l1", name: "Rob Adam", tags: ["Buyer", "Seller"], source: "Facebook Ads", score: 88, scoreColor: "bg-emerald-500", priority: "high" },
    { id: "l2", name: "Michael Scott", tags: ["Buyer"], source: "Website", score: 48, scoreColor: "bg-amber-500" },
    { id: "l3", name: "Jessica Philips", tags: ["Buyer", "Seller", "Investor"], source: "Website", score: 61, scoreColor: "bg-neutral-700" },
  ],
  transactions: [
    { id: "x1", address: "3931 Via Montalvo, Campbell, CA 95008", warning: "2 tasks near deadline", type: "deadline" },
    { id: "x2", address: "87 Valencia ST, Half Moon Bay, CA 94019", warning: "Escrow doc missing", type: "deadline" },
    { id: "x3", address: "2118 Thornridge Cir, Syracuse, CT 35624", warning: "Near offer date", type: "caution" },
    { id: "x4", address: "26096 Dougherty Pl, Carmel, CA 93923", warning: "Closing in 4 days", type: "caution" },
  ],
  highlightedSection: null,
  toasts: [],
};

let state: DashboardState = initialState;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function set(updater: (s: DashboardState) => DashboardState) {
  state = updater(state);
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const getSnapshot = () => state;
const getServerSnapshot = () => initialState;

export function useDashboardStore<T>(selector: (s: DashboardState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(initialState)
  );
}

export function useDashboardSnapshot() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

// ---------- DB hydration ----------
export function hydrateStore(data: {
  leads?: Lead[];
  tasks?: Task[];
  appointments?: Appointment[];
  transactions?: Transaction[];
}) {
  set((s) => ({
    ...s,
    ...(data.leads !== undefined ? { leads: data.leads as Lead[] } : {}),
    ...(data.tasks !== undefined ? { tasks: data.tasks as Task[] } : {}),
    ...(data.appointments !== undefined ? { appointments: data.appointments as Appointment[] } : {}),
    ...(data.transactions !== undefined ? { transactions: data.transactions as Transaction[] } : {}),
  }));
}

// ---------- Mutations ----------
// Fire-and-forget sync to InsForge (best-effort; doesn't block UI)
function syncToDb(path: string, method: "POST" | "PATCH", body: object) {
  if (typeof window === "undefined") return;
  fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => { /* silent – UI already updated optimistically */ });
}

export const dashboardActions = {
  addTask(input: { title: string; contact: string; time?: string; priority?: Task["priority"] }) {
    const task: Task = {
      id: uid("t"),
      title: input.title,
      contact: input.contact,
      time: input.time || "Anytime",
      done: false,
      priority: input.priority || "normal",
    };
    set((s) => ({ ...s, tasks: [task, ...s.tasks] }));
    pushToast({ title: "Task added", description: `${task.title} · ${task.contact}`, tone: "success" });
    syncToDb("/api/db/tasks", "POST", { title: task.title, contact: task.contact, time: task.time, priority: task.priority });
    return task.id;
  },

  completeTask(id: string) {
    set((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: true } : t)),
    }));
    pushToast({ title: "Task completed", tone: "success" });
    syncToDb("/api/db/tasks", "PATCH", { id, done: true });
  },

  reorderTasks(orderedIds: string[]) {
    set((s) => {
      const map = new Map(s.tasks.map((t) => [t.id, t] as const));
      const reordered = orderedIds.map((id) => map.get(id)).filter(Boolean) as Task[];
      const rest = s.tasks.filter((t) => !orderedIds.includes(t.id));
      return { ...s, tasks: [...reordered, ...rest] };
    });
  },

  addAppointment(input: { person: string; date?: string; time: string; location?: string }) {
    const apt: Appointment = {
      id: uid("a"),
      person: input.person,
      time: input.time,
      note: input.location ? `Meet at ${input.location}` : "Newly scheduled by AI assistant.",
      done: false,
    };
    set((s) => ({ ...s, appointments: [apt, ...s.appointments] }));
    pushToast({ title: "Appointment scheduled", description: `${apt.person} · ${apt.time}`, tone: "success" });
    syncToDb("/api/db/appointments", "POST", { person: apt.person, time: apt.time, note: apt.note });
    return apt.id;
  },

  updateLeadPriority(id: string, priority: Task["priority"]) {
    set((s) => ({
      ...s,
      leads: s.leads.map((l) => (l.id === id ? { ...l, priority } : l)),
    }));
    pushToast({ title: "Lead priority updated", tone: "info" });
    syncToDb("/api/db/leads", "PATCH", { id, priority });
  },

  highlight(section: string | null) {
    set((s) => ({ ...s, highlightedSection: section }));
    if (section) {
      setTimeout(() => set((s) => (s.highlightedSection === section ? { ...s, highlightedSection: null } : s)), 2400);
    }
  },

  recordSentMessage(input: { contact: string; channel: "sms" | "email"; body: string }) {
    pushToast({
      title: input.channel === "sms" ? "Text sent" : "Email sent",
      description: `To ${input.contact}`,
      tone: "success",
    });
    return { ok: true };
  },

  dismissToast(id: string) {
    set((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) }));
  },
};

function pushToast(t: Omit<Toast, "id">) {
  const id = uid("toast");
  set((s) => ({ ...s, toasts: [...s.toasts, { ...t, id }] }));
  setTimeout(() => dashboardActions.dismissToast(id), 4200);
}

// ---------- Selectors / read API for AI tools ----------
export function getDashboardStats() {
  const s = state;
  const totalTasks = s.tasks.length;
  const doneTasks = s.tasks.filter((t) => t.done).length;
  const hotLeads = s.leads.filter((l) => l.score >= 70).length;
  const dealsAtRisk = s.transactions.filter((t) => t.type === "deadline").length;

  return {
    new_leads_today: s.leads.length,
    hot_leads: hotLeads,
    active_pipeline_value_usd: 4_280_000,
    gci_mtd_usd: 38_500,
    tasks_total: totalTasks,
    tasks_done: doneTasks,
    tasks_done_pct: totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0,
    appointments_today: s.appointments.length,
    deals_at_risk: dealsAtRisk,
  };
}

export function findLeadByName(name: string): Lead | undefined {
  const lower = name.toLowerCase().trim();
  return state.leads.find((l) => l.name.toLowerCase().includes(lower));
}

export function findTaskByTitle(query: string): Task | undefined {
  const lower = query.toLowerCase().trim();
  return state.tasks.find((t) => t.title.toLowerCase().includes(lower) || t.contact.toLowerCase().includes(lower));
}

export function listToday(kind: "tasks" | "appointments" | "leads") {
  if (kind === "tasks") return state.tasks;
  if (kind === "appointments") return state.appointments;
  return state.leads;
}

export function getAllTasks(): Task[] {
  return state.tasks;
}

export function getAllAppointments(): Appointment[] {
  return state.appointments;
}

export function getAllLeads(): Lead[] {
  return state.leads;
}
