// Lightweight analytics wrapper. No provider is wired up in this prototype —
// events are logged to the console (and, in the browser, kept in a small
// in-memory ring buffer you can inspect via window.__witmEvents for a demo).
// To add PostHog (or similar) later: initialize its SDK in a useEffect in
// app/layout.tsx, then replace the console.log branch below with a call to
// its `.capture()` method. Nothing else in the app needs to change — every
// call site already goes through track(), not a provider SDK directly.

export type AnalyticsEvent =
  | "app_opened"
  | "onboarding_completed"
  | "onboarding_skipped"
  | "recommendation_viewed"
  | "event_opened"
  | "event_saved"
  | "event_unsaved"
  | "itinerary_saved"
  | "share_clicked"
  | "ask_submitted"
  | "cta_clicked"
  | "feedback_good"
  | "feedback_bad"
  | "prototype_reset";

const RING_BUFFER_SIZE = 100;

function ringBuffer(): any[] {
  if (typeof window === "undefined") return [];
  const w = window as any;
  if (!w.__witmEvents) w.__witmEvents = [];
  return w.__witmEvents;
}

export function track(event: AnalyticsEvent, props: Record<string, unknown> = {}): void {
  const payload = { event, props, ts: new Date().toISOString() };

  if (typeof window !== "undefined") {
    const buf = ringBuffer();
    buf.push(payload);
    if (buf.length > RING_BUFFER_SIZE) buf.shift();
  }

  // Replace this branch with a real provider call once one is configured —
  // e.g. `posthog.capture(event, props)` — the call sites never change.
  // eslint-disable-next-line no-console
  console.log("[analytics]", payload.event, payload.props);
}
