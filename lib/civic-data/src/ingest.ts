import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { registry } from "./sources/index.js";
import { runPipeline } from "./sources/pipeline.js";
import type { IncidentLayer, NormalizedIncident, StoredDataFile } from "./sources/adapter.js";

export interface IngestOptions {
  outputPath: string;
  since?: string;
  layers?: IncidentLayer[];
  fullRefresh?: boolean;
}

export interface IngestResult {
  added: number;
  preserved: number;
  skippedSources: string[];
}

export async function runIngest(options: IngestOptions): Promise<IngestResult> {
  const { outputPath, fullRefresh = false } = options;
  const layers: IncidentLayer[] = options.layers ?? ["crime", "311", "permit", "water"];

  // Load existing records to preserve data from any source that fails this run.
  let existing: NormalizedIncident[] = [];
  if (!fullRefresh) {
    try {
      const raw = readFileSync(outputPath, "utf8");
      const stored: StoredDataFile = JSON.parse(raw) as StoredDataFile;
      existing = stored.incidents;
    } catch {
      // File doesn't exist yet — first run.
    }
  }

  // Index existing records by externalId for O(1) dedup lookup.
  const byExternalId = new Map(existing.map((i) => [i.externalId, i]));

  const skippedSources: string[] = [];
  const usedSourceIds = new Set<string>();
  let added = 0;

  for (const layer of layers) {
    const adapters = registry.getForLayer(layer);
    for (const adapter of adapters) {
      try {
        const records = await runPipeline(adapter, { since: options.since });
        for (const r of records) {
          if (!byExternalId.has(r.externalId)) {
            added++;
          }
          byExternalId.set(r.externalId, r);
        }
        usedSourceIds.add(adapter.meta.id);
        console.log(`  [${adapter.meta.id}] ${records.length} records`);
      } catch (err) {
        skippedSources.push(adapter.meta.id);
        console.warn(`  [${adapter.meta.id}] FAILED — ${(err as Error).message}`);
      }
    }
  }

  const merged = Array.from(byExternalId.values());
  const file: StoredDataFile = {
    generatedAt: new Date().toISOString(),
    sources: [...usedSourceIds],
    incidents: merged,
  };

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(file, null, 2), "utf8");

  return { added, preserved: existing.length, skippedSources };
}
