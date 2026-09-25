/**
 * The one door to a language model. Everything that "writes" (ingest extraction, page
 * generation, translation, brand proposal) calls `getAi()` and never a vendor SDK, so the
 * provider is a deployment choice (AI_PROVIDER) and tests run without any key.
 *
 *   AI_PROVIDER = mock (default) | anthropic | openai        AI_API_KEY = …
 *   AI_MODEL    = model id (defaults per provider)             AI_BASE_URL = OpenAI-compatible base
 *
 * The mock provider is deterministic and offline: it answers `null`, which every caller
 * treats as "no model available, use the deterministic path". Callers must always have one.
 */
export type AiRequest = {
  /** What the model is for; kept short and stable so prompts are reviewable in the repo. */
  system: string
  prompt: string
  /** When set, the answer must be JSON matching this description; parsed before return. */
  json?: boolean
  maxTokens?: number
  temperature?: number
}

export type AiProvider = {
  name: 'mock' | 'anthropic' | 'openai'
  available: boolean
  model: string
  /** Returns the text (or parsed JSON when `json`), or null when no model is available. */
  complete: (req: AiRequest) => Promise<string | unknown | null>
}

const DEFAULT_MODEL = { anthropic: 'claude-sonnet-4-5', openai: 'gpt-4o-mini' } as const

const extractJson = (text: string): unknown => {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/([\[{][\s\S]*[\]}])/)
  return JSON.parse((m ? m[1] : text).trim())
}

const anthropic = (apiKey: string, model: string): AiProvider => ({
  name: 'anthropic',
  available: true,
  model,
  complete: async (req) => {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens ?? 2000,
        temperature: req.temperature ?? 0.3,
        system: req.system,
        messages: [{ role: 'user', content: req.prompt + (req.json ? '\n\nAnswer with JSON only.' : '') }],
      }),
      signal: AbortSignal.timeout(60000),
    })
    if (!r.ok) throw new Error(`anthropic ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const j = (await r.json()) as { content?: { type: string; text?: string }[] }
    const text = (j.content ?? []).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('')
    return req.json ? extractJson(text) : text
  },
})

const openai = (apiKey: string, model: string, baseUrl: string): AiProvider => ({
  name: 'openai',
  available: true,
  model,
  complete: async (req) => {
    const r = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_tokens: req.maxTokens ?? 2000,
        temperature: req.temperature ?? 0.3,
        ...(req.json ? { response_format: { type: 'json_object' } } : {}),
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.prompt + (req.json ? '\n\nAnswer with a JSON object only.' : '') },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    })
    if (!r.ok) throw new Error(`openai ${r.status}: ${(await r.text()).slice(0, 300)}`)
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] }
    const text = j.choices?.[0]?.message?.content ?? ''
    return req.json ? extractJson(text) : text
  },
})

export const mockAi: AiProvider = { name: 'mock', available: false, model: 'none', complete: async () => null }

let cached: AiProvider | undefined
/** The configured provider; `mock` (never calls anything) unless AI_PROVIDER and AI_API_KEY are set. */
export function getAi(): AiProvider {
  if (cached) return cached
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase()
  const key = process.env.AI_API_KEY || ''
  if (provider === 'anthropic' && key) cached = anthropic(key, process.env.AI_MODEL || DEFAULT_MODEL.anthropic)
  else if (provider === 'openai' && key) cached = openai(key, process.env.AI_MODEL || DEFAULT_MODEL.openai, process.env.AI_BASE_URL || 'https://api.openai.com/v1')
  else cached = mockAi
  return cached
}

/** Tests only: swap the provider (a scripted fake), and back. */
export function setAiForTests(p: AiProvider | undefined) {
  cached = p
}
