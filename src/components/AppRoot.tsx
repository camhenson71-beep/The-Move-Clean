"use client";
import React, { useEffect, useMemo, useState } from "react";
import type { Item, UserPrefs } from "@/lib/types";
import { DEMO_NOW } from "@/lib/engine";
import { usePrefs, useSavedStore, useFeedbackStore } from "@/lib/hooks";
import { useInventory } from "@/lib/useInventory";
import { track } from "@/lib/analytics";
import Landing from "./Landing";
import Onboarding from "./Onboarding";
import Home from "./Home";
import AskConcierge from "./AskConcierge";
import SavedTab from "./SavedTab";
import SettingsTab from "./SettingsTab";
import ExperienceDetail from "./ExperienceDetail";
import TabBar, { type Tab } from "./TabBar";

export default function AppRoot() {
  const { prefs, setPrefs, clearPrefs, hydrated } = usePrefs();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Fetches live Ticketmaster events in the background (falls back to mock
  // automatically on error/empty/no-key) and starts immediately on mount —
  // not gated behind onboarding — so it's usually resolved by the time the
  // user reaches Home. See src/lib/useInventory.ts.
  const inventory = useInventory();

  const itemsById = useMemo(() => Object.fromEntries(inventory.items.map((i) => [i.id, i])), [inventory.items]);
  const saved = useSavedStore();
  const feedback = useFeedbackStore(itemsById);
  const now = DEMO_NOW; // Change this constant in src/lib/engine.ts to move the simulated "current" date/time.

  useEffect(() => { track("app_opened", {}); }, []);
  useEffect(() => {
    if (inventory.status === "live") track("live_inventory_loaded", { count: inventory.liveEventCount });
    if (inventory.status === "error-fallback") track("live_inventory_error", {});
    if (inventory.status === "empty-fallback") track("live_inventory_empty", {});
  }, [inventory.status]);

  // Wait for the one post-mount read of localStorage before deciding what to
  // show — avoids a flash of the landing page for a returning user.
  if (!hydrated) {
    return <div className="min-h-screen bg-neutral-950" />;
  }

  if (!prefs) {
    if (!showOnboarding) return <Landing onStart={() => setShowOnboarding(true)} />;
    return (
      <Onboarding
        onFinish={(p: UserPrefs) => { setPrefs(p); setShowOnboarding(false); }}
        onSkip={() => { setPrefs({ tags: [], budget: "under150", group: "friends" }); setShowOnboarding(false); }}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto relative">
      {tab === "home" && (
        <Home prefs={prefs} feedback={feedback} now={now} items={inventory.items} inventoryStatus={inventory.status}
          onOpen={setActiveItem} onAsk={() => setTab("ask")} />
      )}
      {tab === "ask" && (
        <AskConcierge prefs={prefs} feedback={feedback} now={now} items={inventory.items}
          saveItinerary={saved.saveItinerary} onOpen={setActiveItem} />
      )}
      {tab === "saved" && (
        <SavedTab prefs={prefs} feedback={feedback} now={now} items={inventory.items} savedIds={saved.savedIds} itineraries={saved.itineraries}
          removeItinerary={saved.removeItinerary} onOpen={setActiveItem} />
      )}
      <TabBar tab={tab} setTab={setTab} onSettings={() => setShowSettings(true)} />

      {activeItem && (
        <ExperienceDetail
          item={activeItem} prefs={prefs} feedback={feedback} now={now} items={inventory.items}
          isSaved={saved.isSaved} toggleSave={saved.toggleSave}
          feedbackFor={feedback.feedbackFor} record={feedback.record}
          onClose={() => setActiveItem(null)} onOpen={setActiveItem}
        />
      )}

      {showSettings && (
        <SettingsTab
          prefs={prefs}
          onUpdate={(p) => setPrefs(p)}
          onReset={() => { clearPrefs(); setShowSettings(false); window.location.reload(); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
