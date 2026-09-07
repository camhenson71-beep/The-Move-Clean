import React, { useState } from "react";
import type { UserPrefs, BudgetBand, GroupType } from "@/lib/types";
import { track } from "@/lib/analytics";

const TAG_OPTIONS = [
  "Upscale", "Good Food", "Live Music", "Hip Hop", "R&B", "House", "Sports",
  "Comedy", "Culture", "Day Parties", "Nightlife", "Outdoors", "Good for Dates", "Good for Groups",
];
const BUDGETS: { id: BudgetBand; label: string }[] = [
  { id: "under50", label: "Under $50" },
  { id: "under100", label: "Under $100" },
  { id: "under150", label: "Under $150" },
  { id: "under250", label: "Under $250" },
  { id: "nolimit", label: "No hard limit" },
];
const GROUPS: { id: GroupType; label: string }[] = [
  { id: "date", label: "Date" },
  { id: "friends", label: "Friends" },
  { id: "group", label: "Group" },
  { id: "alone", label: "Solo" },
];
const ATMOSPHERES = ["Upscale", "High energy", "Relaxed", "Trendy", "Social", "Low key"];

export default function Onboarding({ onFinish, onSkip }: { onFinish: (p: UserPrefs) => void; onSkip: () => void }) {
  const [step, setStep] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [budget, setBudget] = useState<BudgetBand | null>(null);
  const [group, setGroup] = useState<GroupType | null>(null);
  const [atmosphere, setAtmosphere] = useState<string | null>(null);

  const toggleTag = (t: string) => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const canContinue = step === 0 ? tags.length >= 2 : step === 1 ? !!budget : step === 2 ? !!group : !!atmosphere;

  function finish() {
    const prefs: UserPrefs = {
      tags: atmosphere ? [...tags, atmosphere] : tags,
      budget: budget || "under150",
      group: group || "friends",
      atmosphere: atmosphere || undefined,
    };
    track("onboarding_completed", { tagCount: tags.length, budget, group, atmosphere });
    onFinish(prefs);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col">
      <div className="px-6 pt-10 pb-4 flex items-start justify-between">
        <div>
          <p className="text-amber-400 text-sm font-medium">Step {step + 1} of 4</p>
          <h1 className="font-serif text-3xl mt-2 leading-tight">
            {step === 0 && "What are you into?"}
            {step === 1 && "Typical spend per person"}
            {step === 2 && "Who are you usually out with?"}
            {step === 3 && "What crowd do you prefer?"}
          </h1>
        </div>
        <button onClick={() => { track("onboarding_skipped", { atStep: step }); onSkip(); }} className="text-sm text-neutral-500 pt-1">Skip</button>
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        {step === 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {TAG_OPTIONS.map((t) => {
              const active = tags.includes(t);
              return (
                <button key={t} onClick={() => toggleTag(t)}
                  className={`rounded-full px-4 py-2 text-sm border transition-colors ${active ? "bg-amber-400 text-neutral-950 border-amber-400 font-medium" : "border-white/15 text-neutral-300 hover:border-white/30"}`}>
                  {t}
                </button>
              );
            })}
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3 pt-2">
            {BUDGETS.map((b) => (
              <button key={b.id} onClick={() => setBudget(b.id)}
                className={`w-full text-left rounded-xl border px-4 py-4 transition-colors ${budget === b.id ? "border-amber-400 bg-amber-400/10" : "border-white/15"}`}>
                {b.label}
              </button>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {GROUPS.map((g) => (
              <button key={g.id} onClick={() => setGroup(g.id)}
                className={`rounded-xl border px-4 py-6 text-center transition-colors ${group === g.id ? "border-amber-400 bg-amber-400/10" : "border-white/15"}`}>
                {g.label}
              </button>
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {ATMOSPHERES.map((a) => (
              <button key={a} onClick={() => setAtmosphere(a)}
                className={`rounded-xl border px-4 py-6 text-center transition-colors ${atmosphere === a ? "border-amber-400 bg-amber-400/10" : "border-white/15"}`}>
                {a}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-6">
        <button disabled={!canContinue}
          onClick={() => { if (step < 3) setStep(step + 1); else finish(); }}
          className={`w-full rounded-full py-3.5 font-medium transition-colors ${canContinue ? "bg-amber-400 text-neutral-950" : "bg-neutral-800 text-neutral-500"}`}>
          {step < 3 ? "Continue" : "Find my move"}
        </button>
      </div>
    </div>
  );
}
