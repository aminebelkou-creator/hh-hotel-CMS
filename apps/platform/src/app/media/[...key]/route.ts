import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

type Pool = { query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }

/**
 * Public image URL for published sites: /media/<file>. Site photos are public by nature;
 * the admin keeps Payload's access-controlled /api/media/file route for everything else.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params
  const name = key.join('/')
  if (!/^[\w.\-/]{1,300}$/.test(name) || name.includes('..')) return new Response('Not found', { status: 404 })
  const payload = await getPayload({ config })
  const pool = (payload.db as unknown as { pool: Pool }).pool
  const r = await pool.query(`select mime, bytes from media_blobs where key = $1`, [name])
  const row = r.rows[0]
  if (!row) return new Response('Not found', { status: 404 })
  return new Response(new Uint8Array(row.bytes as Buffer), {
    headers: { 'content-type': String(row.mime), 'cache-control': 'public, max-age=31536000, immutable', 'x-content-type-options': 'nosniff' },
  })
}
