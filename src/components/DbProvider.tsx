"use client";

import { useEffect, useRef } from "react";
import { hydrateStore } from "@/lib/store";

/**
 * On mount, fetches all dashboard data from InsForge via /api/db/data
 * and hydrates the in-memory store. This is a one-time load on page open.
 * The store then handles optimistic UI mutations, which also sync back to InsForge.
 */
export default function DbProvider({ children }: { children: React.ReactNode }) {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    fetch("/api/db/data")
      .then((res) => {
        if (!res.ok) throw new Error(`/api/db/data returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        hydrateStore({
          leads: data.leads,
          tasks: data.tasks,
          appointments: data.appointments,
          transactions: data.transactions,
        });
        console.info("[DbProvider] Hydrated store from InsForge:", {
          leads: data.leads?.length,
          tasks: data.tasks?.length,
          appointments: data.appointments?.length,
          transactions: data.transactions?.length,
        });
      })
      .catch((err) => {
        // InsForge not configured or offline — dashboard runs on mock data from store.ts
        console.warn("[DbProvider] InsForge not available, running on local mock data.", err.message);
      });
  }, []);

  return <>{children}</>;
}
