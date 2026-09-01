import { assertEqual, assertTrue } from "../assert.js";
import {
  createWorldState,
  validateWorldState,
  normalizePriorities,
  addObject,
  applyUserIntent,
  defaultPriorities,
} from "../../app/world_state/schema.js";

const cases = [];

cases.push({
  name: "createWorldState produces a valid, well-formed state",
  fn: () => {
    const state = createWorldState("workspace");
    assertTrue(validateWorldState(state), "Fresh world state should validate");
    assertEqual(state.environment, "workspace");
    assertEqual(state.objects.length, 0);
  },
});

cases.push({
  name: "validateWorldState rejects a state missing required fields",
  fn: () => {
    let threw = false;
    try {
      validateWorldState({ environment: "workspace" }); // missing objects/goal/etc
    } catch (e) {
      threw = true;
    }
    assertTrue(threw, "validateWorldState should throw on malformed input");
  },
});

cases.push({
  name: "normalizePriorities always sums to 1.0",
  fn: () => {
    const normalized = normalizePriorities({ safety: 2, accessibility: 2, efficiency: 0, effort: 0 });
    const sum = Object.values(normalized).reduce((a, b) => a + b, 0);
    assertTrue(Math.abs(sum - 1) < 1e-9, "Normalized priorities must sum to 1.0");
  },
});

cases.push({
  name: "normalizePriorities falls back to defaults when all-zero",
  fn: () => {
    const normalized = normalizePriorities({ safety: 0, accessibility: 0, efficiency: 0, effort: 0 });
    assertEqual(JSON.stringify(normalized), JSON.stringify(defaultPriorities()));
  },
});

cases.push({
  name: "addObject appends without mutating the original state",
  fn: () => {
    const state = createWorldState("workspace");
    const next = addObject(state, { id: "obj-1", label: "Chair" });
    assertEqual(state.objects.length, 0, "Original state must remain unmutated");
    assertEqual(next.objects.length, 1, "New state should have the added object");
  },
});

cases.push({
  name: "applyUserIntent sets goal, constraints and normalized priorities",
  fn: () => {
    const state = createWorldState("workspace");
    const next = applyUserIntent(state, {
      goal: "Make this workspace safer",
      constraints: ["Do not block the doorway"],
      priorities: { safety: 1, accessibility: 1, efficiency: 0, effort: 0 },
    });
    assertEqual(next.goal, "Make this workspace safer");
    assertEqual(next.constraints.length, 1);
    assertTrue(Math.abs(next.priorities.safety - 0.5) < 1e-9, "Safety weight should normalize to 0.5");
  },
});

export default cases;
