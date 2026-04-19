"use client";

import { useState } from "react";
import { Check, Plug, X } from "lucide-react";

interface Props {
  connected: boolean;
  configured: boolean;
  email?: string | null;
  onChange: () => void;
}

const GoogleLogo = () => (
  <svg viewBox="0 0 48 48" className="w-4 h-4" aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.7 4.6-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8L6.2 33C9.5 39.6 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2c-.4.3 6.6-4.8 6.6-14.8 0-1.3-.1-2.4-.4-3.5z"/>
  </svg>
);

export default function ConnectGoogleButton({ connected, configured, email, onChange }: Props) {
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
        <Plug size={13} />
        Set <code className="text-[11px]">GOOGLE_CLIENT_ID</code> in <code className="text-[11px]">.env.local</code>
      </div>
    );
  }

  if (connected) {
    const handleDisconnect = async () => {
      setBusy(true);
      try {
        await fetch("/api/google/disconnect", { method: "POST" });
        onChange();
      } finally {
        setBusy(false);
      }
    };

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
          <Check size={13} />
          <GoogleLogo />
          <span className="font-medium">{email || "Connected"}</span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={busy}
          aria-label="Disconnect Google Calendar"
          className="w-7 h-7 grid place-items-center rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-40"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <a
      href="/api/google/auth"
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-neutral-200 text-neutral-800 hover:border-neutral-900 hover:bg-neutral-50 transition-colors shadow-sm"
    >
      <GoogleLogo />
      Connect Google Calendar
    </a>
  );
}
