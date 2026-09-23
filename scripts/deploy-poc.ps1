# Deploys apps/platform to the Makers proof-of-concept project from this PC.
# Run migrations on Neon FIRST (pnpm payload migrate with DATABASE_URL from NEON_DATABASE_URL).
# .env is moved out for the upload (the CLI uploads the whole folder) and always restored.
param([string] $Project = 'hh-platform-poc', [string] $Log = "$env:TEMP\deploy-poc.log")
function Say($m) { Add-Content -Encoding ascii -Path $Log -Value "[$(Get-Date -Format HH:mm:ss)] $m" }
$app = Join-Path $PSScriptRoot '..\apps\platform' | Resolve-Path
$held = Join-Path $env:TEMP 'hh-env-held'
New-Item -ItemType Directory -Force $held | Out-Null
$moved = @()
try {
  Get-ChildItem -Path $app -Force -Filter '.env*' | Where-Object { $_.Name -ne '.env.example' } | ForEach-Object {
    Move-Item $_.FullName (Join-Path $held $_.Name) -Force; $moved += $_.Name
  }
  Say "moved out: $($moved -join ', ')"
  # The CLI uploads the folder and builds remotely: a local .next (hundreds of MB with its cache)
  # is useless there and made the upload take ~4 minutes and the remote build time out.
  $next = Join-Path $app '.next'
  if (Test-Path $next) { Remove-Item $next -Recurse -Force; Say 'removed local .next before upload' }
  $t = Measure-Command { $out = edgeone makers deploy $app -n $Project -e production --json --skip-ai-gateway-sync 2>&1 | Out-String }
  $flat = ($out -replace '\x1b\[[0-9;]*m', '' -replace '\s+', ' ')
  Say ("deploy exit {0} in {1:N0} s" -f $LASTEXITCODE, $t.TotalSeconds)
  Say ("tail: " + $flat.Substring([Math]::Max(0, $flat.Length - 500)))
} finally {
  foreach ($n in $moved) { Move-Item (Join-Path $held $n) (Join-Path $app $n) -Force }
  Say "restored: $($moved -join ', ')"
  Say 'DONE'
}
