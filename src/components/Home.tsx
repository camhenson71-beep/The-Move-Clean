import React, { useMemo } from "react";
import type { Item, UserPrefs, FeedbackStore } from "@/lib/types";
import { ALL_ITEMS } from "@/lib/mockData";
import { computeBestBet, computePersonalMatch, finalRankScore, isTonight, isThisWeekend } from "@/lib/engine";
import Rail from "./Rail";
import { Sparkles, ArrowRight } from "./icons";

export default function Home({
  prefs, feedback, now, onOpen, onAsk,
}: {
  prefs: UserPrefs; feedback: FeedbackStore; now: Date; onOpen: (item: Item) => void; onAsk: () => void;
}) {
  const tampaItems = useMemo(() => ALL_ITEMS.filter((i) => i.city === "Tampa"), []);
  const travelItems = useMemo(() => ALL_ITEMS.filter((i) => i.city !== "Tampa"), []);

  function scoreOf(item: Item, dateWindow: "tonight" | "tomorrow" | "weekend" | null) {
    const bestBet = computeBestBet(item, now);
    const match = computePersonalMatch(item, prefs, feedback, now, dateWindow);
    return finalRankScore(bestBet.final, match.final);
  }

  const shortlist = useMemo(() => [...tampaItems].sort((a, b) => scoreOf(b, null) - scoreOf(a, null)).slice(0, 5), [prefs, feedback.entries.length]);
  const tonight = useMemo(() => tampaItems.filter((i) => isTonight(i, now)).sort((a, b) => scoreOf(b, "tonight") - scoreOf(a, "tonight")).slice(0, 6), [prefs, feedback.entries.length]);
  const weekend = useMemo(() => tampaItems.filter((i) => isThisWeekend(i, now) && !isTonight(i, now)).sort((a, b) => scoreOf(b, "weekend") - scoreOf(a, "weekend")), [prefs, feedback.entries.length]);
  const travel = useMemo(() => [...travelItems].sort((a, b) => scoreOf(b, null) - scoreOf(a, null)), [prefs, feedback.entries.length]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 pb-24">
      <div className="px-5 pt-8 pb-5">
        <p className="text-amber-400 text-sm font-medium tracking-tight">What Is The Move</p>
        <h1 className="font-serif text-3xl mt-0.5">What's moving in Tampa</h1>
      </div>

      <button onClick={onAsk} className="mx-5 mb-6 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3.5 w-[calc(100%-2.5rem)]">
        <Sparkles className="h-5 w-5 text-amber-400" />
        <span className="text-sm text-neutral-100">What's the move? — "Plan my Saturday under $150"</span>
        <ArrowRight className="h-4 w-4 text-neutral-500 ml-auto" />
      </button>

      <div className="space-y-8">
        <Rail title="The Shortlist" subtitle="If you only knew about five things in Tampa this week, make it these." items={shortlist} prefs={prefs} feedback={feedback} now={now} dateWindow={null} onOpen={onOpen} />
        <Rail title="Tonight" subtitle="Still time to make a move." items={tonight} prefs={prefs} feedback={feedback} now={now} dateWindow="tonight" onOpen={onOpen} />
        <Rail title="This Weekend" subtitle="The rest of Friday through Sunday." items={weekend} prefs={prefs} feedback={feedback} now={now} dateWindow="weekend" onOpen={onOpen} />
        <Rail title="Worth Traveling For" subtitle="Bigger than a weeknight — Miami and Atlanta this month." items={travel} prefs={prefs} feedback={feedback} now={now} dateWindow={null} onOpen={onOpen} />
      </div>

      <p className="px-5 pt-6 text-[11px] text-neutral-600">Prototype experience. Event inventory is currently demo data.</p>
    </div>
  );
}
