"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, Microphone, Stop } from "@phosphor-icons/react";

// Minimal types — DOM lib SpeechRecognition is not always in TS scope for Next builds
type SpeechRecognitionResultEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [i: number]: { isFinal: boolean; 0: { transcript: string } };
  };
};

type SpeechRecognitionCtor = new () => {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
};

type SRInstance = InstanceType<SpeechRecognitionCtor>;

function getSR(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Props {
  busy: boolean;
  onSend: (text: string) => void;
  suggestions?: string[];
  onSuggestion?: (s: string) => void;
}

type VoiceState = "idle" | "listening" | "processing";

export default function Composer({ busy, onSend, suggestions, onSuggestion }: Props) {
  const [value, setValue] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [interimText, setInterimText] = useState("");
  const [srSupported, setSrSupported] = useState(false);
  const srRef = useRef<SRInstance | null>(null);

  useEffect(() => {
    setSrSupported(!!getSR());
  }, []);

  const stopListening = useCallback(() => {
    srRef.current?.stop();
    srRef.current = null;
    setVoiceState("idle");
    setInterimText("");
  }, []);

  const startListening = useCallback(() => {
    const SR = getSR();
    if (!SR) return;
    if (srRef.current) {
      stopListening();
      return;
    }

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    srRef.current = rec;
    setVoiceState("listening");

    rec.onresult = (e: SpeechRecognitionResultEventLike) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) setInterimText(interim);
      if (final.trim()) {
        setVoiceState("processing");
        setInterimText("");
        srRef.current = null;
        // Feed to chat
        onSend(final.trim());
        setVoiceState("idle");
      }
    };

    rec.onerror = () => {
      stopListening();
    };

    rec.onend = () => {
      if (voiceState === "listening") {
        setVoiceState("idle");
        setInterimText("");
        srRef.current = null;
      }
    };

    try {
      rec.start();
    } catch {
      stopListening();
    }
  }, [onSend, stopListening, voiceState]);

  // Clean up on unmount
  useEffect(() => () => srRef.current?.stop(), []);

  const submit = () => {
    const v = value.trim();
    if (!v || busy) return;
    onSend(v);
    setValue("");
  };

  const micActive = voiceState !== "idle";
  const displayPlaceholder =
    voiceState === "listening"
      ? interimText || "Listening…"
      : voiceState === "processing"
      ? "Sending…"
      : "Ask AOS to do something…";

  return (
    <div className="space-y-2">
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              disabled={busy || micActive}
              onClick={() => onSuggestion?.(s)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-neutral-200 text-neutral-700 hover:border-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div
        className="flex items-center gap-2 bg-white rounded-2xl pl-4 pr-2 py-2 transition-all"
        style={{
          boxShadow: micActive
            ? "0 0 0 2px rgba(239,68,68,0.35), 0 8px 32px -8px rgba(239,68,68,0.18), 0 2px 8px -2px rgba(50,64,255,0.08)"
            : "0 8px 32px -8px rgba(50,64,255,0.22), 0 2px 12px -4px rgba(96,137,255,0.14), 0 1px 3px 0 rgba(50,64,255,0.06)",
        }}
      >
        <input
          value={micActive ? interimText : value}
          onChange={(e) => !micActive && setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={displayPlaceholder}
          className={`flex-1 bg-transparent outline-none text-[14px] ${
            micActive
              ? "placeholder:text-rose-400 text-rose-500 italic"
              : "placeholder:text-neutral-400"
          }`}
          readOnly={micActive}
          disabled={busy && !micActive}
        />

        {/* Mic button — only shown if browser supports SpeechRecognition */}
        {srSupported && (
          <button
            type="button"
            onClick={micActive ? stopListening : startListening}
            disabled={busy && !micActive}
            aria-label={micActive ? "Stop listening" : "Start voice input"}
            className={`relative grid place-items-center w-9 h-9 rounded-full transition active:scale-95 disabled:opacity-40 ${
              micActive
                ? "bg-rose-500 text-white hover:bg-rose-600"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {micActive ? (
              <Stop size={15} weight="fill" />
            ) : (
              <Microphone size={15} weight="regular" />
            )}
            {/* pulse ring while listening */}
            {voiceState === "listening" && (
              <span className="absolute inset-0 rounded-full ring-2 ring-rose-400 animate-ping opacity-50 pointer-events-none" />
            )}
          </button>
        )}

        {/* Send button */}
        <button
          onClick={submit}
          disabled={busy || micActive || !value.trim()}
          aria-label="Send"
          className="grid place-items-center w-9 h-9 rounded-full text-white disabled:opacity-40 transition active:scale-95 hover:opacity-90 hover:-translate-y-[1px]"
          style={{
            background: "linear-gradient(135deg, #3240FF 0%, #6089FF 100%)",
            boxShadow: "0 2px 8px -2px rgba(50,64,255,0.45)",
          }}
        >
          <ArrowUp size={16} weight="bold" />
        </button>
      </div>

      {!srSupported && (
        <p className="text-[10px] text-neutral-400 px-1">
          Voice input requires Chrome or Edge.
        </p>
      )}
    </div>
  );
}
