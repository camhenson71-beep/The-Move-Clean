import React, { useState } from "react";
import type { Item, UserPrefs, FeedbackStore } from "@/lib/types";
import { getVenue, haversineMiles, ORIGIN, formatDistance, formatPrice } from "@/lib/engine";
import { track } from "@/lib/analytics";
import { useScored, ScorePill, BadgeRow, formatEventTime } from "./ExperienceCard";
import ExperienceCard from "./ExperienceCard";
import { ChevronLeft, Bookmark, Share2, MapPin, Calendar, DollarSign, Clock, Ticket } from "./icons";

const DISMISS_REASONS = ["Too expensive", "Wrong vibe", "Too far", "Bad timing", "Not interested"];

function FeedbackRow({
  item, feedbackFor, record,
}: {
  item: Item;
  feedbackFor: (id: string) => { verdict: "good" | "bad"; reason?: string | null } | null;
  record: (id: string, verdict: "good" | "bad", reason?: string) => void;
}) {
  const existing = feedbackFor(item.id);
  const [showReasons, setShowReasons] = useState(false);
  const [done, setDone] = useState(existing);
  if (done) {
    return (
      <p className="text-xs text-neutral-500">
        Thanks — noted {done.verdict === "good" ? "you liked this" : `this wasn't for you${done.reason ? ` (${done.reason})` : ""}`}. This adjusts future recommendations on this device.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button onClick={() => { record(item.id, "good"); track("feedback_good", { itemId: item.id }); setDone({ verdict: "good" }); }}
          className="flex-1 rounded-full border border-white/15 py-2 text-sm">Good recommendation</button>
        <button onClick={() => setShowReasons(true)} className="flex-1 rounded-full border border-white/15 py-2 text-sm">Not for me</button>
      </div>
      {showReasons && (
        <div className="flex flex-wrap gap-1.5">
          {DISMISS_REASONS.map((r) => (
            <button key={r} onClick={() => { record(item.id, "bad", r); track("feedback_bad", { itemId: item.id, reason: r }); setDone({ verdict: "bad", reason: r }); }}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-neutral-300">{r}</button>
          ))}
        </div>
      )}
    </div>
  );
}

async function shareItem(item: Item) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const shareData = { title: `${item.title} — What Is The Move`, text: `Check out ${item.title} on What Is The Move`, url };
  track("share_clicked", { itemId: item.id });
  if (typeof navigator !== "undefined" && (navigator as any).share) {
    try { await (navigator as any).share(shareData); return; } catch { /* user cancelled or unsupported — fall through */ }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try { await navigator.clipboard.writeText(url); alert("Link copied — paste it anywhere to share."); return; } catch { /* ignore */ }
  }
}

