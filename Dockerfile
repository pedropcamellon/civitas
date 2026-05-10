# ── Stage 0: base (shared layer) ────────────────────────────────────────────
FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./

# Copy every package.json so pnpm can resolve the workspace graph
COPY artifacts/api-server/package.json     ./artifacts/api-server/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY lib/api-client-react/package.json     ./lib/api-client-react/
COPY lib/api-spec/package.json             ./lib/api-spec/
COPY lib/api-zod/package.json              ./lib/api-zod/
COPY lib/civic-data/package.json           ./lib/civic-data/
COPY lib/db/package.json                   ./lib/db/
COPY scripts/package.json                  ./scripts/

# ── Stage 1: api ─────────────────────────────────────────────────────────────
FROM base AS api

RUN pnpm install --frozen-lockfile --filter @workspace/api-server...

COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

RUN pnpm --filter @workspace/api-server build

EXPOSE 3001
CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]

# ── Stage 2: twin dev server ──────────────────────────────────────────────────
FROM base AS twin

RUN pnpm install --frozen-lockfile --filter @workspace/mockup-sandbox...

COPY artifacts/mockup-sandbox/ ./artifacts/mockup-sandbox/

EXPOSE 5173
CMD ["pnpm", "--filter", "@workspace/mockup-sandbox", "dev", "--host"]

# ── Stage 3: twin production build (nginx) ────────────────────────────────────
FROM base AS twin-build

RUN pnpm install --frozen-lockfile --filter @workspace/mockup-sandbox...

COPY artifacts/mockup-sandbox/ ./artifacts/mockup-sandbox/

ENV PORT=5173 BASE_PATH=/
RUN pnpm --filter @workspace/mockup-sandbox build

FROM nginx:alpine AS twin-prod
COPY --from=twin-build /app/artifacts/mockup-sandbox/dist /usr/share/nginx/html
EXPOSE 80
