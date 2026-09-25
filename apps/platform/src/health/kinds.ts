/** What the platform can notice about a site (issues.kind). */
export const ISSUE_KINDS = ['broken-link', 'missing-alt', 'missing-meta', 'stale-content', 'expired-offer', 'missing-fact', 'uptime', 'performance', 'accessibility', 'unanswered'] as const
export type IssueKind = (typeof ISSUE_KINDS)[number]
