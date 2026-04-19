"use client";

import { useState } from "react";
import { Check, Mail, X } from "lucide-react";
import { DraftedEmail } from "@/lib/aos-tools";

interface Props {
  draft: DraftedEmail;
  resolved?: "sent" | "discarded";
  sentMessageId?: string;
  onSend: (final: DraftedEmail) => Promise<void> | void;
  onDiscard: () => void;
}

export default function EmailDraftCard({
  draft,
  resolved,
  sentMessageId,
  onSend,
  onDiscard,
}: Props) {
  const [to, setTo] = useState(draft.to);
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isSent = resolved === "sent";
  const isDiscarded = resolved === "discarded";
  const locked = isSent || isDiscarded || busy;

  const handleSend = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onSend({ to, subject, body });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`card p-4 ${isDiscarded ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-neutral-500" />
          <span className="text-[12px] font-semibold text-neutral-900">
            Draft email
          </span>
        </div>
        {isSent && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            <Check size={11} /> Sent
          </span>
        )}
        {isDiscarded && (
          <span className="text-[11px] font-medium text-neutral-500">
            Discarded
          </span>
        )}
      </div>

      <div className="space-y-2">
        <Field label="To">
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={locked}
            className="w-full bg-transparent text-[13px] outline-none border-b border-neutral-100 py-1 focus:border-neutral-900"
          />
        </Field>
        <Field label="Subject">
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={locked}
            className="w-full bg-transparent text-[13px] outline-none border-b border-neutral-100 py-1 focus:border-neutral-900"
          />
        </Field>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={locked}
          rows={6}
          className="w-full mt-2 text-[13px] leading-relaxed text-neutral-800 bg-neutral-50/60 rounded-lg p-3 outline-none border border-neutral-100 focus:border-neutral-900 resize-y"
        />
      </div>

      {err && (
        <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2 py-1.5">
          {err}
        </div>
      )}

      {!isSent && !isDiscarded && (
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            onClick={onDiscard}
            disabled={busy}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-full text-neutral-600 hover:bg-neutral-100"
          >
            <X size={12} /> Discard
          </button>
          <button
            onClick={handleSend}
            disabled={busy}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 text-[12px] font-semibold rounded-full bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send via Gmail"}
          </button>
        </div>
      )}

      {isSent && sentMessageId && (
        <div className="text-[11px] text-neutral-500 mt-2">
          Gmail message id <span className="font-mono">{sentMessageId.slice(0, 12)}…</span>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 w-12 shrink-0">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}
