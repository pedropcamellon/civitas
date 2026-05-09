import { useQuery } from "@tanstack/react-query";
import { CivicIncident, TimeFilter } from "@/context/MapContext";

function getDateCutoff(timeFilter: TimeFilter): string {
  const now = new Date();
  if (timeFilter === "24h") now.setHours(now.getHours() - 24);
  else if (timeFilter === "7d") now.setDate(now.getDate() - 7);
  else now.setDate(now.getDate() - 30);
  return now.toISOString();
}

function apiUrl(path: string): string {
  if (typeof process !== "undefined" && process.env?.EXPO_PUBLIC_DOMAIN) {
    return `https://${process.env.EXPO_PUBLIC_DOMAIN}/api${path}`;
  }
  return `/api${path}`;
}

interface RawIncident {
  id: string;
  type: "crime" | "311" | "permit";
  lat: number;
  lon: number;
  title: string;
  description: string;
  date: string;
  status: string;
  address: string;
}

function mapType(raw: RawIncident["type"]): CivicIncident["type"] {
  if (raw === "311") return "requests311";
  if (raw === "permit") return "permits";
  return "crime";
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
  };
}

async function fetchLayer(
  endpoint: string,
  timeFilter: TimeFilter
): Promise<CivicIncident[]> {
  const since = getDateCutoff(timeFilter);
  const url = apiUrl(`${endpoint}?since=${encodeURIComponent(since)}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = (await res.json()) as RawIncident[];
  return data.map(toCivicIncident);
}

export function use311Data(timeFilter: TimeFilter) {
  return useQuery({
    queryKey: ["311", timeFilter],
    queryFn: () => fetchLayer("/civic/311", timeFilter),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useCrimeData(timeFilter: TimeFilter) {
  return useQuery({
    queryKey: ["crime", timeFilter],
    queryFn: () => fetchLayer("/civic/crime", timeFilter),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function usePermitData(timeFilter: TimeFilter) {
  return useQuery({
    queryKey: ["permits", timeFilter],
    queryFn: () => fetchLayer("/civic/permits", timeFilter),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
