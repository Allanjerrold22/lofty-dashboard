import { Search, Mail, Bell, HelpCircle } from "lucide-react";

export default function TopBar({
  sidebarCollapsed = false,
  panelOpen = false,
  panelWidth = 0,
}: {
  sidebarCollapsed?: boolean;
  panelOpen?: boolean;
  panelWidth?: number;
}) {
  return (
    <header
      className={`fixed top-0 h-14 bg-white/90 backdrop-blur-md border-b border-neutral-200/70 z-40 flex items-center justify-end px-5 gap-1 transition-all duration-300 ease-out ${
        sidebarCollapsed ? "left-14" : "left-52"
      }`}
      style={{ right: panelOpen ? `${panelWidth}px` : 0 }}
    >
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
    </header>
  );
}
