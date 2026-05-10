---
layout: default
title: Open Data Ingest
nav_order: 4
---

# Open Data — Ingest Spec

> Status markers: `✅ Done` | `🚧 In Progress` | `📐 Specified`

Civitas **never fetches from external APIs during a user session**. Instead, data is pulled from Miami-Dade open data sources on a schedule, normalized, and written to `data/incidents.json`. The app always reads from that stored file, filtered by the user's selected time window.

```
 ┌─────────────────┐     scheduled      ┌────────────────────┐     always
 │  Socrata APIs   │ ──── ingest job ──▶ │ data/incidents.json │ ──── served ──▶ map
 │  (Miami-Dade)   │                     │ (flat file, git)   │
 └─────────────────┘                     └────────────────────┘
```

---

## 1. Known data sources

| ID | Layer | Protocol | Endpoint | Auth | Status |
|----|-------|----------|----------|------|--------|
| `miami-dade-311` | `311` | Socrata SODA | `https://opendata.miamidade.gov/resource/dj6j-qg5t.json` | App token (optional) | 📐 Specified |
| `miami-pd-crime` | `crime` | Socrata SODA | `https://opendata.miamidade.gov/resource/ghx4-s5qi.json` | App token (optional) | 📐 Specified |
| `miami-dade-permits` | `permits` | Socrata SODA | `https://opendata.miamidade.gov/resource/mxhq-a7mw.json` | App token (optional) | 📐 Specified |
| `miami-water` | `water` | TBD | TBD | None | 📐 Specified |
| `noaa-tides` | `water` | REST | `https://api.tidesandcurrents.noaa.gov/api/prod/` | None | 📐 Specified |
| `seed` | all | In-process | `lib/civic-data/src/generate.ts` | None | ✅ Done |

### Socrata SODA basics

- Base URL: `https://{domain}/resource/{dataset-id}.json`
- Pagination: `$limit` + `$offset` (default 1000, max 50 000 per page)
- Time filter: `$where=date_col > '2025-01-01T00:00:00.000'`
- Sort: `$order=date_col DESC`
- Rate limit: 1 000 req/hour unauthenticated → 10 000 with app token
- Token: `X-App-Token` header or `$$app_token` query param

### Seed data notes (`generate.ts`) ✅

`generate()` produces deterministic-ish seed data used until the first real ingest run:

- **Crime (150 records)** — 60 % of records are placed in historically higher-density neighborhoods (Liberty City, Overtown, Little Havana, Downtown, Allapattah, Hialeah, North Miami, Homestead). 40 % are spread across all neighborhoods.
- **311 (180 records)** — uniform random across all neighborhoods.
- **Permits (120 records)** — uniform random across all neighborhoods.
- **Water events (90 records)** — transient advisories (boil-water, main break, discolored water, etc.).
- **Water infrastructure (12 fixed records)** — real Miami-Dade Water & Sewer facilities with accurate coordinates: Hialeah WTP, John E. Preston WTP, Alexander Orr Jr. WTP, South District WTP, plus pump stations and reservoirs across Brickell, South Beach, Wynwood, Hialeah, Kendall, Doral, North Miami, and Coral Gables. These carry `subtype: "infrastructure"` and are always present.

---

## 2. Ingest pipeline

The ingest job runs outside of any user request. It is a standalone script (or GitHub Actions workflow) that:

1. Fetches the last N days from each registered source
2. Validates and normalizes each record to `NormalizedIncident`
3. Deduplicates by `externalId` across sources for the same layer
4. Merges into a single array and writes `data/incidents.json`
5. Commits the file (if run in CI) → triggers Vercel redeploy

```ts
// scripts/ingest.ts (📐 Specified)
await runIngest({
  layers: ["crime", "311", "permit", "water"],
  since: subDays(new Date(), 30).toISOString(),
  outputPath: "data/incidents.json",
});
```

If **any** source fails during ingest, that source is skipped and its last known records (from the existing `data/incidents.json`) are preserved. A partial ingest is better than losing all data for a layer.

---

## 3. File structure

```
lib/civic-data/src/
  sources/
    adapter.ts         ← SourceAdapter interface + NormalizedIncident
    registry.ts        ← register(), getForLayer(), all()
    pipeline.ts        ← fetch → validate → normalize stages
    miami311.ts        ← SourceAdapter for miami-dade-311
    miamiCrime.ts      ← SourceAdapter for miami-pd-crime
    miamiPermits.ts    ← SourceAdapter for miami-dade-permits
    water.ts           ← SourceAdapter for miami-water + noaa-tides
    seed.ts            ← SourceAdapter wrapping generate.ts (always available)
    index.ts           ← registers all adapters, re-exports registry
  ingest.ts            ← runIngest(): orchestrates pipeline, writes output file
  types.ts             ← RawIncident (unchanged public surface)
  scoring.ts           ← unchanged
  neighborhoods.ts     ← unchanged
  generate.ts          ← unchanged (consumed by seed.ts as fallback)
  index.ts             ← barrel re-exports

scripts/
  ingest.ts            ← CLI entry point: calls runIngest(), logs summary

data/
  incidents.json       ← output of last ingest (or seed if ingest never ran)
  neighborhoods.json   ← static neighborhood list
```

---

## 4. Adapter interface (`sources/adapter.ts`)

