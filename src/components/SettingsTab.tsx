import React, { useState } from "react";
import type { UserPrefs, BudgetBand, GroupType } from "@/lib/types";
import { track } from "@/lib/analytics";
import { ChevronLeft } from "./icons";

const BUDGETS: { id: BudgetBand; label: string }[] = [
  { id: "under50", label: "Under $50" }, { id: "under100", label: "Under $100" },
  { id: "under150", label: "Under $150" }, { id: "under250", label: "Under $250" },
  { id: "nolimit", label: "No hard limit" },
];
const GROUPS: { id: GroupType; label: string }[] = [
  { id: "date", label: "Date" }, { id: "friends", label: "Friends" },
  { id: "group", label: "Group" }, { id: "alone", label: "Solo" },
];

export default function SettingsTab({
  prefs, onUpdate, onReset, onClose,
}: {
  prefs: UserPrefs; onUpdate: (p: UserPrefs) => void; onReset: () => void; onClose: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-neutral-50 overflow-y-auto">
      <div className="px-5 pt-8 pb-4 flex items-center gap-3">
        <button onClick={onClose} className="rounded-full border border-white/10 p-2"><ChevronLeft className="h-4 w-4" /></button>
        <h1 className="font-serif text-2xl">Settings</h1>
      </div>

      <div className="px-5 space-y-6 pb-16">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium mb-2">Budget per person</p>
          <div className="space-y-2">
            {BUDGETS.map((b) => (
              <button key={b.id} onClick={() => onUpdate({ ...prefs, budget: b.id })}
                className={`w-full text-left rounded-xl border px-4 py-3 text-sm ${prefs.budget === b.id ? "border-amber-400 bg-amber-400/10" : "border-white/15"}`}>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium mb-2">Usually going out with</p>
          <div className="grid grid-cols-2 gap-2">
            {GROUPS.map((g) => (
              <button key={g.id} onClick={() => onUpdate({ ...prefs, group: g.id })}
                className={`rounded-xl border px-4 py-3 text-sm text-center ${prefs.group === g.id ? "border-amber-400 bg-amber-400/10" : "border-white/15"}`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 space-y-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium">Prototype disclaimer</p>
          <p className="text-sm text-neutral-400">
            What Is The Move is a prototype experience. Event and venue inventory is currently demo data and does not
            represent confirmed real events. Preferences, saves, and feedback are stored only on this device.
          </p>
        </div>

        <div className="pt-4 border-t border-white/10 space-y-2">
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="w-full rounded-full border border-red-500/30 text-red-400 py-3 text-sm font-medium">
              Reset prototype
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-neutral-400">This clears your preferences, saves, and feedback on this device. Continue?</p>
              <div className="flex gap-2">
                <button onClick={() => { track("prototype_reset", {}); onReset(); }} className="flex-1 rounded-full bg-red-500/90 text-white py-2.5 text-sm font-medium">Yes, reset</button>
                <button onClick={() => setConfirmReset(false)} className="flex-1 rounded-full border border-white/15 py-2.5 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
