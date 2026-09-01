/**
 * NEXUS UI Controller
 * -------------------
 * Thin orchestration layer: wires the 8 screens to the pipeline modules
 * in app/. Contains no scoring or decision logic itself — that all
 * lives in app/evaluator, app/decision, app/mutation so it stays
 * testable independent of the DOM.
 *
 * Pipeline call order mirrors the architecture doc:
 *   Perception -> World State -> Candidate Generator -> Evaluator
 *   -> Mutation Loop -> Decision Engine -> Recommendation + Explanation
 */

import { createWorldState, applyUserIntent, normalizePriorities } from "../app/world_state/schema.js";
import { generateCandidates } from "../app/candidates/generator.js";
import { evaluateCandidates } from "../app/evaluator/evaluator.js";
import { runMutationPass } from "../app/mutation/mutation.js";
import { decide } from "../app/decision/decision.js";
import { selectPerceptionProvider } from "../app/perception/perception.js";
import { selectVoiceProvider } from "../app/voice/voice.js";
import { getDemoPriorityPresets } from "../app/demo/demoData.js";

// ---- Force deterministic demo mode: no camera model, no API key, no network required.
const FORCE_DEMO_MODE = true;
const perceptionProvider = selectPerceptionProvider({ forceDemoMode: FORCE_DEMO_MODE });
const voiceProvider = selectVoiceProvider({ forceDemoMode: FORCE_DEMO_MODE });

/** @type {import("../app/world_state/schema.js").WorldState} */
let worldState = createWorldState("workspace");
let scoredCandidates = [];
let decisionResult = null;
let lastViewedCandidateId = null;

// ---------------------------------------------------------------
// Screen navigation
// ---------------------------------------------------------------
const screens = Array.from(document.querySelectorAll(".screen"));
function showScreen(name) {
  for (const el of screens) el.classList.toggle("is-active", el.dataset.screen === name);
  window.scrollTo(0, 0);
}

document.addEventListener("click", (e) => {
  const actionEl = e.target.closest("[data-action]");
  if (!actionEl) return;
  const action = actionEl.dataset.action;
  handleAction(action, actionEl);
});

async function handleAction(action) {
  switch (action) {
    case "go-scan":
      showScreen("scan");
      await runScan();
      break;
    case "go-ask":
      showScreen("goal");
      break;
    case "back-home":
      showScreen("home");
      break;
    case "back-scan":
      showScreen("scan");
      break;
    case "go-goal":
      showScreen("goal");
      break;
    case "use-voice":
      await useVoice();
      break;
    case "go-analysis":
      captureGoalAndPriorities();
      showScreen("analysis");
      await runAnalysisPipeline();
      showScreen("results");
      renderResults();
      break;
    case "back-goal":
      showScreen("goal");
      break;
    case "go-compare":
      renderCompare();
      showScreen("compare");
      break;
    case "go-priorities":
      syncPriorityScreenInputs();
      showScreen("priorities");
      break;
    case "back-results":
      showScreen("results");
      renderResults();
      break;
    case "recalculate":
      applyPriorityScreenInputs();
      rescoreAndDecide();
      showScreen("results");
      renderResults();
      break;
    default:
      break;
  }
}

// ---------------------------------------------------------------
// SCREEN 2 — Scan (Perception Layer)
// ---------------------------------------------------------------
async function runScan() {
  const countEl = document.getElementById("detectedCount");
  const listEl = document.getElementById("detectedList");
  const overlayEl = document.getElementById("detectionOverlay");
  const continueBtn = document.getElementById("continueFromScan");

  countEl.textContent = "Scanning…";
  listEl.innerHTML = "";
  overlayEl.innerHTML = "";
  continueBtn.disabled = true;

  const objects = await perceptionProvider.detectObjects();
  worldState = { ...worldState, objects };

  countEl.textContent = `${objects.length} objects detected`;
  for (const obj of objects) {
    const li = document.createElement("li");
    li.textContent = obj.label;
    if (obj.obstruction) li.classList.add("is-obstruction");
    listEl.appendChild(li);

    const box = document.createElement("div");
    box.className = "detection-box";
    box.style.left = `${obj.bbox.x * 100}%`;
    box.style.top = `${obj.bbox.y * 100}%`;
    box.style.width = `${obj.bbox.w * 100}%`;
    box.style.height = `${obj.bbox.h * 100}%`;
    const label = document.createElement("span");
    label.textContent = obj.label;
    box.appendChild(label);
    overlayEl.appendChild(box);
  }
  continueBtn.disabled = false;
}

