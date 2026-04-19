"use client";

import { useState } from "react";
import { EnvelopeSimpleOpen } from "@phosphor-icons/react";

interface Props {
  defaultLeadName?: string;
  onSubmit: (payload: { leadName: string; replyText: string }) => void;
  disabled?: boolean;
}

const TEMPLATES = [
  "Sounds great! Can we do Tue 2pm?",
  "Yes — I'm free Thursday at 11am.",
  "Let's chat Friday 4pm if that still works.",
];

export default function SimulateReplyButton({
  defaultLeadName = "",
  onSubmit,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [leadName, setLeadName] = useState(defaultLeadName);
  const [text, setText] = useState(TEMPLATES[0]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition disabled:opacity-50"
      >
        <EnvelopeSimpleOpen size={12} />
        Simulate inbound email reply
      </button>
    );
  }

  return (
    <div className="card p-3 max-w-md">
      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
        Simulate reply (demo)
      </div>
      <input
        value={leadName}
        onChange={(e) => setLeadName(e.target.value)}
        placeholder="Lead name (e.g. Maria Lopez)"
        className="w-full text-[13px] px-2 py-1.5 mb-2 rounded border border-neutral-200 focus:border-neutral-900 outline-none"
      />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full text-[13px] px-2 py-1.5 rounded border border-neutral-200 focus:border-neutral-900 outline-none resize-y"
      />
      <div className="flex flex-wrap gap-1 mt-2">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            onClick={() => setText(t)}
            className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={() => setOpen(false)}
          className="text-[11px] px-2.5 py-1 rounded text-neutral-500 hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            if (!leadName.trim() || !text.trim()) return;
            onSubmit({ leadName: leadName.trim(), replyText: text.trim() });
            setOpen(false);
          }}
          className="text-[11px] px-3 py-1 rounded-full bg-neutral-900 text-white hover:bg-neutral-800"
        >
          Send to AOS
        </button>
      </div>
    </div>
  );
}
