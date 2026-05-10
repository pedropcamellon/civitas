import type { SourceAdapter, FetchOptions, NormalizedIncident } from "./adapter.js";
import { NEIGHBORHOODS } from "../neighborhoods.js";

const ENDPOINT = "https://opendata.miamidade.gov/resource/dj6j-qg5t.json";

interface Soda311Record {
  case_number?: string;
  issue_type?: string;
  issue_description?: string;
  date_created?: string;
  status?: string;
  full_address?: string;
  latitude?: string;
  longitude?: string;
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

export class Miami311Adapter implements SourceAdapter {
  meta = {
    id: "miami-dade-311",
    layer: "311" as const,
    label: "Miami-Dade 311",
    attribution: "Miami-Dade County Open Data",
  };

  async fetch(options: FetchOptions): Promise<NormalizedIncident[]> {
    const timeout = parseInt(process.env.INGEST_TIMEOUT_MS ?? "30000", 10);
    const limit = options.limit ?? 1000;

    const params = new URLSearchParams({
      $limit: String(limit),
      $order: "date_created DESC",
    });
    if (options.since) {
      params.set("$where", `date_created > '${options.since}'`);
    }

    const headers: Record<string, string> = {};
    const appToken = process.env.SODA_APP_TOKEN;
    if (appToken) headers["X-App-Token"] = appToken;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${ENDPOINT}?${params}`, {
        headers,
        signal: options.signal ?? controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} from ${this.meta.id}`);

      const records: Soda311Record[] = await res.json() as Soda311Record[];

      return records.flatMap((r) => {
        const lat = parseFloat(r.latitude ?? "");
        const lon = parseFloat(r.longitude ?? "");
        const externalId = r.case_number ?? "";
        if (!externalId || isNaN(lat) || isNaN(lon)) return [];

        return [
          {
            id: externalId,
            externalId,
            sourceId: this.meta.id,
            type: "311" as const,
            lat,
            lon,
            title: r.issue_type ?? "Service Request",
            description: r.issue_description ?? "",
            date: r.date_created ?? new Date().toISOString(),
            status: r.status ?? "Open",
            address: r.full_address ?? "",
            neighborhood: nearestNeighborhood(lat, lon),
          },
        ];
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
