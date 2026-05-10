// Registers all live source adapters.
// Import this module to populate the registry before calling runIngest().
import { registry } from "./registry.js";
import { Miami311Adapter } from "./miami311.js";
import { MiamiCrimeAdapter } from "./miamiCrime.js";
import { MiamiPermitsAdapter } from "./miamiPermits.js";

registry.register(new Miami311Adapter());
registry.register(new MiamiCrimeAdapter());
registry.register(new MiamiPermitsAdapter());

export { registry };
export type { SourceAdapter, SourceMeta, FetchOptions, NormalizedIncident, StoredDataFile, IncidentLayer } from "./adapter.js";
