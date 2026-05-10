# Open Data Integration Spec

> This spec defines what IS implemented and what we build towards.
> Status markers: `✅ Done` | `🚧 In Progress` | `📐 Specified`

---

## 1. Guiding principles

These follow patterns from data platform teams at orgs like Segment, Airbnb, and CKAN-based government portals:

- **Ingest-then-serve, not pull-per-request** — open data is fetched once by an explicit ingest step and stored as JSON files in the repo. API routes only read stored files; they never call external APIs at request time.
- **On-demand ingestion** — ingest is triggered manually (`pnpm ingest`) or via GitHub Actions `workflow_dispatch`. No cron, no background jobs, no always-on infrastructure.
- **Storage = `data/` in the repo** — free, zero dependencies, already in INFRA_SPEC. No Postgres, no Redis, no Vercel KV, no external service of any kind.
- **Source registry over imports** — the ingest script never imports a source by name; it queries the registry by layer. Adding a new source means registering it, not changing ingest logic.
- **Adapter interface over ad-hoc functions** — every source implements the same `SourceAdapter` interface. Merge and deduplication work uniformly across any source type.
- **Pipeline stages, not monolithic fetchers** — fetch → validate → normalize are separate, testable steps. A bad record is dropped; it is not a reason to abort the whole run.
- **Provenance on every record** — each stored record carries `sourceId` and `externalId`. Enables deduplication when two sources overlap and makes reruns idempotent.
- **Seed data as permanent fallback** — `generate.ts` remains in place. If `data/incidents.json` does not exist, the API falls back to seed. Seed is always valid data, not a placeholder.

---

## 2. Data flow

```
  INGEST (on-demand, run by developer or GitHub Actions)
  ┌─────────────────────────────────────────────────────┐
  │  scripts/ingest.ts                                  │
  │    └─ for each layer:                               │
  │         registry.getForLayer(layer)                 │
  │           → runPipeline(adapter)                    │
  │               fetch → validate → normalize          │
  │         merge + deduplicate by externalId           │
  │         write data/incidents.json                   │
  └─────────────────────────────────────────────────────┘
                          │
                          ▼  (committed to repo or written to disk)
  data/
    incidents.json        ← stored normalized incidents
    neighborhoods.json    ← static, already planned

  SERVE (every API request — zero external calls)
  ┌─────────────────────────────────────────────────────┐
  │  API routes (Express + Vercel functions)            │
  │    └─ read data/incidents.json                      │
  │    └─ filter by layer + since                       │
  │    └─ return RawIncident[]                          │
  └─────────────────────────────────────────────────────┘
```

Serving is completely decoupled from fetching. A broken open data API never causes a user-facing error.

---

## 3. Storage: why `data/*.json` in the repo

| Option | Cost | New service? | Works on Vercel free? | KISS? |
|--------|------|-------------|----------------------|-------|
| `data/*.json` in repo | Free | No | Yes (bundled at build) | ✅ |
| Vercel Blob | Free tier 500 MB | Yes (Vercel add-on) | Yes | No |
| Turso (SQLite) | Free tier 9 GB | Yes | Yes | No |
| Neon (Postgres) | Free tier 512 MB | Yes | Yes | No |
| Vercel KV | Free tier limited | Yes | Yes | No |

`data/*.json` wins. It satisfies all constraints from INFRA_SPEC ("no external services"), costs nothing, and works identically in local dev, Docker, and Vercel production. The file is read at cold-start and held in memory for the process lifetime — one file read, no connection pooling, no auth, no network.

---

## 4. Known data sources

| ID | Layer | Protocol | Endpoint | Auth | Status |
|----|-------|----------|----------|------|--------|
| `miami-dade-311` | `311` | Socrata SODA | `https://opendata.miamidade.gov/resource/dj6j-qg5t.json` | App token (optional) | 📐 Specified |
| `miami-pd-crime` | `crime` | Socrata SODA | `https://opendata.miamidade.gov/resource/ghx4-s5qi.json` | App token (optional) | 📐 Specified |
| `miami-dade-permits` | `permits` | Socrata SODA | `https://opendata.miamidade.gov/resource/mxhq-a7mw.json` | App token (optional) | 📐 Specified |
| `miami-water` | `water` | TBD (flat file or advisory feed) | TBD | None | 📐 Specified |
| `noaa-tides` | `water` | REST | `https://api.tidesandcurrents.noaa.gov/api/prod/` | None | 📐 Specified |
| `seed` | all | In-process | `lib/civic-data/src/generate.ts` | None | ✅ Done |

### Socrata SODA API facts

- Base URL: `https://{domain}/resource/{dataset-id}.json`
- Pagination: `$limit` + `$offset` (default 1000, max 50 000 per page)
- Time filter: `$where=date_col > '2025-01-01T00:00:00.000'`
- Sort: `$order=date_col DESC`
- Rate limit: 1 000 req/hour unauthenticated → 10 000 with app token
- Token: `X-App-Token` header or `$$app_token` query param

---

