/**
 * Decision Engine
 * ---------------
 * Takes scored candidates and produces the final DECIDED recommendation:
 * a ranking, a top pick, and a human-readable explanation of why it won.
 *
 * This module never invents a claim of certainty. Confidence is derived
 * from the score gap between the top two candidates — a bigger gap
 * means a clearer decision, a small gap is reported honestly as "close".
 */

/**
 * @param {Object[]} scoredCandidates  candidates already run through the evaluator
 * @returns {{ranked: Object[], recommendation: Object, confidence: number}}
 */
export function decide(scoredCandidates) {
  if (!scoredCandidates || scoredCandidates.length === 0) {
    throw new Error("decide() requires at least one scored candidate");
  }

  const ranked = [...scoredCandidates].sort((a, b) => b.overall_score - a.overall_score);
  const top = ranked[0];
  const runnerUp = ranked[1];

  const confidence = computeConfidence(top, runnerUp);
  top.explanation = buildExplanation(top, runnerUp, confidence);

  return { ranked, recommendation: top, confidence };
}

/**
 * Confidence is an ESTIMATE of how clear-cut the decision is — the
 * relative margin between 1st and 2nd place, mapped into a 55-97 band
 * so NEXUS never claims either total certainty or a coin-flip.
 */
function computeConfidence(top, runnerUp) {
  if (!runnerUp) return 97;
  const gap = top.overall_score - runnerUp.overall_score;
  const normalizedGap = Math.min(1, gap / 25); // a 25pt+ gap reads as maximally confident
  const confidence = 55 + normalizedGap * 42;
  return Math.round(confidence);
}

function buildExplanation(top, runnerUp, confidence) {
  const reasons = [];

  if (!runnerUp || top.overall_score - runnerUp.overall_score >= 8) {
    reasons.push("Highest overall weighted score among the candidates evaluated");
  } else {
    reasons.push(`Highest overall weighted score, though closely contested with ${runnerUp.description}`);
  }

  if (top.constraint_compliance) {
    reasons.push("Required constraints satisfied");
  } else {
    reasons.push("Note: this plan does NOT fully satisfy stated constraints — see comparison view");
  }

  const dims = ["safety", "accessibility", "efficiency", "effort"];
  const strongest = dims.reduce((best, d) =>
    top[`${d}_score`] > top[`${best}_score`] ? d : best
  , dims[0]);
  reasons.push(`Strongest estimated dimension: ${strongest} (${top[`${strongest}_score`]}/100)`);

  if (runnerUp) {
    const deltas = dims
      .filter((d) => top[`${d}_score`] < runnerUp[`${d}_score`])
      .map((d) => `${d} is ${runnerUp[`${d}_score`] - top[`${d}_score`]}pt lower than ${runnerUp.description}`);
    if (deltas.length) reasons.push(`Trade-off: ${deltas[0]}`);
  }

  return {
    summary: `${top.description} — overall score ${top.overall_score}/100`,
    reasons,
    confidence,
    disclaimer:
      "All scores are ESTIMATED outcomes based on the current world state and priority weights, not guaranteed results.",
  };
}
