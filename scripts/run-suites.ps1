# Runs the integration suites against local-10, local-50 and Neon, saving each full log and a summary.
# From apps/platform:  ..\..\scripts\run-suites.ps1
param([string] $Out = "$env:TEMP\suites")
New-Item -ItemType Directory -Force $Out | Out-Null
$env:PAYLOAD_DB_PUSH = 'false'
$env:SEED_PASSWORD = [Environment]::GetEnvironmentVariable('HH_NEON_SEED_PASSWORD', 'User')
$local = 'tests/int/isolation.int.spec.ts', 'tests/int/isolation-extended.int.spec.ts', 'tests/int/override-access.int.spec.ts', 'tests/int/rls.int.spec.ts', 'tests/int/rls-payload.int.spec.ts'
$runs = @(
  @{ Name = 'local-10'; Url = 'postgres://hh:hh_local_dev@localhost:5432/hh_check'; Tenants = '10'; Tests = $local; Platform = '' },
  @{ Name = 'local-50'; Url = 'postgres://hh:hh_local_dev@localhost:5432/hh_platform'; Tenants = '50'; Tests = $local; Platform = '' },
  @{ Name = 'neon-50'; Url = [Environment]::GetEnvironmentVariable('NEON_DATABASE_URL', 'User'); Tenants = '50'; Tests = @('tests/int'); Platform = 'https://hh-platform-poc.edgeone.cool' }
)
foreach ($r in $runs) {
  $env:DATABASE_URL = $r.Url; $env:SEED_TENANTS = $r.Tenants; $env:PLATFORM_URL = $r.Platform
  $log = Join-Path $Out "$($r.Name).log"
  # Splat (@files): pnpm is a .ps1 shim that would otherwise join an array into one argument.
  [string[]] $files = $r.Tests
  pnpm exec vitest run --config ./vitest.config.mts @files 2>&1 | ForEach-Object { "$_" -replace '\x1b\[[0-9;]*m', '' } | Set-Content -Encoding utf8 $log
  $sum = Select-String -Path $log -Pattern '^\s*(Test Files|Tests)\s' | ForEach-Object { $_.Line.Trim() }
  $line = "$($r.Name): $($sum -join ' | ')"
  Add-Content -Encoding ascii -Path (Join-Path $Out 'summary.txt') -Value $line   # Tee-Object writes UTF-16 on PS 5
  $line
}
