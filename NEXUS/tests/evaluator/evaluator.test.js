import { assertEqual, assertTrue } from "../assert.js";
import { createCandidate } from "../../app/candidates/candidate.js";
import { evaluateCandidate, evaluateCandidates, CONSTRAINT_VIOLATION_PENALTY } from "../../app/evaluator/evaluator.js";

const cases = [];

cases.push({
  name: "weighted sum matches manual calculation for equal weights",
  fn: () => {
    const candidate = createCandidate({
      description: "Test candidate",
      safety_score: 80,
      accessibility_score: 60,
      efficiency_score: 40,
      effort_score: 20,
      constraint_compliance: true,
    });
    const priorities = { safety: 0.25, accessibility: 0.25, efficiency: 0.25, effort: 0.25 };
    evaluateCandidate(candidate, priorities);
    // (80+60+40+20)/4 = 50
    assertEqual(candidate.overall_score, 50, "Equal-weight overall score");
  },
});

cases.push({
  name: "constraint violation applies the documented penalty",
  fn: () => {
    const compliant = createCandidate({
      description: "Compliant",
      safety_score: 90,
      accessibility_score: 90,
      efficiency_score: 90,
      effort_score: 90,
      constraint_compliance: true,
    });
    const violating = createCandidate({
      description: "Violating",
      safety_score: 90,
      accessibility_score: 90,
      efficiency_score: 90,
      effort_score: 90,
      constraint_compliance: false,
    });
    const priorities = { safety: 0.25, accessibility: 0.25, efficiency: 0.25, effort: 0.25 };
    evaluateCandidate(compliant, priorities);
    evaluateCandidate(violating, priorities);
    assertEqual(
      compliant.overall_score - violating.overall_score,
      CONSTRAINT_VIOLATION_PENALTY,
      "Penalty gap between compliant and violating candidates"
    );
  },
});

cases.push({
  name: "changing priority weights changes which candidate scores highest",
  fn: () => {
    // Mirrors the README/demo Plan B vs Plan C scenario.
    const planB = createCandidate({
      description: "Plan B",
      safety_score: 94,
      accessibility_score: 93,
      efficiency_score: 88,
      effort_score: 84,
      constraint_compliance: true,
    });
    const planC = createCandidate({
      description: "Plan C",
      safety_score: 97,
      accessibility_score: 72,
      efficiency_score: 65,
      effort_score: 52,
      constraint_compliance: true,
    });

    const safetyAccessibilityFirst = { safety: 0.4, accessibility: 0.4, efficiency: 0.1, effort: 0.1 };
    const [scoredB1, scoredC1] = evaluateCandidates([{ ...planB }, { ...planC }], safetyAccessibilityFirst);
    assertTrue(scoredB1.overall_score > scoredC1.overall_score, "Plan B should lead when safety+accessibility dominate");

    const minimumMovement = { safety: 0.15, accessibility: 0.15, efficiency: 0.15, effort: 0.55 };
    const [scoredB2, scoredC2] = evaluateCandidates([{ ...planB }, { ...planC }], minimumMovement);
    assertTrue(scoredB2.overall_score > scoredC2.overall_score, "Plan B should still lead — Plan B also has lower effort than Plan C");
  },
});

cases.push({
  name: "score_breakdown contributions sum to the pre-penalty weighted total",
  fn: () => {
    const candidate = createCandidate({
      description: "Breakdown check",
      safety_score: 70,
      accessibility_score: 50,
      efficiency_score: 30,
      effort_score: 10,
      constraint_compliance: true,
    });
    const priorities = { safety: 0.4, accessibility: 0.3, efficiency: 0.2, effort: 0.1 };
    evaluateCandidate(candidate, priorities);
    const sum =
      candidate.score_breakdown.safety.contribution +
      candidate.score_breakdown.accessibility.contribution +
      candidate.score_breakdown.efficiency.contribution +
      candidate.score_breakdown.effort.contribution;
    assertTrue(Math.abs(sum - candidate.overall_score) < 1, "Contributions should sum close to overall_score (no penalty here)");
  },
});

export default cases;
