# NEXUS Architecture

## Pipeline overview

```
Physical Environment
        ↓
Camera / Voice / Sensors        (browser MediaDevices + SpeechRecognition APIs)
        ↓
Multimodal Input
        ↓
Perception Layer                app/perception/perception.js
        ↓
World State                     app/world_state/schema.js
        ↓
Goal + Constraints               (captured from Screen 3, merged into World State)
        ↓
Candidate Generator              app/candidates/generator.js
        ↓
Outcome Evaluator                app/evaluator/evaluator.js
        ↓
Mutation / Improvement Loop      app/mutation/mutation.js
        ↓
Decision Engine                  app/decision/decision.js
        ↓
Recommendation + Explanation     rendered by ui/main.js on Screens 5/6
```

Every arrow above is a plain JavaScript function call passing a plain
object — there is no hidden queue, no server round-trip, and no global
mutable singleton beyond the small amount of UI state in `ui/main.js`
(current world state, current scored candidates, current decision).
This was a deliberate choice: a hackathon judge should be able to trace
any number on screen back to the exact function that produced it in
under a minute.

## Module responsibilities

| Module | File | Responsibility | Produces |
|---|---|---|---|
| Perception | `app/perception/perception.js` | Converts camera input (or the demo fixture) into `WorldObject[]` | OBSERVED data only |
| World State | `app/world_state/schema.js` | Canonical schema, validation, immutable updates | The single source of truth passed downstream |
| Candidate Generator | `app/candidates/generator.js` | Produces 3 named strategies (accessibility-max, balanced, safety-max) | `Candidate[]` (unscored) |
| Evaluator | `app/evaluator/evaluator.js` | Weighted scoring model + constraint-compliance penalty | `Candidate[]` (scored, with `score_breakdown`) |
| Mutation Loop | `app/mutation/mutation.js` | One bounded local-search improvement pass on the weakest candidate | `Candidate[]` (possibly improved) |
| Decision Engine | `app/decision/decision.js` | Ranks, picks the top candidate, computes confidence, writes the explanation | `{ranked, recommendation, confidence}` |
| Voice | `app/voice/voice.js` | `VoiceInputProvider` interface: `LiveVoiceProvider` (Web Speech API) / `MockVoiceProvider` | A transcript string |
| AI Provider | `app/aiProvider.js` | `AIProvider` interface for future NL goal-parsing: `RemoteAIProvider` / `LocalAIProvider` (stub) / `MockAIProvider` | Text completions (not required by the core pipeline today) |
| Demo Data | `app/demo/demoData.js` | Curated, reproducible scene + candidate profiles for the judge demo | Fixture data |
| UI Controller | `ui/main.js` | Wires the 8 screens to the pipeline; contains no scoring logic itself | DOM updates |

## Data contracts

### WorldState

```json
{
  "environment": "workspace",
  "objects": [
    { "id": "obj-chair", "label": "Chair", "confidence": 0.95,
      "bbox": { "x": 0.42, "y": 0.60, "w": 0.15, "h": 0.25 },
      "movable": true, "obstruction": true }
  ],
  "relationships": [],
  "goal": "Make this workspace safer and easier to access.",
  "constraints": ["Do not block the doorway"],
  "priorities": { "safety": 0.35, "accessibility": 0.35, "efficiency": 0.15, "effort": 0.15 },
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

`objects` and `relationships` are strictly OBSERVED — they come from
the Perception Layer or direct user input, never from a model's guess
dressed up as fact.

### Candidate

```
Candidate
├── id
├── description
├── actions[]
├── predicted_state     ESTIMATED
├── safety_score         ESTIMATED, 0-100
├── accessibility_score  ESTIMATED, 0-100
├── efficiency_score     ESTIMATED, 0-100
├── effort_score         ESTIMATED, 0-100 (higher = less physical effort)
├── constraint_compliance
├── overall_score        DECIDED once evaluated
└── explanation          DECIDED once ranked (top candidate only)
```

## Scoring model

```
overall_score =
    clamp(
      safety_score        × safety_weight
    + accessibility_score  × accessibility_weight
    + efficiency_score     × efficiency_weight
    + effort_score         × effort_weight
    − (constraint_compliance ? 0 : 25),
    0, 100
    )
```

Weights are the user's normalized priority sliders (they always sum to
1.0 — see `normalizePriorities`). The 25-point constraint-violation
penalty is a deliberate design choice: a plan that breaks a hard
constraint is heavily discouraged from winning, but is not silently
hidden from the comparison view, since the user should be able to see
*why* it lost.

## Mutation / improvement loop

A single bounded pass: find the lowest-scoring candidate, identify its
weakest of {safety, accessibility, efficiency}, raise that dimension by
a fixed step while spending a little `effort_score`, re-evaluate, and
keep the mutation only if the new overall score is actually higher.
This is intentionally transparent and non-agentic — it is not framed
as autonomous reasoning, just one explainable local-search step per
analysis run (see `docs/innovation.md` for why this framing matters).

## Decision + confidence

The Decision Engine sorts scored candidates and reports the top one as
the recommendation. Confidence is derived purely from the score gap
between 1st and 2nd place, mapped into a 55-97% band — NEXUS never
claims 100% certainty and never reports a coin-flip as if it were a
strong recommendation.

## Live vs. Demo mode

| Concern | Demo mode (default) | Live mode (future) |
|---|---|---|
| Perception | `MockPerceptionProvider` returns the curated 6-object scene | `LivePerceptionProvider` wraps an injected detection model (e.g. TensorFlow.js COCO-SSD) against the camera video element |
| Voice | `MockVoiceProvider` returns the scripted transcript | `LiveVoiceProvider` uses the browser `SpeechRecognition` API |
| Candidate generation | Curated Plan A/B/C profiles | `generateHeuristicCandidates()` derives 3 strategies from actually-observed obstructions |
| Network / API key | None required | Only required if a `RemoteAIProvider` is explicitly configured via `.env` |

`selectPerceptionProvider()` and `selectVoiceProvider()` both default to
demo mode and only switch to a live provider if it is genuinely
available (camera permission granted, model loader supplied, etc.),
falling back to the mock automatically otherwise — the app is designed
to never hard-fail because a sensor or model wasn't available.
