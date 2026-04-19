"use client";

import { useState } from "react";
import {
  Search,
  Mail,
  Bell,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import AssistantOrb from "@/components/assistant/AssistantOrb";

const navItems = [
  { label: "People", hasDropdown: true },
  { label: "Transactions", hasDropdown: false },
  { label: "Calendar", hasDropdown: false },
  { label: "Listings", hasDropdown: false },
  { label: "Marketing", hasDropdown: false },
  { label: "Reporting", hasDropdown: false },
  { label: "Website", hasDropdown: false },
  { label: "Marketplace", hasDropdown: false },
  { label: "Settings", hasDropdown: false },
];

export default function Navbar() {
  const [activeNav, setActiveNav] = useState("People");

  return (
    <nav className="bg-white/85 backdrop-blur-md border-b border-neutral-200/70 sticky top-0 z-50">
      <div className="flex items-center h-14 px-5 gap-0">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-8 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center">
            <span className="text-white text-xs font-bold tracking-tight">L</span>
          </div>
          <span className="text-base font-semibold text-neutral-900 tracking-tight">
            Lofty
          </span>
        </div>

        {/* Nav Items */}
        <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scroll-thin">
          {navItems.map((item) => {
            const active = activeNav === item.label;
            return (
              <button
                key={item.label}
                onClick={() => setActiveNav(item.label)}
                className={`relative flex items-center gap-1 px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap ${
                  active
                    ? "text-neutral-900 font-semibold"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                {item.label}
                {item.hasDropdown && <ChevronDown className="w-3 h-3" />}
                {active && (
                  <span className="absolute left-3 right-3 -bottom-[10px] h-[2px] rounded-full bg-neutral-900" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button className="btn-icon" aria-label="Search">
            <Search className="w-4 h-4" />
          </button>
          <button className="btn-icon" aria-label="Inbox">
            <Mail className="w-4 h-4" />
          </button>
          <button className="btn-icon relative" aria-label="Notifications">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-neutral-900 rounded-full ring-2 ring-white" />
          </button>
          <button className="btn-icon" aria-label="Help">
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            className="w-8 h-8 rounded-full overflow-hidden border border-neutral-200 hover:border-neutral-900 transition-colors ml-1"
            aria-label="Profile"
          >
            <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white text-xs font-semibold">
              J
            </div>
          </button>
          <AssistantOrb />
        </div>
      </div>
    </nav>
  );
}
