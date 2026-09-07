// Server-only module: fetches Tampa events from the Ticketmaster Discovery
// API and normalizes them into this app's existing EventItem/Venue shapes
// (see src/lib/types.ts). Imported only by src/app/api/events/route.ts —
// never imported by any client component, so TICKETMASTER_API_KEY never
// reaches the browser.
//
// Ticketmaster's API does not provide the six Best Bet component scores
// this app uses (significance/venueQuality/demand/socialBuzz/uniqueness/
// value) or personalization tags — those are genuinely curated/authored for
// mock data. For live events, the heuristics below derive reasonable
// starting values from the fields Ticketmaster *does* provide (classification,
// on-sale status, price range, attraction count). They're approximations,
// clearly marked as such, not a claim of equivalent editorial quality to the
// hand-curated mock components.

import type { EventItem, Venue } from "@/lib/types";
import { DEMO_NOW } from "@/lib/engine";

const TM_BASE = "https://app.ticketmaster.com/discovery/v2/events.json";

interface NormalizedResult {
  events: EventItem[];
  venues: Record<string, Venue>;
}

function mapCategory(classification: any): { category: string; subcategory: string } {
  const segment: string = classification?.segment?.name || "Miscellaneous";
  const genre: string = classification?.genre?.name || segment;
  if (/comedy/i.test(genre) || /comedy/i.test(segment)) return { category: "Comedy", subcategory: genre };
  if (segment === "Sports") return { category: "Sports", subcategory: genre };
  if (segment === "Music") return { category: "Nightlife", subcategory: genre };
  if (segment === "Arts & Theatre") return { category: "Culture", subcategory: genre };
  if (segment === "Film") return { category: "Culture", subcategory: "Film" };
  if (/festival/i.test(genre)) return { category: "Festival", subcategory: genre };
  return { category: "Culture", subcategory: genre };
}

function mapTags(classification: any): string[] {
  const genre: string = (classification?.genre?.name || "").toLowerCase();
  const segment: string = (classification?.segment?.name || "").toLowerCase();
  const tags: string[] = [];
  if (segment === "music") tags.push("Live Music", "Nightlife");
  if (segment === "sports") tags.push("Sports");
  if (segment === "arts & theatre") tags.push("Culture");
  if (genre.includes("hip-hop") || genre.includes("rap")) tags.push("Hip Hop");
  if (genre.includes("r&b") || genre.includes("urban")) tags.push("R&B");
  if (genre.includes("rock") || genre.includes("pop")) tags.push("High Energy");
  if (genre.includes("dance") || genre.includes("electronic") || genre.includes("house")) tags.push("House", "High Energy");
  if (genre.includes("jazz")) tags.push("Jazz");
  if (genre.includes("comedy")) tags.push("Good for Groups", "Good for Dates");
  if (tags.length === 0) tags.push("Culture");
  return Array.from(new Set(tags));
}

function bestImage(images: any[] | undefined): string {
  if (!images || !images.length) return "https://picsum.photos/seed/ticketmaster-fallback/900/700";
  const sorted = [...images].sort((a, b) => (b.width || 0) - (a.width || 0));
  const wide = sorted.find((i) => i.ratio === "16_9") || sorted[0];
  return wide.url;
}

function deriveBestBetComponents(tmEvent: any, priceMax: number | null) {
  const attractions = tmEvent._embedded?.attractions?.length || 0;
  const onSale = tmEvent.dates?.status?.code === "onsale";
  // Heuristic, approximate — see module header comment.
  const significance = Math.min(80, 55 + attractions * 8);
  const venueQuality = 65;
  const demand = onSale ? 62 : 50;
  const socialBuzz = 50; // no real signal available from this API — placeholder
  const uniqueness = 55;
  const value = priceMax ? Math.max(30, Math.min(90, Math.round(100 - priceMax * 0.5))) : 60;
  return { significance, venueQuality, demand, socialBuzz, uniqueness, value };
}

