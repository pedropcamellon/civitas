import type { RawIncident } from "../types.js";

export type IncidentLayer = "crime" | "311" | "permit" | "water";

export interface SourceMeta {
  id: string;
  layer: IncidentLayer;
  label: string;
  attribution: string;
}

export interface FetchOptions {
  since?: string;       // ISO timestamp — only fetch records after this date
  limit?: number;       // max records per page, default 1000
  signal?: AbortSignal;
}

// Every source adapter implements this interface.
// fetch() returns normalized records or throws on unrecoverable error.
export interface SourceAdapter {
  meta: SourceMeta;
  fetch(options: FetchOptions): Promise<NormalizedIncident[]>;
}

// RawIncident + ingest-time provenance.
// Written to data/incidents.json; stripped back to RawIncident before serving.
export interface NormalizedIncident extends RawIncident {
  sourceId: string;    // adapter meta.id, e.g. "miami-dade-311"
  externalId: string;  // original record ID from the source system
}

// Shape of data/incidents.json
export interface StoredDataFile {
  generatedAt: string;          // ISO timestamp of the ingest run
  sources: string[];            // adapter IDs that contributed records
  incidents: NormalizedIncident[];
}
