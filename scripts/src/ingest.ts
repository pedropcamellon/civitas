import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { runIngest } from "@workspace/civic-data/ingest";
import type { IncidentLayer } from "@workspace/civic-data/sources";

// Resolve output relative to the repo root, regardless of which directory
// pnpm was invoked from.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUTPUT = join(REPO_ROOT, "data", "incidents.json");

const SINCE_DAYS = parseInt(process.env.INGEST_SINCE_DAYS ?? "30", 10);
const since = new Date(Date.now() - SINCE_DAYS * 24 * 60 * 60 * 1000).toISOString();

const args = process.argv.slice(2);
const fullRefresh = args.includes("--full-refresh");
const layerFlag = args.find((a) => a.startsWith("--layer="))?.split("=")[1] as
  | IncidentLayer
  | undefined;

console.log(`Civitas ingest`);
console.log(`  since:   ${since.slice(0, 10)} (${SINCE_DAYS} days)`);
console.log(`  output:  ${OUTPUT}`);
if (fullRefresh) console.log(`  mode:    full refresh`);
if (layerFlag) console.log(`  layer:   ${layerFlag}`);
console.log();

const result = await runIngest({
  outputPath: OUTPUT,
  since,
  fullRefresh,
  layers: layerFlag ? [layerFlag] : undefined,
});

console.log(`Done`);
console.log(`  Added:     ${result.added}`);
console.log(`  Preserved: ${result.preserved}`);
if (result.skippedSources.length > 0) {
  console.warn(`  Failed:    ${result.skippedSources.join(", ")}`);
  process.exit(1);
}