## 5. File structure

```
lib/civic-data/src/
  sources/
    adapter.ts         ← SourceAdapter interface, SourceMeta, FetchOptions
    registry.ts        ← SourceRegistry: register(), getForLayer(), all()
    pipeline.ts        ← runPipeline(): fetch → validate → normalize
    miami311.ts        ← SourceAdapter impl for miami-dade-311
    miamiCrime.ts      ← SourceAdapter impl for miami-pd-crime
    miamiPermits.ts    ← SourceAdapter impl for miami-dade-permits
    water.ts           ← SourceAdapter impl for miami-water + noaa-tides
    seed.ts            ← SourceAdapter impl wrapping generate.ts
    index.ts           ← registers all adapters, re-exports registry
  types.ts             ← RawIncident, NormalizedIncident, StoredDataFile
  scoring.ts           ← unchanged
  neighborhoods.ts     ← unchanged
  generate.ts          ← unchanged (consumed by seed.ts and as API fallback)
  loader.ts            ← NEW: reads data/incidents.json, falls back to generate.ts
  index.ts             ← barrel re-exports

data/
  incidents.json       ← written by scripts/ingest.ts (gitignored until first ingest)
  neighborhoods.json   ← static, committed

scripts/src/
  ingest.ts            ← entry point: runs all adapters, writes data/incidents.json
```

The circuit breaker (`circuit.ts`) is **removed** from the architecture. It only matters when calling external APIs at request time, which we no longer do. During ingestion, a failed adapter logs and continues; partial data is better than no data.

---

## 6. Core interfaces (`sources/adapter.ts`)

```ts
export type IncidentLayer = "crime" | "311" | "permit" | "water";

export interface SourceMeta {
  id: string;                  // e.g. "miami-dade-311"
  layer: IncidentLayer;
  label: string;               // human display name
  attribution: string;         // "Miami-Dade County Open Data"
  updateFrequency: "realtime" | "daily" | "static";
}

export interface FetchOptions {
  since?: string;              // ISO timestamp lower bound (optional for full refresh)
  limit?: number;              // max records per page (default 1000)
  signal?: AbortSignal;
}

export interface SourceAdapter {
  meta: SourceMeta;

  // Returns normalized incidents. Throws on unrecoverable error.
  // Caller (ingest script) decides whether to skip and continue.
  fetch(options: FetchOptions): Promise<NormalizedIncident[]>;
}

// RawIncident + provenance. Written to data/incidents.json.
// Stripped back to RawIncident before being returned by API routes.
export interface NormalizedIncident extends RawIncident {
  sourceId: string;    // adapter meta.id
  externalId: string;  // original record ID from the source
}
```

`StoredDataFile` (in `types.ts`) is the shape of `data/incidents.json`:

```ts
export interface StoredDataFile {
  generatedAt: string;         // ISO timestamp of ingest run
  sources: string[];           // adapter IDs that contributed
  incidents: NormalizedIncident[];
}
```

---

## 7. Registry (`sources/registry.ts`)

```ts
class SourceRegistry {
  register(adapter: SourceAdapter): void
  getForLayer(layer: IncidentLayer): SourceAdapter[]
  all(): SourceAdapter[]
}

export const registry = new SourceRegistry();
```

The ingest script calls `registry.all()` and runs every registered adapter. API routes never touch the registry.

---

## 8. Pipeline (`sources/pipeline.ts`)

Three discrete stages per adapter:

```
fetch()  →  validate()  →  normalize()
```

| Stage | Responsibility | On failure |
|-------|---------------|------------|
| `fetch` | HTTP request, handle pagination | Throw — ingest script catches, logs, skips adapter |
| `validate` | Check required fields are present and non-empty | Drop individual record, log `warn`, continue |
| `normalize` | Map source fields → `NormalizedIncident` | Should not fail after validation |

```ts
export async function runPipeline(
  adapter: SourceAdapter,
  options: FetchOptions
): Promise<NormalizedIncident[]>
```

---

## 9. Ingest script (`scripts/src/ingest.ts`)

```
pnpm ingest
```

Algorithm:

1. Read existing `data/incidents.json` (if present) to get current `externalId` set
2. For each registered adapter (skipping `seed`):
   a. Call `runPipeline(adapter, { since: lastIngestDate })`
   b. On error: log warning, continue to next adapter
3. Merge new records with existing, deduplicate by `externalId`
4. Write updated `StoredDataFile` to `data/incidents.json`
5. Print summary: records added, records skipped (duplicate), adapters failed

Supports `--full-refresh` flag to ignore existing data and fetch everything.
Supports `--layer crime` flag to ingest a single layer.

---

## 10. Loader (`loader.ts`)

Used by API routes. Never used by the ingest script.

```ts
export function loadIncidents(): RawIncident[]
```

1. Try to `readFileSync("data/incidents.json")`
2. If file missing or parse error → return `MIAMI_INCIDENTS` from `generate.ts`
3. Strip `sourceId`/`externalId` before returning — callers only see `RawIncident`

