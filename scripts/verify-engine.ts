// Runs the exact product-test scenario against the ported TypeScript engine
// and prints the ranking math, so the port can be checked against the
// previously-validated JS version rather than just trusted by eye.
import { ALL_ITEMS } from "../src/lib/mockData";
import {
  DEMO_NOW, parseIntent, filterInventory, rankCandidates, buildItinerary, getVenue, formatDistance,
} from "../src/lib/engine";
import type { UserPrefs, FeedbackStore } from "../src/lib/types";

const now = DEMO_NOW;
const prefs: UserPrefs = {
  tags: ["Upscale", "High Energy", "Good for Groups", "Sports", "R&B", "Hip Hop", "House", "Foodie"],
  budget: "nolimit",
  group: "group",
};
const feedback: FeedbackStore = { entries: [], tagAdjustments: {} };
const query = "good crowd, upscale but fun, don't want a club, $200 each, Saturday night with two friends";

const constraints = parseIntent(query, prefs);
console.log("=== PARSED CONSTRAINTS ===");
console.log(constraints);

const filtered = filterInventory(ALL_ITEMS, constraints, now);
console.log(`\n=== FILTERED: ${filtered.length} of ${ALL_ITEMS.length} ===`);

const ranked = rankCandidates(filtered, prefs, feedback, now, constraints);
console.log("\n=== TOP 5 ===");
ranked.slice(0, 5).forEach((r, i) => {
  console.log(`#${i + 1} ${r.item.title}  bestBet=${r.bestBet.final} match=${r.match.final} final=${r.score}`);
  console.log(`   reasons: ${JSON.stringify(r.reasons)}`);
});

const itinerary = buildItinerary(ranked, now);
console.log("\n=== ITINERARY ===");
if (!itinerary) {
  console.log("No valid itinerary.");
} else {
  itinerary.steps.forEach((s) => {
    console.log(`${s.time} ${s.label}: ${s.r.item.title} (${getVenue(s.r.item).name}, ${formatDistance(s.r.distanceMiles)})`);
  });
  console.log(`Estimated: $${itinerary.estimate.min}-$${itinerary.estimate.max} per person`);
}
