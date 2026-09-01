/**
 * Mutation / Improvement Loop
 * ---------------------------
 * Prototype representation of NEXUS's self-improving decision loop.
 *
 * This is deliberately simple: find the weakest-scoring candidate,
 * nudge its weakest dimension upward by trading a small amount of
 * effort_score, re-evaluate, and keep whichever version scores higher
 * under the current priorities. It is NOT autonomous reasoning and
 * NOT a claim of general intelligence — it is a bounded, explainable
 * local search over one dimension at a time.
 *
 *   Generate candidates
 *         ↓
 *   Evaluate candidates
 *         ↓
 *   Find weak candidate
 *         ↓
 *   Modify candidate
 *         ↓
 *   Evaluate again
 *         ↓
 *   Keep better candidate
 */

import { evaluateCandidate } from "../evaluator/evaluator.js";

const IMPROVABLE_DIMENSIONS = ["safety_score", "accessibility_score", "efficiency_score"];
const MUTATION_STEP = 6; // points shifted per mutation attempt
const EFFORT_TRADE = 4; // effort points spent to buy the improvement

/**
 * Runs one improvement pass over a scored candidate list.
 * @param {Object[]} scoredCandidates  candidates already run through evaluateCandidate
 * @param {Object.<string, number>} priorities
 * @returns {{candidates: Object[], mutated: boolean, log: string[]}}
 */
export function runMutationPass(scoredCandidates, priorities) {
  const log = [];
  if (scoredCandidates.length === 0) return { candidates: scoredCandidates, mutated: false, log };

  const weakest = [...scoredCandidates].sort((a, b) => a.overall_score - b.overall_score)[0];
  const weakestDimension = findWeakestDimension(weakest);

  if (!weakestDimension) {
    log.push("No improvable dimension found; skipping mutation.");
    return { candidates: scoredCandidates, mutated: false, log };
  }

  const proposal = { ...weakest };
  proposal[weakestDimension] = clamp(proposal[weakestDimension] + MUTATION_STEP);
  proposal.effort_score = clamp(proposal.effort_score - EFFORT_TRADE);
  proposal.actions = [...weakest.actions, `(mutation) Further adjust to raise ${labelFor(weakestDimension)}`];

  const before = weakest.overall_score;
  evaluateCandidate(proposal, priorities);

  if (proposal.overall_score > before) {
    log.push(
      `Mutated "${weakest.description}": ${labelFor(weakestDimension)} +${MUTATION_STEP}, effort -${EFFORT_TRADE}. ` +
        `Overall score ${before} → ${proposal.overall_score}. Improvement kept.`
    );
    const next = scoredCandidates.map((c) => (c.id === weakest.id ? proposal : c));
    return { candidates: next, mutated: true, log };
  }

  log.push(
    `Mutated "${weakest.description}" but overall score did not improve (${before} → ${proposal.overall_score}). Original kept.`
  );
  return { candidates: scoredCandidates, mutated: false, log };
}

function findWeakestDimension(candidate) {
  let weakest = null;
  let weakestValue = Infinity;
  for (const dim of IMPROVABLE_DIMENSIONS) {
    if (candidate[dim] < weakestValue) {
      weakestValue = candidate[dim];
      weakest = dim;
    }
  }
  return weakest;
}

function labelFor(dim) {
  return dim.replace("_score", "");
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}
