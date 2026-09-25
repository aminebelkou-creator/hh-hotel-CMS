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
  it('A lists only own pages; cannot read, update or delete B by id', async (ctx) => {
    if (!reachable) ctx.skip()
    const ta = await loginRest(tenantEmail(1))
    const tb = await loginRest(tenantEmail(2))
    const a = api(ta)
    const b = api(tb)

    const listA = (await (await a.get('/pages?limit=1000')).json()) as { totalDocs: number; docs: { tenant: unknown }[] }
    expect(listA.totalDocs).toBe(4) // home, rooms, contact, blog

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

  it('GraphQL: A cannot read B page', async (ctx) => {
    if (!reachable) ctx.skip()
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

  it('admin tenant selector: a payload-tenant cookie naming B does not widen user A', async (ctx) => {
    if (!reachable) ctx.skip()
    const ta = await loginRest(tenantEmail(1))
    const tb = await loginRest(tenantEmail(2))
    const pageB = ((await (await api(tb).get('/pages?limit=1')).json()) as { docs: { id: number | string; tenant: unknown }[] }).docs[0]
    const tenantB = (pageB.tenant as { id?: number | string })?.id ?? pageB.tenant
    // The admin UI's tenant selector is a cookie; a user can forge it, so it must only narrow.
    const headers = { authorization: `JWT ${ta}`, cookie: `payload-tenant=${tenantB}` }

    const list = (await (await fetch(`${BASE}/api/pages?limit=1000`, { headers })).json()) as { docs: { id: number | string }[] }
    expect(list.docs.map((d) => d.id)).not.toContain(pageB.id)
    const one = await fetch(`${BASE}/api/pages/${pageB.id}`, { headers })
    expect([403, 404]).toContain(one.status)

    // A create with the forged cookie and no tenant field must not land in B.
    const siteA = ((await (await api(ta).get('/sites?limit=1')).json()) as { docs: { id: number | string }[] }).docs[0]
    const created = await fetch(`${BASE}/api/pages`, {
      method: 'POST',
      headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'iso-probe-cookie', slug: 'iso-probe-cookie', site: siteA.id }),
    })
    if (created.ok) {
      const doc = ((await created.json()) as { doc: { id: number | string; tenant: unknown } }).doc
      const t = (doc.tenant as { id?: number | string })?.id ?? doc.tenant
      await api(ta).del(`/pages/${doc.id}`)
      expect(t).not.toBe(tenantB)
    }
  })
})
