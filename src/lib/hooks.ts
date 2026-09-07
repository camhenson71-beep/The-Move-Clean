import { useEffect, useMemo, useState } from "react";
import { storage } from "./storage";
import { WEIGHTS } from "./engine";
import type { UserPrefs, FeedbackEntry, FeedbackStore, Item } from "./types";

// Hydration pattern: Next.js renders this on the server first, where
// localStorage doesn't exist, so every hook below starts from a safe
// default and only reads real storage after mount (`hydrated` flips true).
// This avoids server/client markup mismatches at the cost of one extra
// render — acceptable for a prototype, called out in the README.

export function usePrefs() {
  const [prefs, setPrefsState] = useState<UserPrefs | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setPrefsState(storage.getPrefs()); setHydrated(true); }, []);
  const setPrefs = (p: UserPrefs) => { setPrefsState(p); storage.setPrefs(p); };
  const clearPrefs = () => { setPrefsState(null); storage.clearPrefs(); };
  return { prefs, setPrefs, clearPrefs, hydrated };
}

export interface SavedItinerary {
  id: string;
  title: string;
  steps: { time: string; label: string; itemId: string }[];
  estimate: { min: number; max: number };
  savedAt: string;
}

export function useSavedStore() {
  const [savedIds, setSavedIdsState] = useState<string[]>([]);
  const [itineraries, setItinerariesState] = useState<SavedItinerary[]>([]);
  useEffect(() => {
    setSavedIdsState(storage.getSavedIds());
    setItinerariesState(storage.getItineraries());
  }, []);

  const toggleSave = (id: string) => {
    setSavedIdsState((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      storage.setSavedIds(next);
      return next;
    });
  };
  const isSaved = (id: string) => savedIds.includes(id);
  const saveItinerary = (itin: Omit<SavedItinerary, "id" | "savedAt">) => {
    setItinerariesState((cur) => {
      const next = [...cur, { ...itin, id: `itin_${Date.now()}`, savedAt: new Date().toISOString() }];
      storage.setItineraries(next);
      return next;
    });
  };
  const removeItinerary = (id: string) => {
    setItinerariesState((cur) => {
      const next = cur.filter((i) => i.id !== id);
      storage.setItineraries(next);
      return next;
    });
  };
  return { savedIds, itineraries, isSaved, toggleSave, saveItinerary, removeItinerary };
}

export function useFeedbackStore(itemsById: Record<string, Item>) {
  const [entries, setEntriesState] = useState<FeedbackEntry[]>([]);
  useEffect(() => { setEntriesState(storage.getFeedback()); }, []);

  const record = (itemId: string, verdict: "good" | "bad", reason?: string) => {
    setEntriesState((cur) => {
      const next = [...cur, { itemId, verdict, reason: reason || null, ts: Date.now() }];
      storage.setFeedback(next);
      return next;
    });
  };
  const feedbackFor = (itemId: string) => entries.filter((e) => e.itemId === itemId).slice(-1)[0] || null;

  const tagAdjustments = useMemo(() => {
    const adj: Record<string, number> = {};
    entries.forEach((e) => {
      const item = itemsById[e.itemId];
      if (!item) return;
      const delta = e.verdict === "good" ? WEIGHTS.personalMatch.feedbackPerTag : -WEIGHTS.personalMatch.feedbackPerTag;
      item.tags.forEach((t) => { adj[t] = Math.max(-12, Math.min(12, (adj[t] || 0) + delta)); });
    });
    return adj;
  }, [entries, itemsById]);

  const store: FeedbackStore = { entries, tagAdjustments };
  return { ...store, record, feedbackFor };
}