// ---------------------------------------------------------------
// SCREEN 3 — Goal + priorities
// ---------------------------------------------------------------
function readPriorityInputs(container) {
  const priorities = {};
  container.querySelectorAll(".priority-row").forEach((row) => {
    const key = row.dataset.priority;
    const input = row.querySelector("input[type='range']");
    priorities[key] = Number(input.value) / 100;
  });
  return normalizePriorities(priorities);
}

// live output label sync for every priority slider on the page
document.querySelectorAll(".priority-row input[type='range']").forEach((input) => {
  const output = input.parentElement.querySelector("output");
  input.addEventListener("input", () => (output.textContent = input.value));
});

async function useVoice() {
  const textarea = document.getElementById("goalText");
  const micBtn = document.getElementById("micButton");
  micBtn.textContent = "…";
  try {
    const transcript = await voiceProvider.listen();
    textarea.value = transcript;
  } finally {
    micBtn.textContent = "🎙";
  }
}

function captureGoalAndPriorities() {
  const goalSection = document.querySelector('[data-screen="goal"]');
  const goal = document.getElementById("goalText").value.trim();
  const priorities = readPriorityInputs(goalSection);
  worldState = applyUserIntent(worldState, {
    goal,
    constraints: ["Do not block the doorway", "Keep laptop reachable from the seated position"],
    priorities,
  });
}

// ---------------------------------------------------------------
// SCREEN 4 — Analysis (Generator -> Evaluator -> Mutation -> Decision)
// ---------------------------------------------------------------
async function runAnalysisPipeline() {
  const steps = Array.from(document.querySelectorAll("#analysisSteps li"));
  for (const li of steps) li.classList.remove("is-done");

  const candidates = generateCandidates(worldState, { mode: "demo" });

  for (const li of steps) {
    // eslint-disable-next-line no-await-in-loop
    await wait(320);
    li.classList.add("is-done");
  }

  scoredCandidates = evaluateCandidates(candidates, worldState.priorities);

  // Run one improvement pass — the prototype's self-improvement loop.
  const mutationResult = runMutationPass(scoredCandidates, worldState.priorities);
  scoredCandidates = mutationResult.candidates;

  decisionResult = decide(scoredCandidates);
  await wait(250);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------
// SCREEN 5 — Results
// ---------------------------------------------------------------
function renderResults() {
  const list = document.getElementById("candidateList");
  list.innerHTML = "";
  const ranked = decisionResult.ranked;
  const topId = decisionResult.recommendation.id;

  ranked.forEach((c) => {
    const card = document.createElement("div");
    card.className = "candidate-card" + (c.id === topId ? " is-recommended" : "");
    card.dataset.candidateId = c.id;
    card.innerHTML = `
      ${scoreRingSVG(c.overall_score)}
      <div>
        <p class="candidate-card__name">${escapeHTML(candidateLabel(c))}</p>
        <p class="candidate-card__desc">${escapeHTML(c.description)}</p>
        ${c.id === topId ? '<span class="candidate-card__tag">★ Recommended</span>' : ""}
      </div>
    `;
    card.addEventListener("click", () => {
      lastViewedCandidateId = c.id;
      renderWhyPanel(c);
      showScreen("why");
    });
    list.appendChild(card);
  });
}

function candidateLabel(candidate) {
  // Demo profiles are named Plan A/B/C in generation order; fall back to description.
  const order = ["Plan A", "Plan B", "Plan C"];
  const idx = scoredCandidates.findIndex((c) => c.id === candidate.id);
  return order[idx] ?? candidate.description;
}

function scoreRingSVG(score) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return `
    <svg class="ring" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="${r}" fill="none" stroke="#1B2434" stroke-width="6"/>
      <circle cx="32" cy="32" r="${r}" fill="none" stroke="#3FE0FF" stroke-width="6"
        stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"
        transform="rotate(-90 32 32)"/>
      <text x="32" y="33">${score}</text>
    </svg>
  `;
}

