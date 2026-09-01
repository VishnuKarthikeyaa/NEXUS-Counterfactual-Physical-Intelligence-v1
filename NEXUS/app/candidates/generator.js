/**
 * Candidate Generator
 * -------------------
 * Turns a WorldState + user goal into three candidate plans.
 *
 * Two modes:
 *  - DEMO mode: returns the curated, reproducible plan set used in the
 *    judge demo (see app/demo/demoData.js). Deterministic every run.
 *  - LIVE mode: derives three heuristic strategies from whatever objects
 *    were actually observed, so the pipeline still produces a sane
 *    result outside the scripted demo scenario.
 *
 * The generator never claims to search an exhaustive space of plans —
 * it produces three named strategies (maximize accessibility, balanced,
 * maximize safety) and lets the evaluator + mutation loop refine them.
 */

import { createCandidate } from "./candidate.js";
import { getDemoCandidateProfiles } from "../demo/demoData.js";

/**
 * @param {import("../world_state/schema.js").WorldState} worldState
 * @param {{mode?: "demo"|"live"}} [options]
 * @returns {Object[]} Candidate[]
 */
export function generateCandidates(worldState, options = {}) {
  const mode = options.mode ?? "demo";
  if (mode === "demo") {
    return getDemoCandidateProfiles().map((profile) =>
      createCandidate({
        description: profile.description,
        actions: profile.actions,
        predicted_state: { note: "Estimated resulting arrangement (demo scenario)" },
        safety_score: profile.safety_score,
        accessibility_score: profile.accessibility_score,
        efficiency_score: profile.efficiency_score,
        effort_score: profile.effort_score,
        constraint_compliance: profile.constraint_compliance,
      })
    );
  }
  return generateHeuristicCandidates(worldState);
}

/**
 * LIVE-mode heuristic strategy generation. This is intentionally simple
 * and transparent (no black-box model) — it counts obstructions and
 * movable objects and derives three differentiated strategies from that.
 */
function generateHeuristicCandidates(worldState) {
  const objects = worldState.objects ?? [];
  const obstructions = objects.filter((o) => o.obstruction);
  const movableObstructions = obstructions.filter((o) => o.movable);
  const immovableObstructions = obstructions.filter((o) => !o.movable);

  const totalObstructions = obstructions.length || 1;
  const resolvableFraction = movableObstructions.length / totalObstructions;

  const strategies = [
    {
      name: "Maximize Accessibility",
      resolve: 1.0,
      safetyBias: -0.1,
      effortCost: 0.9,
    },
    {
      name: "Balanced Safety & Accessibility",
      resolve: 0.75,
      safetyBias: 0.15,
      effortCost: 0.6,
    },
    {
      name: "Maximize Safety",
      resolve: 0.5,
      safetyBias: 0.3,
      effortCost: 0.3,
    },
  ];

  return strategies.map((s) => {
    const resolvedCount = Math.round(movableObstructions.length * s.resolve);
    const actions = movableObstructions
      .slice(0, resolvedCount)
      .map((o) => `Relocate "${o.label}" clear of the walking path`);
    if (actions.length === 0) actions.push("No relocation needed for this strategy");

    const accessibility = clamp(
      50 + resolvedCount * (30 / Math.max(1, movableObstructions.length)) * resolveWeight(s.resolve)
    );
    const safety = clamp(60 + resolvedCount * 6 + s.safetyBias * 100 - immovableObstructions.length * 5);
    const efficiency = clamp(70 + resolvedCount * 4 - immovableObstructions.length * 3);
    const effort = clamp(100 - resolvedCount * 18 * s.effortCost);

    return createCandidate({
      description: `${s.name}: relocate ${resolvedCount} of ${movableObstructions.length} movable obstruction(s)`,
      actions,
      predicted_state: {
        note: "Estimated resulting arrangement (live heuristic mode)",
        resolvedObstructions: resolvedCount,
        remainingImmovableObstructions: immovableObstructions.length,
      },
      safety_score: Math.round(safety),
      accessibility_score: Math.round(accessibility),
      efficiency_score: Math.round(efficiency),
      effort_score: Math.round(effort),
      constraint_compliance: immovableObstructions.length === 0,
    });
  });
}

function resolveWeight(resolve) {
  return 0.6 + resolve * 0.4;
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}
