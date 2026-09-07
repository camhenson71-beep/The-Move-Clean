import { NextResponse } from "next/server";
import { fetchTampaEventsFromTicketmaster } from "@/lib/ticketmaster";

// Route-level hint matching the 15-minute fetch revalidation in
// src/lib/ticketmaster.ts — the actual caching happens on the upstream
// fetch() call itself (via `next: { revalidate: 900 }`), which is the
// reliable mechanism for a route handler that reads an env var.
export const revalidate = 900;

// The only place TICKETMASTER_API_KEY is ever read. Never sent to, or
// reachable from, the browser — the client (src/lib/useInventory.ts) only
// ever calls this same-origin route and reads its JSON response.
export async function GET() {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    // Expected, normal state if the key isn't configured yet. The client
    // treats any non-200 here as "use mock inventory" — see useInventory.ts.
    return NextResponse.json({ error: "Ticketmaster API key not configured" }, { status: 503 });
  }

  try {
    const { events, venues } = await fetchTampaEventsFromTicketmaster(apiKey);
    return NextResponse.json({ events, venues, count: events.length, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: `Ticketmaster request failed: ${err instanceof Error ? err.message : "unknown error"}` }, { status: 502 });
  }
}
