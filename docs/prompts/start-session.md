# Start a working session

**For:** a coding agent (for example Claude) working in this repository on the owner's PC.

```text
You are continuing work on the hh-hotel-CMS platform (Website-as-a-Service for independent
hotels: one multi-tenant Payload CMS on Postgres, hosted on EdgeOne Makers, Frankfurt).

Before doing anything, read:
1. docs/13-how-it-works.md (what the platform is, the words we use, where things live)
2. HANDOFF.md (current state, plan deltas, next actions, delta log)
3. CLAUDE.md (non-negotiable rules and known gotchas)
4. docs/CHECKLIST.md (progress)

Then work on: [the next action from HANDOFF.md, or: "the first open ENG item in the Phase 2 list"].

Rules for this session:
- Work autonomously; stop and ask only when blocked, when an action is irreversible, costs
  money, touches DNS or secrets, or publishes to a live hotel site.
- Schema changes are migrations only; rehearse them on the 50-tenant database before Neon.
- Run the local suites (10 tenants with the HTTP server, 50 tenants) and keep CI green.
- Never print or commit secrets; they live in user environment variables and GitHub secrets.

At the end of the session:
- Update docs/CHECKLIST.md (tick what is done, with evidence links), HANDOFF.md (rewrite
  "Current state", add a delta-log entry: changed, learned, left undone), README.md and any
  document your change affects; add screenshots under docs/screenshots/ if the site changed.
- Commit with a clear message and push; confirm CI is green; deploy only if asked.
- Report to the owner in plain words: what changed, what was verified, what needs them.
```
