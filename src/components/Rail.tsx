import React from "react";
import type { Item, UserPrefs, FeedbackStore, AskConstraints } from "@/lib/types";
import ExperienceCard from "./ExperienceCard";

export default function Rail({
  title, subtitle, items, prefs, feedback, now, dateWindow, onOpen,
}: {
  title: string; subtitle?: string; items: Item[]; prefs: UserPrefs; feedback: FeedbackStore;
  now: Date; dateWindow: AskConstraints["dateWindow"] | null; onOpen: (item: Item) => void;
}) {
  if (!items.length) return null;
  return (
    <section className="space-y-3">
      <div className="px-4">
        <h2 className="font-serif text-2xl text-neutral-50">{title}</h2>
        {subtitle && <p className="text-sm text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-none">
        {items.map((it) => (
          <ExperienceCard key={it.id} item={it} prefs={prefs} feedback={feedback} now={now} dateWindow={dateWindow} onOpen={onOpen} size="hero" />
        ))}
      </div>
    </section>
  );
}
