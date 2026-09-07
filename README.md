# The Move (What Is The Move) — Tampa Prototype

**Stop searching. Know the move.** An AI-assisted concierge that ranks what's
worth doing in Tampa, personalized to you — a Shortlist, Tonight, This
Weekend, Worth Traveling For, and an "Ask" box for natural-language requests
like *"good crowd, upscale but fun, don't want a club, $200 each."*

This is a **prototype**. All event and venue data is clearly-labeled mock
data (see the header comments in `src/lib/mockData.ts`) — it does not
represent real, currently-scheduled events.

---

## HOW TO RUN LOCALLY

You don't need to be a developer to do this — just follow these steps in order.

1. **Install Node.js**, if you don't already have it: go to
   [nodejs.org](https://nodejs.org), download the "LTS" version, and run the
   installer. (This gives you the `node` and `npm` commands used below.)
2. **Unzip the project** you downloaded, anywhere on your computer.
3. **Open a terminal in that folder.**
   - Mac: right-click the folder in Finder → "New Terminal at Folder" (or open
     Terminal and type `cd `, drag the folder in, press Enter).
   - Windows: open the folder in File Explorer, click the address bar, type
     `cmd`, press Enter.
4. **Run:**
   ```
   npm install
   ```
   This downloads the project's dependencies. It takes a minute or two and
   only needs to happen once.
5. **Run:**
   ```
   npm run dev
   ```
6. **Open the local URL** it prints — usually
   [http://localhost:3000](http://localhost:3000) — in your browser. For the
   real mobile feel, open your browser's device toolbar (in Chrome:
   right-click → Inspect → the little phone/tablet icon) and pick an iPhone.

To stop the server, go back to the terminal and press `Ctrl+C`.

---

## HOW TO DEPLOY TO VERCEL (so you can send a real link)

The simplest path is GitHub + Vercel, and neither requires touching a
terminal beyond what you already did above.

1. **Create a free GitHub account** at [github.com](https://github.com) if
   you don't have one.
2. **Create a new, empty repository** (the "+" in the top right → "New
   repository"). Give it any name, e.g. `what-is-the-move`. Don't add a
   README/license/gitignore — you already have those.
3. **Upload the project.** On the new repo's page, use "uploading an existing
   file" and drag in everything from the unzipped project folder — or, if
   you're comfortable with git:
   ```
   git init
   git add .
   git commit -m "Initial prototype"
   git branch -M main
   git remote add origin <the URL GitHub gave you>
   git push -u origin main
   ```
4. **Create a free Vercel account** at [vercel.com](https://vercel.com) —
   sign up with your GitHub account, this connects them automatically.
5. On the Vercel dashboard, click **"Add New… → Project"**, and pick the
   GitHub repo you just created. Vercel automatically detects it's a Next.js
   app — you don't need to change any build settings.
6. Click **Deploy**. In about a minute, Vercel gives you a live URL like
   `what-is-the-move.vercel.app` — that's your shareable link.

Any time you push a change to GitHub, Vercel automatically redeploys.

---

## ENVIRONMENT VARIABLES

**None are required.** The app works completely — onboarding, recommendations,
the Ask concierge, saving, feedback — with zero configuration.

| Variable | Required? | What it does |
|---|---|---|
| `ANTHROPIC_API_KEY` | No — optional | If set, the Ask concierge's reply is phrased by an AI model instead of a built-in template sentence. Everything it *recommends* is decided by application code either way — the AI (when configured) only ever writes one intro sentence over an already-decided list of picks. |
| `TICKETMASTER_API_KEY` | No — optional | If set, Home/Ask/Saved show real upcoming Tampa events from the Ticketmaster Discovery API instead of the mock catalog, ranked by the same Move Score / For You Score logic. Falls back to mock data automatically if unset, if the request fails, or if Ticketmaster returns nothing for the demo window. Read only in `src/app/api/events/route.ts` — never sent to the browser. |

**If you want to add the key:** in the Vercel dashboard, open your project →
**Settings → Environment Variables** → add a variable named
`ANTHROPIC_API_KEY` with your key from
[console.anthropic.com](https://console.anthropic.com) as the value → Save →
redeploy (Vercel prompts you, or push any small change to GitHub). Locally,
copy `.env.example` to a new file named `.env.local` and put the key there —
`.env.local` is already in `.gitignore` so it's never uploaded anywhere.

---

## WHAT'S PROTOTYPE VS. REAL FUNCTIONALITY

**Fully functional, not simulated:**
- Onboarding, preference storage, Home (Shortlist / Tonight / This Weekend /
  Worth Traveling For), the Ask concierge's recommendation logic, itinerary
  building, Saved (events, places, itineraries), feedback (Good / Not for
  me), Settings (edit preferences, reset prototype) — all real, all wired
  together, all persisted in your browser's local storage on your device.
- The ranking math (Move Score, For You Score, distances, budget fit, etc.)
  is real, deterministic application logic — not a simulation of a
  simulation. It runs the same whether or not an AI key is configured.

**Prototype/demo, by design:**
- **Event and venue data** is a hand-built mock catalog (20 events, 12
  places) for Tampa — not a live feed. Clearly marked as such in the code and
  in a small disclaimer line shown in the app itself.
- **"Now"** is simulated via one constant (`DEMO_NOW` in `src/lib/engine.ts`)
  rather than the real clock, so you can demo "tonight" and "this weekend"
  at any real-world time. Change that one line to move the simulated date.
- **No accounts** — preferences/saves/feedback live in your browser's local
  storage per-device, not a shared database. Clearing your browser data (or
  using "Reset prototype" in Settings) erases them.
- **Ticket/reservation links** on mock inventory are clearly labeled demo
  links (`example.com/demo-...`), not real ticket pages.
- **Analytics** are logged to the browser console only (`[analytics] ...`) —
  no data leaves the device. See `src/lib/analytics.ts` for where a real
  provider like PostHog would be wired in later.

---

## HOW DEMO TIME WORKS

Every date/time feature in the app ("Tonight," "This Weekend," which events
have already ended, itinerary timing) is computed relative to one constant:

```ts
// src/lib/engine.ts
export const DEMO_NOW = new Date("2026-09-12T16:00:00");
```

Change that line to any date/time and the whole app — Home rails, the Ask
concierge, itinerary building — recalculates around it. This is what lets you
demo "what's happening tonight" convincingly regardless of when you're
actually showing it to someone.

---

## HOW MOCK DATA IS STRUCTURED

`src/lib/mockData.ts` exports three things, all typed in `src/lib/types.ts`:

- **`VENUES`** — physical locations (name, neighborhood, lat/lng). A venue
  can host both a scheduled event and a walk-in place (e.g. a rooftop bar
  that's also the venue for a one-night DJ set).
- **`PLACES`** — restaurants/bars/lounges with weekly opening hours, a price
  level, and (optionally) a reservation link. No fixed start/end time.
- **`EVENTS`** — concerts, sports, comedy, festivals, etc. with a real ISO
  `startTime`/`endTime`, and (optionally) a ticket link.

Both `Place` and `Event` carry an explicit, component-level **Best Bet**
score input (`bestBetComponents`: significance, venueQuality, demand,
socialBuzz, uniqueness, value) — the app computes the final Move Score and
For You Score from those, plus your preferences, at render/request time. See
`src/lib/engine.ts` for the full, commented scoring and itinerary logic.

## HOW TO ADD REAL EVENT SOURCES LATER

`ALL_ITEMS` (in `mockData.ts`) is just a plain array of typed objects — the
rest of the app (ranking, the Ask concierge, itinerary building, the UI)
doesn't know or care whether that array came from hand-written mock data or
a live API. To add a real source:

1. Write a small adapter that fetches from the provider (Ticketmaster,
   Eventbrite, a restaurant platform, etc.) and maps its fields onto the
   `Event` or `Place` shape in `types.ts`.
2. Merge its output into `ALL_ITEMS` (or replace the mock array with a
   database/API call — the engine functions take a plain array either way).
3. Everything downstream — scoring, filtering, the Ask concierge, itinerary
   construction — works unchanged.

## HOW TO CONFIGURE AN AI PROVIDER

Already wired — see "Environment variables" above. The only place any AI
provider is called is the server-side route at
`src/app/api/concierge/route.ts`, which reads `ANTHROPIC_API_KEY` from the
server environment and is never reachable from the browser. Swapping providers
means editing the `fetch(...)` call in that one file — nothing else in the app
needs to change, since the client only ever calls its own `/api/concierge`
endpoint.

---

## ARCHITECTURE NOTES

- **Single-page app inside Next.js.** There's one route (`/`), which mounts
  `AppRoot` — a client component that manages Home/Ask/Saved/Settings and the
  event-detail overlay as internal state, rather than separate Next.js
  routes per tab. This was a deliberate simplification: the whole experience
  is preference- and localStorage-driven from the first screen onward, which
  doesn't map cleanly onto server-rendered routes, and a single client-side
  shell keeps the app exactly as capable while staying easy to reason about.
  The **API route is real, separate, and server-only** — that boundary is
  the one that actually matters for security (no exposed keys), and it's
  properly split out.
- **`"use client"` appears once**, at the top of `AppRoot.tsx`. Every
  component it imports (Home, Ask, Saved, etc.) is automatically part of the
  same client bundle — Next.js doesn't require the directive on every file,
  only at the boundary where a server-rendered tree hands off to a
  client-rendered one.
- **No database, no auth** — by design for this prototype (see the original
  brief's "what not to build yet" list). `src/lib/storage.ts` is the only
  persistence layer, and it's guarded so it never runs during server-side
  rendering.

---

## VERIFICATION STATUS — READ THIS BEFORE ASSUMING A CLEAN BUILD

Being direct about this, because it matters: **the environment this
prototype was built in has no network access at all** (confirmed — package
registries, GitHub, and Vercel all reject connections from it). That means:

**What was actually verified, for real, in that environment:**
- Every `.ts`/`.tsx` file in `src/` passes a strict-mode TypeScript check
  with zero errors, using the real project structure and path aliases.
- The recommendation engine specifically (`src/lib/engine.ts`,
  `mockData.ts`, `types.ts`) was compiled to plain JavaScript and actually
  **executed** against the exact scenario from earlier in this project's
  development (a Saturday-night, $200-budget, no-nightclub request) — it
  produces the correct, previously-validated ranking output. You can re-run
  this yourself with `npx tsx scripts/verify-engine.ts` (or compile with
  `tsc` and run the output with `node`) once you have Node installed.
- Targeted checks for broken relative imports, duplicate exports, undefined
  variables, `localStorage` calls outside the SSR-safe wrapper, and the
  server route importing browser-only code (or vice versa) were all run
  against the final project — none found.

**What could NOT be verified, because of the network restriction:**
- `npm install` was never run in that environment (the package registry is
  unreachable from it), so real `@types/react`/`next`/`tailwindcss` package
  resolution was never checked against these exact files.
- `npm run build` (the real Next.js production build) was never run.
- Nothing was deployed to Vercel from that environment — there's no live
  URL from this session.

**In plain terms:** the logic is genuinely tested; the exact combination of
"this code + these specific dependency versions + a real Next.js build
pipeline" has not been. Given how small and standard this stack is (a
default Next.js 14 + Tailwind setup, no exotic packages), the risk of a build
error is low — but "low risk" isn't the same as "verified," and this README
won't pretend otherwise. **The first `npm install && npm run build` you run
locally is the real verification** — if it surfaces anything, it'll almost
certainly be a minor version-compatibility fix, not a logic problem.
