// Shared types for What Is The Move.
// This file has no React/Next dependency — it's pure data modeling,
// so it can be (and is) type-checked in isolation.

export type ItemType = "event" | "place";

export interface Venue {
  id: string;
  name: string;
  neighborhood: string;
  lat: number;
  lng: number;
}

export interface BestBetComponents {
  significance: number;
  venueQuality: number;
  demand: number;
  socialBuzz: number;
  uniqueness: number;
  value: number;
}

export interface BaseItem {
  id: string;
  type: ItemType;
  title: string;
  city: string;
  category: string;
  subcategory: string;
  venueId: string;
  image: string;
  tags: string[];
  badges: string[];
  description: string;
  bestBetComponents: BestBetComponents;
  dressCode?: string;
  ageRestriction?: string;
}

export interface EventItem extends BaseItem {
  type: "event";
  performer: string | null;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  priceMin: number;
  priceMax: number;
  ticketUrl: string | null;
  officialUrl: string | null;
}

export type WeeklyHours = Partial<Record<
  "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat",
  [number, number] // [openHour, closeHour] — closeHour can exceed 24 for past-midnight
>>;

export interface PlaceItem extends BaseItem {
  type: "place";
  cuisine: string | null;
  atmosphere: string[];
  priceLevel: "$" | "$$" | "$$$" | "$$$$";
  hours: WeeklyHours;
  reservationUrl: string | null;
  officialUrl: string | null;
}

export type Item = EventItem | PlaceItem;

export type BudgetBand = "under50" | "under100" | "under150" | "under250" | "nolimit";
export type GroupType = "date" | "friends" | "group" | "alone";

export interface UserPrefs {
  tags: string[];
  budget: BudgetBand;
  group: GroupType;
  atmosphere?: string; // upscale | high-energy | relaxed | trendy | social | low-key
}

export interface AskConstraints {
  city: string;
  dateWindow: "tonight" | "tomorrow" | "weekend";
  budgetPerPerson: number | null;
  groupType: GroupType;
  vibeTags: string[];
  excludedCategories: string[]; // e.g. "Nightlife:club"
  wantsItinerary: boolean;
}

export interface BestBetResult {
  final: number;
  weighted: number;
  timingAdj: number;
  components: BestBetComponents;
}

export interface PersonalMatchResult {
  final: number;
  tagOverlap: number;
  matchedTags: string[];
  budgetFit: number;
  groupFit: number;
  distanceMiles: number;
  distancePenalty: number;
  feedbackAdjustment: number;
  dateWindowFit: number;
}

export interface ScoredItem {
  item: Item;
  bestBet: BestBetResult;
  match: PersonalMatchResult;
  score: number;
  reasons: string[];
  distanceMiles: number;
}

export interface ItineraryStep {
  time: string;
  label: "Dinner" | "Drinks" | "Main Event";
  r: ScoredItem;
  travelMinutes?: number;
}

export interface Itinerary {
  steps: ItineraryStep[];
  estimate: { min: number; max: number; assumptionNote: string };
  totalMiles: number;
}

export type FeedbackVerdict = "good" | "bad";
export interface FeedbackEntry {
  itemId: string;
  verdict: FeedbackVerdict;
  reason: string | null;
  ts: number;
}
export interface FeedbackStore {
  entries: FeedbackEntry[];
  tagAdjustments: Record<string, number>;
}
