import type { SourceAdapter, FetchOptions, NormalizedIncident } from "./adapter.js";
import { NEIGHBORHOODS } from "../neighborhoods.js";

const ENDPOINT = "https://opendata.miamidade.gov/resource/mxhq-a7mw.json";

interface SodaPermitRecord {
  permit_number?: string;
  work_type?: string;
  work_description?: string;
  issue_date?: string;
  status?: string;
  address?: string;
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

export class MiamiPermitsAdapter implements SourceAdapter {
  meta = {
    id: "miami-dade-permits",
    layer: "permit" as const,
    label: "Miami-Dade Building Permits",
    attribution: "Miami-Dade County Open Data",
  };

  async fetch(options: FetchOptions): Promise<NormalizedIncident[]> {
    const timeout = parseInt(process.env.INGEST_TIMEOUT_MS ?? "30000", 10);
    const limit = options.limit ?? 1000;

    const params = new URLSearchParams({
      $limit: String(limit),
      $order: "issue_date DESC",
    });
    if (options.since) {
      params.set("$where", `issue_date > '${options.since}'`);
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

      const records: SodaPermitRecord[] = await res.json() as SodaPermitRecord[];

      return records.flatMap((r) => {
        const lat = parseFloat(r.latitude ?? "");
        const lon = parseFloat(r.longitude ?? "");
        const externalId = r.permit_number ?? "";
        if (!externalId || isNaN(lat) || isNaN(lon)) return [];

        return [
          {
            id: externalId,
            externalId,
            sourceId: this.meta.id,
            type: "permit" as const,
            lat,
            lon,
            title: r.work_type ?? "Building Permit",
            description: r.work_description ?? "",
            date: r.issue_date ?? new Date().toISOString(),
            status: r.status ?? "Issued",
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
