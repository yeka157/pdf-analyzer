<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Linting and formatting

Use Ultracite with Biome: `npm run lint` checks, `npm run lint:fix` applies fixes, and `npm run format` formats supported files. Run `npm run lint:framework` as well to retain the existing Next.js ESLint checks. `quality` runs both. Existing source violations are not suppressed by the tooling migration; review fixes before applying them broadly.
