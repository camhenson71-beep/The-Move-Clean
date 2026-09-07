// What Is The Move — recommendation engine.
// Pure logic, no React/Next dependency, so it's type-checked and unit-tested
// in isolation (see scripts/verify-engine.ts). This is a direct TypeScript
// port of the engine validated in the previous iteration — same formulas,
// same weights, now typed.

import type {
  Item, EventItem, PlaceItem, Venue, UserPrefs, AskConstraints,
  BestBetResult, PersonalMatchResult, ScoredItem, Itinerary, ItineraryStep,
  FeedbackStore,
} from "./types";
import { VENUES as MOCK_VENUES } from "./mockData";

/* ---------------------- CONFIG ---------------------- */

// Simulated "now" for the whole product. Change this one constant to move
// tonight/weekend/upcoming logic to a different date for a live demo.
export const DEMO_NOW = new Date("2026-09-12T16:00:00");

// Fixed user origin for MVP distance calculations (Water Street, downtown Tampa).
export const ORIGIN = { lat: 27.9429, lng: -82.4551 };

export const WEIGHTS = {
  bestBet: {
    significance: 0.25, venueQuality: 0.15, demand: 0.20,
    socialBuzz: 0.15, uniqueness: 0.10, value: 0.15,
  },
  timingBonusPrimeNight: 4,
  timingPenaltyOffPeak: -4,
  personalMatch: {
    base: 50,
    perTagOverlap: 8,
    maxTagOverlapPoints: 32,
    groupFit: 8,
    budgetFitFull: 12,
    budgetFitPartial: 4,
    budgetOverPenalty: -20,
    distancePerMile: -3,
    maxDistancePenalty: -15,
    feedbackPerTag: 6,
    dateWindowFit: 5,
    clampMin: 30,
    clampMax: 98,
  },
  finalBlend: { personalMatch: 0.6, bestBet: 0.4 },
} as const;

const BUDGET_CEILINGS: Record<string, number> = {
  under50: 50, under100: 100, under150: 150, under250: 250, nolimit: 100000,
};

/* ---------------------- UTILITIES ---------------------- */

export function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export function estimateTravelMinutes(miles: number): number {
  return Math.max(4, Math.round(miles * 4 + 3));
}

export function formatDistance(miles: number): string {
  if (miles < 0.1) return "steps away";
  return `${miles.toFixed(1)} mi away`;
}

export function getVenue(item: Item): Venue {
  return venueRegistry[item.venueId];
}

// Mutable venue registry, seeded from the mock dataset. Live sources (e.g.
// the Ticketmaster route/hook) call registerVenues() once their results are
// normalized, so getVenue() above works identically for mock and live items
// without every call site needing to know which registry an item came from.
// This is additive — nothing about how mock data or existing scoring code
// uses getVenue() changed.
let venueRegistry: Record<string, Venue> = { ...MOCK_VENUES };
export function registerVenues(venues: Record<string, Venue>): void {
  venueRegistry = { ...venueRegistry, ...venues };
}

