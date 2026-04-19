"use client";

import { useState } from "react";
import { CalendarPlus, Check, MapPin, X } from "lucide-react";
import { AppointmentProposal } from "@/lib/aos-tools";

interface Props {
  proposal: AppointmentProposal;
  resolved?: "created" | "discarded";
  onConfirm: (final: AppointmentProposal) => Promise<void> | void;
  onDiscard: () => void;
}

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AppointmentProposalCard({
  proposal,
  resolved,
  onConfirm,
  onDiscard,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isCreated = resolved === "created";
  const isDiscarded = resolved === "discarded";
  const locked = isCreated || isDiscarded || busy;

  const handleConfirm = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onConfirm(proposal);
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
          <CalendarPlus size={14} className="text-neutral-500" />
          <span className="text-[12px] font-semibold text-neutral-900">
            Proposed appointment
          </span>
        </div>
        {isCreated && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            <Check size={11} /> Added to calendar
          </span>
        )}
        {isDiscarded && (
          <span className="text-[11px] font-medium text-neutral-500">
            Skipped
          </span>
        )}
      </div>

      <div className="space-y-1.5 text-[13px]">
        <div>
          <span className="text-neutral-500">With </span>
          <span className="font-semibold text-neutral-900">{proposal.person}</span>
        </div>
        <div className="text-neutral-700">
          {fmt(proposal.start_iso)} – {new Date(proposal.end_iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </div>
        {proposal.location && (
          <div className="flex items-center gap-1 text-neutral-600 text-[12px]">
            <MapPin size={11} /> {proposal.location}
          </div>
        )}
        {proposal.notes && (
          <p className="text-[12px] text-neutral-500 pt-1 border-t border-neutral-100 mt-2">
            {proposal.notes}
          </p>
        )}
      </div>

      {err && (
        <div className="mt-2 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-2 py-1.5">
          {err}
        </div>
      )}

      {!locked && (
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            onClick={onDiscard}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium rounded-full text-neutral-600 hover:bg-neutral-100"
          >
            <X size={12} /> Skip
          </button>
          <button
            onClick={handleConfirm}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 text-[12px] font-semibold rounded-full bg-neutral-900 text-white hover:bg-neutral-800"
          >
            Confirm &amp; add
          </button>
        </div>
      )}
    </div>
  );
}
