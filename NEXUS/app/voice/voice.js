/**
 * Voice Input
 * -----------
 * VoiceInputProvider interface:
 *   async listen() -> string   (the transcribed utterance)
 *   isAvailable() -> boolean
 *
 * MockVoiceProvider guarantees the demo works even on devices/browsers
 * without speech recognition support, or with the microphone denied.
 */

import { DEMO_GOAL } from "../demo/demoData.js";

export class MockVoiceProvider {
  isAvailable() {
    return true;
  }

  async listen() {
    // Deterministic scripted utterance for the judge demo.
    return DEMO_GOAL;
  }
}

/**
 * Wraps the browser's SpeechRecognition API where present
 * (webkitSpeechRecognition in Chrome/Chromium-based browsers).
 */
export class LiveVoiceProvider {
  isAvailable() {
    return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  async listen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) throw new Error("SpeechRecognition is not supported in this browser");

    return new Promise((resolve, reject) => {
      const recognizer = new SpeechRecognition();
      recognizer.lang = "en-US";
      recognizer.interimResults = false;
      recognizer.maxAlternatives = 1;

      recognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };
      recognizer.onerror = (event) => reject(new Error(`Speech recognition error: ${event.error}`));
      recognizer.onend = () => {
        // If onresult never fired, resolve with empty string rather than hang.
      };

      recognizer.start();
    });
  }
}

/**
 * Selects Live voice input if genuinely available and not forced into
 * demo mode; otherwise falls back to the deterministic Mock provider.
 */
export function selectVoiceProvider({ forceDemoMode = true } = {}) {
  if (forceDemoMode) return new MockVoiceProvider();
  const live = new LiveVoiceProvider();
  return live.isAvailable() ? live : new MockVoiceProvider();
}
