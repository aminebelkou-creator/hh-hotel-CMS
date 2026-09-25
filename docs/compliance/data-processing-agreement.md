# Data processing agreement — draft skeleton v0.1

**Not a legal document yet.** This is the engineering description of what the agreement must say, so a lawyer writes it once against facts. Parties: the hotel (`[name]`, **controller**) and `[our company]` (**processor**). Article 28 GDPR.

## 1. Subject and duration
Hosting, building and maintaining the hotel's marketing website on the platform, for the length of the service contract. No booking, payment or PMS data is processed by the platform.

## 2. Nature and purpose of the processing
Publishing the hotel's content; storing and forwarding messages visitors send through the contact form; keeping staff accounts; monitoring the site (nightly checks, uptime); on request, importing the hotel's previous website and drafting pages with a model.

## 3. Categories of data and data subjects
As in [processing-register.md](processing-register.md) §1–2.

## 4. Our obligations as processor
- Process only on the hotel's documented instructions (the admin actions and this agreement).
- Confidentiality of staff with access (our team accounts are `super-admin`; every action is logged).
- Security measures (Annex 2): tenant isolation in three layers tested on every change; encryption in transit; backups per hotel with a rehearsed single-tenant restore; login lockout; security headers; dependency and code scanning; secrets never in the repository.
- Sub-processors (Annex 3 = [sub-processors.md](sub-processors.md)); the hotel is informed of changes `[30 days]` in advance and may object.
- Assistance with data-subject requests: export and erasure per the `erasure-and-export` contract; contact-form messages are deleted by the hotel in the admin or by us on request.
- Breach notification to the hotel without undue delay and within `[48 hours]` of becoming aware ([breach-procedure.md](breach-procedure.md)).
- Deletion or return at the end: full export of the hotel's data (`tenant-backup.ts` format, JSON) on request, then deletion of the tenant and all its rows within `[30 days]`, backups expiring within `[30 days]` more.
- Audits: information needed to demonstrate compliance; the repository's test evidence is public.

## 5. The hotel's obligations as controller
Lawful basis for the content it publishes and the messages it receives; its own privacy notice on the site (a draft page is generated for each hotel and must be validated by the hotel); instructions given through the admin.

## 6. Transfers
None outside the EU by design; see the sub-processor list for the host's pending DPA.

## Annexes
1. Description of processing — the register. 2. Security measures — `README.md` §Security and `docs/09-system-design.md` §3. 3. Sub-processors. 4. Retention periods.
