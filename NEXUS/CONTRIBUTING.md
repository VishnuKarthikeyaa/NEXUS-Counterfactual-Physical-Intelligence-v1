# Contributing to NEXUS

This is a hackathon prototype maintained by Team CODEX. Contributions
during the event are welcome from team members; external contributions
are welcome after submission.

## Development principles

1. **Working MVP over huge architecture.** Don't add a module unless it
   serves the current demo or a concretely-scoped roadmap item.
2. **Clear code over clever code.** The scoring, ranking, and mutation
   logic must stay easy for a judge (or a new contributor) to read in
   one pass.
3. **Honest claims over exaggerated claims.** Never label an estimated
   value as observed fact, and never add a benchmark, statistic, or
   citation that wasn't actually produced or verified.
4. **No new dependency without a reason.** The prototype currently runs
   with zero runtime dependencies — keep it that way unless a feature
   genuinely requires one.

## Setup

```bash
git clone <this-repo-url>
cd NEXUS
npm start      # serves ui/ at http://localhost:8080
npm test       # runs the unit test suite
```

## Making changes

- **Pipeline logic** (`app/`): add or update unit tests in `tests/`
  alongside any behavior change. `npm test` must pass before a PR is
  opened.
- **UI** (`ui/`): keep orchestration (`main.js`) free of scoring logic —
  it should only call into `app/` modules and update the DOM.
- **Docs** (`docs/`): update `docs/architecture.md` if you change a
  module's responsibility or a data contract; update `docs/demo.md` if
  you change the screen flow.

## Commit style

Write commit messages in the imperative mood describing what changed
and why, e.g. `Add constraint-compliance penalty to evaluator`, not
`Fixed stuff`.

## Code of conduct

Be respectful and constructive in reviews and issues. Disagreements
about implementation approach are normal and welcome — keep them
focused on the technical trade-offs.
