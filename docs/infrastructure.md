---
layout: default
title: Infrastructure
nav_order: 3
---

# Civitas — Infrastructure

## 1. Goals

- **Local dev**: `docker compose up` runs everything (API + frontend) on localhost
- **Vercel prod**: zero-cost deploy — Vite static site + serverless API functions
- **Storage**: `data/incidents.json` checked into the repo — no DB, no external services
- **Data**: populated by the ingest script (`pnpm --filter @workspace/scripts run ingest`)
- **KISS**: no Postgres, no Redis, no API keys required to run

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Vercel (free)                     │
│                                                         │
│  Static build ─── artifacts/civitas/dist/               │
│                                                         │
│  Serverless  ──── api/                                  │
│                   ├── civic/[layer].ts  GET /api/civic/* │
│                   └── neighborhood/report.ts             │
│                                                         │
│  Data files  ──── data/                                 │
│                   └── incidents.json  (bundled at build) │
└─────────────────────────────────────────────────────────┘
```

Local dev uses an Express server (`artifacts/api-server`) unchanged.

## 3. Monorepo layout

```
lib/
  civic-data/        — shared types, generate.ts, scoring.ts, loader.ts, sources/
artifacts/
  api-server/        — Express app (local dev + Docker)
  civitas/           — Vite + React web app
scripts/
  src/ingest.ts      — CLI: pulls real data from ArcGIS, writes data/incidents.json
data/
  incidents.json     — ingested snapshot (committed, updated by ingest script)
api/                 — Vercel serverless functions (prod)
```

## 4. Data flow

```
 ArcGIS Feature Services (Miami-Dade)
         │
         ▼  pnpm --filter @workspace/scripts run ingest
 data/incidents.json   ◄── committed to git
         │
         ├── api-server routes (local/Docker)
         └── api/ serverless functions (Vercel prod)
                 │
                 ▼
         React map (artifacts/civitas)
```

`loadIncidents()` reads the file once at process start and caches it. Falls back to seed data (`lib/civic-data/src/generate.ts`) if the file is missing.

## 5. API surface

| Route                                    | Description                                  |
| ---------------------------------------- | -------------------------------------------- |
| `GET /api/civic/meta`                    | `{ years, latestDate, earliestDate, count }` |
| `GET /api/civic/311?year=YYYY`           | 311 incidents filtered by year               |
| `GET /api/civic/crime?year=YYYY`         | Crime (jail bookings) filtered by year       |
| `GET /api/civic/permits?year=YYYY`       | Permits filtered by year                     |
| `GET /api/civic/water?year=YYYY`         | Water events filtered by year                |
| `GET /api/neighborhood/report?lat=&lon=` | Neighborhood score report                    |
| `GET /api/healthz`                       | `{ status: "ok" }`                           |

Year filter is preferred. `?since=ISO` is also accepted as a fallback.

## 6. Vite proxy (local dev)

`artifacts/civitas/vite.config.ts` proxies `/api` to the Express server. Docker passes `API_URL` so the container resolves the sibling service by name (`http://civitas-api:3001`).

## 7. Cost breakdown

| Component | Local        | Vercel free tier           |
| --------- | ------------ | -------------------------- |
| Frontend  | Docker       | Static hosting (100 GB bw) |
| API       | Docker       | Serverless (100k inv/day)  |
| Storage   | JSON on disk | JSON bundled in functions  |
| DB        | none         | none                       |
| Domain    | localhost    | *.vercel.app (free)        |
| **Total** | **$0**       | **$0**                     |

## Deployment

Vercel is connected directly to the GitHub repo (`pedropcamellon/civitas`). No GitHub Actions workflow is needed for deploys:

| Branch | Result |
|--------|--------|
| `main` | Production deployment |
| Any other branch / PR | Preview URL |

Every `git push` triggers an automatic Vercel build:
1. `corepack enable && pnpm install --frozen-lockfile`
2. `pnpm --filter @workspace/mockup-sandbox build`
3. Serverless functions in `api/` are bundled alongside the static output

## Ingest CI

`.github/workflows/ingest.yml` — manually triggered (`workflow_dispatch`) with inputs:
- `full_refresh` (boolean)
- `layer` (string, optional)
- `since_days` (number)

Runs ingest, commits `data/incidents.json`, and Vercel auto-redeploys on the commit.


