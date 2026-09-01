# Feasibility for a 36-hour hackathon build

## Why this scope, and not "a universal AI system"

The brief for this track rewards a working, demonstrable prototype over
an ambitious slide deck. NEXUS's scope was deliberately narrowed to one
vertical — physical workspace optimization — because it is:

- **Visually demonstrable in under 60 seconds** — a phone, a desk, a
  spoken goal, three ranked plans.
- **Fully implementable without a trained model.** The scoring,
  ranking, mutation, and decision logic are all deterministic
  arithmetic and sorting — no dataset, no training run, no GPU.
- **Honest about what's live vs. simulated** (see table below), so
  nothing in the demo requires a network connection, an API key, or a
  camera-based detection model to actually work end-to-end.

## What is genuinely implemented vs. simulated

| Component | Status | Detail |
|---|---|---|
| World state schema + validation | **Implemented** | `app/world_state/schema.js`, fully unit-tested |
| Weighted evaluator | **Implemented** | `app/evaluator/evaluator.js`, fully unit-tested, transparent formula |
| Mutation / improvement loop | **Implemented** | `app/mutation/mutation.js`, bounded single-dimension local search |
| Decision engine + confidence | **Implemented** | `app/decision/decision.js`, fully unit-tested |
| Candidate generator (demo mode) | **Implemented** | Curated Plan A/B/C profiles, `app/demo/demoData.js` |
| Candidate generator (live mode) | **Implemented, heuristic** | `generateHeuristicCandidates()` in `app/candidates/generator.js` — derives 3 strategies from actually-detected obstructions; simple and transparent by design, not a trained model |
| Voice input | **Implemented (both modes)** | `MockVoiceProvider` (scripted) and `LiveVoiceProvider` (real `SpeechRecognition` API) behind one interface |
| Object detection (demo mode) | **Implemented, fixture-based** | `MockPerceptionProvider` returns a curated 6-object scene, deterministic every run |
| Object detection (live mode) | **Interface implemented, model not bundled** | `LivePerceptionProvider` is a real class ready to wrap an injected detection model (e.g. TensorFlow.js COCO-SSD loaded from CDN); no model is bundled in this repo — see rationale below |
| UI (8 screens) | **Implemented** | Plain HTML/CSS/JS, no build step, works on any modern mobile browser |
| RemoteAIProvider (future NL goal parsing) | **Interface only, not required by the demo** | `app/aiProvider.js`; the core decision pipeline needs zero language model |

## Why the live CV model isn't bundled

Shipping and testing a real in-browser object-detection model reliably
across arbitrary judge devices, on an untested network, within a
36-hour build window, is a real risk to demo stability — and the
brief explicitly says: *"do not make the application fail because the
AI model is unavailable."* Rather than gamble the whole submission on
a model download succeeding on stage, `LivePerceptionProvider` is fully
wired to accept any model conforming to a `.detect(videoElement)`
contract (matching TensorFlow.js's `coco-ssd` API shape) — plugging in
a real model is a constructor argument, not a rewrite. `selectPerceptionProvider()`
prefers a live provider only if one is genuinely available, and falls
back to the deterministic mock automatically otherwise.

## What could realistically be added in the next 12 hours

1. Wire an actual TensorFlow.js `coco-ssd` model into
   `LivePerceptionProvider` when the demo venue has reliable Wi-Fi.
2. Compute `obstruction` flags for live-detected objects from bbox
   overlap with a marked walking path, rather than the current
   conservative default.
3. Add a second vertical (see `docs/roadmap.md`) to demonstrate the
   architecture generalizes beyond workspaces.

None of this is required for the current demo to run start-to-finish.
