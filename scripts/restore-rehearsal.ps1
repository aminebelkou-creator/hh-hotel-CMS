# Rehearses a single-tenant restore and proves no other tenant is touched:
#   snapshot all tenants -> export one tenant -> damage it -> verify ONLY it changed
#   -> restore it (timed) -> verify every tenant matches the snapshot again
# Usage (from apps/platform):
#   ..\..\scripts\restore-rehearsal.ps1 -DbUrl <url> -Label local -Tenant tenant-07
param(
  [Parameter(Mandatory)] [string] $DbUrl,
  [Parameter(Mandatory)] [string] $Label,
  [Parameter(Mandatory)] [string] $Tenant,
  [string] $Log = "$env:TEMP\restore-rehearsal.log"
)
$env:DATABASE_URL = $DbUrl
$env:PAYLOAD_DB_PUSH = 'false'
$snap = "$env:TEMP\restore-snapshot-$Label.json"
$bak = "$env:TEMP\tenant-backup-$Label-$Tenant.json"
function Say($m) { "[$(Get-Date -Format HH:mm:ss)] $Label $m" | Tee-Object -Append -FilePath $Log }
function Run($what, [scriptblock] $b, $pattern) {
  $t = Measure-Command { $script:out = & $b 2>&1 }
  $script:out | Select-String $pattern | ForEach-Object { Say ("{0}: {1}" -f $what, ($_.Line -replace '\x1b\[[0-9;]*m', '').Trim()) }
  Say ("{0}: exit {1}, {2:N1} s" -f $what, $LASTEXITCODE, $t.TotalSeconds)
}
Run 'snapshot' { pnpm exec tsx src/db/tenant-checksums.ts snapshot $snap } 'snapshot of|rror'
Run 'export'   { pnpm exec tsx src/db/tenant-backup.ts export $Tenant $bak } 'exported|rror'
Run 'damage'   { pnpm exec tsx src/db/damage-tenant.ts $Tenant } 'damaged|rror|usage'
$id = (Get-Content $bak -Raw | ConvertFrom-Json).tenant
Run 'verify-damaged' { pnpm exec tsx src/db/tenant-checksums.ts verify $snap --only-tenants $id } 'verified|rror'
Run 'restore'  { pnpm exec tsx src/db/tenant-backup.ts restore $Tenant $bak } 'restored|rolled back|rror'
Run 'verify-restored' { pnpm exec tsx src/db/tenant-checksums.ts verify $snap } 'verified|rror'
