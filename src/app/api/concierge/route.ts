import { NextRequest, NextResponse } from "next/server";

// The only server-side route in the app, and the only place an AI provider
// key is ever read. The browser never sees ANTHROPIC_API_KEY — see
// src/components/AskConcierge.tsx, which POSTs here and has a fully
// deterministic fallback if this route is unavailable or returns non-200.
//
// This endpoint NEVER decides what's recommended. By the time a request
// reaches here, application code has already run parseIntent -> filterInventory
// -> rankCandidates (see src/lib/engine.ts) and picked the final items. The
// model is only ever asked to phrase one short intro sentence over an
// already-decided list.

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Expected, normal state for this prototype when no key is configured.
    // The client already has a deterministic templated sentence for this case.
    return NextResponse.json({ error: "no AI provider configured" }, { status: 503 });
  }

  let body: { constraints?: unknown; pickIds?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 100,
        system:
          "You write one short, plain sentence introducing a list of already-chosen recommendations. " +
          "You are NOT choosing or ranking anything — that has already been decided by application code. " +
          "Do not mention scores, IDs, or your own reasoning. No markdown, no quotes, just the sentence.",
        messages: [
          {
            role: "user",
            content: `Constraints: ${JSON.stringify(body.constraints)}\nAlready-chosen pick IDs (context only): ${JSON.stringify(body.pickIds)}`,
          },
        ],
      }),
    });

    if (!upstream.ok) {
      return NextResponse.json({ error: `upstream ${upstream.status}` }, { status: 502 });
    }
    const data = await upstream.json();
    const intro = (data.content || []).map((b: { text?: string }) => b.text || "").join("").trim();
    return NextResponse.json({ intro: intro || null });
  } catch {
    // Network/provider failure — same contract, client falls back gracefully.
    return NextResponse.json({ error: "concierge phrasing failed" }, { status: 502 });
  }
}
