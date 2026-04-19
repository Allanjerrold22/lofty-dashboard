"use client";

import { Phone, MessageSquare, Mail, MoreHorizontal, Check, ChevronRight } from "lucide-react";
import { dashboardActions, useDashboardStore } from "@/lib/store";

const taskCategories = [
  { label: "Call", count: 4, icon: Phone },
  { label: "Text", count: 2, icon: MessageSquare },
  { label: "Email", count: 1, icon: Mail },
  { label: "Other", count: 3, icon: MoreHorizontal },
];

export default function TasksCard() {
  const tasks = useDashboardStore((s) => s.tasks);
  const highlighted = useDashboardStore((s) => s.highlightedSection) === "tasks";

  return (
    <div
      id="section-tasks"
      className={`card p-5 transition-shadow ${
        highlighted ? "ring-2 ring-neutral-900 shadow-lg" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-neutral-900 tracking-tight">
          Today&apos;s Tasks
        </h3>
        <button className="text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-0.5">
          View all <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {taskCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.label}
              className="rounded-xl border border-neutral-200/80 p-2 text-center hover:border-neutral-900 transition-colors cursor-pointer"
            >
              <div className="text-base font-semibold text-neutral-900 tabular">
                {cat.count}
              </div>
              <div className="flex items-center justify-center gap-1 mt-0.5 text-neutral-500">
                <Icon className="w-3 h-3" />
                <span className="text-[10px] font-medium">{cat.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <ul className="space-y-1">
        {tasks.slice(0, 5).map((task) => (
          <li
            key={task.id}
            className={`flex items-start gap-2.5 py-2 border-b border-neutral-100 last:border-0 ${
              task.done ? "opacity-50" : ""
            }`}
          >
            <button
              onClick={() => !task.done && dashboardActions.completeTask(task.id)}
              className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                task.done
                  ? "bg-neutral-900 border-neutral-900"
                  : "border-neutral-300 hover:border-neutral-900"
              }`}
              aria-label="Toggle task"
            >
              {task.done && <Check className="w-2.5 h-2.5 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={`text-xs font-medium text-neutral-900 truncate ${
                  task.done ? "line-through" : ""
                }`}
              >
                {task.title}
              </p>
              <p className="text-[11px] text-neutral-400">{task.contact}</p>
            </div>
            <span className="text-[11px] font-medium text-neutral-500 shrink-0">
              {task.time}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
