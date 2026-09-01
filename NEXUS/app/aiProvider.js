/**
 * AIProvider
 * ----------
 * A minimal, swappable interface for anything that needs a language
 * model in the future (e.g. turning a natural-language goal into
 * structured constraints, or generating richer plan descriptions).
 *
 * The current prototype's core decision pipeline (evaluator, mutation,
 * decision engine) does NOT require an AIProvider at all — all of its
 * scoring and ranking logic is deterministic and model-free. This
 * interface exists so the roadmap item "natural-language goal parsing"
 * has a clear seam to plug into, without requiring an API key today.
 *
 * interface AIProvider {
 *   async complete(prompt: string): Promise<string>
 *   isAvailable(): boolean
 * }
 */

export class MockAIProvider {
  isAvailable() {
    return true;
  }

  /**
   * Deterministic canned responses keyed by simple prompt matching —
   * enough to demo "AI-assisted explanation" without any network call
   * or API key.
   */
  async complete(prompt) {
    if (/why/i.test(prompt)) {
      return "This plan best balances the priorities you set, while satisfying all required constraints.";
    }
    return "Deterministic mock response — no external AI call was made.";
  }
}

/**
 * Stub for a future on-device model (e.g. a small local LLM via WebLLM
 * or a native on-device model on the phone). Not implemented in this
 * prototype; present to keep the interface honest about the roadmap.
 */
export class LocalAIProvider {
  isAvailable() {
    return false; // not implemented in this prototype
  }
  async complete() {
    throw new Error("LocalAIProvider is not implemented in this prototype");
  }
}

/**
 * Stub for a future hosted endpoint. Reads its endpoint/key from
 * environment variables only — NEVER hard-code credentials here.
 */
export class RemoteAIProvider {
  constructor({ endpoint = null, apiKey = null } = {}) {
    this._endpoint = endpoint;
    this._apiKey = apiKey;
  }

  isAvailable() {
    return !!this._endpoint && !!this._apiKey;
  }

  async complete(prompt) {
    if (!this.isAvailable()) {
      throw new Error("RemoteAIProvider is not configured — set NEXUS_REMOTE_AI_ENDPOINT / NEXUS_REMOTE_AI_API_KEY");
    }
    const response = await fetch(this._endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this._apiKey}`,
      },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) throw new Error(`RemoteAIProvider request failed: ${response.status}`);
    const data = await response.json();
    return data.text ?? "";
  }
}

/**
 * Selects the best available provider without ever requiring one to
 * run the demo: Remote if configured, else Local if implemented, else
 * the deterministic Mock.
 */
export function selectAIProvider({ endpoint, apiKey } = {}) {
  const remote = new RemoteAIProvider({ endpoint, apiKey });
  if (remote.isAvailable()) return remote;
  const local = new LocalAIProvider();
  if (local.isAvailable()) return local;
  return new MockAIProvider();
}
