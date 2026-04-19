import type { Metadata } from "next";
import "./globals.css";
import AssistantProvider from "@/components/assistant/AssistantProvider";
import ConfirmActionDialog from "@/components/assistant/ConfirmActionDialog";
import ToastStack from "@/components/assistant/ToastStack";
import DbProvider from "@/components/DbProvider";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Lofty CRM Dashboard",
  description: "Lofty CRM — AI-powered real estate dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[var(--bg)]">
        <AssistantProvider>
          <DbProvider>
            <AppShell>{children}</AppShell>
          </DbProvider>
          <ConfirmActionDialog />
          <ToastStack />
        </AssistantProvider>
      </body>
    </html>
  );
}
