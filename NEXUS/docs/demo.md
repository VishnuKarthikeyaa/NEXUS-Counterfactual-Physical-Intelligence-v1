# Judge demonstration script

Total runtime: ~90 seconds. Requires nothing but the phone/laptop
running `ui/index.html` — no internet, no API key, no camera
permission needed (Demo Mode is on by default).

## Setup (before judges arrive)

```
cd NEXUS
npm start
# or: python3 -m http.server 8080 --directory ui
```

Open `http://localhost:8080` on a phone or in a mobile-width browser
window. Confirm the **DEMO MODE** badge is visible in the top-right of
the status bar.

## Script

**1. Home (5s)**
> "This is NEXUS — a decision intelligence engine, not a chatbot. It
> senses a physical space, generates multiple possible actions, and
> recommends the one that best fits your constraints."

Tap **Scan environment**.

**2. Scan (10s)**
The simulated workspace scene appears with live-looking bounding boxes.
> "NEXUS detects six objects: table, chair, laptop, bottle, box, bag.
> Chair, box, and bag are flagged as obstructions."

Tap **Continue**.

**3. Goal (15s)**
The goal field is pre-filled: *"Make this workspace safer and easier
to access."* Optionally tap the mic icon to show the voice input path
resolves to the same scripted transcript.
> "I can type or speak my goal, and set how much I care about safety,
> accessibility, efficiency, and minimizing physical effort."

Tap **Explore possibilities**.

**4. Analysis (5s)**
A short animated pipeline plays: evaluating safety → accessibility →
effort → constraints.
> "Behind this animation, NEXUS just ran three candidate plans through
> a transparent weighted evaluator and one self-improvement pass."

**5. Results (15s)**
Three ranked candidate cards appear, Plan B marked **★ Recommended**
with a ring score of ~91/100.
> "Plan B — clear the path and relocate both obstructions — is the
> strongest balance of safety and accessibility for reasonable effort."

Tap the **Plan B** card.

**6. Why this plan? (10s)**
> "Every recommendation is explainable: highest overall score,
> constraints satisfied, and here's the specific trade-off against the
> runner-up — plus an honest confidence estimate, not false certainty."

Tap **Back to plans**, then tap **Compare all**.

**7. Compare (10s)**
A side-by-side table shows all four sub-scores plus overall for all
three plans, with the best value per row highlighted.
> "Nothing is hidden — you can see exactly where each plan wins and
> loses."

**8. Change priorities — the key moment (20s)**
Tap **Change priorities**. Tap the **Minimum movement** preset (or
manually raise the "Minimum effort" slider toward the right).
> "Now watch — I haven't touched the scene or the objects. I'm only
> telling NEXUS I care much more about minimum effort."

Tap **Recalculate recommendation**.
> "The recommendation changes. This is the point: NEXUS is a decision
> engine that reasons over trade-offs, not a static response
> generator that gives the same answer every time."

## Closing line

> "Sense, understand, generate, evaluate, improve, decide — all fully
> transparent, all running with zero network dependency, ready to
> extend to any physical-decision domain."
