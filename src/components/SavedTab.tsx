import React, { useMemo } from "react";
import type { Item, UserPrefs, FeedbackStore } from "@/lib/types";
import { ALL_ITEMS } from "@/lib/mockData";
import type { SavedItinerary } from "@/lib/hooks";
import ExperienceCard from "./ExperienceCard";
import { Bookmark } from "./icons";

export default function SavedTab({
  prefs, feedback, now, savedIds, itineraries, removeItinerary, onOpen,
}: {
  prefs: UserPrefs; feedback: FeedbackStore; now: Date;
  savedIds: string[]; itineraries: SavedItinerary[]; removeItinerary: (id: string) => void;
  onOpen: (item: Item) => void;
}) {
  const itemsById = useMemo(() => Object.fromEntries(ALL_ITEMS.map((i) => [i.id, i])), []);
  const savedItems = savedIds.map((id) => itemsById[id]).filter(Boolean);

  if (!savedItems.length && !itineraries.length) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col items-center justify-center px-8 text-center pb-24">
        <Bookmark className="h-8 w-8 text-neutral-600 mb-3" />
        <p className="font-serif text-xl">Nothing saved yet</p>
        <p className="text-neutral-500 text-sm mt-1">Save events, places, or itineraries to find them here.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 pb-24 px-5 pt-8 space-y-6">
      <h1 className="font-serif text-3xl">Saved</h1>
      {itineraries.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-xl">Itineraries</h2>
          {itineraries.map((itin) => (
            <div key={itin.id} className="rounded-xl border border-white/10 bg-neutral-900 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{itin.title}</p>
                <button onClick={() => removeItinerary(itin.id)} className="text-xs text-neutral-500">Remove</button>
              </div>
              {itin.steps.map((s, i) => {
                const it = itemsById[s.itemId];
                return it ? <button key={i} onClick={() => onOpen(it)} className="block text-xs text-neutral-400 hover:text-neutral-200">{s.time} — {s.label}: {it.title}</button> : null;
              })}
              <p className="text-xs text-neutral-500">${itin.estimate.min}–${itin.estimate.max} per person</p>
            </div>
          ))}
        </div>
      )}
      {savedItems.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-serif text-xl">Events & Places</h2>
          <div className="flex flex-wrap gap-3">
            {savedItems.map((it) => <ExperienceCard key={it.id} item={it} prefs={prefs} feedback={feedback} now={now} dateWindow={null} onOpen={onOpen} />)}
          </div>
        </div>
      )}
    </div>
  );
}
