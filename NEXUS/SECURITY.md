# Security Policy

## Reporting a vulnerability

If you find a security issue in this prototype, please open a private
report to Team CODEX rather than a public issue, so it can be
addressed before wider disclosure.

## Practices this project follows

- **Never commit API keys or secrets.** `.env` is git-ignored; only
  `.env.example` (with empty placeholder values) is committed. All
  provider classes in `app/aiProvider.js` read credentials exclusively
  from environment variables, never from hard-coded strings.
- **No API key required to run the demo.** `MockAIProvider`,
  `MockPerceptionProvider`, and `MockVoiceProvider` make the entire
  pipeline runnable with zero credentials and zero network calls.
- **Avoid unnecessary collection of personal data.** The prototype does
  not persist camera frames, audio, or scan results anywhere — all
  state lives in memory for the duration of the browser session and is
  discarded on reload. No analytics or telemetry are wired in.
- **Process sensitive visual information locally where practical.**
  The architecture is designed so that, once a real detection model is
  wired into `LivePerceptionProvider`, inference can run entirely
  in-browser (e.g. via TensorFlow.js) rather than uploading a
  workspace photo to a remote server. `RemoteAIProvider` is opt-in and
  disabled by default.
- **Least-privilege by default.** Camera and microphone access are only
  requested when the user explicitly initiates a live scan or a live
  voice input in a non-demo configuration; Demo Mode requests neither.

## Scope

This document covers the prototype as submitted for iQOO Hackathon
2026. It does not constitute a security audit or a production-readiness
claim.
