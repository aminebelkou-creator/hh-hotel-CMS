# Compliance file — drafts before the first invoice

Phase 5 of the roadmap says no hotel is invoiced before these exist. They are **drafts written by engineering from what the platform actually does**; a lawyer must review them before use, and the owner fills the company details marked `[…]`. Everything here describes the platform as built on 25 September 2026 (EdgeOne Makers Frankfurt, Neon Postgres Frankfurt, no booking logic, no payment data).

| Document | Purpose | Status |
| --- | --- | --- |
| [processing-register.md](processing-register.md) | The GDPR record of processing activities (Art. 30) for the platform | Draft |
| [sub-processors.md](sub-processors.md) | The providers list hotels are told about, with region and role | Draft, from the architecture |
| [data-processing-agreement.md](data-processing-agreement.md) | The DPA between us (processor) and each hotel (controller), Art. 28 | Draft skeleton, lawyer required |
| [breach-procedure.md](breach-procedure.md) | What we do in the 72 hours after a suspected personal-data breach | Draft |
| [accessibility-statement.md](accessibility-statement.md) | The statement each hotel site publishes (RGAA / EN 301 549), fed by the CI gates | Draft template |

Not here, because they need an outside party: the **external accessibility audit** and the **penetration test** (checklist, BIZ). The evidence for both is in the repository: `tests/quality/gates.mjs` (axe WCAG 2.2 AA on every template, every push), `tests/int/isolation*.int.spec.ts` and `rls.int.spec.ts` (tenant isolation, three layers), CodeQL and Dependabot in `.github/`.
