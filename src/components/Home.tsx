import React, { useMemo } from "react";
import type { Item, UserPrefs, FeedbackStore } from "@/lib/types";
import { computeBestBet, computePersonalMatch, finalRankScore, isTonight, isThisWeekend } from "@/lib/engine";
import type { InventoryStatus } from "@/lib/useInventory";
import Rail from "./Rail";
import { Sparkles, ArrowRight } from "./icons";

function InventoryStatusLine({ status }: { status: InventoryStatus }) {
  if (status === "loading") {
    return <p className="px-5 pb-2 text-[11px] text-neutral-500">Checking Ticketmaster for live Tampa events…</p>;
  }
  if (status === "live") {
    return <p className="px-5 pb-2 text-[11px] text-emerald-400/80">Live Ticketmaster listings for Tampa, ranked for you.</p>;
  }
  if (status === "error-fallback") {
    return <p className="px-5 pb-2 text-[11px] text-neutral-500">Live event data unavailable right now — showing prototype demo inventory.</p>;
  }
  // empty-fallback
  return <p className="px-5 pb-2 text-[11px] text-neutral-500">No live Tampa events found for this window — showing prototype demo inventory.</p>;
}

export default function Home({
  prefs, feedback, now, items, inventoryStatus, onOpen, onAsk,
}: {
  prefs: UserPrefs; feedback: FeedbackStore; now: Date; items: Item[]; inventoryStatus: InventoryStatus;
  onOpen: (item: Item) => void; onAsk: () => void;
}) {
  const tampaItems = useMemo(() => items.filter((i) => i.city === "Tampa"), [items]);
  const travelItems = useMemo(() => items.filter((i) => i.city !== "Tampa"), [items]);

  function scoreOf(item: Item, dateWindow: "tonight" | "tomorrow" | "weekend" | null) {
    const bestBet = computeBestBet(item, now);
    const match = computePersonalMatch(item, prefs, feedback, now, dateWindow);
    return finalRankScore(bestBet.final, match.final);
  }

  const shortlist = useMemo(() => [...tampaItems].sort((a, b) => scoreOf(b, null) - scoreOf(a, null)).slice(0, 5), [tampaItems, prefs, feedback.entries.length]);
  const tonight = useMemo(() => tampaItems.filter((i) => isTonight(i, now)).sort((a, b) => scoreOf(b, "tonight") - scoreOf(a, "tonight")).slice(0, 6), [tampaItems, prefs, feedback.entries.length]);
  const weekend = useMemo(() => tampaItems.filter((i) => isThisWeekend(i, now) && !isTonight(i, now)).sort((a, b) => scoreOf(b, "weekend") - scoreOf(a, "weekend")), [tampaItems, prefs, feedback.entries.length]);
  const travel = useMemo(() => [...travelItems].sort((a, b) => scoreOf(b, null) - scoreOf(a, null)), [travelItems, prefs, feedback.entries.length]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 pb-24">
      <div className="px-5 pt-8 pb-2">
        <p className="text-amber-400 text-sm font-medium tracking-tight">What Is The Move</p>
        <h1 className="font-serif text-3xl mt-0.5">What's moving in Tampa</h1>
      </div>
      <InventoryStatusLine status={inventoryStatus} />

      <button onClick={onAsk} className="mx-5 mb-6 mt-3 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3.5 w-[calc(100%-2.5rem)]">
        <Sparkles className="h-5 w-5 text-amber-400" />
        <span className="text-sm text-neutral-100">What's the move? — "Plan my Saturday under $150"</span>
        <ArrowRight className="h-4 w-4 text-neutral-500 ml-auto" />
      </button>

      {tampaItems.length === 0 && travelItems.length === 0 ? (
        <p className="px-5 text-sm text-neutral-400">Nothing to show right now — try again in a moment.</p>
      ) : (
        <div className="space-y-8">
          <Rail title="The Shortlist" subtitle="If you only knew about five things in Tampa this week, make it these." items={shortlist} prefs={prefs} feedback={feedback} now={now} dateWindow={null} onOpen={onOpen} />
          <Rail title="Tonight" subtitle="Still time to make a move." items={tonight} prefs={prefs} feedback={feedback} now={now} dateWindow="tonight" onOpen={onOpen} />
          <Rail title="This Weekend" subtitle="The rest of Friday through Sunday." items={weekend} prefs={prefs} feedback={feedback} now={now} dateWindow="weekend" onOpen={onOpen} />
          <Rail title="Worth Traveling For" subtitle="Bigger than a weeknight — Miami and Atlanta this month." items={travel} prefs={prefs} feedback={feedback} now={now} dateWindow={null} onOpen={onOpen} />
        </div>
      )}

      <p className="px-5 pt-6 text-[11px] text-neutral-600">Prototype experience. Non-live listings are demo data.</p>
    </div>
  );
}
