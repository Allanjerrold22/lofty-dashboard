"use client";

import { useState } from "react";
import {
  CaretDown,
  ArrowUp,
  Star,
  Sparkle,
  Paperclip,
  Microphone,
  MagnifyingGlass,
} from "@phosphor-icons/react";

const MAX_CHARS = 3000;

export default function BuilderHero() {
  const [value, setValue] = useState("");

  return (
    <div
      className="relative z-10 flex flex-col items-center w-full -mt-[50px]"
      style={{ gap: "44px" }}
    >
      {/* Header block: badge + title + subtitle, stacked with 34px gaps */}
      <div className="flex flex-col items-center" style={{ gap: "34px" }}>
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full bg-white shadow-[0_2px_10px_-2px_rgba(0,0,0,0.08)] border border-black/5"
          style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", fontWeight: 400 }}
        >
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: "#0e1311" }}
          >
            <Star size={12} weight="fill" className="text-white" />
            <span className="text-[12px] font-medium leading-none">New</span>
          </span>
          <span className="text-black">Discover what&rsquo;s possible</span>
          <CaretDown size={12} className="text-black/50" />
        </div>

        {/* Headline */}
        <h1
          className="text-center text-black"
          style={{
            fontWeight: 700,
            fontSize: "80px",
            letterSpacing: "-4.8px",
            lineHeight: 1,
          }}
        >
          Transform Data Quickly
        </h1>

        {/* Subtitle */}
        <p
          className="text-center"
          style={{
            color: "#505050",
            fontWeight: 500,
            fontSize: "20px",
            letterSpacing: "-0.4px",
            maxWidth: "736px",
            width: "542px",
            lineHeight: 1.4,
          }}
        >
          Upload your information and get powerful insights right away. Work smarter and
          achieve goals effortlessly.
        </p>
      </div>

      {/* Search / Prompt Box */}
      <div
        className="w-full backdrop-blur-md rounded-[18px] flex flex-col"
        style={{
          maxWidth: "728px",
          height: "200px",
          backgroundColor: "rgba(0,0,0,0.24)",
          padding: "14px",
        }}
      >
        {/* Top row: credits + powered-by */}
        <div
          className="flex items-center justify-between text-white px-1"
          style={{
            fontFamily: "'Schibsted Grotesk', Inter, sans-serif",
            fontWeight: 500,
            fontSize: "12px",
          }}
        >
          <div className="flex items-center gap-2">
            <span>60/450 credits</span>
            <button
              className="px-2 py-0.5 rounded-md text-black font-semibold hover:brightness-105 transition"
              style={{ backgroundColor: "rgba(90,225,76,0.89)" }}
            >
              Upgrade
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkle size={12} weight="fill" className="text-white" />
            <span>Powered by GPT-4o</span>
          </div>
        </div>

        {/* Main input area (white pill) */}
        <div
          className="mt-2 bg-white rounded-[12px] flex items-center gap-2 pl-4 pr-2 py-2 shadow-[0_4px_16px_-6px_rgba(0,0,0,0.18)]"
          style={{ flex: 1 }}
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Type question..."
            className="flex-1 bg-transparent outline-none border-none placeholder:text-black/60 text-black"
            style={{ fontSize: "16px" }}
          />
          <button
            type="button"
            aria-label="Submit"
            className="grid place-items-center rounded-full bg-black text-white hover:bg-neutral-800 transition active:scale-95"
            style={{ width: "36px", height: "36px" }}
          >
            <ArrowUp size={16} weight="bold" />
          </button>
        </div>

        {/* Bottom row: action buttons + character counter */}
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-1.5">
            <ActionChip icon={<Paperclip size={12} weight="regular" />} label="Attach" />
            <ActionChip icon={<Microphone size={12} weight="regular" />} label="Voice" />
            <ActionChip icon={<MagnifyingGlass size={12} weight="regular" />} label="Prompts" />
          </div>
          <div
            className="text-white/80"
            style={{ fontSize: "12px", fontFamily: "'Schibsted Grotesk', Inter, sans-serif" }}
          >
            {value.length.toLocaleString()}/3,000
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium text-neutral-800 hover:brightness-95 transition"
      style={{ backgroundColor: "#f8f8f8" }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
