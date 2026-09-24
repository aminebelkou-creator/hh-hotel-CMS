# Design tokens

Each template's resolved tokens in the W3C design-tokens format (DTCG), for designers and agents, plus `_brand-fields.json`: what a hotel can change on top of a template and the contrast gates that apply. Generated from the code; do not edit by hand:

```bash
cd apps/platform
pnpm exec tsx src/design/export-tokens.ts ../../docs/design-tokens
```

Rules: [`../11-design-contract.md`](../11-design-contract.md). Brief for designers: [`../14-designer-brief.md`](../14-designer-brief.md).
