/**
 * World State
 * ------------
 * A structured, framework-agnostic representation of the physical
 * environment NEXUS is reasoning about. This is the single source of
 * truth passed between the Perception Layer, the Candidate Generator,
 * and the Outcome Evaluator.
 *
 * Everything under `objects` and `relationships` is OBSERVED
 * (came from perception/user input). Nothing in this module estimates
 * anything — estimation happens downstream in the evaluator.
 */

/**
 * @typedef {Object} WorldObject
 * @property {string} id
 * @property {string} label            e.g. "table", "chair", "laptop"
 * @property {number} confidence       0-1, detection confidence (1.0 for user-entered/demo objects)
 * @property {{x:number, y:number, w:number, h:number}} bbox  normalized 0-1 bounding box
 * @property {boolean} movable
 * @property {boolean} obstruction      whether it currently blocks a path/exit
 */

/**
 * @typedef {Object} WorldState
 * @property {string} environment      e.g. "workspace"
 * @property {WorldObject[]} objects
 * @property {Array<{from:string, to:string, relation:string}>} relationships
 * @property {string} goal             free-text user goal
 * @property {string[]} constraints    hard requirements, e.g. "keep laptop on table"
 * @property {Object.<string, number>} priorities  weight 0-1 per dimension
 * @property {string} timestamp        ISO 8601
 */

export const PRIORITY_DIMENSIONS = ["safety", "accessibility", "efficiency", "effort"];

/**
 * Creates a well-formed, empty world state.
 * @param {string} environment
 * @returns {WorldState}
 */
export function createWorldState(environment = "workspace") {
  return {
    environment,
    objects: [],
    relationships: [],
    goal: "",
    constraints: [],
    priorities: defaultPriorities(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Default priority weights — used until the user adjusts them.
 * Sums to 1.0.
 */
export function defaultPriorities() {
  return { safety: 0.35, accessibility: 0.35, efficiency: 0.15, effort: 0.15 };
}

/**
 * Normalizes an arbitrary priority weighting so the values sum to 1.0.
 * Falls back to default priorities if the input is empty or all-zero.
 * @param {Object.<string, number>} priorities
 */
export function normalizePriorities(priorities) {
  const dims = PRIORITY_DIMENSIONS;
  const total = dims.reduce((sum, d) => sum + Math.max(0, priorities?.[d] ?? 0), 0);
  if (!total) return defaultPriorities();
  const normalized = {};
  for (const d of dims) normalized[d] = Math.max(0, priorities?.[d] ?? 0) / total;
  return normalized;
}

/**
 * Validates that a world state object has the required shape.
 * Throws a descriptive error rather than failing silently — a bad
 * world state should never be allowed to enter the evaluator.
 * @param {WorldState} state
 * @returns {true}
 */
export function validateWorldState(state) {
  if (!state || typeof state !== "object") {
    throw new Error("WorldState must be an object");
  }
  if (typeof state.environment !== "string" || !state.environment) {
    throw new Error("WorldState.environment must be a non-empty string");
  }
  if (!Array.isArray(state.objects)) {
    throw new Error("WorldState.objects must be an array");
  }
  for (const obj of state.objects) {
    if (!obj.id || !obj.label) {
      throw new Error("Every WorldObject requires an id and a label");
    }
  }
  if (!Array.isArray(state.relationships)) {
    throw new Error("WorldState.relationships must be an array");
  }
  if (typeof state.goal !== "string") {
    throw new Error("WorldState.goal must be a string");
  }
  if (!Array.isArray(state.constraints)) {
    throw new Error("WorldState.constraints must be an array");
  }
  if (typeof state.priorities !== "object" || state.priorities === null) {
    throw new Error("WorldState.priorities must be an object");
  }
  return true;
}

/**
 * Adds a detected/observed object to a world state (immutable update).
 * @param {WorldState} state
 * @param {WorldObject} object
 * @returns {WorldState}
 */
export function addObject(state, object) {
  return { ...state, objects: [...state.objects, object] };
}

/**
 * Sets goal + constraints + priorities on a world state (immutable update).
 * @param {WorldState} state
 * @param {{goal?:string, constraints?:string[], priorities?:Object}} intent
 * @returns {WorldState}
 */
export function applyUserIntent(state, intent) {
  return {
    ...state,
    goal: intent.goal ?? state.goal,
    constraints: intent.constraints ?? state.constraints,
    priorities: intent.priorities ? normalizePriorities(intent.priorities) : state.priorities,
    timestamp: new Date().toISOString(),
  };
}
