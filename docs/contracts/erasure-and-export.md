# Contract: erasure and export — v0.1 draft

**Purpose.** A GDPR erasure or access request against a guest must complete across every system that holds their data, and the platform must be able to prove completion. This contract defines the event, the acknowledgement, and the deadline.

**Parties.** Website platform (this team), CRM (chatbot, guest profiles, knowledge base), PMS (reservations, folios), distribution (feeds). The website platform is the initiator for requests arriving through a hotel's website; any party may initiate.

## Event: `guest.erasure_requested` (and `guest.export_requested`)

| Field | Type | Notes |
| --- | --- | --- |
| `requestId` | UUID | Idempotency key; duplicates are acknowledged, not re-executed |
| `tenantId` | string | The hotel/organisation |
| `subject` | object | `email`, optional `phone`, optional `name`; at least one identifier |
| `scope` | enum | `erasure` or `export` |
| `requestedAt` | ISO 8601 | |
| `deadline` | ISO 8601 | Initiator sets; default 30 days from request |
| `initiator` | string | System name |

Transport: the xedge event bus, topic `guest.privacy`. Replayable. Each consumer maintains its own offset.

## Acknowledgement: `guest.erasure_completed` (and `guest.export_completed`)

| Field | Type | Notes |
| --- | --- | --- |
| `requestId` | UUID | Same as the request |
| `system` | string | Acknowledging system |
| `completedAt` | ISO 8601 | |
| `records` | integer | Count affected; 0 is a valid, required answer |
| `retained` | array | Anything lawfully retained (e.g. invoices under fiscal rules) with the legal basis |
| `exportRef` | string | For export: a signed URL valid 7 days, or null |

## Rules

1. Every consumer acknowledges every request, including with zero records. Silence is a failure.
2. The initiator collects acknowledgements and produces one completion record per request, retained 3 years as evidence.
3. Backups: each system states in its acknowledgement whether backups are purged or expire on a schedule, and the schedule.
4. Retention exceptions (fiscal, legal hold) are declared in `retained`, never silently applied.
5. Time limit: all acknowledgements within 25 days of `requestedAt`, leaving 5 days for the regulator-facing response.

## What each party must confirm before signing

- The identifier(s) it can match on, and what happens on ambiguous matches
- Its backup purge policy
- Its retention exceptions and legal basis
- A named owner and an escalation contact
