import type { SourceAdapter, FetchOptions, NormalizedIncident } from "./adapter.js";
import { NEIGHBORHOODS } from "../neighborhoods.js";

/** ArcGIS WHERE clause requires `timestamp 'YYYY-MM-DD HH:MM:SS'` format, not epoch ms. */
function toArcGISTimestamp(iso: string): string {
  return `timestamp '${iso.replace("T", " ").replace("Z", "").slice(0, 19)}'`;
}

// NOTE: Miami-Dade does NOT publish a queryable crime incident feed in their open data portal.
// The closest available data is the Jail Bookings dataset (May 2015 to current),
// which covers arrests and bookings — not all reported crimes.
// CrimeMapping.com (crimemapping.com/map/fl/miami-dadecounty) exists but has no public API.
//
// This adapter uses the Jail Bookings Feature Service as the crime proxy until
// a dedicated crime incident feed becomes available.
const SERVICE_URL =
  "https://services.arcgis.com/8Pc9XBTAsYuxx9Ny/arcgis/rest/services/miamidade_jail_data/FeatureServer/0";

interface ArcGISJailRecord {
  ObjectId?: number;
  arrest_date?: number;  // epoch ms
  charge_description?: string;
  charge_type?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  booking_number?: string;
  arrest_disposition?: string | null;
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

export class MiamiCrimeAdapter implements SourceAdapter {
  meta = {
    id: "miami-dade-jail-bookings",
    layer: "crime" as const,
    label: "Miami-Dade Jail Bookings (crime proxy)",
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
        where: `arrest_date >= ${sinceTs}`,
        // Note: field `arrest_date` is of type esriFieldTypeDate (epoch ms internally),
        // but WHERE clauses require the `timestamp '...'` string format.
        outFields: "*",
        orderByFields: "arrest_date DESC",
        resultRecordCount: "2000",
        returnGeometry: "false",
      });

      const res = await fetch(`${SERVICE_URL}/query?${params}`, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${this.meta.id}`);

      const data = await res.json() as {
        features?: { attributes: ArcGISJailRecord }[];
        error?: { message: string };
      };

      if (data.error) throw new Error(data.error.message);

      return (data.features ?? []).flatMap((f) => {
        const r = f.attributes;
        const externalId = r.booking_number ?? String(r.ObjectId ?? "");
        if (!externalId) return [];

        // Jail booking data rarely has coordinates — use nearest neighborhood centroid
        const lat = r.latitude ?? NEIGHBORHOODS[0].lat;
        const lon = r.longitude ?? NEIGHBORHOODS[0].lon;

        return [
          {
            id: externalId,
            externalId,
            sourceId: this.meta.id,
            type: "crime" as const,
            lat,
            lon,
            title: r.charge_description ?? "Arrest",
            description: r.charge_type ?? "",
            date: r.arrest_date
              ? new Date(r.arrest_date).toISOString()
              : new Date().toISOString(),
            status: r.arrest_disposition ?? "Booked",
            address: r.address ?? "",
            neighborhood: nearestNeighborhood(lat, lon),
          },
        ];
      });
    } finally {
      clearTimeout(timer);
    }
  }
}

