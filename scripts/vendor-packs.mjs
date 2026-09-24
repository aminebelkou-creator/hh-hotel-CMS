// Makes apps/platform deployable on its own (EdgeOne Makers uploads and installs only that
// folder, so pnpm workspace links to ../../packs/* cannot resolve there).
//
//   node ../../scripts/vendor-packs.mjs            (from apps/platform) copy packs in, rewrite deps
//   node ../../scripts/vendor-packs.mjs --restore  undo (local deploys only; CI runners are throwaway)
//
// Each "workspace:*" dependency on a pack becomes "link:./vendor/<pack>", a copy of the pack's
// source without node_modules. Packs resolve payload/react from apps/platform's node_modules.
import { cpSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const app = process.cwd()
const pkgPath = join(app, 'package.json')
const backup = join(app, 'package.json.predeploy')
const vendor = join(app, 'vendor')

if (process.argv.includes('--restore')) {
  if (existsSync(backup)) renameSync(backup, pkgPath)
  rmSync(vendor, { recursive: true, force: true })
  console.log('vendor-packs: restored package.json, removed vendor/')
  process.exit(0)
}

const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
const packsDir = resolve(app, '..', '..', 'packs')
let n = 0
for (const [name, spec] of Object.entries(pkg.dependencies ?? {})) {
  if (!String(spec).startsWith('workspace:')) continue
  const dir = ['hotel'].map((d) => join(packsDir, d)).find((d) => {
    try {
      return JSON.parse(readFileSync(join(d, 'package.json'), 'utf8')).name === name
    } catch {
      return false
    }
  })
  if (!dir) throw new Error(`vendor-packs: no pack in packs/ provides ${name}`)
  const dest = join(vendor, name.replace(/^@[^/]+\//, ''))
  rmSync(dest, { recursive: true, force: true })
  cpSync(dir, dest, { recursive: true, filter: (src) => !src.includes('node_modules') })
  pkg.dependencies[name] = `link:./vendor/${name.replace(/^@[^/]+\//, '')}`
  n++
}
if (!existsSync(backup)) writeFileSync(backup, readFileSync(pkgPath))
writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + '\n')
console.log(`vendor-packs: ${n} pack(s) vendored into apps/platform/vendor`)