function startOfDay(d: Date): Date { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function isSameCalendarDay(a: Date, b: Date): boolean { return startOfDay(a).getTime() === startOfDay(b).getTime(); }

export function isLiveNow(item: Item, now: Date): boolean {
  if (item.type !== "event") return false;
  const start = new Date(item.startTime);
  const end = item.endTime ? new Date(item.endTime) : new Date(start.getTime() + 2 * 3600000);
  return start <= now && now < end;
}

const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function isPlaceOpenAt(place: PlaceItem, dateTime: Date): boolean {
  const key = DOW[dateTime.getDay()];
  const todayHours = place.hours[key];
  if (!todayHours) return false;
  const [openHour, closeHour] = todayHours;
  const hour = dateTime.getHours() + dateTime.getMinutes() / 60;
  return hour >= openHour && hour < closeHour;
}
export function isPlaceOpen(place: PlaceItem, now: Date): boolean {
  return isPlaceOpenAt(place, now);
}

export function isTonight(item: Item, now: Date): boolean {
  if (item.type === "place") return isPlaceOpen(item, now);
  const start = new Date(item.startTime);
  const nightCutoff = addDays(startOfDay(now), 1);
  nightCutoff.setHours(4, 0, 0, 0);
  const startsLaterTonight = isSameCalendarDay(start, now) && start > now && start < nightCutoff;
  return startsLaterTonight || isLiveNow(item, now);
}
export function isTomorrow(item: Item, now: Date): boolean {
  const tmrw = addDays(now, 1);
  if (item.type === "place") return true;
  return isSameCalendarDay(new Date(item.startTime), tmrw);
}
export function isThisWeekend(item: Item, now: Date): boolean {
  const day = now.getDay();
  const daysUntilSun = day === 0 ? 0 : 7 - day;
  const weekendEnd = addDays(startOfDay(now), daysUntilSun);
  weekendEnd.setHours(23, 59, 59, 999);
  if (item.type === "place") return true;
  const start = new Date(item.startTime);
  const upcoming = start > now || isLiveNow(item, now);
  return upcoming && start <= weekendEnd;
}

export function priceRangeFor(item: Item): { min: number; max: number } {
  if (item.type === "event") return { min: item.priceMin, max: item.priceMax };
  const table: Record<string, { min: number; max: number }> = {
    "$": { min: 12, max: 22 }, "$$": { min: 22, max: 40 },
    "$$$": { min: 40, max: 75 }, "$$$$": { min: 75, max: 140 },
  };
  return table[item.priceLevel] || { min: 20, max: 40 };
}
export function formatPrice(item: Item): string {
  const { min, max } = priceRangeFor(item);
  if (min === 0 && max <= 25) return max === 0 ? "Free" : `Free–$${max}`;
  return `$${min}–$${max}`;
}

/* ---------------------- SCORING ---------------------- */

export function computeBestBet(item: Item, now: Date): BestBetResult {
  const c = item.bestBetComponents;
  const w = WEIGHTS.bestBet;
  const weighted =
    c.significance * w.significance + c.venueQuality * w.venueQuality +
    c.demand * w.demand + c.socialBuzz * w.socialBuzz +
    c.uniqueness * w.uniqueness + c.value * w.value;

  let timingAdj = 0;
  if (item.type === "event") {
    const start = new Date(item.startTime);
    const dow = start.getDay();
    const hour = start.getHours();
    const isPrimeNight = (dow === 5 || dow === 6) && hour >= 18;
    const isWeekdayDaytime = dow >= 1 && dow <= 4 && hour < 17;
    if (isPrimeNight) timingAdj = WEIGHTS.timingBonusPrimeNight;
    else if (isWeekdayDaytime) timingAdj = WEIGHTS.timingPenaltyOffPeak;
  }
  const final = Math.round(Math.max(0, Math.min(100, weighted + timingAdj)));
  return { final, weighted: Math.round(weighted), timingAdj, components: c };
}

export function computePersonalMatch(
  item: Item, prefs: UserPrefs, feedback: FeedbackStore, now: Date,
  dateWindow: AskConstraints["dateWindow"] | null, budgetOverride?: number | null,
): PersonalMatchResult {
  const w = WEIGHTS.personalMatch;
  const overlapTags = item.tags.filter((t) => prefs.tags.includes(t));
  const tagOverlap = Math.min(overlapTags.length * w.perTagOverlap, w.maxTagOverlapPoints);

  const price = priceRangeFor(item);
  const budgetCeil = budgetOverride ?? (BUDGET_CEILINGS[prefs.budget] ?? 150);
  const budgetFit = price.max <= budgetCeil ? w.budgetFitFull
    : price.max <= budgetCeil * 1.25 ? w.budgetFitPartial
    : w.budgetOverPenalty;

  let groupFit = 0;
  if (prefs.group === "group" && item.tags.includes("Good for Groups")) groupFit = w.groupFit;
  if (prefs.group === "date" && item.tags.includes("Good for Dates")) groupFit = w.groupFit;

  const venue = getVenue(item);
  const distanceMiles = Math.round(haversineMiles(ORIGIN, venue) * 10) / 10;
  const distancePenalty = item.city !== "Tampa" ? 0 : Math.max(w.maxDistancePenalty, Math.round(distanceMiles * w.distancePerMile));

  let feedbackAdjustment = 0;
  item.tags.forEach((t) => { if (feedback.tagAdjustments[t]) feedbackAdjustment += feedback.tagAdjustments[t]; });
  feedbackAdjustment = Math.max(-12, Math.min(12, feedbackAdjustment));

  let dateWindowFit = 0;
  if (dateWindow) {
    const fits =
      (dateWindow === "tonight" && isTonight(item, now)) ||
      (dateWindow === "tomorrow" && isTomorrow(item, now)) ||
      (dateWindow === "weekend" && isThisWeekend(item, now));
    if (fits) dateWindowFit = w.dateWindowFit;
  }

  const raw = w.base + tagOverlap + budgetFit + groupFit + distancePenalty + feedbackAdjustment + dateWindowFit;
  const final = Math.max(w.clampMin, Math.min(w.clampMax, Math.round(raw)));
  return { final, tagOverlap, matchedTags: overlapTags, budgetFit, groupFit, distanceMiles, distancePenalty, feedbackAdjustment, dateWindowFit };
}

export function finalRankScore(bestBet: number, personalMatch: number): number {
  const b = WEIGHTS.finalBlend;
  return Math.round(personalMatch * b.personalMatch + bestBet * b.bestBet);
}

/* ---------------------- EXPLANATIONS ---------------------- */

export function generateReasons(item: Item, match: PersonalMatchResult, bestBet: BestBetResult): string[] {
  const reasons: { text: string; weight: number }[] = [];

  if (match.matchedTags.length > 0) {
    reasons.push({ text: `Matches your preference for ${match.matchedTags.slice(0, 2).join(" and ")}`, weight: match.tagOverlap });
  }
  if (match.budgetFit >= WEIGHTS.personalMatch.budgetFitFull) {
    reasons.push({ text: `Within your typical budget at ${formatPrice(item)} per person`, weight: match.budgetFit });
  } else if (match.budgetFit <= 0) {
    reasons.push({ text: `Runs above your usual budget (${formatPrice(item)})`, weight: -match.budgetFit });
  }
  if (bestBet.components.demand >= 80) {
    reasons.push({ text: "Among the highest-demand experiences in Tampa this weekend", weight: bestBet.components.demand / 4 });
  }
  if (match.groupFit > 0) {
    reasons.push({ text: "Strong fit for groups", weight: match.groupFit });
  }
  if (match.distanceMiles <= 1.5) {
    reasons.push({ text: `${formatDistance(match.distanceMiles)} from Water Street`, weight: 10 - match.distanceMiles });
  }
  if (bestBet.components.uniqueness >= 80) {
    reasons.push({ text: "One of the more distinctive things on in Tampa right now", weight: bestBet.components.uniqueness / 5 });
  }
  if (match.feedbackAdjustment < 0) {
    reasons.push({ text: "Similar to things you've passed on before — included anyway since it ranks well", weight: 3 });
  }
  reasons.sort((a, b) => b.weight - a.weight);
  return reasons.slice(0, 3).map((r) => r.text);
}

/* ---------------------- ASK ENGINE — intent parsing, filtering, ranking ---------------------- */

export function parseIntent(query: string, prefs: UserPrefs): AskConstraints {
  const q = query.toLowerCase();
  const constraints: AskConstraints = {
    city: "Tampa",
    dateWindow: "weekend",
    budgetPerPerson: null,
    groupType: prefs.group,
    vibeTags: [],
    excludedCategories: [],
    wantsItinerary: /plan|itinerary|night of it|evening|full night/.test(q),
  };
  if (/tonight/.test(q)) constraints.dateWindow = "tonight";
  else if (/tomorrow/.test(q)) constraints.dateWindow = "tomorrow";
  else if (/weekend/.test(q)) constraints.dateWindow = "weekend";

  if (/don'?t want (a |going to )?(a )?club|not a club|no club|not necessarily a nightclub/.test(q)) {
    constraints.excludedCategories.push("Nightlife:club");
  }
  if (/upscale|fancy|nice/.test(q)) constraints.vibeTags.push("Upscale");
  if (/lively|high energy|fun/.test(q)) constraints.vibeTags.push("High Energy");
  if (/chill|relax/.test(q)) constraints.vibeTags.push("Chill");
  if (/date/.test(q)) constraints.vibeTags.push("Good for Dates");
  if (/group|friends|boys|girls/.test(q)) constraints.vibeTags.push("Good for Groups");

  const budgetMatch = q.match(/\$?(\d{2,4})/);
  if (budgetMatch) constraints.budgetPerPerson = parseInt(budgetMatch[1], 10);

  return constraints;
}

export function filterInventory(items: Item[], constraints: AskConstraints, now: Date): Item[] {
  return items.filter((item) => {
    if (item.city !== constraints.city) return false;
    const inWindow =
      constraints.dateWindow === "tonight" ? isTonight(item, now) :
      constraints.dateWindow === "tomorrow" ? isTomorrow(item, now) :
      isThisWeekend(item, now);
    if (!inWindow) return false;

    for (const excl of constraints.excludedCategories) {
      const [cat, sub] = excl.split(":");
      if (item.category === cat && (!sub || item.subcategory.toLowerCase().includes(sub))) return false;
    }
    if (constraints.budgetPerPerson) {
      const price = priceRangeFor(item);
      if (price.min > constraints.budgetPerPerson * 1.15) return false;
    }
    return true;
  });
}

export function rankCandidates(
  filtered: Item[], prefs: UserPrefs, feedback: FeedbackStore, now: Date, constraints: AskConstraints,
): ScoredItem[] {
  return filtered
    .map((item) => {
      const bestBet = computeBestBet(item, now);
      const match = computePersonalMatch(item, prefs, feedback, now, constraints.dateWindow, constraints.budgetPerPerson);
      const score = finalRankScore(bestBet.final, match.final);
      const reasons = generateReasons(item, match, bestBet);
      return { item, bestBet, match, score, reasons, distanceMiles: match.distanceMiles };
    })
    .sort((a, b) => b.score - a.score);
}

/* ---------------------- ITINERARY ---------------------- */

export function buildItinerary(ranked: ScoredItem[], now: Date): Itinerary | null {
  const dinnerSlotTime = new Date(now); dinnerSlotTime.setHours(19, 30, 0, 0);
  const drinksSlotTime = new Date(now); drinksSlotTime.setHours(21, 30, 0, 0);
  const mainSlotTime = new Date(now); mainSlotTime.setHours(23, 0, 0, 0);

  const dinnerCandidates = ranked.filter((r): r is ScoredItem & { item: PlaceItem } =>
    r.item.type === "place" && r.item.subcategory === "Restaurant" && isPlaceOpenAt(r.item, dinnerSlotTime)
  ).slice(0, 3);

  const drinksCandidates = ranked.filter((r): r is ScoredItem & { item: PlaceItem } =>
    r.item.type === "place" &&
    ["Rooftop Bar", "Lounge", "Bar"].includes(r.item.subcategory) &&
    isPlaceOpenAt(r.item, drinksSlotTime)
  ).slice(0, 3);

  const mainCandidates = ranked.filter((r): r is ScoredItem & { item: EventItem } => {
    if (r.item.type !== "event") return false;
    const start = new Date(r.item.startTime);
    const end = r.item.endTime ? new Date(r.item.endTime) : new Date(start.getTime() + 2 * 3600000);
    const validCategory = ["Nightlife", "Sports", "Comedy", "Culture", "Festival"].includes(r.item.category);
    return validCategory && end > mainSlotTime && start < new Date(mainSlotTime.getTime() + 3 * 3600000);
  }).slice(0, 3);

  if (!dinnerCandidates.length || !drinksCandidates.length || !mainCandidates.length) return null;

  let best: { dinner: ScoredItem; drinks: ScoredItem; main: ScoredItem; totalMiles: number; combinedScore: number } | null = null;
  for (const d of dinnerCandidates) {
    for (const dr of drinksCandidates) {
      for (const m of mainCandidates) {
        const v1 = getVenue(d.item), v2 = getVenue(dr.item), v3 = getVenue(m.item);
        const totalMiles = haversineMiles(v1, v2) + haversineMiles(v2, v3);
        const combinedScore = d.score + dr.score + m.score - totalMiles * 2;
        if (!best || combinedScore > best.combinedScore) best = { dinner: d, drinks: dr, main: m, totalMiles, combinedScore };
      }
    }
  }
  if (!best) return null;

  const steps: ItineraryStep[] = [
    { time: "7:30 PM", label: "Dinner", r: best.dinner },
    { time: "9:30 PM", label: "Drinks", r: best.drinks },
    { time: "11:00 PM", label: "Main Event", r: best.main },
  ];
  for (let i = 0; i < steps.length - 1; i++) {
    const vA = getVenue(steps[i].r.item);
    const vB = getVenue(steps[i + 1].r.item);
    steps[i].travelMinutes = estimateTravelMinutes(haversineMiles(vA, vB));
  }

  const mins = steps.map((s) => priceRangeFor(s.r.item).min);
  const maxs = steps.map((s) => priceRangeFor(s.r.item).max);
  return {
    steps,
    estimate: {
      min: mins.reduce((a, b) => a + b, 0),
      max: maxs.reduce((a, b) => a + b, 0),
      assumptionNote: "Assumes one drink or dish per stop beyond any listed ticket/reservation price.",
    },
    totalMiles: Math.round(best.totalMiles * 10) / 10,
  };
}
