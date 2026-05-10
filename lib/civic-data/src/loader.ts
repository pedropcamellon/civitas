import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { RawIncident } from "./types.js";
import type { StoredDataFile } from "./sources/adapter.js";
import { MIAMI_INCIDENTS } from "./generate.js";

// Loaded once per process start. Subsequent calls return the cached value.
let cached: RawIncident[] | null = null;

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
