import React, { useState } from "react";
import type { Item, UserPrefs, FeedbackStore, ScoredItem, Itinerary, AskConstraints } from "@/lib/types";
import { parseIntent, filterInventory, rankCandidates, buildItinerary, getVenue, formatDistance } from "@/lib/engine";
import { track } from "@/lib/analytics";
import ExperienceCard from "./ExperienceCard";
import { Sparkles, Send, Bookmark, Share2 } from "./icons";
import type { SavedItinerary } from "@/lib/hooks";

const QUICK_PROMPTS = [
  "What should I do tonight?",
  "Plan a date night Friday under $200",
  "Good crowd, upscale but fun, don't want a club, $200 each",
  "What's worth traveling for this month?",
];

function templatedIntro(constraints: AskConstraints): string {
  const parts: string[] = [];
  parts.push(constraints.dateWindow === "tonight" ? "tonight" : constraints.dateWindow === "tomorrow" ? "tomorrow" : "this weekend");
  if (constraints.budgetPerPerson) parts.push(`around $${constraints.budgetPerPerson} a person`);
  if (constraints.excludedCategories.length) parts.push("skipping the club scene");
  return `Here's what fits ${parts.join(", ")} — ranked, not just listed.`;
}

interface AskResult {
  constraints: AskConstraints;
  picks: ScoredItem[];
  itinerary: Itinerary | null;
  intro: string;
}

export default function AskConcierge({
  prefs, feedback, now, items, saveItinerary, onOpen,
}: {
  prefs: UserPrefs; feedback: FeedbackStore; now: Date; items: Item[];
  saveItinerary: (itin: Omit<SavedItinerary, "id" | "savedAt">) => void;
  onOpen: (item: Item) => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);

  async function handleAsk(q: string) {
    setQuery(q);
    setLoading(true);
    setResult(null);
    track("ask_submitted", { query: q });

    // Steps 1-3 always run in application code — the server/AI is never
    // asked to choose or score anything, only (optionally) to phrase step 4.
    const constraints = parseIntent(q, prefs);
    const filtered = filterInventory(items, constraints, now);
    const ranked = rankCandidates(filtered, prefs, feedback, now, constraints);
    const picks = ranked.slice(0, 3);
    const itinerary = constraints.wantsItinerary ? buildItinerary(ranked, now) : null;

    let intro = templatedIntro(constraints);
    try {
      const resp = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ constraints, pickIds: picks.map((p) => p.item.id) }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.intro) intro = data.intro;
      }
      // A non-ok response (e.g. 503 because no ANTHROPIC_API_KEY is configured)
      // is expected and fine — the deterministic templatedIntro() above stands.
    } catch {
      // Network hiccup or no server available — same deterministic fallback.
    }

    setResult({ constraints, picks, itinerary, intro });
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 pb-28">
      <div className="px-5 pt-8 pb-4">
        <h1 className="font-serif text-3xl">What's the move?</h1>
        <p className="text-neutral-400 text-sm mt-1">Tell it what kind of night you want. It'll do the deciding.</p>
      </div>

      <div className="px-5 space-y-2">
        {!result && !loading && QUICK_PROMPTS.map((p) => (
          <button key={p} onClick={() => handleAsk(p)} className="w-full text-left rounded-xl border border-white/10 px-4 py-3 text-neutral-200 hover:border-white/25">{p}</button>
        ))}

        {loading && <div className="pt-6 flex items-center gap-2 text-neutral-400 text-sm"><Sparkles className="h-4 w-4 animate-pulse text-amber-400" /> Filtering and ranking tonight's options…</div>}

        {result && !loading && (
          <div className="pt-2 space-y-5">
            <p className="text-neutral-300 text-sm">{result.intro}</p>
            <p className="text-[11px] text-neutral-500">
              Understood: {result.constraints.dateWindow}
              {result.constraints.budgetPerPerson ? ` · ~$${result.constraints.budgetPerPerson}pp` : ""}
              {` · ${result.constraints.groupType}`}
              {result.constraints.excludedCategories.length ? " · no nightclubs" : ""}
            </p>

            {result.picks.length === 0 && <p className="text-sm text-neutral-400">Nothing in the current demo catalog cleanly fits that — try loosening the budget or date window.</p>}

            <div className="space-y-3">
              {result.picks.map(({ item }) => (
                <ExperienceCard key={item.id} item={item} prefs={prefs} feedback={feedback} now={now} dateWindow={result.constraints.dateWindow} onOpen={onOpen} />
              ))}
            </div>

            {result.constraints.wantsItinerary && !result.itinerary && (
              <p className="text-sm text-neutral-400">Couldn't build a full evening that respects opening hours and event times from the current catalog — showing top picks instead.</p>
            )}

            {result.itinerary && (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 space-y-3">
                <h3 className="font-serif text-lg">Your evening</h3>
                {result.itinerary.steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-xs text-amber-400 font-medium w-16 pt-0.5">{step.time}</span>
                    <div className="flex-1">
                      <p className="text-xs text-neutral-500">{step.label}</p>
                      <button onClick={() => onOpen(step.r.item)} className="text-sm text-neutral-100 font-medium hover:underline">{step.r.item.title}</button>
                      <p className="text-xs text-neutral-500">{getVenue(step.r.item).name} · {formatDistance(step.r.distanceMiles)}</p>
                    </div>
                    {step.travelMinutes && <span className="text-[11px] text-neutral-500 pt-0.5">~{step.travelMinutes} min next</span>}
                  </div>
                ))}
                <p className="text-xs text-neutral-400 pt-1">Estimated night: ${result.itinerary.estimate.min}–${result.itinerary.estimate.max} per person</p>
                <p className="text-[11px] text-neutral-600">{result.itinerary.estimate.assumptionNote}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      const itin = result.itinerary!;
                      saveItinerary({
                        title: `Saturday night — ${itin.steps[2].r.item.title}`,
                        steps: itin.steps.map((s) => ({ time: s.time, label: s.label, itemId: s.r.item.id })),
                        estimate: { min: itin.estimate.min, max: itin.estimate.max },
                      });
                      track("itinerary_saved", {});
                    }}
                    className="flex-1 rounded-full border border-white/15 py-2 text-sm flex items-center justify-center gap-1.5"><Bookmark className="h-3.5 w-3.5" /> Save</button>
                  <button onClick={() => track("share_clicked", { itinerary: true })} className="flex-1 rounded-full border border-white/15 py-2 text-sm flex items-center justify-center gap-1.5"><Share2 className="h-3.5 w-3.5" /> Share</button>
                </div>
              </div>
            )}

            <button onClick={() => { setResult(null); setQuery(""); }} className="text-sm text-amber-400">Ask something else</button>
          </div>
        )}
      </div>

      <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); if (query.trim()) handleAsk(query.trim()); }} className="fixed bottom-16 left-0 right-0 px-4">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-neutral-900 px-4 py-2.5 max-w-md mx-auto">
          <input value={query} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="What should I do tonight?" className="flex-1 bg-transparent text-sm text-neutral-100 placeholder-neutral-500 outline-none" />
          <button type="submit" className="rounded-full bg-amber-400 p-1.5"><Send className="h-4 w-4 text-neutral-950" /></button>
        </div>
      </form>
    </div>
  );
}
