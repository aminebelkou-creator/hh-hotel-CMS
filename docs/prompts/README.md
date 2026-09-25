# Example prompts

Ready-to-use prompts for the recurring jobs on this project. Copy one, replace the `[bracketed]` parts, and give it to the agent or person named in its header. They all rely on the same documents, so the answers stay consistent with how the platform works.

| Prompt | For | Use it when |
| --- | --- | --- |
| [start-session.md](start-session.md) | A coding agent in this repository | Starting a working session: pick up the next action, finish with docs updated |
| [implement-template.md](implement-template.md) | A coding agent | A designer has delivered a template and it must be built |
| [propose-template.md](propose-template.md) | An AI design assistant | You need a new template and have no designer |
| [designer-brief-email.md](designer-brief-email.md) | A freelance designer (by email) | Commissioning a template |
| [brand-proposal.md](brand-proposal.md) | An AI assistant, or a coding agent with admin access | Choosing a template and brand for a new hotel |
| [onboard-hotel-self-service.md](onboard-hotel-self-service.md) | A team member in the admin | Putting a new hotel on the platform with the Phase 3 tools (import, review, draft, translate, look) |
| [onboard-hotel.md](onboard-hotel.md) | A coding agent | Putting a new hotel on the platform by hand-written content (customer zero's way) |
| [add-feature.md](add-feature.md) | A coding agent | Adding a feature, a hotel-pack type or a Payload plugin |

## How these prompts are written

- **Read first.** Every prompt for an agent starts by pointing to [`../13-how-it-works.md`](../13-how-it-works.md), [`../../CLAUDE.md`](../../CLAUDE.md) and [`../../HANDOFF.md`](../../HANDOFF.md). The rules live there, not in the prompt.
- **One job, a clear finish.** Each prompt says what "done" means: tests passing, screenshots, which documents to update.
- **Stop conditions.** Each prompt says when the agent must stop and ask instead of improvising (a new block, a publish to a live site, a purchase, anything touching secrets).
- **No secrets.** Passwords and keys stay in environment variables on the owner's PC or in GitHub secrets. Never paste one into a prompt.
