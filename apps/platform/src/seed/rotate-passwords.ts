/**
 * Rotates the password of every seeded test user (*@example.test) to SEED_PASSWORD.
 * Run against a shared database: DATABASE_URL=... SEED_PASSWORD=... tsx src/seed/rotate-passwords.ts
 * System operation; uses overrideAccess and is listed in the allowlist.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const pw = process.env.SEED_PASSWORD
if (!pw || pw.length < 20) {
  console.error('SEED_PASSWORD must be set to a random value of at least 20 characters')
  process.exit(1)
}
const payload = await getPayload({ config })
const users = await payload.find({ collection: 'users', where: { email: { like: '@example.test' } }, limit: 1000, overrideAccess: true, depth: 0 })
let n = 0
for (const u of users.docs) {
  await payload.update({ collection: 'users', id: u.id, data: { password: pw }, overrideAccess: true })
  n++
}
payload.logger.info(`Rotated ${n} seeded user passwords`)
process.exit(0)