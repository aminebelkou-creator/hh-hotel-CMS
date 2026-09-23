# Fires two Makers deploys of the same static project at the same moment and records what the
# free plan's single build slot does with them. Scratch project; no customer data.
#   scripts\collide-publishes.ps1 [-Project hh-collide-test]
param([string] $Project = 'hh-collide-test', [string] $Log = "$env:TEMP\collide.log")
$root = Join-Path $env:TEMP 'hh-collide'
function Say($m) { Add-Content -Encoding ascii -Path $Log -Value "[$(Get-Date -Format HH:mm:ss.fff)] $m" }
foreach ($v in 'a', 'b') {
  $d = Join-Path $root $v
  New-Item -ItemType Directory -Force $d | Out-Null
  Set-Content -Encoding ascii (Join-Path $d 'index.html') "<!doctype html><title>collide $v</title><h1>version $v $(Get-Date -Format o)</h1>"
}
Say "warm-up deploy (creates the project if needed)"
$w = edgeone makers deploy (Join-Path $root 'a') -n $Project -e production --json 2>&1 | Out-String
Say ("warm-up: " + ($w -replace '\s+', ' ').Substring(0, [Math]::Min(300, ($w -replace '\s+', ' ').Length)))

$jobs = foreach ($v in 'a', 'b') {
  Start-Job -ArgumentList (Join-Path $root $v), $Project, $v -ScriptBlock {
    param($dir, $proj, $v)
    $t0 = Get-Date
    $out = edgeone makers deploy $dir -n $proj -e production --json 2>&1 | Out-String
    [pscustomobject]@{ v = $v; start = $t0.ToString('HH:mm:ss.fff'); end = (Get-Date).ToString('HH:mm:ss.fff'); secs = [int]((Get-Date) - $t0).TotalSeconds; exit = $LASTEXITCODE; out = ($out -replace '\s+', ' ') }
  }
}
Say "two deploys started"
$res = $jobs | Wait-Job -Timeout 600 | Receive-Job
foreach ($r in $res) { Say ("deploy {0}: start {1} end {2} ({3} s) exit {4} :: {5}" -f $r.v, $r.start, $r.end, $r.secs, $r.exit, $r.out.Substring(0, [Math]::Min(400, $r.out.Length))) }
$live = (Invoke-WebRequest -UseBasicParsing "https://$Project.edgeone.cool/" -ErrorAction SilentlyContinue).Content
Say ("live now serves: " + ([regex]::Match("$live", 'version [ab][^<]*').Value))
Say 'DONE'
