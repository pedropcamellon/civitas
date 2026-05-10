// ---------------------------------------------------------------------------
// Shared civic data & scoring logic — used by Express routes AND Vercel fns
// ---------------------------------------------------------------------------

export type { RawIncident, Neighborhood } from "./types.js";
export { NEIGHBORHOODS } from "./neighborhoods.js";
export { generate, MIAMI_INCIDENTS } from "./generate.js";
export { loadIncidents } from "./loader.js";
export {
  WATER_WEIGHTS,
  crimeLabel,
  waterGrade,
  waterLabel,
  filterByDate,
  buildNeighborhoodReport,
} from "./scoring.js";