Loaded once per process start (module-level variable). No re-reads per request.

---

## 11. Field mappings

### miami-dade-311

| SODA field | NormalizedIncident field |
|------------|--------------------------|
| `case_number` | `externalId` |
| `issue_type` | `title` |
| `issue_description` | `description` |
| `date_created` | `date` |
| `status` | `status` |
| `full_address` | `address` |
| `latitude` / `longitude` | `lat` / `lon` |
| geo lookup via `neighborhoods.ts` | `neighborhood` |
| `"311"` (constant) | `type` |

### miami-pd-crime

| SODA field | NormalizedIncident field |
|------------|--------------------------|
| `case_number` | `externalId` |
| `offense` | `title` |
| `offense_description` | `description` |
| `date_occurred` | `date` |
| `disposition` | `status` |
| `address` | `address` |
| `latitude` / `longitude` | `lat` / `lon` |
| geo lookup | `neighborhood` |
| `"crime"` (constant) | `type` |

### miami-dade-permits

| SODA field | NormalizedIncident field |
|------------|--------------------------|
| `permit_number` | `externalId` |
| `work_type` | `title` |
| `work_description` | `description` |
| `issue_date` | `date` |
| `status` | `status` |
| `address` | `address` |
| `latitude` / `longitude` | `lat` / `lon` |
| geo lookup | `neighborhood` |
| `"permit"` (constant) | `type` |

---

## 12. Environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `SODA_APP_TOKEN` | No | — | Socrata rate-limit upgrade (ingest only) |
| `OPEN_DATA_TIMEOUT_MS` | No | `30000` | Per-request HTTP timeout during ingest |

No env vars needed at serve time. API routes just read a file.

---

## 13. Adding a new source (future contributor guide)

1. Create `lib/civic-data/src/sources/{sourceId}.ts`
2. Implement `SourceAdapter` — fill in `meta` and `fetch()`
3. Map source-specific fields to `NormalizedIncident` (see §11 for examples)
4. In `sources/index.ts`: `registry.register(new YourAdapter())`
5. Run `pnpm ingest --layer <layer>` to test it
6. Done — no API route code changes

---

## 14. Error handling

| Failure mode | Behavior |
|--------------|----------|
| Adapter HTTP timeout during ingest | Log warning, skip adapter, continue with others |
| Adapter HTTP 429 during ingest | Same as timeout |
| Adapter HTTP 5xx during ingest | Same as timeout |
| Record missing required field | Drop record, log `warn`, continue |
| `data/incidents.json` missing at serve time | Loader returns seed data |
| `data/incidents.json` corrupted | Loader returns seed data |

---

## 15. Testing strategy

- **Adapter unit tests** — recorded `.json` fixture per source, no network
- **Pipeline unit tests** — validate + normalize stages in isolation
- **Ingest script tests** — mock adapters, verify dedup logic and file output shape
- **Loader tests** — missing file → seed fallback, valid file → correct strip of provenance fields
- **API route tests** — unchanged; consume `RawIncident[]` regardless of source
- **No live API calls in CI**

---

## 16. Implementation phases

### Phase 1 — Scaffold + 311 adapter + ingest script 📐

- [ ] `sources/adapter.ts` — interfaces (`SourceAdapter`, `SourceMeta`, `FetchOptions`, `NormalizedIncident`)
- [ ] `types.ts` — add `StoredDataFile`
- [ ] `sources/registry.ts` — `SourceRegistry` class
- [ ] `sources/pipeline.ts` — `runPipeline()`
- [ ] `sources/seed.ts` — wraps `generate.ts` as a `SourceAdapter`
- [ ] `sources/miami311.ts` — first live adapter
- [ ] `sources/index.ts` — registers seed + miami311
- [ ] `loader.ts` — reads `data/incidents.json`, falls back to seed
- [ ] `scripts/src/ingest.ts` — ingest entry point
- [ ] Wire `loader.ts` into existing Express routes (replace direct `generate.ts` usage)
- [ ] `.env.example` updated with variables from §12
- [ ] `data/incidents.json` added to `.gitignore` (or committed after first ingest — decide)

### Phase 2 — Crime + Permits adapters

- [ ] `sources/miamiCrime.ts`
- [ ] `sources/miamiPermits.ts`
- [ ] Fixture snapshots for both

### Phase 3 — Water + NOAA

- [ ] `sources/water.ts` (composite: advisory feed + NOAA tide data)
- [ ] Flood risk scoring in `scoring.ts`

### Phase 4 — GitHub Actions ingest workflow

- [ ] `.github/workflows/ingest.yml` — `workflow_dispatch` trigger
- [ ] Runs `pnpm ingest`, commits updated `data/incidents.json`
- [ ] Vercel redeploys automatically on push (picks up new data at next cold start)

---

## 17. What does NOT change

- `RawIncident` interface and its field names
- All API route signatures and caching headers
- Frontend hooks and components
- Neighborhood list, scoring logic, and report builder (until Phase 3)
