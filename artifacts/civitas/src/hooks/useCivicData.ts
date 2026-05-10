import { useQuery } from "@tanstack/react-query";
import type { CivicIncident, NeighborhoodReport, TimeFilter } from "@/context/MapContext";

interface RawIncident {
  id: string;
  type: "crime" | "311" | "permit" | "water";
  lat: number;
  lon: number;
  title: string;
  description: string;
  date: string;
  status: string;
  address: string;
  neighborhood: string;
}

function mapType(raw: RawIncident["type"]): CivicIncident["type"] {
  if (raw === "311") return "requests311";
  if (raw === "permit") return "permits";
  return raw;
}

function toCivicIncident(r: RawIncident): CivicIncident {
  return {
    id: r.id,
    type: mapType(r.type),
    lat: r.lat,
    lon: r.lon,
    title: r.title,
    description: r.description,
    date: r.date,
    status: r.status,
    address: r.address,
    neighborhood: r.neighborhood,
  };
}

async function fetchLayer(endpoint: string, timeFilter: TimeFilter): Promise<CivicIncident[]> {
  const params = timeFilter ? `?year=${encodeURIComponent(timeFilter)}` : "";
  const res = await fetch(`/api${endpoint}${params}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = (await res.json()) as RawIncident[];
  return data.map(toCivicIncident);
}

export interface DataMeta {
  latestDate: string;
  earliestDate: string;
  years: number[];
  count: number;
}

export function useDataMeta() {
  return useQuery<DataMeta>({
    queryKey: ["civic-meta"],
    queryFn: async () => {
      const res = await fetch("/api/civic/meta");
      if (!res.ok) throw new Error(`Meta API error ${res.status}`);
      return res.json() as Promise<DataMeta>;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function use311Data(timeFilter: TimeFilter, enabled = true) {
  return useQuery({
    queryKey: ["311", timeFilter],
    queryFn: () => fetchLayer("/civic/311", timeFilter),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled,
  });
}

export function useCrimeData(timeFilter: TimeFilter, enabled = true) {
  return useQuery({
    queryKey: ["crime", timeFilter],
    queryFn: () => fetchLayer("/civic/crime", timeFilter),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled,
  });
}

export function usePermitData(timeFilter: TimeFilter, enabled = true) {
  return useQuery({
    queryKey: ["permits", timeFilter],
    queryFn: () => fetchLayer("/civic/permits", timeFilter),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled,
  });
}

export function useWaterData(timeFilter: TimeFilter, enabled = true) {
  return useQuery({
    queryKey: ["water", timeFilter],
    queryFn: () => fetchLayer("/civic/water", timeFilter),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    enabled,
  });
}

export function useNeighborhoodReport(lat: number | null, lon: number | null, enabled = true) {
  return useQuery<NeighborhoodReport>({
    queryKey: ["neighborhood-report", lat, lon],
    queryFn: async () => {
      const res = await fetch(`/api/neighborhood/report?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(`Neighborhood API error ${res.status}`);
      return res.json() as Promise<NeighborhoodReport>;
    },
    enabled: enabled && lat !== null && lon !== null,
    staleTime: 0,
    retry: 1,
  });
}
