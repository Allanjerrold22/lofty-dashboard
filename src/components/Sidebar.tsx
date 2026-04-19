"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  Robot,
  Users,
  Receipt,
  CalendarDots,
  House,
  MegaphoneSimple,
  ChartBar,
  Globe,
  Storefront,
  GearSix,
  CaretDown,
} from "@phosphor-icons/react";

const navItems = [
  { label: "Dashboard",    href: "/",             icon: SquaresFour,      hasDropdown: false },
  { label: "AOS",          href: "/aos",          icon: Robot,            hasDropdown: false },
  { label: "People",       href: "/people",       icon: Users,            hasDropdown: true  },
  { label: "Transactions", href: "/transactions", icon: Receipt,          hasDropdown: false },
  { label: "Calendar",     href: "/calendar",     icon: CalendarDots,     hasDropdown: false },
  { label: "Listings",     href: "/listings",     icon: House,            hasDropdown: false },
  { label: "Marketing",    href: "/marketing",    icon: MegaphoneSimple,  hasDropdown: false },
  { label: "Reporting",    href: "/reporting",    icon: ChartBar,         hasDropdown: false },
  { label: "Website",      href: "/website",      icon: Globe,            hasDropdown: false },
  { label: "Marketplace",  href: "/marketplace",  icon: Storefront,       hasDropdown: false },
  { label: "Settings",     href: "/settings",     icon: GearSix,          hasDropdown: false },
];

export default function Sidebar({ collapsed: collapsedProp }: { collapsed?: boolean } = {}) {
  const pathname = usePathname();
  const collapsed = collapsedProp ?? pathname.startsWith("/aos");

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 bg-white border-r border-neutral-200/70 z-50 flex flex-col transition-[width] duration-200 ${
        collapsed ? "w-14" : "w-52"
      }`}
    >
      {/* Logo */}
      <div
        className={`flex items-center h-14 border-b border-neutral-100 shrink-0 ${
          collapsed ? "justify-center px-0" : "gap-2.5 px-5"
        }`}
      >
        <div className="w-7 h-7 rounded-lg bg-neutral-900 flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold tracking-tight">L</span>
        </div>
        {!collapsed && (
          <span className="text-base font-semibold text-neutral-900 tracking-tight">
            Lofty
          </span>
        )}
      </div>

      {/* Nav items */}
      <nav className={`flex-1 overflow-y-auto scroll-thin py-3 ${collapsed ? "px-1.5" : "px-2.5"}`}>
        {navItems.map(({ label, href, icon: Icon, hasDropdown }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={label}
              href={href}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center rounded-lg text-sm mb-0.5 transition-colors group ${
                collapsed
                  ? "justify-center h-10"
                  : "gap-2.5 px-3 py-2"
              } ${
                isActive
                  ? "bg-neutral-900 text-white font-semibold"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              }`}
            >
              <Icon
                size={collapsed ? 18 : 17}
                weight={isActive ? "fill" : "regular"}
                className="shrink-0"
              />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{label}</span>
                  {hasDropdown && (
                    <CaretDown
                      size={12}
                      className={`shrink-0 ${isActive ? "text-white/70" : "text-neutral-400"}`}
                    />
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="h-3 shrink-0" />
    </aside>
  );
}
