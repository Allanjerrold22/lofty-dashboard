"use client";

import { ReactNode } from "react";
import { Sparkle, User } from "@phosphor-icons/react";

interface Props {
  role: "user" | "agent";
  text?: string;
  streaming?: boolean;
  children?: ReactNode;
}

function sanitizeAssistantText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1");
}

export default function MessageBubble({ role, text, streaming, children }: Props) {
  if (role === "user") {
    return (
      <div className="flex items-start gap-3 justify-end">
        <div className="max-w-[70%] rounded-2xl rounded-tr-md px-4 py-2.5 text-[14px] text-neutral-900 bg-white border border-neutral-100">
          {text}
        </div>
        <div
          className="w-7 h-7 rounded-full grid place-items-center text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #3240FF 0%, #6089FF 100%)" }}
        >
          <User size={14} weight="fill" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div
        className="w-7 h-7 rounded-full grid place-items-center text-white shrink-0"
        style={{
          background: "linear-gradient(135deg, #3240FF 0%, #6089FF 100%)",
        }}
      >
        <Sparkle size={14} weight="fill" />
      </div>
      <div className="flex-1 max-w-[80%]">
        {text !== undefined && (
          <p
            className={`text-[14px] leading-relaxed whitespace-pre-wrap ${
              streaming ? "aos-streaming" : "aos-final"
            }`}
          >
            {sanitizeAssistantText(text)}
            {streaming && (
              <span className="inline-block w-1.5 h-4 bg-neutral-400 ml-0.5 align-text-bottom animate-pulse" />
            )}
          </p>
        )}
        {children && <div className={text ? "mt-3" : ""}>{children}</div>}
      </div>
    </div>
  );
}