// ---------------------------------------------------------------
// SCREEN 6 — Why this plan?
// ---------------------------------------------------------------
function renderWhyPanel(candidate) {
  const title = document.getElementById("whyTitle");
  const panel = document.getElementById("whyPanel");
  title.textContent = `Why ${candidateLabel(candidate)}?`;

  const isTop = candidate.id === decisionResult.recommendation.id;
  const explanation = isTop
    ? decisionResult.recommendation.explanation
    : buildNonTopExplanation(candidate);

  panel.innerHTML = `
    <p class="why-panel__summary">${escapeHTML(explanation.summary)}</p>
    <ul class="why-panel__reasons">
      ${explanation.reasons.map((r) => `<li>${escapeHTML(r)}</li>`).join("")}
    </ul>
    <div class="why-panel__confidence">
      <span>Confidence</span>
      <span>${explanation.confidence}%</span>
    </div>
    <p class="why-panel__disclaimer">${escapeHTML(explanation.disclaimer)}</p>
  `;
}

function buildNonTopExplanation(candidate) {
  const top = decisionResult.recommendation;
  return {
    summary: `${candidateLabel(candidate)} — overall score ${candidate.overall_score}/100`,
    reasons: [
      `Scored ${top.overall_score - candidate.overall_score}pt lower than the recommended plan under your current priorities`,
      candidate.constraint_compliance ? "Required constraints satisfied" : "Does not fully satisfy stated constraints",
    ],
    confidence: decisionResult.confidence,
    disclaimer:
      "All scores are ESTIMATED outcomes based on the current world state and priority weights, not guaranteed results.",
  };
}

// ---------------------------------------------------------------
// SCREEN 7 — Compare
// ---------------------------------------------------------------
function renderCompare() {
  const table = document.getElementById("compareTable");
  const topId = decisionResult.recommendation.id;
  const dims = [
    ["safety_score", "Safety"],
    ["accessibility_score", "Accessibility"],
    ["efficiency_score", "Efficiency"],
    ["effort_score", "Effort"],
    ["overall_score", "Overall"],
  ];

  const header = `<thead><tr><th></th>${scoredCandidates
    .map((c) => `<th class="${c.id === topId ? "is-recommended-col" : ""}">${escapeHTML(candidateLabel(c))}</th>`)
    .join("")}</tr></thead>`;

  const rows = dims
    .map(([key, label]) => {
      const values = scoredCandidates.map((c) => c[key]);
      const best = Math.max(...values);
      const cells = scoredCandidates
        .map((c) => `<td class="${c[key] === best ? "is-best" : ""}">${c[key]}</td>`)
        .join("");
      return `<tr><td>${label}</td>${cells}</tr>`;
    })
    .join("");

  table.innerHTML = header + `<tbody>${rows}</tbody>`;
}

// ---------------------------------------------------------------
// SCREEN 8 — Change priorities
// ---------------------------------------------------------------
function syncPriorityScreenInputs() {
  const section = document.querySelector('[data-screen="priorities"]');
  section.querySelectorAll(".priority-row").forEach((row) => {
    const key = row.dataset.priority;
    const input = row.querySelector("input[type='range']");
    const output = row.querySelector("output");
    const value = Math.round((worldState.priorities[key] ?? 0) * 100);
    input.value = value;
    output.textContent = value;
  });
}

function applyPriorityScreenInputs() {
  const section = document.querySelector('[data-screen="priorities"]');
  const priorities = readPriorityInputs(section);
  worldState = applyUserIntent(worldState, { priorities });
}

function rescoreAndDecide() {
  // Re-evaluate the SAME candidates under the new priorities — this is
  // exactly what proves NEXUS is a decision engine, not a static
  // response generator: identical plans, different ranked outcome.
  scoredCandidates = evaluateCandidates(scoredCandidates, worldState.priorities);
  decisionResult = decide(scoredCandidates);
}

document.querySelectorAll(".chip[data-preset]").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip[data-preset]").forEach((c) => c.classList.remove("is-active"));
    chip.classList.add("is-active");
    const presets = getDemoPriorityPresets();
    const preset = presets[chip.dataset.preset];
    worldState = applyUserIntent(worldState, { priorities: preset });
    syncPriorityScreenInputs();
  });
});

// ---------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Initial screen
showScreen("home");
