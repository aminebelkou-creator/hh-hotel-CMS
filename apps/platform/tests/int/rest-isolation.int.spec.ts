/**
 * Tenant isolation over REST, against a running server (PLATFORM_URL, default http://localhost:3000).
 * Skipped when the server is unreachable so the unit suite stays green without it.
 */
import { describe, it, beforeAll, expect } from 'vitest'
import { SEED_PASSWORD, tenantEmail } from '@/seed/constants'

// PLATFORM_URL, not BASE_URL: Vitest injects BASE_URL='/' (Vite base path).
const BASE = (process.env.PLATFORM_URL || 'http://localhost:3000').replace(/\/+$/, '')
let reachable = false

const loginRest = async (email: string) => {
  const r = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: SEED_PASSWORD }),
  })
  const j = (await r.json()) as { token?: string; user?: { id: number | string } }
  if (!j.token) throw new Error('login failed')
  return j.token
}

const api = (token: string) => ({
  get: (p: string) => fetch(`${BASE}/api${p}`, { headers: { authorization: `JWT ${token}` } }),
  post: (p: string, body: unknown) =>
    fetch(`${BASE}/api${p}`, { method: 'POST', headers: { authorization: `JWT ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  patch: (p: string, body: unknown) =>
    fetch(`${BASE}/api${p}`, { method: 'PATCH', headers: { authorization: `JWT ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  del: (p: string) => fetch(`${BASE}/api${p}`, { method: 'DELETE', headers: { authorization: `JWT ${token}` } }),
})

beforeAll(async () => {
  try {
    const r = await fetch(`${BASE}/api/users/me`)
    reachable = r.status < 500
  } catch {
    reachable = false
  }
})

describe('tenant isolation over REST', () => {
  it.runIf(() => reachable)('A lists only own pages; cannot read, update or delete B by id', async () => {
    const ta = await loginRest(tenantEmail(1))
    const tb = await loginRest(tenantEmail(2))
    const a = api(ta)
    const b = api(tb)

    const listA = (await (await a.get('/pages?limit=1000')).json()) as { totalDocs: number; docs: { tenant: unknown }[] }
    expect(listA.totalDocs).toBe(3)

    const listB = (await (await b.get('/pages?limit=1')).json()) as { docs: { id: number | string; tenant: unknown }[] }
    const pageB = listB.docs[0]

    const read = await a.get(`/pages/${pageB.id}`)
    expect([403, 404]).toContain(read.status)

    const upd = await a.patch(`/pages/${pageB.id}`, { title: 'defaced' })
    expect(upd.status).toBeGreaterThanOrEqual(400)

    const del = await a.del(`/pages/${pageB.id}`)
    expect(del.status).toBeGreaterThanOrEqual(400)

    const tenantB = (pageB.tenant as { id?: number | string })?.id ?? pageB.tenant
    const siteB = ((await (await b.get('/sites?limit=1')).json()) as { docs: { id: number | string }[] }).docs[0]
    const create = await a.post('/pages', { title: 'intrusion', slug: 'intrusion', site: siteB.id, tenant: tenantB })
    expect(create.status).toBeGreaterThanOrEqual(400)
  })

  it.runIf(() => reachable)('GraphQL: A cannot read B page', async () => {
    const ta = await loginRest(tenantEmail(1))
    const tb = await loginRest(tenantEmail(2))
    const b = api(tb)
    const pageB = ((await (await b.get('/pages?limit=1')).json()) as { docs: { id: number | string }[] }).docs[0]
    const r = await fetch(`${BASE}/api/graphql`, {
      method: 'POST',
      headers: { authorization: `JWT ${ta}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query: `{ Page(id: ${JSON.stringify(pageB.id)}) { id title } }` }),
    })
    const j = (await r.json()) as { data?: { Page?: unknown }; errors?: unknown[] }
    expect(j.data?.Page ?? null).toBeNull()
  })
})
