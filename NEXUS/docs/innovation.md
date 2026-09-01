# What makes NEXUS different

NEXUS is often mistaken, at a glance, for one of three existing
categories. It borrows a piece of each but isn't reducible to any of
them.

## vs. Chatbots

A chatbot answers a question with text. It does not maintain a
structured model of a physical scene, does not generate multiple
distinct candidate futures, and does not score those futures against
constraints you actually stated. Ask a chatbot "how do I make my
workspace safer" and you get advice. Ask NEXUS and you get three
scored, comparable plans with a ranked recommendation and an
explanation you can interrogate — and if you change what you care
about, the recommendation itself changes, live, without re-asking the
question. The chat surface is optional; the decision structure is the
product.

## vs. standard computer vision

A standard object detector's job ends at a label and a bounding box:
"this is a chair, 95% confidence." That is exactly what NEXUS's
Perception Layer produces too — and deliberately no more. NEXUS's
contribution starts *after* detection: turning "table, chair, laptop,
bottle, box, bag" into a structured World State, then generating and
scoring multiple possible rearrangements of those objects against a
goal. Object detection is an input to NEXUS, not the product.

## vs. recommendation systems

A typical recommender ranks a fixed catalog of existing items by
predicted preference (which movie, which product). NEXUS doesn't rank
pre-existing items — it *generates* the candidates it then ranks, from
the current world state and goal, and its ranking function is a fully
transparent weighted formula the user can see broken down per
dimension (`score_breakdown` in `app/evaluator/evaluator.js`), not a
learned black-box preference model. There is no training data and no
opaque embedding similarity — every point is explainable on the spot.

## The actual innovation: counterfactual candidate-state exploration

The core idea is simple to state and non-trivial to build end-to-end
in a submittable prototype: **before recommending an action, generate
several different possible resulting states, evaluate each one against
explicit, user-adjustable priorities, and show your work.**

That requires four things working together, which is what this
repository actually implements:

1. A **structured world state** that cleanly separates OBSERVED facts
   from ESTIMATED outcomes (`app/world_state/schema.js`).
2. A **candidate generator** that produces genuinely different
   strategies rather than one plan with cosmetic variations
   (`app/candidates/generator.js`).
3. A **transparent, re-runnable evaluator** where changing a priority
   slider and re-scoring the *same* candidates can flip the
   recommendation — proving the system reasons over trade-offs rather
   than returning a memorized "best" answer (`app/evaluator/evaluator.js`,
   demonstrated in `tests/decision/decision.test.js`).
4. A **bounded, explainable improvement step** (the mutation loop) that
   models — honestly, without overclaiming — the idea that a decision
   engine can refine a weak candidate rather than only ever selecting
   among static options (`app/mutation/mutation.js`).

## What NEXUS explicitly does not claim

- It does not claim to perfectly predict the future — every outcome
  score is labeled and treated internally as an ESTIMATE.
- It does not claim general autonomous reasoning — the mutation loop is
  a single bounded local-search step, not open-ended planning.
- It does not claim the live camera pipeline is production-grade in
  this prototype — see `docs/feasibility.md` for exactly what runs
  live vs. what runs on curated demo data today, and why that's the
  right tradeoff for a 36-hour build.
