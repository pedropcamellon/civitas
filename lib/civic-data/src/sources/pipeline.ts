import type { SourceAdapter, FetchOptions, NormalizedIncident } from "./adapter.js";

// Runs an adapter's fetch and validates each record.
// Throws if the adapter throws — caller (ingest script) decides whether to skip.
// Drops invalid individual records with a warning rather than aborting the run.
export async function runPipeline(
  adapter: SourceAdapter,
  options: FetchOptions,
): Promise<NormalizedIncident[]> {
  const records = await adapter.fetch(options);
  const valid: NormalizedIncident[] = [];

  for (const record of records) {
    if (isValid(record)) {
      valid.push(record);
    } else {
      console.warn(
        `[pipeline][${adapter.meta.id}] dropping record with missing fields: externalId=${record.externalId}`,
      );
    }
  }

  return valid;
}

function isValid(r: NormalizedIncident): boolean {
  return (
    typeof r.id === "string" &&
    r.id.length > 0 &&
    typeof r.externalId === "string" &&
    r.externalId.length > 0 &&
    typeof r.lat === "number" &&
    !isNaN(r.lat) &&
    typeof r.lon === "number" &&
    !isNaN(r.lon) &&
    typeof r.title === "string" &&
    r.title.length > 0 &&
    typeof r.date === "string" &&
    r.date.length > 0
  );
}
