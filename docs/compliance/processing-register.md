# Record of processing activities — draft v0.1

Controller for this record: `[company name, address, SIREN]` as **processor** on behalf of hotels, and as **controller** for its own users (hotel staff accounts). Data protection contact: `[name, email]`.

## 1. Hotel website publishing (on behalf of each hotel — processor)

| Item | Detail |
| --- | --- |
| Purpose | Building, hosting and maintaining the hotel's marketing website; keeping it healthy (nightly checks) |
| Data subjects | Hotel staff (accounts), website visitors (server logs, contact-form senders) |
| Categories | Staff: name, email, password hash, actions in the admin (action log: who changed what, never the values). Visitors: contact-form fields the hotel defines (typically name, email, phone, message), IP address in the host's edge logs |
| Source | Staff: created by us or the hotel. Visitors: the visitor |
| Recipients | The hotel (controller); sub-processors in [sub-processors.md](sub-processors.md) |
| Transfers outside the EU | None by design: hosting, database and email in the EU; the host is EdgeOne (Tencent Cloud) with the project pinned to Frankfurt — the DPA covering edge processing is being requested (`docs/outreach/`) |
| Retention | Staff accounts: for the contract, deleted 30 days after it ends. Contact messages: `[12 months]` in the admin, then deleted. Action log: `[24 months]`. Edge logs: the host's default (`[to confirm with the host]`) |
| Security | Tenant isolation in three layers (access control, tenant-scoped jobs, Postgres RLS), tested in CI; TLS; login lockout; security headers; backups per hotel with a rehearsed restore; secrets in environment variables only |
| Automated decisions | None. Generated website text is drafted from facts the hotel confirmed and published only by the hotel |

## 2. Import of the hotel's previous website (processor)

| Item | Detail |
| --- | --- |
| Purpose | Reading the hotel's public website to propose facts and page drafts (Phase 3 ingest) |
| Data | The hotel's own public pages. Personal data only incidentally (a named contact on the site), stored as unconfirmed facts until the hotel decides |
| Model provider | Only when `AI_PROVIDER` is configured: page text is sent to the provider named in [sub-processors.md](sub-processors.md), under its DPA; the provider is not used to train models (`[confirm in the provider's terms]`) |
| Retention | Crawl state (page texts) kept with the import record; deleted with the tenant |

## 3. Platform operations (controller)

| Item | Detail |
| --- | --- |
| Purpose | Running the service: monitoring, support, invoicing |
| Data | Hotel contacts (name, email, phone), contract and invoices, support exchanges |
| Retention | Contract + legal retention for invoices (10 years in France) |

## 4. Rights and requests

Requests reach `[email]`. Erasure and export follow the `erasure-and-export` contract (`docs/contracts/`): per-tenant export exists today (`src/db/tenant-backup.ts`); erasure of a visitor's message is done in the admin by the hotel; erasure of a whole hotel = deletion of the tenant and its rows (all tenant-scoped tables, `src/db/tenant-tables.ts`).
