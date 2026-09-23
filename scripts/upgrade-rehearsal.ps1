# Rehearses a Payload upgrade: pin every Payload package to each version in turn, then for each:
#   install -> typecheck -> schema-drift check (migrate:create --skip-empty) -> isolation + RLS suites
# Leaves package.json at the LAST version given. Run from apps/platform against a LOCAL database.
#   ..\..\scripts\upgrade-rehearsal.ps1 -Versions 3.89.0,3.90.1
param(
  [Parameter(Mandatory)] [string[]] $Versions,
  [string] $DbUrl = 'postgres://hh:hh_local_dev@localhost:5432/hh_platform',
  [string] $Log = "$env:TEMP\upgrade-rehearsal.log"
)
$env:DATABASE_URL = $DbUrl
$env:PAYLOAD_DB_PUSH = 'false'
# Same rotated seed password everywhere, so a test run never trips the login lockout.
$env:SEED_PASSWORD = [Environment]::GetEnvironmentVariable('HH_NEON_SEED_PASSWORD', 'User')
$index = (Resolve-Path src\migrations\index.ts).Path
function Say($m) { "[$(Get-Date -Format HH:mm:ss)] $m" | Tee-Object -Append -FilePath $Log }
$pkg = (Resolve-Path package.json).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)
$tests = 'tests/int/isolation.int.spec.ts', 'tests/int/override-access.int.spec.ts', 'tests/int/rls.int.spec.ts', 'tests/int/rls-payload.int.spec.ts'

foreach ($v in $Versions) {
  $t = [IO.File]::ReadAllText($pkg)
  $t = [regex]::Replace($t, '("(?:payload|@payloadcms/[a-z-]+)":\s*")\d+\.\d+\.\d+(")', "`${1}$v`${2}")
  [IO.File]::WriteAllText($pkg, $t, $utf8)
  Say "== payload $v"
  $d = Measure-Command { $o = pnpm install --frozen-lockfile=false 2>&1 }
  Say ("install exit {0}, {1:N0} s" -f $LASTEXITCODE, $d.TotalSeconds)
  $o = pnpm exec tsc --noEmit 2>&1
  Say ("typecheck exit {0} {1}" -f $LASTEXITCODE, (($o | Select-Object -First 3) -join ' | '))
  if ($v -eq $Versions[0]) {
    # Write the users' credentials with the OLD version, so later versions must accept them.
    $o = pnpm exec tsx src/seed/rotate-passwords.ts 2>&1
    Say ("credentials written by {0}: {1}" -f $v, (($o | Select-String 'Rotated').Line -replace '\x1b\[[0-9;]*m', ''))
  }
  $indexBefore = [IO.File]::ReadAllText($index)
  $o = pnpm payload migrate:create drift_check --skip-empty 2>&1
  $new = @(Get-ChildItem src\migrations\*drift_check*.ts)
  if ($new.Count) {
    Say "SCHEMA DRIFT: $v generates a migration: $($new.Name -join ', ')"
    $new | ForEach-Object { Copy-Item $_.FullName "$env:TEMP\$($_.Name)" -Force; Remove-Item $_.FullName }
    Get-ChildItem src\migrations\*drift_check*.json | Remove-Item
    [IO.File]::WriteAllText($index, $indexBefore, $utf8)
  } else { Say 'no schema drift' }
  $o = pnpm exec vitest run --config ./vitest.config.mts @tests 2>&1
  $sum = $o | Select-String 'Tests\s+\d|Test Files' | ForEach-Object { ($_.Line -replace '\x1b\[[0-9;]*m', '').Trim() }
  Say ("tests exit {0}: {1}" -f $LASTEXITCODE, ($sum -join ' ; '))
}
