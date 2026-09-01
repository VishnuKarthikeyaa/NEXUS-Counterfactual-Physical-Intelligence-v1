/**
 * Demo Data
 * ---------
 * Curated, reproducible data for the "physical workspace optimization"
 * demo scenario. This is what lets NEXUS run a full, convincing
 * end-to-end demo with zero internet connection, zero API key, and
 * zero dependency on a live camera or CV model.
 *
 * Everything here is clearly a fixture, not a claim about real-world
 * performance — see docs/feasibility.md and the Responsible AI section
 * of the README for why this distinction matters.
 */

/** The scripted user request used throughout the demo. */
export const DEMO_GOAL = "Make this workspace safer and easier to access.";

/** Detected objects for the demo workspace scan (Screen 2). */
export function getDemoDetectedObjects() {
  return [
    { id: "obj-table", label: "Table", confidence: 0.98, bbox: { x: 0.10, y: 0.55, w: 0.35, h: 0.30 }, movable: false, obstruction: false },
    { id: "obj-chair", label: "Chair", confidence: 0.95, bbox: { x: 0.42, y: 0.60, w: 0.15, h: 0.25 }, movable: true, obstruction: true },
    { id: "obj-laptop", label: "Laptop", confidence: 0.97, bbox: { x: 0.15, y: 0.50, w: 0.10, h: 0.08 }, movable: true, obstruction: false },
    { id: "obj-bottle", label: "Bottle", confidence: 0.90, bbox: { x: 0.28, y: 0.52, w: 0.04, h: 0.10 }, movable: true, obstruction: false },
    { id: "obj-box", label: "Box", confidence: 0.88, bbox: { x: 0.60, y: 0.70, w: 0.18, h: 0.20 }, movable: true, obstruction: true },
    { id: "obj-bag", label: "Bag", confidence: 0.85, bbox: { x: 0.05, y: 0.78, w: 0.12, h: 0.15 }, movable: true, obstruction: true },
  ];
}

/**
 * The three curated candidate profiles referenced throughout the spec
 * and UI mocks. Scores are pre-authored to make the "changing priorities
 * changes the recommendation" behavior demonstrable and consistent.
 */
export function getDemoCandidateProfiles() {
  return [
    {
      name: "Plan A",
      description: "Clear the main walking path only — minimal rearrangement",
      actions: [
        "Slide Chair fully under the Table",
        "Leave Box and Bag in their current position",
      ],
      safety_score: 74,
      accessibility_score: 91,
      efficiency_score: 80,
      effort_score: 95,
      constraint_compliance: true,
    },
    {
      name: "Plan B",
      description: "Clear the path and relocate both obstructions near the exit",
      actions: [
        "Slide Chair fully under the Table",
        "Move Box against the side wall, away from the walkway",
        "Move Bag to the storage nook near the entrance",
      ],
      safety_score: 94,
      accessibility_score: 93,
      efficiency_score: 88,
      effort_score: 84,
      constraint_compliance: true,
    },
    {
      name: "Plan C",
      description: "Full reorganization — maximize safety margins everywhere",
      actions: [
        "Slide Chair fully under the Table",
        "Move Box to a separate storage room",
        "Move Bag to a wall-mounted hook",
        "Reposition Table 30cm from the doorway swing radius",
      ],
      safety_score: 97,
      accessibility_score: 72,
      efficiency_score: 65,
      effort_score: 52,
      constraint_compliance: true,
    },
  ];
}

/** Two named priority presets used in Screen 8 ("Change Priorities"). */
export function getDemoPriorityPresets() {
  return {
    safetyFirst: { safety: 0.4, accessibility: 0.4, efficiency: 0.1, effort: 0.1 },
    minimumMovement: { safety: 0.15, accessibility: 0.15, efficiency: 0.15, effort: 0.55 },
  };
}
