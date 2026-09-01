# Roadmap

## Stage 0 — Current prototype (this repository)

- One vertical: physical workspace optimization.
- Deterministic demo mode; live-mode interfaces implemented but not
  bundled with a shipped detection model.
- Fully unit-tested evaluator, decision engine, and mutation loop.

## Stage 1 — Multimodal expansion

- Wire `LivePerceptionProvider` to a real in-browser detection model
  (TensorFlow.js `coco-ssd` or similar) for live camera scans.
- Wire `LiveVoiceProvider` end-to-end in more browsers (current
  `SpeechRecognition` support is Chromium-based only; evaluate a
  cross-browser fallback).
- Let a `RemoteAIProvider` (opt-in, user-supplied API key via `.env`)
  turn a free-text goal into structured constraints automatically,
  instead of the user pre-selecting constraint text.

## Stage 2 — Richer world models

- Represent object relationships explicitly (`relationships[]` in the
  World State schema already reserves space for this) — e.g. "bag
  is-on chair" — so moving one object can auto-suggest what else must
  move with it.
- Replace the fixed three-strategy candidate generator with a
  configurable strategy set, so a domain can register its own named
  strategies (e.g. "cheapest," "fastest," "most durable") beyond
  safety/accessibility/efficiency/effort.
- Extend the mutation loop beyond single-dimension nudges to
  multi-step local search with a stopping criterion, still fully
  logged and explainable.

## Stage 3 — Additional domains

The architecture (World State → Candidate Generator → Evaluator →
Mutation → Decision) is intentionally domain-agnostic. Candidate future
verticals, each requiring only a new Perception adapter and a new
Candidate Generator strategy set:

- **Kitchen/meal-prep planning** — objects: ingredients, appliances,
  time budget; goal: "minimize cook time while meeting dietary
  constraints."
- **Warehouse/retail shelf layout** — objects: SKUs, shelf zones,
  foot-traffic data; goal: "maximize accessibility to high-turnover
  items."
- **Accessibility audits for public spaces** — objects: ramps, doors,
  signage; goal: "meet a specific accessibility standard at minimum
  renovation cost."

Each new domain reuses the entire Evaluator, Mutation Loop, and
Decision Engine unchanged — only Perception and Candidate Generation
need domain-specific logic. That reuse is the actual scaling argument
for the architecture, not a claim that today's workspace prototype
already generalizes on its own.
