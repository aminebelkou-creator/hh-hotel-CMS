# Email to Tencent Cloud: Makers for Platforms evaluation

Status: **draft, not sent.** Owner: OWN. Send on day one of week 1 (Gate 1 depends on the answers).
Where: Tencent Cloud International support ticket (category EdgeOne) plus the sales contact form linked from the [Platform and Multi-Tenancy](https://edgeone.ai/document/218316253599858688) page. Ask for a named contact and a call in the same message.

---

**Subject:** Makers for Platforms: evaluation for a European multi-tenant website service (API, quotas, pricing, DPA)

Hello,

We run a managed website service for independent hotels in Europe, operated from Paris. Our platform is a single multi-tenant application; every hotel gets its own site on its own domain, published as an immutable release. We are evaluating EdgeOne Makers as our production host and have already deployed a proof of concept to Makers with Cloud Functions pinned to Frankfurt (project `makers-gznjppyen95y`).

The Platform and Multi-Tenancy page says SDKs and APIs exist for project creation, artifact upload, deployment, domain binding and certificates, and directs evaluations to you. We need the following in writing to reach a decision by **12 October 2026**:

**1. Platforms API**
- API reference for: create project, upload artifact, deploy, promote/rollback to an earlier deployment, bind and unbind a custom domain, certificate issuance and status, delete project.
- Authentication model for a platform acting on behalf of many tenants (one account, sub-accounts, or delegated keys).
- Which tenancy mode you recommend for ~1,000 sites served by one codebase: one project per tenant, or shared code with tenant routing at the edge by host name.
- Webhooks or polling for deployment and certificate status.

**2. Quotas at 100, 500 and 1,000 tenants**
- Projects, custom domains, builds per month and concurrent builds, deployments retained per project, storage, Cloud Function and Edge Function executions.
- Whether upload-only deployments (a prebuilt artifact, no remote build) are supported, and whether they count against build quotas.
- Typical and worst-case time from API deploy call to live traffic on the custom domain.

**3. Pricing**
- Commercial pricing for the tiers above, or a written estimate, and the expected date for published pricing.
- Whether the free-plan quotas can be raised during a paid evaluation.

**4. Data protection (GDPR)**
- The contracting entity for EU customers, and confirmation that the published Tencent Cloud International DPA covers EdgeOne Makers, including Edge Functions, KV and Blob storage.
- Where Edge Function execution, KV and Blob data are processed and stored for requests from EU visitors; whether they can be restricted to EU locations.
- Sub-processor list and the transfer mechanism (standard contractual clauses) for any processing outside the EEA.
- Confirmation that Cloud Functions pinned to `eu-frankfurt` process and log data only in Frankfurt, and log retention periods.

**5. Domains**
- Whether Makers custom domains and EdgeOne alias domains (`CreateAliasDomain`) are the same mechanism, and which one a platform should use for customer domains.
- Apex-domain support (CNAME flattening or A records), and automatic certificate issuance and renewal for customer domains.

**6. Support**
- SLA for the paid tier, support hours in Central European Time, and English-language escalation.

A 30-minute call in the next two weeks would help; we can share the proof-of-concept repository under NDA.

Thank you,

[Name]
[Title], [Company]
[Phone] · hotelhersedorparis@gmail.com

---

## After sending

- Log the ticket number and date in `docs/CHECKLIST.md` under Week 1, OWN.
- Record each answer against the gate criteria in `docs/04-edgeone-makers-evaluation.md`.
- No written answer on items 1, 2 and 4 by **9 October 2026** means Gate 1 falls back to Cloudflare EU.
