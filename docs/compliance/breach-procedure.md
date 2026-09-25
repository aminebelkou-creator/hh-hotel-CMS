# Personal-data breach procedure — draft v0.1

A breach is any event where personal data was, or may have been, accessed, changed, lost or disclosed without authorisation: a cross-tenant read, a leaked credential, a lost backup, a compromised staff account, a provider incident.

## First hour — contain
1. Whoever notices writes the time and what they saw in the incident log (`docs/compliance/incidents/<date>.md`, created from this section) and tells the owner.
2. Contain: rotate the credential (`scripts/`: seed and owner passwords, Makers token, Neon connection string — names in `HANDOFF.md` §Secrets map), disable the account, or take the site offline (Makers console) if data is still exposed.
3. Preserve evidence: export the action log (`audit-log` collection) and the host's logs for the period; do not delete anything.

## First day — assess
4. What data, whose, how many, for how long, and whether it was encrypted or otherwise unusable. Check tenant isolation with `tests/int/isolation*.int.spec.ts` and `src/db/inspect-rls.ts` against the affected database.
5. Decide, with the owner and a lawyer: is there a risk to the people concerned? Record the reasoning even when the answer is no.

## Within 48 hours — tell the hotels concerned
6. Each affected hotel (controller) is told in writing what happened, what data, what we did, what they should do; the DPA sets this at `[48 hours]`.

## Within 72 hours — the authority
7. If there is a risk to people, the controller notifies the CNIL (in France) within 72 hours; we provide the facts. If the risk is high, the people concerned are informed too.

## Afterwards
8. Post-mortem in `docs/05`-style findings: cause, fix, test added so it cannot recur; the checklist gets a row.

Contacts: owner `[phone, email]`; engineering `[…]`; lawyer `[…]`; host support `[Tencent Cloud ticket]`; database `[Neon support]`.
