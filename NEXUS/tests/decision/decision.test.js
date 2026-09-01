import { assertEqual, assertTrue, assertGreaterThan } from "../assert.js";
import { createCandidate } from "../../app/candidates/candidate.js";
import { evaluateCandidates } from "../../app/evaluator/evaluator.js";
import { decide } from "../../app/decision/decision.js";
import { runMutationPass } from "../../app/mutation/mutation.js";
import { generateCandidates } from "../../app/candidates/generator.js";
import { createWorldState, applyUserIntent } from "../../app/world_state/schema.js";

const cases = [];

cases.push({
  name: "decide() selects the candidate with the highest weighted score (Plan B scenario)",
  fn: () => {
    const planA = createCandidate({ description: "Plan A", safety_score: 74, accessibility_score: 91, efficiency_score: 80, effort_score: 95, constraint_compliance: true });
    const planB = createCandidate({ description: "Plan B", safety_score: 94, accessibility_score: 93, efficiency_score: 88, effort_score: 84, constraint_compliance: true });
    const planC = createCandidate({ description: "Plan C", safety_score: 97, accessibility_score: 72, efficiency_score: 65, effort_score: 52, constraint_compliance: true });

    const priorities = { safety: 0.35, accessibility: 0.35, efficiency: 0.15, effort: 0.15 };
    const scored = evaluateCandidates([planA, planB, planC], priorities);
    const result = decide(scored);

    assertEqual(result.recommendation.description, "Plan B", "Plan B must be recommended under balanced safety+accessibility priorities");
    assertEqual(result.ranked[0].id, result.recommendation.id, "Top of ranked list must equal the recommendation");
  },
});

cases.push({
  name: "changing priorities changes the recommendation — core NEXUS demo requirement",
  fn: () => {
    const planA = createCandidate({ description: "Plan A", safety_score: 74, accessibility_score: 91, efficiency_score: 80, effort_score: 95, constraint_compliance: true });
    const planB = createCandidate({ description: "Plan B", safety_score: 94, accessibility_score: 93, efficiency_score: 88, effort_score: 84, constraint_compliance: true });
    const planC = createCandidate({ description: "Plan C", safety_score: 97, accessibility_score: 72, efficiency_score: 65, effort_score: 52, constraint_compliance: true });

    const safetyFirst = { safety: 0.4, accessibility: 0.4, efficiency: 0.1, effort: 0.1 };
    const resultSafetyFirst = decide(evaluateCandidates([{ ...planA }, { ...planB }, { ...planC }], safetyFirst));
    assertEqual(resultSafetyFirst.recommendation.description, "Plan B");

    // Heavily weighting minimum effort should favor Plan A, which has the
    // highest effort_score (least work) of the three.
    const minimumEffort = { safety: 0.1, accessibility: 0.1, efficiency: 0.1, effort: 0.7 };
    const resultMinEffort = decide(evaluateCandidates([{ ...planA }, { ...planB }, { ...planC }], minimumEffort));
    assertEqual(resultMinEffort.recommendation.description, "Plan A", "Heavily weighting minimum effort should flip the recommendation to Plan A");
  },
});

cases.push({
  name: "confidence is lower when top two candidates are close, higher when the gap is wide",
  fn: () => {
    const close = decide(
      evaluateCandidates(
        [
          createCandidate({ description: "X", safety_score: 80, accessibility_score: 80, efficiency_score: 80, effort_score: 80, constraint_compliance: true }),
          createCandidate({ description: "Y", safety_score: 79, accessibility_score: 79, efficiency_score: 79, effort_score: 79, constraint_compliance: true }),
        ],
        { safety: 0.25, accessibility: 0.25, efficiency: 0.25, effort: 0.25 }
      )
    );
    const wide = decide(
      evaluateCandidates(
        [
          createCandidate({ description: "X", safety_score: 95, accessibility_score: 95, efficiency_score: 95, effort_score: 95, constraint_compliance: true }),
          createCandidate({ description: "Y", safety_score: 40, accessibility_score: 40, efficiency_score: 40, effort_score: 40, constraint_compliance: true }),
        ],
        { safety: 0.25, accessibility: 0.25, efficiency: 0.25, effort: 0.25 }
      )
    );
    assertGreaterThan(wide.confidence, close.confidence, "A wider score gap must yield higher confidence");
  },
});

cases.push({
  name: "mutation pass only keeps a mutation that improves the overall score",
  fn: () => {
    const weak = createCandidate({ description: "Weak plan", safety_score: 40, accessibility_score: 40, efficiency_score: 40, effort_score: 100, constraint_compliance: true });
    const strong = createCandidate({ description: "Strong plan", safety_score: 90, accessibility_score: 90, efficiency_score: 90, effort_score: 90, constraint_compliance: true });
    const priorities = { safety: 0.4, accessibility: 0.3, efficiency: 0.3, effort: 0.0 };
    const scored = evaluateCandidates([weak, strong], priorities);
    const before = scored.find((c) => c.description === "Weak plan").overall_score;

    const result = runMutationPass(scored, priorities);
    const after = result.candidates.find((c) => c.description === "Weak plan").overall_score;

    assertTrue(after >= before, "Mutation must never leave the weakest candidate worse off than before");
  },
});

cases.push({
  name: "generateCandidates in demo mode always returns exactly 3 candidates",
  fn: () => {
    const state = applyUserIntent(createWorldState("workspace"), { goal: "Make this workspace safer and easier to access." });
    const candidates = generateCandidates(state, { mode: "demo" });
    assertEqual(candidates.length, 3, "Demo mode must produce exactly 3 candidate plans");
  },
});

export default cases;
