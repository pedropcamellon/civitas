import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RawIncident } from "./types.js";
import type { StoredDataFile } from "./sources/adapter.js";
import { MIAMI_INCIDENTS } from "./generate.js";

// Loaded once per process start. Subsequent calls return the cached value.
let cached: RawIncident[] | null = null;

export interface DataBounds {
  latestDate: string;   // ISO — most recent incident.date in the dataset
  earliestDate: string; // ISO — oldest incident.date in the dataset
  years: number[];      // sorted ascending list of years present in the data
  count: number;
}

/** Returns the temporal bounds of the loaded dataset so the UI can present
 *  only the years that actually have data. */
export function getDataBounds(): DataBounds {
  const incidents = loadIncidents();
  if (incidents.length === 0) {
    const now = new Date().toISOString();
    return { latestDate: now, earliestDate: now, years: [], count: 0 };
  }
  let min = Infinity;
  let max = -Infinity;
  const yearSet = new Set<number>();
  for (const i of incidents) {
    const t = new Date(i.date).getTime();
    if (t < min) min = t;
    if (t > max) max = t;
    yearSet.add(new Date(i.date).getFullYear());
  }
  return {
    latestDate: new Date(max).toISOString(),
    earliestDate: new Date(min).toISOString(),
    years: [...yearSet].sort(),
    count: incidents.length,
  };
}

// Returns the best available incidents:
//   1. data/incidents.json (populated by the ingest script)
//   2. Seed data from generate.ts (always valid, used until first ingest run)
export function loadIncidents(): RawIncident[] {
  if (cached !== null) return cached;

  const filePath = join(process.cwd(), "data", "incidents.json");
  try {
    const raw = readFileSync(filePath, "utf8");
    const file: StoredDataFile = JSON.parse(raw) as StoredDataFile;

    // Strip ingest-only provenance fields before returning to consumers.
    cached = file.incidents.map(({ sourceId: _s, externalId: _e, ...rest }) => rest);
    console.log(
      `[loader] ${cached.length} incidents from data/incidents.json (generated ${file.generatedAt.slice(0, 10)})`,
    );
    return cached;
  } catch {
    console.log("[loader] data/incidents.json not found — using seed data");
    cached = MIAMI_INCIDENTS;
    return cached;
  }
}
