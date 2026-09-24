/**
 * Gate 1 evidence for custom domains on EdgeOne: what the API lets a platform do from code.
 *   tsx src/host/teo-probe.ts            read-only: account zones, plans, domains
 *   tsx src/host/teo-probe.ts --write    also add a throwaway hostname to an existing zone,
 *                                        request its free certificate, observe, then delete it
 * Never prints credentials. Results go to .ingest/teo-probe.json (git-ignored).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { teo, TeoError } from './teo'

const WRITE = process.argv.includes('--write')
const ORIGIN = 'hh-platform.edgeone.dev'
const log: Record<string, unknown>[] = []
const step = async (name: string, action: string, params: Record<string, unknown> = {}) => {
  const t0 = Date.now()
  try {
    const r = await teo(action, params)
    log.push({ name, action, ok: true, ms: Date.now() - t0, result: r })
    console.log(`ok   ${name} (${Date.now() - t0} ms)`)
    return r as Record<string, unknown>
  } catch (e) {
    const err = e instanceof TeoError ? { code: e.code, message: e.message } : { message: (e as Error).message }
    log.push({ name, action, ok: false, ms: Date.now() - t0, error: err })
    console.log(`FAIL ${name}: ${err.message}`)
    return null
  }
}

const zones = await step('list zones (sites) in the account', 'DescribeZones', { Limit: 100 })
const zoneList = ((zones?.Zones as Record<string, unknown>[]) || []).map((z) => ({
  ZoneId: z.ZoneId, ZoneName: z.ZoneName, Type: z.Type, Status: z.Status, Area: z.Area, PlanId: (z.Resources as { PlanId?: string }[] | undefined)?.[0]?.PlanId,
}))
console.log(`zones: ${JSON.stringify(zoneList)}`)
await step('list purchasable plans', 'DescribeAvailablePlans')
await step('list plans on the account', 'DescribePlans', { Limit: 100 })
for (const z of zoneList) {
  await step(`domains in ${z.ZoneName}`, 'DescribeAccelerationDomains', { ZoneId: z.ZoneId, Limit: 100 })
}

if (WRITE && zoneList.length) {
  const z = zoneList.find((x) => x.Status === 'active') || zoneList[0]
  const host = `hh-probe-${Date.now().toString(36)}.${z.ZoneName}`
  console.log(`write test on ${host}`)
  await step('add a hostname to the zone', 'CreateAccelerationDomain', {
    ZoneId: z.ZoneId,
    DomainName: host,
    OriginInfo: { OriginType: 'IP_DOMAIN', Origin: ORIGIN },
  })
  await step('request a free certificate for it', 'ModifyHostsCertificate', { ZoneId: z.ZoneId, Hosts: [host], Mode: 'eofreecert' })
  await new Promise((r) => setTimeout(r, 10000))
  await step('observe hostname status', 'DescribeAccelerationDomains', {
    ZoneId: z.ZoneId, Filters: [{ Name: 'domain-name', Values: [host] }],
  })
  await step('clean up: delete the hostname', 'DeleteAccelerationDomains', { ZoneId: z.ZoneId, DomainNames: [host], Force: true })
} else if (WRITE) {
  console.log('no zone on the account: nothing to attach a hostname to (see audit)')
}

mkdirSync(path.resolve('.ingest'), { recursive: true })
writeFileSync(path.resolve('.ingest', 'teo-probe.json'), JSON.stringify({ at: new Date().toISOString(), zones: zoneList, log }, null, 2))