export async function fetchTampaEventsFromTicketmaster(apiKey: string): Promise<NormalizedResult> {
  // Query a window anchored on the app's simulated "now" (DEMO_NOW) rather
  // than the real current date, so live results actually populate
  // Tonight/This Weekend/Upcoming in a way that matches the rest of the
  // demo. See src/lib/engine.ts for DEMO_NOW.
  const start = DEMO_NOW;
  const end = new Date(DEMO_NOW.getTime() + 10 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    apikey: apiKey,
    city: "Tampa",
    stateCode: "FL",
    countryCode: "US",
    startDateTime: start.toISOString().split(".")[0] + "Z",
    endDateTime: end.toISOString().split(".")[0] + "Z",
    size: "50",
    sort: "date,asc",
  });

  // Cache the upstream Ticketmaster response for 15 minutes using Next.js's
  // fetch-level revalidation, so normal browsing traffic doesn't hit
  // Ticketmaster's API on every single page load.
  const resp = await fetch(`${TM_BASE}?${params.toString()}`, {
    next: { revalidate: 900 }, // 900s = 15 min
  });
  if (!resp.ok) {
    throw new Error(`Ticketmaster responded ${resp.status}`);
  }
  const data = await resp.json();
  const rawEvents: any[] = data?._embedded?.events || [];

  const venues: Record<string, Venue> = {};
  const events: EventItem[] = [];

  for (const tmEvent of rawEvents) {
    try {
      const tmVenue = tmEvent._embedded?.venues?.[0];
      if (!tmVenue) continue; // can't place it on the map or compute distance — skip rather than guess

      const venueId = `tm_venue_${tmVenue.id}`;
      const lat = tmVenue.location?.latitude ? parseFloat(tmVenue.location.latitude) : null;
      const lng = tmVenue.location?.longitude ? parseFloat(tmVenue.location.longitude) : null;
      venues[venueId] = {
        id: venueId,
        name: tmVenue.name || "Tampa venue",
        neighborhood: tmVenue.city?.name || "Tampa",
        // Fall back to the app's Water Street origin if Ticketmaster didn't
        // supply coordinates for this venue, so distance math never breaks —
        // "coordinates when available" per the integration requirement.
        lat: lat ?? 27.9429,
        lng: lng ?? -82.4551,
      };

      const classification = tmEvent.classifications?.[0];
      const { category, subcategory } = mapCategory(classification);

      const localDate = tmEvent.dates?.start?.localDate;
      const localTime = tmEvent.dates?.start?.localTime;
      const startTime = localDate
        ? `${localDate}T${localTime || "19:00:00"}`
        : tmEvent.dates?.start?.dateTime || DEMO_NOW.toISOString();
      // Ticketmaster's Discovery API does not return an event end time —
      // assume a 3-hour duration, a reasonable default for concerts/sports/
      // comedy, clearly an assumption rather than reported data.
      const endTime = new Date(new Date(startTime).getTime() + 3 * 60 * 60 * 1000).toISOString();

      const priceRange = tmEvent.priceRanges?.[0];
      const priceMin = priceRange?.min != null ? Math.round(priceRange.min) : 20;
      const priceMax = priceRange?.max != null ? Math.round(priceRange.max) : 100;
      const hadRealPricing = !!priceRange;

      events.push({
        id: `tm_${tmEvent.id}`,
        type: "event",
        source: "ticketmaster",
        title: tmEvent.name,
        city: tmVenue.city?.name || "Tampa",
        category,
        subcategory,
        venueId,
        performer: tmEvent._embedded?.attractions?.[0]?.name || null,
        startTime,
        endTime,
        priceMin,
        priceMax,
        ticketUrl: tmEvent.url || null,
        officialUrl: null,
        image: bestImage(tmEvent.images),
        tags: mapTags(classification),
        badges: ["Live"],
        description: hadRealPricing
          ? (tmEvent.info || tmEvent.pleaseNote || `${tmEvent.name} at ${tmVenue.name}.`)
          : (tmEvent.info || tmEvent.pleaseNote || `${tmEvent.name} at ${tmVenue.name}. Pricing not listed by Ticketmaster — shown range is an estimate.`),
        bestBetComponents: deriveBestBetComponents(tmEvent, hadRealPricing ? priceMax : null),
      });
    } catch {
      // Skip any single malformed record rather than failing the whole batch.
      continue;
    }
  }

  return { events, venues };
}
