import sharp from 'sharp'
import type { Payload } from 'payload'

/**
 * A map image made once per location and zoom, from OpenStreetMap tiles, stored with the
 * photos (media_blobs) and served at /media/maps/<key>.webp. Public pages then show a plain
 * image instead of an OpenStreetMap iframe: no visitor data leaves our hosting (docs/12 §5).
 * Tiles are fetched only when the image does not exist yet (one download per hotel), with
 * the identifying User-Agent OpenStreetMap's tile usage policy asks for.
 */
const TILE = 256
const WIDTH = 1200
const HEIGHT = 640
const UA = 'hh-platform-static-map/0.1 (+https://github.com/aminebelkou-creator/hh-hotel-CMS)'

type Pool = { query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> }
const poolOf = (payload: Payload) => (payload.db as unknown as { pool: Pool }).pool

export function mapKey(lat: number, lon: number, zoom: number) {
  return `maps/osm-${lat.toFixed(5)}-${lon.toFixed(5)}-z${zoom}.webp`
}

function project(lat: number, lon: number, zoom: number) {
  const n = Math.pow(2, zoom)
  const x = ((lon + 180) / 360) * n * TILE
  const rad = (lat * Math.PI) / 180
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n * TILE
  return { x, y }
}

async function tile(z: number, x: number, y: number) {
  const n = Math.pow(2, z)
  const wx = ((x % n) + n) % n
  if (y < 0 || y >= n) return null
  const res = await fetch(`https://tile.openstreetmap.org/${z}/${wx}/${y}.png`, { headers: { 'user-agent': UA } })
  if (!res.ok) return null
  return Buffer.from(await res.arrayBuffer())
}

/** Builds the image if missing and returns its public path, or null when tiles cannot be fetched. */
export async function ensureStaticMap(payload: Payload, lat: number, lon: number, zoom = 16): Promise<string | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 85 || Math.abs(lon) > 180) return null
  const key = mapKey(lat, lon, zoom)
  const pool = poolOf(payload)
  const exists = await pool.query(`select 1 from media_blobs where key = $1`, [key])
  if (exists.rows[0]) return `/media/${key}`
  try {
    const c = project(lat, lon, zoom)
    const left = Math.floor((c.x - WIDTH / 2) / TILE)
    const top = Math.floor((c.y - HEIGHT / 2) / TILE)
    const cols = Math.ceil(WIDTH / TILE) + 1
    const rows = Math.ceil(HEIGHT / TILE) + 1
    const tiles = await Promise.all(
      Array.from({ length: cols * rows }, async (_, i) => {
        const tx = left + (i % cols)
        const ty = top + Math.floor(i / cols)
        const buf = await tile(zoom, tx, ty)
        return buf ? { input: buf, left: (tx - left) * TILE, top: (ty - top) * TILE } : null
      }),
    )
    if (tiles.some((t) => !t)) return null
    const offX = Math.round(c.x - WIDTH / 2 - left * TILE)
    const offY = Math.round(c.y - HEIGHT / 2 - top * TILE)
    const pin = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52"><path d="M20 51c9-14 18-22 18-31A18 18 0 0 0 2 20c0 9 9 17 18 31z" fill="#c8102e" stroke="#7a0a1c" stroke-width="2"/><circle cx="20" cy="20" r="7" fill="#fff"/></svg>`,
    )
    const image = await sharp({ create: { width: cols * TILE, height: rows * TILE, channels: 3, background: '#e8e4dc' } })
      .composite(tiles as { input: Buffer; left: number; top: number }[])
      .png()
      .toBuffer()
    const out = await sharp(image)
      .extract({ left: offX, top: offY, width: WIDTH, height: HEIGHT })
      .composite([{ input: pin, left: Math.round(WIDTH / 2 - 20), top: Math.round(HEIGHT / 2 - 51) }])
      .webp({ quality: 80 })
      .toBuffer()
    await pool.query(
      `insert into media_blobs (key, mime, bytes, size) values ($1, $2, $3, $4) on conflict (key) do nothing`,
      [key, 'image/webp', out, out.length],
    )
    return `/media/${key}`
  } catch {
    return null
  }
}
