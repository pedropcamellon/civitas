---
layout: default
title: Open Data Ingest
nav_order: 4
---

# Open Data — Ingest

Civitas **never fetches from external APIs during a user session**. Instead, data is pulled from Miami-Dade open data sources on demand, normalized, and written to `data/incidents.json`. The app always reads from that stored file, filtered by the year the user selects.

```
 ┌──────────────────┐    pnpm ingest     ┌────────────────────┐     always
 │  ArcGIS Feature  │ ──── on demand ──▶ │ data/incidents.json │ ──── served ──▶ map
 │  Services (MDC)  │                    │ (flat file, git)    │
 └──────────────────┘                    └────────────────────┘
```

---

## Portal: ArcGIS Hub

Miami-Dade migrated from Socrata to **ArcGIS Hub** — `opendata.miamidade.gov` now
redirects to an ArcGIS Hub instance. All datasets are **ArcGIS Feature Services**,
not Socrata SODA endpoints.

**ArcGIS REST query pattern:**
```
GET {serviceUrl}/FeatureServer/{layerId}/query
  ?f=json
  &where={SQL expression}
  &outFields={comma-separated fields}
  &orderByFields={field} DESC
  &resultRecordCount=2000
  &resultOffset={n}
  &returnGeometry=true
  &outSR=4326
```

Pagination uses `resultRecordCount` + `resultOffset`. Response includes
`exceededTransferLimit: true` when more pages exist.

---

## Data sources

| ID                         | Layer    | Service URL                                  | Public?            | Status      |
| -------------------------- | -------- | -------------------------------------------- | ------------------ | ----------- |
| `miami-dade-311`           | `311`    | `…/data_311_2023/FeatureServer/0`            | ✅ 2023 and earlier | ✅ Done      |
| `miami-dade-jail-bookings` | `crime`  | `…/miamidade_jail_data/FeatureServer/0`      | ✅ May 2015–present | ✅ Done      |
| `miami-dade-permits`       | `permit` | `…/BuildingPermit_gdb/FeatureServer/0`       | ✅ 2003–present     | ✅ Done      |
| `miami-water`              | `water`  | Water & Sewer dept — no public API found yet | ❌                  | 📐 Specified |
| `seed`                     | all      | `lib/civic-data/src/generate.ts`             | —                  | ✅ Done      |

### Important caveats

- **311**: Data is split into per-year Feature Services. The 2024+ services require an ArcGIS token (HTTP 499). The 2023 service is fully public. Ingest queries 2023 until a public 2024+ feed is available.
- **Crime**: Miami-Dade does NOT publish a crime incident feed. `CrimeMapping.com` lists incidents but has no public API. Jail bookings is the closest proxy — covers arrests, not all reported crimes.
- **Permits**: `BuildingPermit_gdb` is a single live service (2003–present). Date field `ISSUDATE` is epoch milliseconds. Geometry is returned in WGS84 (`outSR=4326`).
- **Water**: Water & Sewer dept page exists on the portal but no advisory API was found.

---

## Field mappings

### miami-dade-311 (ArcGIS `data_311_2023`)

| ArcGIS field                          | RawIncident field  |
| ------------------------------------- | ------------------ |
| `ticket_id`                           | `id`, `externalId` |
| `issue_type`                          | `title`            |
| `issue_description`                   | `description`      |
| `ticket_created_date_time` (epoch ms) | `date`             |
| `ticket_status`                       | `status`           |
| `street_address`                      | `address`          |
| `latitude` / `longitude`              | `lat` / `lon`      |
| geo lookup                            | `neighborhood`     |

### miami-dade-jail-bookings (crime proxy)

