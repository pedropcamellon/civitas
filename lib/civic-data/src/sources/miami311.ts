import type { SourceAdapter, FetchOptions, NormalizedIncident } from "./adapter.js";
import { NEIGHBORHOODS } from "../neighborhoods.js";

// Miami-Dade 311 data lives in per-year ArcGIS Feature Services.
// Public access is available for 2023 and earlier; newer years require an ArcGIS token.
// We query the most recent public year. The service covers all of 2023.
//
// NOTE: Because this is the 2023 service, the `since` date filter is respected but
// will return 0 results for dates after Dec 2023. The ingest script handles this
// gracefully (preserves existing records from the last run).
const BASE = "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services";
const SERVICE_URL = `${BASE}/data_311_2023/FeatureServer/0`;

// ArcGIS date field format for WHERE clauses: timestamp 'YYYY-MM-DD HH:MM:SS'
function toArcGISTimestamp(isoOrEpoch: string | number): string {
  const d = typeof isoOrEpoch === "number" ? new Date(isoOrEpoch) : new Date(isoOrEpoch);
  return `timestamp '${d.toISOString().replace("T", " ").slice(0, 19)}'`;
}

interface ArcGIS311Record {
  ticket_id?: string;
  issue_type?: string;
  issue_description?: string | null;
  ticket_created_date_time?: number; // epoch ms
  ticket_status?: string;
  street_address?: string;
  latitude?: number;
  longitude?: number;
}

interface ArcGIS311Response {
  features?: { attributes: ArcGIS311Record }[];
  exceededTransferLimit?: boolean;
  error?: { message: string };
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

async function fetchPage(
  where: string,
  offset: number,
  signal: AbortSignal,
): Promise<ArcGIS311Response> {
  const params = new URLSearchParams({
    f: "json",
    where,
    outFields:
      "ticket_id,issue_type,issue_description,ticket_created_date_time,ticket_status,street_address,latitude,longitude",
    orderByFields: "ticket_created_date_time DESC",
    resultRecordCount: "2000",
    resultOffset: String(offset),
  });
  const res = await fetch(`${SERVICE_URL}/query?${params}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} from miami-dade-311`);
  return res.json() as Promise<ArcGIS311Response>;
}

export class Miami311Adapter implements SourceAdapter {
  meta = {
    id: "miami-dade-311",
    layer: "311" as const,
    label: "Miami-Dade 311 Service Requests (2023)",
    attribution: "Miami-Dade County Open Data Hub",
  };

  async fetch(options: FetchOptions): Promise<NormalizedIncident[]> {
    const timeout = parseInt(process.env.INGEST_TIMEOUT_MS ?? "30000", 10);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const signal = options.signal ?? controller.signal;

    try {
      const where = options.since
        ? `ticket_created_date_time >= ${toArcGISTimestamp(options.since)}`
        : "1=1";

      const results: NormalizedIncident[] = [];
      let offset = 0;

      while (true) {
        const page = await fetchPage(where, offset, signal);
        if (page.error) throw new Error(page.error.message);

        const features = page.features ?? [];
        for (const { attributes: r } of features) {
          const lat = r.latitude;
          const lon = r.longitude;
          const externalId = r.ticket_id ?? "";
          if (!externalId || lat == null || lon == null) continue;

          results.push({
            id: externalId,
            externalId,
            sourceId: this.meta.id,
            type: "311" as const,
            lat,
            lon,
            title: r.issue_type ?? "Service Request",
            description: r.issue_description ?? "",
            date: r.ticket_created_date_time
              ? new Date(r.ticket_created_date_time).toISOString()
              : new Date().toISOString(),
            status: r.ticket_status ?? "Open",
            address: r.street_address ?? "",
            neighborhood: nearestNeighborhood(lat, lon),
          });
        }

        if (!page.exceededTransferLimit || features.length === 0) break;
        offset += features.length;
      }

      return results;
    } finally {
      clearTimeout(timer);
    }
  }
}

