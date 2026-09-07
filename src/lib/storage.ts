// localStorage-backed persistence. Guarded for SSR (Next.js renders this
// module on the server first, where `window`/`localStorage` don't exist).
import type { UserPrefs, FeedbackEntry } from "./types";

const KEYS = {
  prefs: "witm_prefs_v1",
  saved: "witm_saved_v1",
  itineraries: "witm_itins_v1",
  feedback: "witm_feedback_v1",
} as const;

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, val: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Storage unavailable (private browsing, quota, etc.) — fail silently in the prototype.
  }
}

export const storage = {
  getPrefs: (): UserPrefs | null => loadJSON<UserPrefs | null>(KEYS.prefs, null),
  setPrefs: (p: UserPrefs) => saveJSON(KEYS.prefs, p),
  clearPrefs: () => { if (isBrowser()) window.localStorage.removeItem(KEYS.prefs); },

  getSavedIds: (): string[] => loadJSON<string[]>(KEYS.saved, []),
  setSavedIds: (ids: string[]) => saveJSON(KEYS.saved, ids),

  getItineraries: (): any[] => loadJSON<any[]>(KEYS.itineraries, []),
  setItineraries: (items: any[]) => saveJSON(KEYS.itineraries, items),

  getFeedback: (): FeedbackEntry[] => loadJSON<FeedbackEntry[]>(KEYS.feedback, []),
  setFeedback: (entries: FeedbackEntry[]) => saveJSON(KEYS.feedback, entries),

  // "Reset prototype" in Settings — clears everything this device remembers.
  resetAll: () => {
    if (!isBrowser()) return;
    Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
  },
};
