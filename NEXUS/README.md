# NEXUS

**Counterfactual Physical Intelligence**

> See the situation. Explore the possibilities. Choose the better outcome.

Team CODEX · iQOO Hackathon 2026 · Open Innovation Track

---

## Problem

Most AI tools stop at generating an answer. They describe a situation
or suggest one action, but they don't model *what would actually
happen* if you took that action, compare it against alternatives, or
adapt when your priorities change. Real physical decisions — rearrange
a room, respond to a hazard, plan a layout — involve trade-offs between
competing goals (safety vs. effort, speed vs. thoroughness), and a
single generated answer can't show you that trade-off space.

## Solution

NEXUS is a smartphone-first decision intelligence engine. It senses a
physical environment (camera + voice + context), builds a structured
model of that environment, generates several distinct candidate
actions, evaluates each one against your stated goal and constraints,
and recommends the strongest feasible option — with a transparent,
inspectable explanation of why.

NEXUS is **not** a chatbot, not a plain object detector, and not a
claim of perfect future prediction. It clearly distinguishes:

- **OBSERVED** — what the camera/voice/sensors actually reported.
- **ESTIMATED** — candidate outcomes, scores, and confidence NEXUS
  computed from that observation.
- **DECIDED** — the final ranked recommendation.

See `docs/innovation.md` for a full comparison against chatbots,
standard computer vision, and recommendation systems.

## Core innovation

**Counterfactual candidate-state exploration**: before recommending
anything, NEXUS generates multiple possible resulting states, scores
each with a transparent weighted model, runs one bounded
self-improvement pass on the weakest candidate, and only then decides.
Change what you prioritize, and — without touching the underlying
scene — the recommendation itself can change. That's the difference
between a decision engine and a static response generator, and it's
directly demonstrated in the demo (`docs/demo.md`) and unit-tested in
`tests/decision/decision.test.js`.

## MVP: physical workspace optimization

The prototype implements one full, demonstrable vertical: given a
scanned or simulated workspace and the goal *"Make this workspace
safer and easier to access,"* NEXUS detects objects, builds a world
state, generates three candidate rearrangement plans, scores them on
safety / accessibility / efficiency / effort, and recommends the best
one — then lets you compare alternatives or change your priorities and
watch the recommendation update.

## Architecture

```
Physical Environment
        ↓
Camera / Voice / Sensors
        ↓
Multimodal Input
        ↓
Perception Layer
        ↓
World State
        ↓
Goal + Constraints
        ↓
Candidate Generator
        ↓
Outcome Evaluator
        ↓
Mutation / Improvement Loop
        ↓
Decision Engine
        ↓
Recommendation + Explanation
```

Full module-by-module detail, data contracts, and the scoring formula
are in `docs/architecture.md`.

## Demo

1. Scan a workspace (simulated in Demo Mode — no camera/model needed).
2. Say or type a goal: *"Make this workspace safer and easier to access."*
3. NEXUS generates and scores three candidate plans, recommends the
   strongest, and explains why.
4. Compare all three plans side by side.
5. Change your priorities (e.g. toward "minimum movement") and watch
   the recommendation change — same scene, different decision.

Full judge script: `docs/demo.md`.

## Technology stack

- **Frontend**: plain HTML5, CSS3, and vanilla JavaScript (ES modules)
  — no bundler, no framework, no build step. Runs in any modern mobile
  browser.
