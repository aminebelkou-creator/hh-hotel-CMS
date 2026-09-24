import type { Adapter } from '@payloadcms/plugin-cloud-storage/types'

type Pool = { query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }
const poolOf = (payload: unknown) => (payload as { db: { pool: Pool } }).db.pool

/**
 * Media storage v0: file bytes in Postgres (table media_blobs, created by migration).
 * Serverless functions have no durable disk, and this keeps photos in the same EU database
 * with no new vendor. Fine for tens of photos per hotel; object storage replaces it later
 * behind the same adapter interface (docs/10-roadmap-phases.md, Phase 1).
 */
export const postgresStorage: Adapter = () => ({
  name: 'postgres-blob',
  handleUpload: async ({ file, req, storageFilePath }) => {
    await poolOf(req.payload).query(
      `insert into media_blobs (key, mime, bytes, size) values ($1, $2, $3, $4)
       on conflict (key) do update set mime = excluded.mime, bytes = excluded.bytes, size = excluded.size, created_at = now()`,
      [storageFilePath, file.mimeType, file.buffer, file.filesize],
    )
  },
  handleDelete: async ({ req, storageFilePath }) => {
    await poolOf(req.payload).query(`delete from media_blobs where key = $1`, [storageFilePath])
  },
  staticHandler: async (req, { params }) => {
    const key = params.prefix ? `${params.prefix}/${params.filename}` : params.filename
    const r = await poolOf(req.payload).query(`select mime, bytes from media_blobs where key = $1`, [key])
    const row = r.rows[0]
    if (!row) return new Response('Not found', { status: 404 })
    return new Response(new Uint8Array(row.bytes as Buffer), {
      headers: { 'content-type': String(row.mime), 'cache-control': 'public, max-age=31536000, immutable' },
    })
  },
  generateURL: ({ filename, prefix }) => `/media/${prefix ? `${prefix}/` : ''}${filename}`,
})
