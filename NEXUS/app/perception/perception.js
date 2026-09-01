/**
 * Perception Layer
 * ----------------
 * Converts raw camera input into OBSERVED WorldObject entries.
 *
 * Two implementations behind one interface, so the rest of the
 * pipeline never has to know or care which one is active:
 *
 *   MockPerceptionProvider  — returns the curated demo scene.
 *                             Always available, needs no camera or model.
 *   LivePerceptionProvider  — wraps a real object-detection model
 *                             (e.g. a TensorFlow.js COCO-SSD model loaded
 *                             from CDN) when the browser/device supports it.
 *                             Falls back gracefully if the model can't load.
 *
 * PerceptionProvider interface:
 *   async detectObjects(videoElementOrNull) -> WorldObject[]
 *   isAvailable() -> boolean
 */

import { getDemoDetectedObjects } from "../demo/demoData.js";

export class MockPerceptionProvider {
  isAvailable() {
    return true;
  }

  async detectObjects() {
    // Deterministic — same scene every run, by design.
    return getDemoDetectedObjects();
  }
}

/**
 * Live provider stub. Designed to be wired up to an actual in-browser
 * detection model (e.g. @tensorflow-models/coco-ssd) when network
 * access and a suitable device are available. Intentionally does not
 * ship a bundled model in this prototype — see docs/feasibility.md for
 * why that tradeoff was made for a 36-hour hackathon build.
 */
export class LivePerceptionProvider {
  constructor({ modelLoader = null } = {}) {
    this._modelLoader = modelLoader; // async () => detectionModel
    this._model = null;
  }

  isAvailable() {
    return typeof navigator !== "undefined" && !!navigator.mediaDevices && !!this._modelLoader;
  }

  async _ensureModel() {
    if (!this._model && this._modelLoader) {
      this._model = await this._modelLoader();
    }
    return this._model;
  }

  /**
   * @param {HTMLVideoElement} videoElement
   * @returns {Promise<Array>} WorldObject[]
   */
  async detectObjects(videoElement) {
    const model = await this._ensureModel();
    if (!model || !videoElement) {
      throw new Error("LivePerceptionProvider requires a loaded model and a video element");
    }
    const predictions = await model.detect(videoElement);
    return predictions.map((p, i) => ({
      id: `live-obj-${i}-${Date.now()}`,
      label: p.class,
      confidence: Math.round(p.score * 100) / 100,
      bbox: normalizeBox(p.bbox, videoElement),
      movable: true, // unknown from vision alone; conservative default, user can correct
      obstruction: false, // computed later from bbox overlap with known walk paths
    }));
  }
}

function normalizeBox([x, y, w, h], videoElement) {
  const vw = videoElement.videoWidth || 1;
  const vh = videoElement.videoHeight || 1;
  return { x: x / vw, y: y / vh, w: w / vw, h: h / vh };
}

/**
 * Selects the best available provider: prefers Live if genuinely
 * available, otherwise falls back to Mock so the app never breaks.
 */
export function selectPerceptionProvider({ forceDemoMode = true, modelLoader = null } = {}) {
  if (forceDemoMode) return new MockPerceptionProvider();
  const live = new LivePerceptionProvider({ modelLoader });
  return live.isAvailable() ? live : new MockPerceptionProvider();
}
