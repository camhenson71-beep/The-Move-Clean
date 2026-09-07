import React, { useState } from "react";
import type { Item, UserPrefs, FeedbackStore, AskConstraints } from "@/lib/types";
import {
  computeBestBet, computePersonalMatch, finalRankScore, generateReasons,
  getVenue, haversineMiles, ORIGIN, formatDistance, formatPrice,
} from "@/lib/engine";
import { MapPin, Plane, Calendar, DollarSign } from "./icons";

export function useScored(item: Item, prefs: UserPrefs, feedback: FeedbackStore, now: Date, dateWindow: AskConstraints["dateWindow"] | null) {
  const bestBet = computeBestBet(item, now);
  const match = computePersonalMatch(item, prefs, feedback, now, dateWindow);
  const score = finalRankScore(bestBet.final, match.final);
  const reasons = generateReasons(item, match, bestBet);
  return { bestBet, match, score, reasons };
}

function formatEventTime(item: Item, now: Date): string {
  if (item.type === "place") {
    const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
    const key = DOW[now.getDay()];
    const hrs = item.hours[key];
    if (!hrs) return "Closed today";
    const fmt = (h: number) => { const hh = Math.floor(h % 24); const period = hh >= 12 ? "PM" : "AM"; const disp = hh % 12 === 0 ? 12 : hh % 12; return `${disp}${period}`; };
    const nowHour = now.getHours() + now.getMinutes() / 60;
    const isOpen = nowHour >= hrs[0] && nowHour < hrs[1];
    return isOpen ? `Open now · until ${fmt(hrs[1])}` : `Opens ${fmt(hrs[0])}`;
  }
  const start = new Date(item.startTime);
  const day = start.toLocaleDateString(undefined, { weekday: "short" });
  const time = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day}, ${time}`;
}

export function ScorePill({ label, value, tone }: { label: string; value: number; tone: "brass" | "teal" }) {
  const toneClasses = tone === "brass" ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-teal-500/15 text-teal-300 border-teal-500/30";
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses}`}>{value}% {label}</span>;
}
export function BadgeRow({ badges }: { badges: string[] }) {
  if (!badges?.length) return null;
  return <div className="flex flex-wrap gap-1.5">{badges.map((b) => <span key={b} className="rounded-full bg-black/50 backdrop-blur px-2.5 py-1 text-xs text-neutral-100 border border-white/10">{b}</span>)}</div>;
}

export default function ExperienceCard({
  item, prefs, feedback, now, dateWindow, onOpen, size = "default",
}: {
  item: Item; prefs: UserPrefs; feedback: FeedbackStore; now: Date;
  dateWindow: AskConstraints["dateWindow"] | null; onOpen: (item: Item) => void; size?: "default" | "hero";
}) {
  const scored = useScored(item, prefs, feedback, now, dateWindow);
  const venue = getVenue(item);
  const distanceMiles = haversineMiles(ORIGIN, venue);
  const isWide = size === "hero";

  return (
    <button onClick={() => onOpen(item)}
      className={`text-left group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900 flex-shrink-0 ${isWide ? "w-[86%] sm:w-80" : "w-64"}`}>
      <div className="relative h-44 w-full overflow-hidden">
        <img src={item.image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute top-2 left-2"><BadgeRow badges={item.badges} /></div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <ScorePill label="For You" value={scored.match.final} tone="brass" />
          {item.city !== "Tampa" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 border border-white/10 px-2 py-1 text-xs text-neutral-200"><Plane className="h-3 w-3" /> {item.city}</span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/60 border border-white/10 px-2 py-1 text-xs text-neutral-200"><MapPin className="h-3 w-3" /> {formatDistance(distanceMiles)}</span>
          )}
        </div>
      </div>
      <div className="p-3.5 space-y-1">
        <p className="font-serif text-lg leading-tight text-neutral-50">{item.title}</p>
        <p className="text-sm text-neutral-400">{venue.name} · {venue.neighborhood}</p>
        <div className="flex items-center gap-3 pt-1 text-xs text-neutral-400">
          <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{formatEventTime(item, now)}</span>
          <span className="inline-flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatPrice(item)}</span>
        </div>
        {scored.reasons[0] && <p className="text-xs text-amber-300/90 pt-1">{scored.reasons[0]}</p>}
      </div>
    </button>
  );
}

export { formatEventTime };
