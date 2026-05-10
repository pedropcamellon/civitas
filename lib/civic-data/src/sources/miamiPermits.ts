import type { SourceAdapter, FetchOptions, NormalizedIncident } from "./adapter.js";
import { NEIGHBORHOODS } from "../neighborhoods.js";

/** ArcGIS WHERE clause requires `timestamp 'YYYY-MM-DD HH:MM:SS'` format, not epoch ms. */
function toArcGISTimestamp(iso: string): string {
  return `timestamp '${iso.replace("T", " ").replace("Z", "").slice(0, 19)}'`;
}

// Miami-Dade Building Permits — single continuously-updated ArcGIS Feature Service.
// Date field ISSUDATE is stored as epoch milliseconds.
// Fields: ID, TYPE, DESC1, ISSUDATE, BPSTATUS, ADDRESS, geometry
const SERVICE_URL =
  "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/BuildingPermit_gdb/FeatureServer/0";

interface ArcGISPermitRecord {
  ID?: number;
  TYPE?: string;
  DESC1?: string;
  ISSUDATE?: number; // epoch ms
  BPSTATUS?: string;
  ADDRESS?: string;
  PROCNUM?: string;
}

interface ArcGISGeometry {
  x?: number;
  y?: number;
}

interface ArcGISPermitFeature {
  attributes: ArcGISPermitRecord;
  geometry?: ArcGISGeometry;
}

function nearestNeighborhood(lat: number, lon: number): string {
  let best = NEIGHBORHOODS[0];
  let bestD = Infinity;
  for (const nb of NEIGHBORHOODS) {
    const d = Math.sqrt((lat - nb.lat) ** 2 + (lon - nb.lon) ** 2);
    if (d < bestD) {
      bestD = d;
      best = nb;
    }
  }
  return best.name;
}

export class MiamiPermitsAdapter implements SourceAdapter {
  meta = {
    id: "miami-dade-permits",
    layer: "permit" as const,
    label: "Miami-Dade Building Permits",
    attribution: "Miami-Dade County Open Data Hub",
  };

  async fetch(options: FetchOptions): Promise<NormalizedIncident[]> {
    const timeout = parseInt(process.env.INGEST_TIMEOUT_MS ?? "30000", 10);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const signal = options.signal ?? controller.signal;

    try {
      const sinceIso = options.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sinceTs = toArcGISTimestamp(sinceIso);

      const params = new URLSearchParams({
        f: "json",
        where: `ISSUDATE >= ${sinceTs}`,
        outFields: "ID,TYPE,DESC1,ISSUDATE,BPSTATUS,ADDRESS,PROCNUM",
        orderByFields: "ISSUDATE DESC",
        resultRecordCount: "2000",
        returnGeometry: "true",
        outSR: "4326",
      });

      const res = await fetch(`${SERVICE_URL}/query?${params}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${this.meta.id}`);

      const data = await res.json() as { features?: ArcGISPermitFeature[] };

      return (data.features ?? []).flatMap((f) => {
        const r = f.attributes;
        const lon = f.geometry?.x;
        const lat = f.geometry?.y;
        const externalId = r.PROCNUM ?? String(r.ID ?? "");
        if (!externalId || lat == null || lon == null) return [];

        return [
          {
            id: externalId,
            externalId,
            sourceId: this.meta.id,
            type: "permit" as const,
            lat,
            lon,
            title: r.TYPE ?? "Building Permit",
            description: r.DESC1?.trim() ?? "",
            date: r.ISSUDATE ? new Date(r.ISSUDATE).toISOString() : new Date().toISOString(),
            status: r.BPSTATUS ?? "Issued",
            address: r.ADDRESS?.trim() ?? "",
            neighborhood: nearestNeighborhood(lat, lon),
          },
        ];
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

