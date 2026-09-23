#!/usr/bin/env bash
# Setup for macOS / Linux. Run from the repository root.
set -euo pipefail

echo "== Node and package managers =="
node -v
if ! command -v pnpm >/dev/null 2>&1; then corepack enable && corepack prepare pnpm@latest --activate; fi
pnpm -v

echo "== EdgeOne CLI =="
npm install -g edgeone
edgeone -v

echo "== EdgeOne Makers skills into .claude/skills =="
npx --yes skills add TencentEdgeOne/edgeone-makers-tools

echo "== Login to EdgeOne (browser) =="
echo "Choose 'Global' when prompted. Skip with Ctrl+C if using an API token in CI."
edgeone login
edgeone whoami

echo
echo "Done. The MCP server is configured in .mcp.json and starts with Claude Code."
