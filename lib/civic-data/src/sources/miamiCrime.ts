import type { SourceAdapter, FetchOptions, NormalizedIncident } from "./adapter.js";
import { NEIGHBORHOODS } from "../neighborhoods.js";

const ENDPOINT = "https://opendata.miamidade.gov/resource/ghx4-s5qi.json";

interface SodaCrimeRecord {
  case_number?: string;
  offense?: string;
  offense_description?: string;
  date_occurred?: string;
  disposition?: string;
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

export class MiamiCrimeAdapter implements SourceAdapter {
  meta = {
    id: "miami-pd-crime",
    layer: "crime" as const,
    label: "Miami PD Crime Incidents",
    attribution: "Miami-Dade County Open Data",
  };

  async fetch(options: FetchOptions): Promise<NormalizedIncident[]> {
    const timeout = parseInt(process.env.INGEST_TIMEOUT_MS ?? "30000", 10);
    const limit = options.limit ?? 1000;

    const params = new URLSearchParams({
      $limit: String(limit),
      $order: "date_occurred DESC",
    });
    if (options.since) {
      params.set("$where", `date_occurred > '${options.since}'`);
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

      const records: SodaCrimeRecord[] = await res.json() as SodaCrimeRecord[];

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
            type: "crime" as const,
            lat,
            lon,
            title: r.offense ?? "Crime Incident",
            description: r.offense_description ?? "",
            date: r.date_occurred ?? new Date().toISOString(),
            status: r.disposition ?? "Under Investigation",
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
