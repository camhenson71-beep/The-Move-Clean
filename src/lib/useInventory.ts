import { useEffect, useState } from "react";
import type { Item, EventItem, Venue } from "./types";
import { PLACES, EVENTS as MOCK_EVENTS } from "./mockData";
import { registerVenues } from "./engine";

export type InventoryStatus = "loading" | "live" | "empty-fallback" | "error-fallback";

export interface InventoryState {
  items: Item[];
  status: InventoryStatus;
  liveEventCount: number;
}

// Places (restaurants/bars/lounges) are always the curated mock set —
// Ticketmaster doesn't cover them. Only Events are ever swapped for live
// Ticketmaster data; Places are unaffected either way.
export function useInventory(): InventoryState {
  const [state, setState] = useState<InventoryState>({
    items: [...PLACES, ...MOCK_EVENTS],
    status: "loading",
    liveEventCount: 0,
  });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/events")
      .then(async (res) => {
        if (!res.ok) {
          // Covers both "no key configured" (503) and a genuine upstream
          // failure (502) — either way, fall back to mock, per spec.
          if (!cancelled) setState({ items: [...PLACES, ...MOCK_EVENTS], status: "error-fallback", liveEventCount: 0 });
          return;
        }
        const data: { events: EventItem[]; venues: Record<string, Venue> } = await res.json();
        if (cancelled) return;

        if (!data.events || data.events.length === 0) {
          // Request succeeded but Ticketmaster genuinely had nothing in the
          // demo window — distinct from a failure, still falls back to mock
          // so the app isn't empty, but tracked as its own status for the UI.
          setState({ items: [...PLACES, ...MOCK_EVENTS], status: "empty-fallback", liveEventCount: 0 });
          return;
        }

        registerVenues(data.venues || {});
        setState({ items: [...PLACES, ...data.events], status: "live", liveEventCount: data.events.length });
      })
      .catch(() => {
        if (!cancelled) setState({ items: [...PLACES, ...MOCK_EVENTS], status: "error-fallback", liveEventCount: 0 });
      });

    return () => { cancelled = true; };
  }, []);

  return state;
}
