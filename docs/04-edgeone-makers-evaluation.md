# EdgeOne Makers evaluation

**Decision, 22 September 2026: assumed production provider, behind a week-one gate, with Cloudflare EU as the pre-wired fallback.** The findings below stand and are the reason the gate exists: quotas with no published path past them, unpublished commercial pricing, a two-week-old multi-tenancy feature whose platform API is referenced but not documented publicly, and EU residency that is achievable via Frankfurt and a DPA but remains a sales friction. The gate criteria are in the solution definition under *Hosting provider decision*. Findings checked 22 September 2026.

Verification, updated. The [Platform and Multi-Tenancy](https://edgeone.ai/document/218316253599858688) page exists and describes two tenancy modes, and a responsibility split in which Makers handles builds, delivery, certificates, scaling and per-tenant isolation of code, configuration, domains and usage, while the enterprise platform handles users, sessions, application ownership, publishing decisions, quotas, billing and tenant-to-project mapping. Usage is counted per project. What the page does not contain is the API itself — no endpoints, parameters, examples, quotas, pricing, SLA or regions — and it directs evaluation to Tencent Cloud support for a demo and integration guidance. So the first task of the gate is unchanged: open that conversation on day one and get the API, the quotas and the terms in writing.

## Claims checked

| Claim | Status | Detail |
| --- | --- | --- |
| Pages renamed to Makers, expanded to full-stack and agents | **Verified** | June 2026 release notes; no migration required |
| Agent runtime supports Claude Agent SDK, OpenAI Agents, LangGraph, DeepAgents, CrewAI | **Verified** | June 2026, with built-in runtime, session storage, tools and sandbox |
| Models Gateway and Blob storage | **Verified** | June 2026 |
| Cloud Functions multi-region | **Verified** | April 2026 |
| "Makers for Platforms" with two tenancy modes | **Verified** | The Platform and Multi-Tenancy page describes an independent-project mode per tenant and a shared-code mode where "tenant identification and data loading [are] performed at the edge by domain name, path, or business context", and the responsibility split with the enterprise platform |
| Platform API for project creation, artifact upload, deploy, domain binding, certificates | **Referenced, not documented** | The same page says SDKs and APIs exist for these operations but gives no endpoint names, parameters, code, quotas, pricing, SLA or regions; it directs evaluation inquiries to Tencent Cloud support |
| Commercial pricing not yet released | **Verified** | Official pricing page lists only the free plan, "more pricing options coming soon"; free plan stated permanent |
| 3,200+ edge nodes, APAC strength | Not independently verified; consistent with third-party reviews | — |

## Free-tier quotas that matter for a Website-as-a-Service

| Quota | Free edition | Consequence for this product |
| --- | --- | --- |
| Projects per account | 40 | One project must serve all sites via host routing, or Platforms must be used |
| Custom domains | 200 | A hard ceiling on customers until commercial quotas exist |
| Builds per month, concurrent builds | 500, 1 | About 16 publishes a day, one at a time. A managed service that publishes continuously across the fleet hits this early |
| Total storage, max file | 5 GB, 25 MB | Media must live elsewhere |
| Edge Function executions | 3 million per month | Adequate for early traffic |
| Cloud Function executions, duration | 1 million per month, 30–120 s | Adequate early; long agent jobs must use the Agent runtime |
| Agent executions, concurrent sessions | 200,000 per month, 40 | Useful for experiments; not a fleet-scale agent tier |
| KV, Blob | 1 GB each | Not a content store |
| Deployment retention | Three most recent successful deployments, per the earlier report; verify | Own release store required regardless |

The documentation states all quotas "may be adjusted after commercialization". That is the problem: the numbers that decide whether this hosts a managed service are the ones not yet published.

## Data residency and compliance

More addressable than earlier assumed, and still a friction.

- Cloud Functions can be pinned to **Frankfurt**, the only European region; the international default is Singapore, set per project in `edgeone.json`.
- Tencent Cloud International holds ISO 27001, ISO 27701, SOC 2 Type II, PCI DSS and Germany's C5, and publishes a Data Processing Agreement. GDPR is not named on the compliance page; the contracting entity and EU data-centre list are not disclosed there.
- Edge Functions, KV and Blob run and store on the global edge; where a given request's data is processed is not documented regionally. For anything handling personal data at the edge, that is a transfer question for the DPA and standard contractual clauses.
- There is no managed database. Postgres lives elsewhere, ideally in Frankfurt, with cloud functions pinned beside it.

So residency is achievable on paper with Frankfurt plus the DPA. The remaining cost is commercial: a French hotelier's data-protection officer, or their guests, will ask why their data sits with a Chinese cloud, and the answer has to be ready every time.

## Ecosystem, honestly

Real and growing. `edgeone-makers-tools` has about 1.9k stars, the deployment MCP server about 430, the templates repository about 210. The agent starters are MIT and useful as reference. Against that: the official starters have zero to four stars, an independent review rates the platform 7.5/10 with rough English documentation and an unproven Western support record, and recommends it for APAC-focused projects rather than exclusively European audiences.

## The dependency to refuse

The suggestion that Makers for Platforms could "eventually replace parts of the deployment control plane" is exactly the dependency the solution definition exists to avoid. Tenancy, releases, domains and rollback are the control plane; delegating them to a provider feature that shipped two weeks ago, on a platform with unpublished pricing, hands the core of the business to a vendor's roadmap. Use a provider as execution infrastructure, never as the source of truth for tenants and releases.

## Recommendation

1. Assumed provider for v1, behind the week-one gate; Cloudflare with EU localisation pre-wired as fallback.
2. Two re-evaluation triggers if the gate fails: commercial pricing published, and Platforms documentation published with tenant quotas and isolation model.
3. Deploy the proof-of-concept application to Makers Frankfurt in week one to learn real build times, the one-concurrent-build constraint, and developer experience.
4. Do not couple the agent runtime to Makers. The generation pipeline and service loop run inside the application; a provider's agent runtime is an execution option, not an architecture.
5. If APAC customers ever become a segment, revisit: the network is genuinely strong there and the calculus changes.

## Tooling

- CLI: `npm install -g edgeone`, then `edgeone login` (browser) or `-t <token>` for CI. Commands: `edgeone makers create|init|link|dev|deploy|env`.
- MCP server: `npx @edgeone/makers-mcp@latest` (see `.mcp.json` at the repository root).
- Skills: `npx skills add TencentEdgeOne/edgeone-makers-tools` (eight skills: agents, edge functions, cloud functions, storage, middleware, deploy, CLI, recipes).

## Sources

- [Platform and Multi-Tenancy](https://edgeone.ai/document/218316253599858688)
- [Product introduction and documentation index](https://pages.edgeone.ai/document/product-introduction)
- [EdgeOne Makers release notes](https://pages.edgeone.ai/document/release-notes)
- [EdgeOne Makers pricing](https://pages.edgeone.ai/pricing)
- [Free edition quotas and limits](https://pages.edgeone.ai/document/limits-and-quotas)
- [Cloud Functions documentation, regions](https://edgeone.ai/document/196117784807596032)
- [EdgeOne CLI](https://pages.edgeone.ai/document/edgeone-cli), [MCP](https://pages.edgeone.ai/document/pages-mcp), [Skills](https://pages.edgeone.ai/document/skills)
- [Tencent Cloud Compliance Center](https://intl.cloud.tencent.com/services/compliance)
- [Tencent Cloud International Data Processing Agreement](https://www.tencentcloud.com/document/product/1085/47312)
- [Tencent EdgeOne on GitHub](https://github.com/tencentedgeone)
- [MakerStack independent review](https://makerstack.co/reviews/tencent-edgeone-makers-review/)

## Update, 23 September 2026 — recommendation superseded

The recommendation above was written before the hosting decision. The current position is the decision at the top of this document: Makers is the assumed provider behind the week-one gate, with Cloudflare EU as fallback. Two facts have since been established by running it: a Next.js 16 + Payload application builds and runs on Makers with functions pinned to Frankfurt and Postgres on Neon Frankfurt, and the isolation suite passes against the deployed URL. See `05-week1-spike-results.md`.

## Templates and products, checked 23 September 2026

**Templates that matter for this build**

| Template | What it proves | Caveat |
| --- | --- | --- |
| [Payload Website Starter](https://github.com/TencentEdgeOne/payload-mongodb-starter) | Payload admin, layout builder, drafts, live preview, form, search and redirect plugins, S3 media and on-demand revalidation run on Makers | MongoDB, which this spec rules out; 1 star. Reference only |
| Next.js Hybrid Rendering, ISR Starter | SSR, ISR, on-demand `revalidatePath` / `revalidateTag`, cloud and edge functions in one project | — |
| Neon Starter, Next.js Better Auth | Serverless Postgres reachable from Makers cloud functions | Confirmed in practice by this project |
| Vibe Coding Agent [Platform] | The Makers-for-Platforms reference | Demonstrates sandboxes and skills, not tenant provisioning APIs |
| AI Chat Assistant | An embeddable assistant widget | Reference for the chatbot boundary the CRM team owns |

No template exists for a multi-tenant CMS, host-based tenant routing, or Puck. Those are ours.

**Next.js on Makers**: versions 13.5 to 16; SSR, ISR, route handlers, server components, image optimisation, middleware in the edge runtime. **Redirects and rewrites in `next.config` are not supported**; `edgeone.json` holds static project-level redirects only. Per-tenant 301 maps for migrated sites must be resolved in edge middleware from a KV lookup.

**EdgeOne product lines beyond Makers**: CDN, Smart Acceleration, L4 proxy; DDoS protection, Bot Management, Web Protection (WAF), CAPTCHA; Edge Functions, Image Renderer; VOD. Makers' free tier carries four custom security rules and one rate-limit rule, so production WAF and bot management are the separately priced security products.

## The EdgeOne site product and its API

Two Tencent products are in play. **Makers** is the developer platform (free tier, 200-domain project quota). **EdgeOne** is the CDN, security and domain platform underneath, with published plans and a public API.

| Plan | Monthly | Sites | Subdomains per site | Security |
| --- | --- | --- | --- | --- |
| Free (beta) | $0 | 1 | 200 | Basic WAF |
| Personal | $4.2 | 1 | 200 | Basic WAF |
| Basic | $57 | 1 | 300 | Enhanced ruleset |
| Standard | $590 | 1 | 500 | Managed rules, bot management pay-as-you-go, DDoS add-on |
| Enterprise | Custom | 10 | 1,000 | Full custom rules |

Source: [plan comparison](https://edgeone.ai/document/55650). Ceiling to note: 1,000 hostnames per site and ten sites even on Enterprise.

**API**: service `teo`, endpoint `teo.intl.tencentcloudapi.com`, version 2022-09-01, Tencent Cloud v3 signature with a CAM SecretId and SecretKey.

- `CreateAccelerationDomain`, `ModifyAccelerationDomain`, `DescribeAccelerationDomains` — hostnames on a site
- `ModifyHostsCertificate` with mode `eofreecert`, `ApplyFreeCertificate`, `CheckFreeCertificateVerification` — free certificates per hostname
- `CreateAliasDomain`, `ModifyAliasDomain`, `DeleteAliasDomain` — a customer's own domain aliased onto a target domain: the SaaS custom-hostname primitive, **Enterprise-only and in beta** ([doc](https://edgeone.ai/document/51551))

Question for Tencent: are Makers custom domains and EdgeOne alias domains the same mechanism underneath? The answer decides which quota table governs this product.

## API probe with a real key — 23 September 2026

The probe is `apps/platform/src/host/teo-probe.ts`, on a minimal signed client (`src/host/teo.ts`, TC3-HMAC-SHA256, no SDK). The key is a new CAM key stored as user environment variables; the old leaked key is not used.

| Call | Result |
| --- | --- |
| `DescribePlans` | One plan: **`plan-free`**, area global, expires 2099. This is the Makers free tier |
| `DescribeAvailablePlans` | Purchasable: personal, basic and standard (`sta`), each with `_cm` / `_global` variants and bot-protection options. Enterprise is not self-serve |
| `DescribeZones` | One zone: **`default-pages-zone`**, type `pages`, status `pending`. This is the internal zone Makers projects live in; the account has no zone of its own |
| `DescribeAccelerationDomains` on that zone | **`UnauthorizedOperation`** |

Finding 20: **Makers custom domains cannot be managed through the public `teo` API.** Makers projects sit in an internal `pages` zone that the account's own API key cannot operate on. Two consequences for Gate 1:

1. For a platform, custom domains on Makers go through either the Makers console or the unpublished Makers for Platforms API. That puts the Platforms API reference on the critical path; it is item 1 of the Tencent email.
2. The alternative path is EdgeOne proper. Create our own zone for a domain we control, on a paid plan, then attach customer hostnames as acceleration or alias domains in front of the Makers origin. This needs a domain with DNS access and a plan with enough hostnames: 200 on personal, 1,000 on Enterprise per site, as in the plan table above. `teo-probe.ts --write` tests this end to end as soon as a zone exists. The test subdomain should be one the owner controls (for example `staging.hotel-herse-dor.com`): EdgeOne verifies domain ownership, so a made-up test domain cannot be used.
