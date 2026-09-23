import type { Payload } from 'payload'

type Result = { rows: Record<string, unknown>[]; rowCount: number | null }
export type Pool = { query: (sql: string, params?: unknown[]) => Promise<Result> }

/**
 * Direct pool access for the few statements that must be atomic across instances (the
 * publish lease and the request counter). Each call autocommits on its own connection, so
 * it is visible to every other worker immediately, whatever transaction a caller is in.
 */
export const poolOf = (payload: Payload): Pool => (payload.db as unknown as { pool: Pool }).pool