- **Decision pipeline**: pure JavaScript modules under `app/` — no ML
  framework required for the core evaluator/decision/mutation logic
  (it's deterministic weighted scoring, not a trained model).
- **Voice input**: browser `SpeechRecognition` Web API (`LiveVoiceProvider`),
  with a deterministic `MockVoiceProvider` fallback.
- **Object detection**: interface (`LivePerceptionProvider`) ready to
  wrap an in-browser model such as TensorFlow.js `coco-ssd`; the
  bundled demo uses `MockPerceptionProvider` with curated scene data —
  see `docs/feasibility.md` for exactly what's live vs. simulated.
- **Testing**: zero-dependency Node.js test runner (`tests/run-tests.js`).

Nothing above is aspirational — every technology listed is actually
present in this repository.

## Installation

Requires only Node.js (for running tests) and Python 3 (for the
built-in static file server) — no `npm install` step, since the
prototype has zero runtime dependencies.

```bash
git clone <this-repo-url>
cd NEXUS
```

## Running the prototype

```bash
npm start
# equivalent to: python3 -m http.server 8080 --directory ui
```

Open `http://localhost:8080` in a browser (resize to mobile width, or
open directly on a phone on the same network).

## Demo mode

Demo Mode is **on by default** (`FORCE_DEMO_MODE = true` in
`ui/main.js`) and requires no internet connection, no camera
permission, and no API key. It uses the curated scene and candidate
data in `app/demo/demoData.js`, so every run is reproducible. A
**DEMO MODE** badge is always visible in the app's status bar while
it's active.

To experiment with the live-mode interfaces (voice recognition via the
browser, and the heuristic live candidate generator), set
`FORCE_DEMO_MODE = false` in `ui/main.js` — camera-based object
detection will still fall back to the mock provider unless a detection
model is wired in (see `docs/roadmap.md`).

## Running tests

```bash
npm test
# equivalent to: node tests/run-tests.js
```

15 deterministic unit tests cover world-state validation, evaluator
scoring, priority-driven ranking changes, confidence computation, and
the mutation loop.

## Project structure

```
NEXUS/
├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── CONTRIBUTING.md
├── SECURITY.md
├── package.json
│
├── docs/
│   ├── architecture.md      Full technical architecture + data contracts
│   ├── innovation.md        Why NEXUS differs from chatbots/CV/recommenders
│   ├── feasibility.md       What's implemented vs. simulated, and why
│   ├── demo.md              Exact judge demonstration script
│   ├── roadmap.md           MVP → multimodal → richer world models → new domains
│   └── references.md        Real technical references only
│
├── app/                     Framework-agnostic decision pipeline (ES modules)
│   ├── perception/          Live + Mock object detection providers
│   ├── world_state/         Schema, validation, immutable update helpers
│   ├── candidates/          Candidate model + generator (demo + live heuristic)
│   ├── evaluator/           Transparent weighted scoring model
│   ├── mutation/            Bounded single-step candidate improvement
│   ├── decision/            Ranking, recommendation, confidence, explanation
│   ├── voice/               Live + Mock voice input providers
│   ├── demo/                Curated deterministic demo scene + candidate data
│   └── aiProvider.js        Pluggable AIProvider interface (Mock/Local/Remote)
│
├── ui/                      8-screen mobile web app
│   ├── index.html
│   ├── styles.css
│   └── main.js              Orchestration only — no scoring logic lives here
│
├── tests/                   Zero-dependency unit tests (`node tests/run-tests.js`)
│   ├── evaluator/
│   ├── world_state/
│   └── decision/
│
└── assets/                  Screenshots / diagrams / demo recordings (add your own)
```

## What's genuinely implemented vs. simulated

Short version — see `docs/feasibility.md` for the full table:

- **Fully implemented and unit-tested**: world state schema, weighted
  evaluator, mutation loop, decision engine, the full 8-screen UI, both
  voice-input providers, the live-mode heuristic candidate generator.
- **Fixture-based by design for demo reliability**: the demo-mode
  object detection scene and the three curated candidate profiles
  (Plan A/B/C) — chosen so the judge demo never depends on network
  access, an API key, or a bundled camera-vision model.
- **Interface implemented, not bundled**: `LivePerceptionProvider` is a
  real class ready to wrap an actual in-browser detection model; no
  model is shipped in this repo (see `docs/feasibility.md` for why).

## Roadmap

MVP (this repo) → multimodal expansion (live CV model, NL goal
parsing) → richer world models (object relationships, configurable
strategies) → additional domains (kitchen planning, warehouse layout,
accessibility audits). Full detail in `docs/roadmap.md`.

## Responsible AI

- Every outcome score is explicitly an **estimate**, never a guarantee
  — the UI and code both use "estimated," "candidate," "possible
  result," and "confidence" language throughout, never "predicted the
  future."
- The user stays in control: priorities are adjustable at any time, and
  changing them visibly changes the recommendation.
- OBSERVED and ESTIMATED data are never blended into a single
  undifferentiated number — the `score_breakdown` on every candidate
  shows exactly which weight produced which contribution.
- Object detection is designed to run locally in the browser rather
  than uploading a workspace photo to a remote service, when a live
  detection model is wired in.

## License

MIT — see `LICENSE`. Third-party libraries and Web APIs referenced in
this project (e.g. browser `SpeechRecognition`, TensorFlow.js if wired
in later) retain their own respective licenses.

## Team

**Team CODEX** — iQOO Hackathon 2026, Open Innovation Track.
