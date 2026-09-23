# Setup for Windows. Run from the repository root in PowerShell.
$ErrorActionPreference = "Stop"

Write-Host "== Node and package managers =="
node -v
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) { corepack enable; corepack prepare pnpm@latest --activate }
pnpm -v

Write-Host "== EdgeOne CLI =="
npm install -g edgeone
edgeone -v

Write-Host "== EdgeOne Makers skills into .claude/skills =="
npx --yes skills add TencentEdgeOne/edgeone-makers-tools

Write-Host "== Login to EdgeOne (browser) =="
Write-Host "Choose 'Global' when prompted. Skip with Ctrl+C if using an API token in CI."
edgeone login
edgeone whoami

Write-Host ""
Write-Host "Done. The MCP server is configured in .mcp.json and starts with Claude Code."
