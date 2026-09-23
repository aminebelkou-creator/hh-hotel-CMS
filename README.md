# hh-hotel-CMS

Website-as-a-Service for hotels: a multi-tenant platform that generates, hosts and continuously operates a hotel's direct-booking website. Part of the xedge project.

The core is horizontal (no hotel concept in it); hotels are the first vertical pack. Payload on Postgres, one application, pooled tenancy, immutable releases at the edge. EdgeOne Makers is the assumed host behind a week-one gate, with Cloudflare EU as fallback.

## Read first

| Document | What it is |
| --- | --- |
| [docs/01-solution-definition.md](docs/01-solution-definition.md) | The spec: scope, users, service model, domain model, architecture, agent layer, decisions, risks, metrics, CMS decision, hosting decision |
| [docs/02-90-day-plan.md](docs/02-90-day-plan.md) | Week-by-week plan to first paying customers, with gates and fallbacks |
| [docs/03-webstudio-evaluation.md](docs/03-webstudio-evaluation.md) | Prior-art study: what to steal, why not to adopt |
| [docs/04-edgeone-makers-evaluation.md](docs/04-edgeone-makers-evaluation.md) | Hosting candidate: verified facts, quotas, residency, gate criteria |
| [CLAUDE.md](CLAUDE.md) | Rules for AI coding agents working in this repository |

The living versions of these documents are in the Claude Docs artifact; the copies here are exports as of 22 September 2026. Update both or say which is canonical.

## Repository layout (intent)

```
apps/        one application: Next.js + Payload; studio, renderer, control plane
packages/    shared: content model, design tokens, components, release pipeline, connectors
packs/       vertical packs: hotel first (content types, templates, connectors, agent tools)
templates/   template packages, versioned, accessibility- and CWV-gated in CI
docs/        the spec, the plan, the evaluations
scripts/     setup and operational scripts
.claude/     agent skills and project instructions
```

Nothing under `apps/`, `packages/`, `packs/` or `templates/` exists yet. Week one of the plan is the isolation proof of concept and the collection design on paper; code follows that.

## Setup

```powershell
# Windows
.\scripts\setup.ps1
```

```bash
# macOS / Linux
./scripts/setup.sh
```

Installs pnpm, the EdgeOne CLI, and the EdgeOne Makers skills into `.claude/skills/`, then runs `edgeone login`. The MCP server is configured in `.mcp.json` and starts with Claude Code.

## Status

Day 0. See the start gate in the solution definition and week one of the plan.
