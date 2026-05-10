import type { RawIncident } from "./types.js";
import { NEIGHBORHOODS } from "./neighborhoods.js";
import { MIAMI_INCIDENTS } from "./generate.js";

// ── Scoring weights ───────────────────────────────────────────────────────

export const WATER_WEIGHTS: Record<string, number> = {
  "Lead Test — Failed":    30,
  "Contamination Notice":  30,
  "Boil Water Advisory":   20,
  "Water Main Break":      12,
  "Pressure Test Failure":  8,
  "Discolored Water":       8,
  "Service Interruption":   5,
  "Low Water Pressure":     4,
};

// ── Label helpers ─────────────────────────────────────────────────────────

export function crimeLabel(score: number): { label: string; color: string } {
  if (score <= 25) return { label: "Low",      color: "#32D74B" };
  if (score <= 55) return { label: "Moderate", color: "#FFD60A" };
  return                   { label: "High",    color: "#FF453A" };
}

export function waterGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

export function waterLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Excellent", color: "#32D74B" };
  if (score >= 75) return { label: "Good",      color: "#4FC3F7" };
  if (score >= 60) return { label: "Fair",      color: "#FFD60A" };
  if (score >= 45) return { label: "Poor",      color: "#FF9500" };
  return                   { label: "Critical", color: "#FF453A" };
}

// ── Date filter ───────────────────────────────────────────────────────────

export function filterByDate(incidents: RawIncident[], since?: string): RawIncident[] {
  if (!since) return incidents;
  const cutoff = new Date(since).getTime();
  if (isNaN(cutoff)) return incidents;
  return incidents.filter((i) => new Date(i.date).getTime() >= cutoff);
}

// ── Geo helpers ───────────────────────────────────────────────────────────

function dist(lat1: number, lon1: number, lat2: number, lon2: number): number {
  return Math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2);
}

function nearestNeighborhood(lat: number, lon: number) {
  let best = NEIGHBORHOODS[0];
  let bestD = Infinity;
  for (const nb of NEIGHBORHOODS) {
    const d = dist(lat, lon, nb.lat, nb.lon);
    if (d < bestD) { bestD = d; best = nb; }
  }
  return best;
}

// ── Report builder ────────────────────────────────────────────────────────

const RADIUS = 0.014;

export function buildNeighborhoodReport(
  lat: number,
  lon: number,
  incidents: RawIncident[] = MIAMI_INCIDENTS,
) {
  const nb = nearestNeighborhood(lat, lon);

  const nbIncidents = incidents.filter(
    (i) => i.neighborhood === nb.name || dist(lat, lon, i.lat, i.lon) <= RADIUS * 2,
  );

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recent = nbIncidents.filter((i) => new Date(i.date) >= since30d);

  const crimeItems = recent.filter((i) => i.type === "crime");
  const waterItems = recent.filter((i) => i.type === "water");
  const open311    = recent.filter((i) => i.type === "311" && i.status !== "Closed");
  const permits    = recent.filter((i) => i.type === "permit");

  const crimeScore = Math.min(100, crimeItems.length * 7);
  const crime = crimeLabel(crimeScore);

  let waterPenalty = 0;
  for (const w of waterItems) waterPenalty += WATER_WEIGHTS[w.title] ?? 5;
  const wScore = Math.max(0, 100 - waterPenalty);
  const water = waterLabel(wScore);
  const activeAdvisory = waterItems.find(
    (w) => w.title === "Boil Water Advisory" || w.title === "Contamination Notice",
  );

  const crimeCounts: Record<string, number> = {};
  for (const c of crimeItems) crimeCounts[c.title] = (crimeCounts[c.title] ?? 0) + 1;
  const topCrimeTypes = Object.entries(crimeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([title, count]) => ({ title, count }));

  return {
    neighborhood: nb.name,
    lat: nb.lat,
    lon: nb.lon,
    crimeCount:      crimeItems.length,
    crimeScore,
    crimeLabel:      crime.label,
    crimeColor:      crime.color,
    waterScore:      wScore,
    waterGrade:      waterGrade(wScore),
    waterLabel:      water.label,
    waterColor:      water.color,
    waterIncidents:  waterItems.length,
    waterAdvisory:   activeAdvisory?.title ?? null,
    requests311Count: open311.length,
    permitsCount:    permits.length,
    topCrimeTypes,
    lastUpdated:     new Date().toISOString(),
  };
}
