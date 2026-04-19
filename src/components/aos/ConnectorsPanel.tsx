"use client";

import { useMemo, useState } from "react";
import {
  CalendarDots,
  ChartBar,
  DeviceMobile,
  EnvelopeSimple,
  Globe,
  MegaphoneSimple,
  Phone,
  Sparkle,
  Storefront,
  Users,
  X,
} from "@phosphor-icons/react";

type Connector = {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  pinned?: boolean;
  color: string;
  icon: React.ComponentType<{ size?: number; weight?: "fill" | "regular" }>;
};

const CONNECTORS: Connector[] = [
  {
    id: "gmail",
    name: "Gmail",
    category: "Communication",
    enabled: true,
    pinned: true,
    color: "#EA4335",
    icon: EnvelopeSimple,
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    category: "Scheduling",
    enabled: true,
    pinned: true,
    color: "#4285F4",
    icon: CalendarDots,
  },
  {
    id: "ai-assistant",
    name: "AI Assistant",
    category: "AI",
    enabled: false,
    color: "#3240FF",
    icon: Sparkle,
  },
  {
    id: "sales-agent",
    name: "Sales Agent",
    category: "AI",
    enabled: false,
    color: "#5B7CFF",
    icon: Users,
  },
  {
    id: "social-agent",
    name: "Social Agent",
    category: "AI",
    enabled: false,
    color: "#7C3AED",
    icon: MegaphoneSimple,
  },
  {
    id: "real-estate-crm",
    name: "Real Estate CRM",
    category: "Platform",
    enabled: false,
    color: "#111827",
    icon: Users,
  },
  {
    id: "power-dialer",
    name: "Power Dialer",
    category: "Communication",
    enabled: false,
    color: "#059669",
    icon: Phone,
  },
  {
    id: "agent-websites",
    name: "Agent Websites",
    category: "Platform",
    enabled: false,
    color: "#0EA5E9",
    icon: Globe,
  },
  {
    id: "wordpress-idx-plugin",
    name: "WordPress IDX Plugin",
    category: "Platform",
    enabled: false,
    color: "#2563EB",
    icon: Globe,
  },
  {
    id: "social-studio",
    name: "Social Studio",
    category: "Marketing",
    enabled: false,
    color: "#F59E0B",
    icon: MegaphoneSimple,
  },
  {
    id: "transaction-management",
    name: "Transaction Management",
    category: "Platform",
    enabled: false,
    color: "#64748B",
    icon: ChartBar,
  },
  {
    id: "mobile-apps",
    name: "Mobile Apps",
    category: "Platform",
    enabled: false,
    color: "#10B981",
    icon: DeviceMobile,
  },
  {
    id: "closely-app",
    name: "Closely App",
    category: "Platform",
    enabled: false,
    color: "#8B5CF6",
    icon: Storefront,
  },
  {
    id: "back-office",
    name: "Back Office",
    category: "Platform",
    enabled: false,
    color: "#475569",
    icon: ChartBar,
  },
  {
    id: "360-marketing",
    name: "360 Marketing",
    category: "Marketing",
    enabled: false,
    color: "#EC4899",
    icon: MegaphoneSimple,
  },
  {
    id: "brand-advertising",
    name: "Brand Advertising",
    category: "Marketing",
    enabled: false,
    color: "#F97316",
    icon: MegaphoneSimple,
  },
  {
    id: "google-ppc",
    name: "Google PPC",
    category: "Marketing",
    enabled: false,
    color: "#34A853",
    icon: ChartBar,
  },
  {
    id: "google-lsa",
    name: "Google LSA",
    category: "Marketing",
    enabled: false,
    color: "#A3A3A3",
    icon: ChartBar,
  },
  {
    id: "direct-mail",
    name: "Direct Mail",
    category: "Marketing",
    enabled: false,
    color: "#D97706",
    icon: EnvelopeSimple,
  },
  {
    id: "lofty-bloom",
    name: "Lofty Bloom",
    category: "Lead Generation",
    enabled: false,
    color: "#22C55E",
    icon: Sparkle,
  },
];

export default function ConnectorsPanel() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [connectors, setConnectors] = useState<Connector[]>(CONNECTORS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = connectors.filter((item) => {
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
    return result.sort((a, b) => {
      const pinA = a.pinned ? 1 : 0;
      const pinB = b.pinned ? 1 : 0;
      if (pinA !== pinB) return pinB - pinA;
      if (a.enabled !== b.enabled) return Number(b.enabled) - Number(a.enabled);
      return a.name.localeCompare(b.name);
    });
  }, [connectors, query]);

  const toggle = (id: string) => {
    setConnectors((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-300 bg-neutral-100 text-neutral-700 text-[11px] font-medium hover:bg-neutral-50 hover:border-neutral-400 transition"
      >
        <Storefront size={12} weight="regular" />
        Connectors
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-white/20 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-[24px] bg-white/88 backdrop-blur-xl border border-white/70 shadow-[0_24px_80px_-24px_rgba(50,64,255,0.22)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/70">
              <div>
                <h3 className="text-[16px] font-semibold text-neutral-900">
                  Lofty connectors
                </h3>
                <p className="text-[12px] text-neutral-500 mt-0.5">
                  Search and toggle connected services. Gmail and Google Calendar are pinned on top.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full grid place-items-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 transition"
                aria-label="Close connectors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 pt-4">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search integrations..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-neutral-200 text-[13px] text-neutral-800 outline-none focus:border-neutral-400"
              />
            </div>

            <div className="px-5 pb-5 pt-4 max-h-[60vh] overflow-y-auto scroll-thin">
              <div className="space-y-2">
                {filtered.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl bg-white/85 border border-neutral-200/70 px-3.5 py-3"
                    >
                      <div
                        className="w-10 h-10 rounded-2xl grid place-items-center text-white shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        <Icon size={18} weight="fill" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-neutral-900 truncate">
                            {item.name}
                          </span>
                          {item.pinned && (
                            <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          {item.category}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-pressed={item.enabled}
                        className={`relative w-11 h-6 rounded-full transition ${
                          item.enabled
                            ? "bg-neutral-900"
                            : "bg-neutral-200"
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition ${
                            item.enabled ? "left-[22px]" : "left-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}

                {filtered.length === 0 && (
                  <div className="text-center py-10 text-[13px] text-neutral-500">
                    No integrations found for “{query}”.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