```ts
export type IncidentLayer = "crime" | "311" | "permit" | "water";

export interface SourceMeta {
  id: string;
  layer: IncidentLayer;
  label: string;
  attribution: string;
}

export interface FetchOptions {
  since: string;          // ISO timestamp — fetch records after this date
  limit?: number;         // max per page, default 1000
  signal?: AbortSignal;
}

export interface SourceAdapter {
  meta: SourceMeta;
  fetch(options: FetchOptions): Promise<NormalizedIncident[]>;
}

// RawIncident + ingest-time provenance (stripped before writing to file)
export interface NormalizedIncident extends RawIncident {
  sourceId: string;
  externalId: string;
}
```

`RawIncident` carries an optional `subtype` field used to distinguish fixed
infrastructure records from transient events:

```ts
export interface RawIncident {
  // ...
  subtype?: "infrastructure";  // set for treatment plants, pump stations, etc.
}
```

Infrastructure records are **never filtered by date** — they are always shown when the water layer is active.

---

## 5. Field mappings

### miami-dade-311

| SODA field | RawIncident field |
|------------|-------------------|
| `case_number` | `id` (also `externalId`) |
| `issue_type` | `title` |
| `issue_description` | `description` |
| `date_created` | `date` |
| `status` | `status` |
| `full_address` | `address` |
| `latitude` / `longitude` | `lat` / `lon` |
| geo lookup via `neighborhoods.ts` | `neighborhood` |

### miami-pd-crime

| SODA field | RawIncident field |
|------------|-------------------|
| `case_number` | `id` |
| `offense` | `title` |
| `offense_description` | `description` |
| `date_occurred` | `date` |
| `disposition` | `status` |
| `address` | `address` |
| `latitude` / `longitude` | `lat` / `lon` |

### miami-dade-permits

| SODA field | RawIncident field |
|------------|-------------------|
| `permit_number` | `id` |
| `work_type` | `title` |
| `work_description` | `description` |
| `issue_date` | `date` |
| `status` | `status` |
| `address` | `address` |
| `latitude` / `longitude` | `lat` / `lon` |

---

## 6. Serving ingested data

API routes never call external sources. They read from `data/incidents.json` and filter by the `since` query parameter:

```ts
// api/civic/[layer].ts
const all = incidents.filter(i => i.type === layer);
const since = req.query.since;
const result = since
  ? all.filter(i => new Date(i.date) >= new Date(since))
  : all;
res.json(result);
```

The time window (`since`) is derived from the frontend's selected filter (24h / 7d / 30d). All filtering happens server-side; the frontend never receives the full dataset.

---

## 7. Environment variables (ingest script only)

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `SODA_APP_TOKEN` | No | — | Socrata rate-limit upgrade (10k req/hr) |
| `INGEST_SINCE_DAYS` | No | `30` | How far back to pull on each run |
| `INGEST_TIMEOUT_MS` | No | `30000` | Per-source HTTP timeout |

These variables are only read by the ingest script. The app server and frontend have no knowledge of them.

---

## 8. Ingest schedule

| Environment | Schedule | Mechanism |
|-------------|----------|-----------|
| CI / prod | Daily at 06:00 UTC | GitHub Actions cron |
| Local dev | On demand | `pnpm run ingest` |

A successful ingest commits the updated `data/incidents.json`, which triggers a Vercel redeploy. The app always serves from the last committed snapshot.

---

## 9. Error handling

| Failure mode | Behavior |
|--------------|----------|
| Source HTTP timeout | Skip source, preserve existing records for that layer |
| HTTP 429 | Skip source, log warning |
| Malformed JSON | Skip source |
| Record missing required field | Drop record, log warning, continue |
| All sources fail | Write nothing — existing file preserved |
| Ingest never ran | App serves seed data from `generate.ts` |

---

## 10. Testing strategy

- **Adapter unit tests** — recorded `.json` fixture per source, no network calls
- **Pipeline unit tests** — validate and normalize stages in isolation
- **ingest.ts integration tests** — mocked adapters, verify merge + dedup + file write
- **API route tests** — unchanged; consume `RawIncident[]` from file regardless of source
- **No live API calls in CI ever**

---

## 11. Implementation phases

### Phase 1 — Adapter scaffold + 311 📐

- [ ] `sources/adapter.ts` — SourceAdapter interface, NormalizedIncident
- [ ] `sources/registry.ts` — SourceRegistry
- [ ] `sources/pipeline.ts` — fetch → validate → normalize
- [ ] `sources/seed.ts` — wraps generate.ts
- [ ] `sources/miami311.ts` — first real adapter
- [ ] `sources/index.ts` — registers seed + miami311
- [ ] `ingest.ts` — runIngest() orchestrator
- [ ] `scripts/ingest.ts` — CLI entry point
- [ ] `.env.example` updated
- [ ] GitHub Actions workflow: daily cron → `pnpm run ingest` → commit

### Phase 2 — Crime + Permits 📐

- [ ] `sources/miamiCrime.ts`
- [ ] `sources/miamiPermits.ts`
- [ ] Recorded fixtures + unit tests for both

### Phase 3 — Water + NOAA 📐

- [ ] `sources/water.ts` — advisory + tide level composite
- [ ] Flood risk scoring enhancement in `scoring.ts`
