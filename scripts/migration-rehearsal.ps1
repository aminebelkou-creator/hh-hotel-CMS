# Rehearses pending Payload migrations against one database and proves per-tenant safety:
#   1. snapshot per-tenant checksums (ignoring the columns the migration is meant to add)
#   2. payload migrate (timed)
#   3. verify every tenant's other data is unchanged, then run the migration's own check
# Usage (from apps/platform):
#   ..\..\scripts\migration-rehearsal.ps1 -DbUrl <url> -Label local-10 -Ignore brand_name,timezone -Check src/db/verify-site-brand.ts
param(
  [Parameter(Mandatory)] [string] $DbUrl,
  [Parameter(Mandatory)] [string] $Label,
  [string[]] $Ignore = @(),
  [string] $Check = '',
  [string] $Log = "$env:TEMP\migration-rehearsal.log"
)
$ErrorActionPreference = 'Continue'
$env:DATABASE_URL = $DbUrl
$env:PAYLOAD_DB_PUSH = 'false'
$snap = "$env:TEMP\tenant-snapshot-$Label.json"
$ign = ($Ignore -join ',')
function Say($m) { "[$(Get-Date -Format HH:mm:ss)] $Label $m" | Tee-Object -Append -FilePath $Log }

Say 'snapshot'
pnpm exec tsx src/db/tenant-checksums.ts snapshot $snap --ignore $ign 2>&1 | Select-String 'snapshot of' | ForEach-Object { Say $_.Line.Trim() }
$t = Measure-Command { $out = pnpm payload migrate 2>&1 }
$out | Select-String 'Migrat|rror' | ForEach-Object { Say $_.Line.Trim() }
Say ("payload migrate took {0:N1} s" -f $t.TotalSeconds)
pnpm exec tsx src/db/tenant-checksums.ts verify $snap --ignore $ign 2>&1 | Select-String 'verified|rror' | ForEach-Object { Say $_.Line.Trim() }
Say "checksum exit $LASTEXITCODE"
if ($Check) {
  pnpm exec tsx $Check 2>&1 | Select-String 'check|tenant |rror' | ForEach-Object { Say $_.Line.Trim() }
  Say "check exit $LASTEXITCODE"
}
