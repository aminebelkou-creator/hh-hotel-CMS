/**
 * Minimal EdgeOne (teo) API client: TC3-HMAC-SHA256 signing with Node crypto, no SDK.
 * Credentials come from TENCENTCLOUD_SECRET_ID / TENCENTCLOUD_SECRET_KEY, never from code.
 * This is the seed of the host adapter: only the release pipeline may import it (CLAUDE.md rule 5).
 */
import { createHash, createHmac } from 'node:crypto'
import dns from 'node:dns'

// The API host resolves to IPv6 addresses that intermittently fail from this network.
dns.setDefaultResultOrder('ipv4first')

const HOST = 'teo.intl.tencentcloudapi.com'
const SERVICE = 'teo'
const VERSION = '2022-09-01'

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')
const hmac = (k: Buffer | string, s: string) => createHmac('sha256', k).update(s).digest()

export class TeoError extends Error {
  constructor(public code: string, message: string, public requestId?: string) {
    super(`${code}: ${message}`)
  }
}

export async function teo<T = Record<string, unknown>>(action: string, params: Record<string, unknown> = {}, tries = 3): Promise<T> {
  try {
    return await call<T>(action, params)
  } catch (e) {
    // Network errors are retried (a signed request is valid for 5 minutes); API errors are not.
    if (e instanceof TeoError || tries <= 1) throw e
    await new Promise((r) => setTimeout(r, 1000))
    return teo<T>(action, params, tries - 1)
  }
}

async function call<T>(action: string, params: Record<string, unknown>): Promise<T> {
  const id = process.env.TENCENTCLOUD_SECRET_ID
  const key = process.env.TENCENTCLOUD_SECRET_KEY
  if (!id || !key) throw new Error('TENCENTCLOUD_SECRET_ID / TENCENTCLOUD_SECRET_KEY are not set')
  const body = JSON.stringify(params)
  const ts = Math.floor(Date.now() / 1000)
  const date = new Date(ts * 1000).toISOString().slice(0, 10)
  const canonical = [
    'POST', '/', '',
    `content-type:application/json; charset=utf-8\nhost:${HOST}\nx-tc-action:${action.toLowerCase()}\n`,
    'content-type;host;x-tc-action',
    sha256(body),
  ].join('\n')
  const scope = `${date}/${SERVICE}/tc3_request`
  const toSign = ['TC3-HMAC-SHA256', ts, scope, sha256(canonical)].join('\n')
  const kDate = hmac(`TC3${key}`, date)
  const signature = createHmac('sha256', hmac(hmac(kDate, SERVICE), 'tc3_request')).update(toSign).digest('hex')
  const res = await fetch(`https://${HOST}/`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json; charset=utf-8',
      host: HOST,
      'x-tc-action': action,
      'x-tc-version': VERSION,
      'x-tc-timestamp': String(ts),
      authorization: `TC3-HMAC-SHA256 Credential=${id}/${scope}, SignedHeaders=content-type;host;x-tc-action, Signature=${signature}`,
    },
    body,
  })
  const json = (await res.json()) as { Response: T & { Error?: { Code: string; Message: string }; RequestId?: string } }
  const r = json.Response
  if (r.Error) throw new TeoError(r.Error.Code, r.Error.Message, r.RequestId)
  return r
}
