---
layout: default
title: Infrastructure
nav_order: 3
---

# Civic Watch — Infrastructure Spec
# Target: local Docker dev + Vercel free tier production

## 1. Goals

- **Local dev**: `docker compose up` runs everything (API + frontend) on localhost
- **Vercel prod**: zero-cost deploy — Vite static site + serverless API functions
- **Storage**: JSON flat files checked into the repo (no DB at all for now)
- **Data**: static seed data → later replaced by daily cron fetching Miami-Dade open data
- **KISS**: no Postgres, no Redis, no external services, no API keys

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Vercel (free)                     │
│                                                         │
│  Static build ─── artifacts/mockup-sandbox/dist/        │
│                                                         │
│  Serverless  ──── api/                                  │
│                   ├── civic/[layer].ts   GET /api/civic/*│
│                   └── neighborhood/report.ts             │
│                                                         │
│  Data files  ──── data/                                 │
│                   └── incidents.json (bundled at build)  │
└─────────────────────────────────────────────────────────┘
```

Local dev uses the existing Express server unchanged.

## 3. Workspace changes (checklist)

### 3.1 Extract in-memory data to a shared JSON file

- [ ] Create `data/incidents.json` — dump `MIAMI_INCIDENTS` array from
      `artifacts/api-server/src/data/miamiCivicData.ts` at build time
- [ ] Create `data/neighborhoods.json` — the `NEIGHBORHOODS` array
- [ ] Create a shared loader `lib/civic-data/src/index.ts`:
      ```ts
      import incidents from "../../../data/incidents.json";
      import neighborhoods from "../../../data/neighborhoods.json";
      export { incidents, neighborhoods };
      ```
- [ ] Wire `lib/civic-data` into `pnpm-workspace.yaml` packages list
- [ ] Both Express routes and Vercel functions import from `@workspace/civic-data`

### 3.2 Create Vercel serverless functions

- [ ] `api/civic/[layer].ts` — handles `/api/civic/crime`, `/api/civic/311`,
      `/api/civic/permits`, `/api/civic/water`
      Uses the same filter-by-date logic as the Express route.
- [ ] `api/neighborhood/report.ts` — same logic as Express neighborhood route
- [ ] `api/healthz.ts` — returns `{ status: "ok" }`

Each function is a standard Vercel edge/serverless handler:
```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { incidents } from "@workspace/civic-data";

export default function handler(req: VercelRequest, res: VercelResponse) {
  const layer = req.query.layer as string;
  const since = req.query.since as string | undefined;
  const filtered = incidents
    .filter(i => i.type === (layer === "311" ? "311" : layer))
    .filter(i => !since || new Date(i.date).getTime() >= new Date(since).getTime());
  res.json(filtered);
}
```

### 3.3 Create `vercel.json`

```json
{
  "buildCommand": "pnpm --filter @workspace/mockup-sandbox build",
  "outputDirectory": "artifacts/mockup-sandbox/dist",
  "framework": null,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" }
  ],
  "installCommand": "corepack enable && pnpm install --frozen-lockfile"
}
```

### 3.4 Update frontend API base

- [ ] In `artifacts/mockup-sandbox/src/twin/useIncidents.ts`, change:
      ```ts
      const API_BASE = "/api";
      ```
      This already works for both local (proxied) and Vercel (rewritten). No change needed.

### 3.5 Vite proxy for local dev ✅

`artifacts/mockup-sandbox/vite.config.ts` proxies `/api` to the Express server.
For Docker, `API_URL` env var overrides the target so the container resolves the
sibling service by name (`http://civitas-api:3001`) rather than localhost:

```ts
proxy: {
  "/api": {
    target: process.env.API_URL ?? `http://localhost:${process.env.API_PORT ?? "3001"}`,
    changeOrigin: true,
  },
}
```

`docker-compose.yml` passes `API_URL: "http://civitas-api:3001"` to the frontend container.

### 3.6 Docker Compose (local dev) ✅

Update `docker-compose.yml` to run both services:

```yaml
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: api
    ports:
      - "3001:3001"
    environment:
      PORT: "3001"

  twin:
    build:
      context: .
      dockerfile: Dockerfile
      target: twin
    ports:
      - "5173:5173"
    environment:
      PORT: "5173"
      BASE_PATH: "/"
    depends_on:
      - api
```

### 3.7 Multi-target Dockerfile

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY artifacts/api-server/package.json     artifacts/api-server/
COPY artifacts/mockup-sandbox/package.json artifacts/mockup-sandbox/
COPY lib/api-client-react/package.json     lib/api-client-react/
COPY lib/api-spec/package.json             lib/api-spec/
COPY lib/api-zod/package.json              lib/api-zod/
COPY lib/db/package.json                   lib/db/
COPY scripts/package.json                  scripts/

# ── API server ──
FROM base AS api
RUN pnpm install --frozen-lockfile --filter @workspace/api-server...
COPY artifacts/api-server/ artifacts/api-server/
COPY lib/ lib/
COPY data/ data/
RUN pnpm --filter @workspace/api-server build
EXPOSE 3001
CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]

# ── Frontend dev server ──
FROM base AS twin
RUN pnpm install --frozen-lockfile --filter @workspace/mockup-sandbox...
COPY artifacts/mockup-sandbox/ artifacts/mockup-sandbox/
EXPOSE 5173
CMD ["pnpm", "--filter", "@workspace/mockup-sandbox", "dev"]
```

## 4. Data pipeline (future — not in v1)

- Daily GitHub Action (free) or Vercel cron:
  1. Fetch from Miami-Dade ArcGIS REST / Socrata endpoints
  2. Write to `data/incidents.json`
  3. Commit & push (triggers Vercel redeploy)
- Cost: $0 — GitHub Actions has 2000 min/month free

## 5. Cost breakdown

| Component       | Local         | Vercel free tier           |
|-----------------|---------------|----------------------------|
| Frontend        | Docker        | Static hosting (100GB bw)  |
| API             | Docker        | Serverless (100k inv/day)  |
| Storage         | JSON on disk  | JSON bundled in functions   |
| DB              | none          | none                       |
| Domain          | localhost     | *.vercel.app (free)        |
| **Total**       | **$0**        | **$0**                     |

## 6. Implementation order

1. Extract data to `data/*.json` + create `lib/civic-data`
2. Refactor Express routes to use `@workspace/civic-data`
3. Add Vite dev proxy (`/api` → `localhost:3001`)
4. Update Dockerfile to multi-target + update `docker-compose.yml`
5. Verify `docker compose up` works end-to-end
6. Create `api/` serverless functions
7. Create `vercel.json`
8. Deploy to Vercel, verify everything works
