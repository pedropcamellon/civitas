import { useEffect, useRef, useState } from "react";
import type { Incident } from "./types";

const API_BASE = "/api";

function buildUrl(path: string, simCutoffIso: string): string {
  return `${API_BASE}${path}?since=${encodeURIComponent(simCutoffIso)}`;
}

export function useAllIncidents(simCutoffIso: string) {
  const [crime, setCrime] = useState<Incident[]>([]);
  const [requests311, setRequests311] = useState<Incident[]>([]);
  const [permits, setPermits] = useState<Incident[]>([]);
  const [water, setWater] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  useEffect(() => {
    const current = ++seq.current;
    setLoading(true);

    const toIncident = (raw: Record<string, unknown>): Incident => ({
      id: String(raw.id ?? ""),
      type: raw.type as Incident["type"],
      lat: Number(raw.lat),
      lon: Number(raw.lon),
      title: String(raw.title ?? ""),
      description: String(raw.description ?? ""),
      date: String(raw.date ?? ""),
      status: String(raw.status ?? ""),
      address: String(raw.address ?? ""),
      neighborhood: String(raw.neighborhood ?? ""),
    });

    Promise.all([
      fetch(buildUrl("/civic/crime", simCutoffIso)).then((r) => r.json()),
      fetch(buildUrl("/civic/311", simCutoffIso)).then((r) => r.json()),
      fetch(buildUrl("/civic/permits", simCutoffIso)).then((r) => r.json()),
      fetch(buildUrl("/civic/water", simCutoffIso)).then((r) => r.json()),
    ]).then(([c, r, p, w]) => {
      if (seq.current !== current) return;
      setCrime((c as Record<string, unknown>[]).map(toIncident));
      setRequests311((r as Record<string, unknown>[]).map(toIncident));
      setPermits((p as Record<string, unknown>[]).map(toIncident));
      setWater((w as Record<string, unknown>[]).map(toIncident));
      setLoading(false);
    }).catch(() => {
      if (seq.current !== current) return;
      setLoading(false);
    });
  }, [simCutoffIso]);

  return { crime, requests311, permits, water, loading, refresh: () => { seq.current++; } };
}

export function useNeighborhoodReport(lat: number | null, lon: number | null) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    if (lat === null || lon === null) return;
    const current = ++seq.current;
    setLoading(true);
    fetch(`${API_BASE}/neighborhood/report?lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((d) => { if (seq.current === current) { setData(d as Record<string, unknown>); setLoading(false); } })
      .catch(() => { if (seq.current === current) setLoading(false); });
  }, [lat, lon]);

  return { data, loading, refresh: () => { seq.current++; } };
}
