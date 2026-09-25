# Sub-processors — draft v0.1 (25 September 2026)

What runs where, so a hotel can be told who touches its data. Update this file when a provider changes; it is referenced by the DPA.

| Provider | Role | Data | Region | Contract status |
| --- | --- | --- | --- | --- |
| Tencent Cloud — EdgeOne Makers | Hosting of the platform (functions, static assets), edge network, TLS | Everything the platform serves and receives (in transit); edge access logs | Project area "Global, Chinese mainland excluded", functions pinned to Frankfurt (project `hh-platform`) | DPA and confirmation of edge processing **requested** (`docs/outreach/tencent-makers-platforms-email.md`) |
| Neon — Postgres | Database | All platform data at rest, including photos (`media_blobs`) | Frankfurt (`eu-central-1`) | Neon DPA (standard) `[to sign in the console]` |
| GitHub (Microsoft) | Source code, CI, nightly checks | Code; CI runs see only synthetic seeded data; the nightly run calls the live platform with a service token and stores no personal data | EU/US (GitHub Actions runners) | Standard terms |
| `[Scaleway TEM]` or `[Brevo]` | Transactional email (contact-form notifications, monthly reports) | Sender and recipient addresses, message content | France / EU | Not yet contracted (owner) |
| `[AI provider: Anthropic / OpenAI-compatible]` | Model calls for ingest extraction, page drafts, translation, brand rationale — only when configured | Hotel website text, confirmed facts; no visitor data | `[EU region if offered]` | Not yet contracted (owner: "AI model key") |
| OpenStreetMap Foundation | Map tiles fetched **at publish time** by the platform to make a static image | No visitor data (visitors never contact OSM) | — | ODbL attribution shown on the map |

Not sub-processors: the hotel's own booking engine or PMS (the site only links to them), the hotel's analytics if it adds any (none by default).
