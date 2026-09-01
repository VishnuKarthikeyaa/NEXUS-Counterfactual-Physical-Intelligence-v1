/**
 * Outcome Evaluator
 * -----------------
 * Produces the overall_score for a Candidate using a transparent,
 * fully-inspectable weighted scoring model. No hidden model, no
 * black box — every point in overall_score can be traced back to a
 * sub-score and a weight.
 *
 *   overall_score =
 *       safety_score        * safety_weight
 *     + accessibility_score * accessibility_weight
 *     + efficiency_score    * efficiency_weight
 *     + effort_score        * effort_weight
 *   ...then a constraint-compliance adjustment is applied, and the
 *   result is clamped to 0-100.
 *
 * Constraint compliance is a hard signal, not just another weighted
 * input: a candidate that violates a stated hard constraint receives
 * a significant penalty so it will rarely outrank a compliant plan,
 * without being silently discarded (the user should still be able to
 * see and compare it).
 */

import { normalizePriorities } from "../world_state/schema.js";

export const CONSTRAINT_VIOLATION_PENALTY = 25; // points subtracted, pre-clamp

/**
 * Scores a single candidate against a priority weighting.
 * Mutates and returns the candidate with overall_score + explanation set.
 * @param {Object} candidate
 * @param {Object.<string, number>} priorities
 * @returns {Object} the same candidate object, scored
 */
export function evaluateCandidate(candidate, priorities) {
  const w = normalizePriorities(priorities);

  const weightedSum =
    candidate.safety_score * w.safety +
    candidate.accessibility_score * w.accessibility +
    candidate.efficiency_score * w.efficiency +
    candidate.effort_score * w.effort;

  const penalty = candidate.constraint_compliance ? 0 : CONSTRAINT_VIOLATION_PENALTY;
  const overall = clamp(Math.round(weightedSum - penalty));

  candidate.overall_score = overall;
  candidate.score_breakdown = {
    safety: { value: candidate.safety_score, weight: round2(w.safety), contribution: round1(candidate.safety_score * w.safety) },
    accessibility: { value: candidate.accessibility_score, weight: round2(w.accessibility), contribution: round1(candidate.accessibility_score * w.accessibility) },
    efficiency: { value: candidate.efficiency_score, weight: round2(w.efficiency), contribution: round1(candidate.efficiency_score * w.efficiency) },
    effort: { value: candidate.effort_score, weight: round2(w.effort), contribution: round1(candidate.effort_score * w.effort) },
    constraint_penalty: penalty,
  };

  return candidate;
}

/**
 * Scores every candidate in a list against the same priority weighting.
 * @param {Object[]} candidates
 * @param {Object.<string, number>} priorities
 * @returns {Object[]} the same candidates, each scored
 */
export function evaluateCandidates(candidates, priorities) {
  return candidates.map((c) => evaluateCandidate(c, priorities));
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
