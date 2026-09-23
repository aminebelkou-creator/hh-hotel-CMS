# Contract: chatbot widget boundary — v0.1 draft

**Purpose.** The CRM team owns the chatbot's brain; the website platform renders it on the hotel's site. This contract says who owns what, so there is one chat bubble, one disclosure, and one consent decision.

## Ownership

| Concern | Owner | Notes |
| --- | --- | --- |
| Model, knowledge, conversation logic, escalation to humans | CRM | |
| Placement, theming, open/closed state, mobile behaviour | Website platform | Theme tokens passed at mount |
| AI disclosure (EU AI Act Art. 50) | Website platform | Rendered before the first exchange; text agreed with CRM |
| Consent gating | Website platform | Widget does not load until the visitor's consent state permits it |
| Analytics events | Website platform emits; CRM may subscribe | `chat.opened`, `chat.message_sent`, `chat.handoff`, `chat.lead_captured` |
| Grounding in live inventory | CRM via PMS contract | The widget never fabricates rates or availability |

## Integration surface

A single script loaded by the platform with a signed configuration object:

```json
{
  "tenantId": "…",
  "siteId": "…",
  "locale": "fr",
  "theme": { "primary": "#…", "surface": "#…", "radius": "12px", "font": "…" },
  "consent": { "analytics": false, "personalisation": false },
  "disclosure": "Vous discutez avec un assistant IA. …",
  "signature": "…"
}
```

The widget renders inside a container the platform owns, must not inject global styles, and must expose `mount`, `unmount`, `setConsent`, `setLocale`.

## Rules

1. No personal data leaves the page before consent permits it. The widget honours `setConsent` immediately.
2. Disclosure is visible before the first message can be sent, in the page's locale.
3. Escalation to a human hands off into the CRM's unified inbox with the conversation transcript; the platform is not in that loop.
4. The widget degrades to nothing on error; it never breaks page rendering or Core Web Vitals budgets (max 50 KB gzipped on initial load, lazy after interaction).
5. Accessibility: keyboard operable, focus trapped while open, announced to screen readers.

## To confirm before signing

Script URL and versioning policy; the signature scheme; the exact disclosure text per locale; who answers a data-subject question about chat transcripts.