| ArcGIS field                          | RawIncident field                                           |
| ------------------------------------- | ----------------------------------------------------------- |
| `booking_number`                      | `id`, `externalId`                                          |
| `charge_description`                  | `title`                                                     |
| `charge_type`                         | `description`                                               |
| `arrest_date` (epoch ms)              | `date`                                                      |
| `arrest_disposition`                  | `status`                                                    |
| `address`                             | `address`                                                   |
| `latitude` / `longitude` (often null) | `lat` / `lon` (falls back to nearest neighborhood centroid) |
| geo lookup                            | `neighborhood`                                              |

### miami-dade-permits (ArcGIS `BuildingPermit_gdb`)

| ArcGIS field          | RawIncident field  |
| --------------------- | ------------------ |
| `PROCNUM`             | `id`, `externalId` |
| `TYPE`                | `title`            |
| `DESC1`               | `description`      |
| `ISSUDATE` (epoch ms) | `date`             |
| `BPSTATUS`            | `status`           |
| `ADDRESS`             | `address`          |
| geometry x/y (WGS84)  | `lat` / `lon`      |
| geo lookup            | `neighborhood`     |

---

## 4. Serving ingested data

API routes read `data/incidents.json` via `loadIncidents()` at process start — no network calls.

**Year filter** (preferred): pass `?year=2023` — the server returns only incidents whose `date` falls in that calendar year.  
**Date range filter** (legacy): pass `?since=ISO` for a lower-bound cutoff.

```
GET /api/civic/meta          → { years: [2023, 2024], latestDate, earliestDate, count }
GET /api/civic/311?year=2023 → RawIncident[]
GET /api/civic/crime?year=2023
GET /api/civic/permits?year=2023
```

`loadIncidents()` caches in memory for the process lifetime. Falls back to seed data if the file is missing or corrupt.

The **TimelineBar** component calls `/api/civic/meta` on mount to get the `years` array, then renders one button per year. It defaults to the most recent year with data.

---

## 5. Running ingest

```sh
# All layers, last 30 days
pnpm --filter @workspace/scripts run ingest

# Single layer
pnpm --filter @workspace/scripts run ingest --layer=311

# Full refresh (ignore existing data/incidents.json)
pnpm --filter @workspace/scripts run ingest --full-refresh

# Pull historical data (e.g. all of 2023)
INGEST_SINCE_DAYS=900 pnpm --filter @workspace/scripts run ingest --layer=311
```

> **Data availability note**: The public 311 service (`data_311_2023`) covers Jan–Dec 2023.
> Querying with a recent `since` date returns 0 records. Use `INGEST_SINCE_DAYS=900` to
> reach 2023 data. The year selector in the UI shows only years that are actually present
> in `data/incidents.json` — no empty states.

---

## Environment variables (ingest only)

| Variable            | Required | Default | Purpose                    |
| ------------------- | -------- | ------- | -------------------------- |
| `INGEST_SINCE_DAYS` | No       | `30`    | How many days back to pull |
| `INGEST_TIMEOUT_MS` | No       | `30000` | Per-source HTTP timeout    |

`SODA_APP_TOKEN` is no longer relevant — the portal is ArcGIS, not Socrata.

---

## Error handling

| Failure mode                  | Behavior                                              |
| ----------------------------- | ----------------------------------------------------- |
| ArcGIS service error          | Skip source, preserve existing records for that layer |
| Adapter timeout               | Skip source, log warning                              |
| Record missing required field | Drop record, log warning, continue                    |
| All sources fail              | Write nothing — existing file preserved               |
| Ingest never ran              | `loadIncidents()` returns seed data                   |
| `data/incidents.json` corrupt | `loadIncidents()` returns seed data                   |

---

## Open gaps

| Gap                 | Notes                                                                          |
| ------------------- | ------------------------------------------------------------------------------ |
| Crime incident feed | MDPD does not publish one. Jail bookings is the only proxy.                    |
| 2024+ 311 data      | Requires ArcGIS token (HTTP 499 without it). Monitor MDC open data.            |
| Water advisories    | No public API found. May require FOIA or manual check with Water & Sewer dept. |