export default function ExperienceDetail({
  item, prefs, feedback, now, items, isSaved, toggleSave, feedbackFor, record, onClose, onOpen,
}: {
  item: Item; prefs: UserPrefs; feedback: FeedbackStore; now: Date; items: Item[];
  isSaved: (id: string) => boolean; toggleSave: (id: string) => void;
  feedbackFor: (id: string) => { verdict: "good" | "bad"; reason?: string | null } | null;
  record: (id: string, verdict: "good" | "bad", reason?: string) => void;
  onClose: () => void; onOpen: (item: Item) => void;
}) {
  const scored = useScored(item, prefs, feedback, now, null);
  const venue = getVenue(item);
  const distanceMiles = haversineMiles(ORIGIN, venue);
  const isPlace = item.type === "place";

  const companions = items
    .filter((e) => e.id !== item.id && e.city === "Tampa")
    .map((e) => ({ e, d: haversineMiles(getVenue(e), venue) }))
    .filter((x) => x.d <= 1.6)
    .sort((a, b) => a.d - b.d)
    .slice(0, 2)
    .map((x) => x.e);

  const ticketUrl = item.type === "event" ? item.ticketUrl : null;
  const reservationUrl = item.type === "place" ? item.reservationUrl : null;
  const officialUrl = item.officialUrl;
  const ctaUrl = ticketUrl || reservationUrl || officialUrl;
  const ctaLabel = ticketUrl ? "Tickets" : reservationUrl ? "Reserve" : officialUrl ? "Official Site" : null;
  const isLiveTicket = item.type === "event" && item.source === "ticketmaster";

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-neutral-50 overflow-y-auto">
      <div className="relative h-72 w-full">
        <img src={item.image} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-black/20 to-black/30" />
        <button onClick={onClose} className="absolute top-4 left-4 rounded-full bg-black/50 p-2 backdrop-blur"><ChevronLeft className="h-5 w-5" /></button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => { toggleSave(item.id); track(isSaved(item.id) ? "event_unsaved" : "event_saved", { itemId: item.id }); }} className="rounded-full bg-black/50 p-2 backdrop-blur">
            <Bookmark className="h-5 w-5" filled={isSaved(item.id)} />
          </button>
          <button onClick={() => shareItem(item)} className="rounded-full bg-black/50 p-2 backdrop-blur"><Share2 className="h-5 w-5" /></button>
        </div>
        <div className="absolute bottom-4 left-4 right-4"><BadgeRow badges={item.badges} /><h1 className="font-serif text-3xl mt-2">{item.title}</h1></div>
      </div>

      <div className="px-5 py-5 space-y-6">
        <div className="flex flex-wrap gap-2">
          <ScorePill label="Move Score" value={scored.bestBet.final} tone="teal" />
          <ScorePill label="For You" value={scored.match.final} tone="brass" />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-neutral-300"><Calendar className="h-4 w-4 text-amber-400" />{formatEventTime(item, now)}</div>
          <div className="flex items-center gap-2 text-neutral-300"><MapPin className="h-4 w-4 text-amber-400" />{venue.name}, {venue.neighborhood}</div>
          <div className="flex items-center gap-2 text-neutral-300"><DollarSign className="h-4 w-4 text-amber-400" />{formatPrice(item)}</div>
          <div className="flex items-center gap-2 text-neutral-300"><Clock className="h-4 w-4 text-amber-400" />{formatDistance(distanceMiles)}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-neutral-900 p-4 space-y-1.5">
          <p className="text-xs uppercase tracking-wide text-amber-400 font-medium">Why we picked it</p>
          <ul className="space-y-1">{scored.reasons.map((r) => <li key={r} className="text-neutral-200 text-sm leading-relaxed">· {r}</li>)}</ul>
        </div>

        <p className="text-sm text-neutral-400">{item.description}</p>
        {item.dressCode && <p className="text-xs text-neutral-500">Dress code — {item.dressCode}</p>}
        {item.ageRestriction && <p className="text-xs text-neutral-500">Age requirement — {item.ageRestriction}</p>}
        {isPlace && "cuisine" in item && item.cuisine && <p className="text-xs text-neutral-500">Cuisine — {item.cuisine}</p>}

        {ctaUrl ? (
          <a href={ctaUrl} target={isLiveTicket ? "_blank" : undefined} rel={isLiveTicket ? "noopener noreferrer" : undefined}
            onClick={() => track("cta_clicked", { itemId: item.id, label: ctaLabel })}
            className="flex items-center justify-center gap-2 rounded-full bg-amber-400 text-neutral-950 py-3 font-medium">
            <Ticket className="h-4 w-4" /> {ctaLabel} <span className="text-xs opacity-70">{isLiveTicket ? "(Ticketmaster)" : "(demo link)"}</span>
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-full border border-white/15 text-neutral-400 py-3 font-medium">
            Demo Listing
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-neutral-500 font-medium">Was this a good call?</p>
          <FeedbackRow item={item} feedbackFor={feedbackFor} record={record} />
        </div>

        {companions.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-serif text-xl">Build My Night</h3>
            <div className="flex gap-3 overflow-x-auto scrollbar-none">
              {companions.map((e) => <ExperienceCard key={e.id} item={e} prefs={prefs} feedback={feedback} now={now} dateWindow={null} onOpen={onOpen} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
