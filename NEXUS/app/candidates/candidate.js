/**
 * Candidate
 * ---------
 * A single possible resulting state NEXUS is considering. Every numeric
 * score on this object is an ESTIMATE produced by the Outcome Evaluator —
 * never treat these as measured facts.
 */

let _idCounter = 0;

/**
 * @param {Object} params
 * @param {string} params.description         human-readable summary of the plan
 * @param {string[]} params.actions            ordered list of concrete actions
 * @param {Object} params.predicted_state      ESTIMATED resulting world state (partial)
 * @param {number} params.safety_score         0-100, ESTIMATED
 * @param {number} params.accessibility_score  0-100, ESTIMATED
 * @param {number} params.efficiency_score     0-100, ESTIMATED
 * @param {number} params.effort_score         0-100, ESTIMATED (higher = less effort)
 * @param {boolean} params.constraint_compliance  whether all hard constraints are satisfied
 * @returns {Object} Candidate
 */
export function createCandidate({
  description,
  actions = [],
  predicted_state = {},
  safety_score = 0,
  accessibility_score = 0,
  efficiency_score = 0,
  effort_score = 0,
  constraint_compliance = true,
}) {
  _idCounter += 1;
  return {
    id: `candidate-${_idCounter}`,
    description,
    actions,
    predicted_state, // ESTIMATED
    safety_score, // ESTIMATED
    accessibility_score, // ESTIMATED
    efficiency_score, // ESTIMATED
    effort_score, // ESTIMATED
    constraint_compliance,
    overall_score: null, // filled in by the evaluator — DECIDED once ranked
    explanation: null, // filled in by the decision engine
  };
}

/**
 * Resets the internal id counter. Test-only utility so unit tests get
 * deterministic candidate ids regardless of execution order.
 */
export function _resetCandidateIdsForTests() {
  _idCounter = 0;
}
