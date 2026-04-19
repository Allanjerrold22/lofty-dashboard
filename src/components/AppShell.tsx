"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import AssistantPanel from "./assistant/AssistantPanel";
import { useAssistantUi } from "@/lib/assistant-ui";

const PANEL_WIDTH = 320; // px — keep in sync with AssistantDock

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ui = useAssistantUi();

  // Sidebar collapses for AOS page OR when assistant panel is open
  const sidebarCollapsed = pathname.startsWith("/aos") || ui.open;

  return (
    <>
      <Sidebar collapsed={sidebarCollapsed} />
      <TopBar
        sidebarCollapsed={sidebarCollapsed}
        panelOpen={ui.open}
        panelWidth={PANEL_WIDTH}
      />
      <main
        className={`pt-14 min-h-screen transition-[margin] duration-300 ease-out ${
          sidebarCollapsed ? "ml-14" : "ml-52"
        }`}
        style={{ marginRight: ui.open ? `${PANEL_WIDTH}px` : 0 }}
      >
        {children}
      </main>
      <AssistantPanel width={PANEL_WIDTH} />
    </>
  );
}
