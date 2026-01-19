Render build instructions

If Render (or another host) installs only production dependencies by default, the TypeScript compiler will fail because declaration packages (e.g., `@types/express`) live in devDependencies.

Two options:

1) Preferred: keep `@types/*` in `devDependencies` and tell Render to install devDependencies during the build.

   - Set an environment variable in your Render service settings:
     - Key: `NPM_CONFIG_PRODUCTION`
     - Value: `false`

   - Or set the Render Build Command to explicitly install devDependencies and then build:
     - If you use pnpm (recommended):
       pnpm install --include=dev && pnpm run build
     - If you use npm:
       npm install --include=dev && npm run build

   - Alternatively, use the provided helper script in this package.json:
     - `pnpm run render-build` (uses pnpm)
     - `npm run render-build:npm` (uses npm)

2) Short-term/quick fix: move `@types/*` to `dependencies` so they are installed during production-only installs. This increases production install size and is not recommended long-term.

This repository includes a `render-build` script in `backend/package.json` to make Render builds explicit. Prefer option 1 if you can change Render settings; otherwise option 2 is acceptable as a short-term workaround.
