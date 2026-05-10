import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Layers3,
  LocateFixed,
  MoonStar,
  RefreshCw,
  SunMedium,
  Waves,
  Package,
  ShieldAlert,
  Building2,
  Droplets,
  Truck,
  Play,
  Pause,
} from "lucide-react";

const API_BASE = "/api";

type ThemeName = "dark" | "light" | "neon";
type LayerKey = "crime" | "requests311" | "permits" | "water" | "cargo";
type TimeFilter = "24h" | "7d" | "30d";

type Incident = {
  id: string;
  type: LayerKey;
  lat: number;
  lon: number;
  title: string;
  description: string;
  date: string;
  status: string;
  address?: string;
  neighborhood?: string;
};

type NeighborhoodReport = {
  neighborhood: string;
  lat: number;
  lon: number;
  crimeCount: number;
  crimeScore: number;
  crimeLabel: string;
  crimeColor: string;
  waterScore: number;
  waterGrade: string;
  waterLabel: string;
  waterColor: string;
  waterIncidents: number;
  waterAdvisory: string | null;
  requests311Count: number;
  permitsCount: number;
  topCrimeTypes: { title: string; count: number }[];
  lastUpdated: string;
};

type Neighborhood = { name: string; lat: number; lon: number };

const THEMES: Record<ThemeName, Record<string, string>> = {
  dark: {
    bg: "#07111F",
    panel: "#0E1C33",
    panel2: "#122241",
    text: "#F4F7FF",
    muted: "#8AA0C7",
    border: "#223454",
    primary: "#00B4D8",
    crime: "#FF453A",
    requests311: "#FFD60A",
    permits: "#32D74B",
    water: "#4FC3F7",
    cargo: "#FF9500",
    accent: "#7C5CFF",
  },
  light: {
    bg: "#EEF5FF",
    panel: "#FFFFFF",
    panel2: "#F7FAFF",
    text: "#0A1628",
    muted: "#58708F",
    border: "#C6D6EA",
    primary: "#0077B6",
    crime: "#E63946",
    requests311: "#C58A00",
    permits: "#1E8A3C",
    water: "#0077B6",
    cargo: "#D4700A",
    accent: "#7849F7",
  },
  neon: {
    bg: "#090913",
    panel: "#17122D",
    panel2: "#1E1737",
    text: "#FFF7FF",
    muted: "#A793C8",
    border: "#34235F",
    primary: "#FF2D78",
    crime: "#FF2D78",
    requests311: "#FFD60A",
    permits: "#00FFD1",
    water: "#4FC3F7",
    cargo: "#FF9500",
    accent: "#00FFD1",
  },
};

const NEIGHBORHOODS: Neighborhood[] = [
  { name: "Downtown Miami", lat: 25.7685, lon: -80.1937 },
  { name: "Brickell", lat: 25.7617, lon: -80.1918 },
  { name: "Coconut Grove", lat: 25.7550, lon: -80.2100 },
  { name: "Wynwood", lat: 25.7959, lon: -80.1997 },
  { name: "Edgewater", lat: 25.8050, lon: -80.1913 },
  { name: "Little Havana", lat: 25.7653, lon: -80.2278 },
  { name: "Coral Gables", lat: 25.7215, lon: -80.2684 },
  { name: "Miami Beach", lat: 25.7907, lon: -80.1300 },
  { name: "Doral", lat: 25.8196, lon: -80.3568 },
  { name: "Hialeah", lat: 25.8576, lon: -80.2781 },
  { name: "Kendall", lat: 25.6847, lon: -80.4178 },
  { name: "North Miami", lat: 25.8893, lon: -80.1867 },
  { name: "Homestead", lat: 25.4750, lon: -80.4773 },
];

const LAYERS: { key: LayerKey; label: string; icon: typeof ShieldAlert }[] = [
  { key: "crime", label: "Crime", icon: ShieldAlert },
  { key: "requests311", label: "311", icon: Building2 },
  { key: "permits", label: "Permits", icon: Package },
  { key: "water", label: "Water", icon: Droplets },
  { key: "cargo", label: "Cargo", icon: Truck },
];

const COMING_SOON = ["Traffic", "Flood", "Transit", "Power"];
const TIME_FILTERS: TimeFilter[] = ["24h", "7d", "30d"];
const MAP_BOUNDS = {
  minLon: -80.55,
  maxLon: -80.05,
  minLat: 25.45,
  maxLat: 25.95,
};

function useJson<T>(url: string, deps: unknown[] = [], enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const current = ++seq.current;
    setLoading(true);
    setError(null);
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (seq.current === current) setData(json as T);
      })
      .catch((e) => {
        if (seq.current === current) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (seq.current === current) setLoading(false);
      });
  }, deps);

  return { data, loading, error, refetch: () => seq.current++ };
}

function project(lat: number, lon: number) {
  const x = ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * 100;
  const y = 100 - ((lat - MAP_BOUNDS.minLat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100;
  return { x, y };
}

function cls(...items: Array<string | false | undefined | null>) {
  return items.filter(Boolean).join(" ");
}

function distance(a: Neighborhood, bLat: number, bLon: number) {
  return Math.hypot(a.lat - bLat, a.lon - bLon);
}

function formatDate(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function DigitalTwin() {
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [openLayers, setOpenLayers] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Incident | null>(null);
  const [reportPoint, setReportPoint] = useState<{ lat: number; lon: number; name: string } | null>({
    lat: 25.7617,
    lon: -80.1918,
    name: "Brickell",
  });
  const [isPlaying, setIsPlaying] = useState(true);
  const [cargoStep, setCargoStep] = useState(0);
  const [pulse, setPulse] = useState(0);

  const c = THEMES[theme];

  const since = useMemo(() => {
    const d = new Date();
    if (timeFilter === "24h") d.setHours(d.getHours() - 24);
    else if (timeFilter === "7d") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 30);
    return d.toISOString();
  }, [timeFilter]);

  const crimeQ = useJson<Incident[]>(`${API_BASE}/civic/crime?since=${encodeURIComponent(since)}`, [timeFilter, since]);
  const reqQ = useJson<Incident[]>(`${API_BASE}/civic/311?since=${encodeURIComponent(since)}`, [timeFilter, since]);
  const permitQ = useJson<Incident[]>(`${API_BASE}/civic/permits?since=${encodeURIComponent(since)}`, [timeFilter, since]);
  const waterQ = useJson<Incident[]>(`${API_BASE}/civic/water?since=${encodeURIComponent(since)}`, [timeFilter, since]);
  const reportQ = useJson<NeighborhoodReport>(
    reportPoint ? `${API_BASE}/neighborhood/report?lat=${reportPoint.lat}&lon=${reportPoint.lon}` : "",
    [reportPoint?.lat, reportPoint?.lon],
    !!reportPoint,
  );

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.setProperty("color-scheme", theme === "light" ? "light" : "dark");
    document.documentElement.style.setProperty("background", c.bg);
    document.documentElement.style.setProperty("color", c.text);
  }, [theme, c.bg, c.text]);

  useEffect(() => {
    let frame = 0;
    const id = window.setInterval(() => {
      if (isPlaying) setCargoStep((v) => (v + 1) % 240);
      frame += 1;
      if (frame % 10 === 0) setPulse((v) => (v + 1) % 1000);
    }, 50);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  const all = [
    ...(crimeQ.data ?? []),
    ...(reqQ.data ?? []),
    ...(permitQ.data ?? []),
    ...(waterQ.data ?? []),
  ];
  const [visible, setVisible] = useState<Record<LayerKey, boolean>>({
    crime: true,
    requests311: true,
    permits: true,
    water: true,
    cargo: true,
  });

  const filteredNeighborhoods = NEIGHBORHOODS.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = Object.values(visible).filter(Boolean).length;

  const cargoPoints = [
    { latitude: 25.7730, longitude: -80.1718 },
    { latitude: 25.7748, longitude: -80.1820 },
    { latitude: 25.7732, longitude: -80.1960 },
    { latitude: 25.7718, longitude: -80.2095 },
    { latitude: 25.7730, longitude: -80.2280 },
    { latitude: 25.7745, longitude: -80.2490 },
    { latitude: 25.7790, longitude: -80.2720 },
    { latitude: 25.7910, longitude: -80.2848 },
    { latitude: 25.7980, longitude: -80.3050 },
    { latitude: 25.8090, longitude: -80.3260 },
    { latitude: 25.8160, longitude: -80.3430 },
    { latitude: 25.8196, longitude: -80.3568 },
  ];
  const seg = Math.floor((cargoStep / 240) * (cargoPoints.length - 1));
  const t = (cargoStep / 240) * (cargoPoints.length - 1) - seg;
  const a = cargoPoints[seg];
  const b = cargoPoints[Math.min(seg + 1, cargoPoints.length - 1)];
  const cargoPos = { latitude: a.latitude + (b.latitude - a.latitude) * t, longitude: a.longitude + (b.longitude - a.longitude) * t };

  const port = cargoPoints[0];
  const doral = cargoPoints[cargoPoints.length - 1];
  const portP = project(port.latitude, port.longitude);
  const doralP = project(doral.latitude, doral.longitude);
  const truckP = project(cargoPos.latitude, cargoPos.longitude);

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: c.bg, color: c.text }}>
      <div className="absolute inset-0 opacity-60">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="relative z-10 flex h-screen flex-col">
        <header className="px-4 pt-4 md:px-6 md:pt-6">
          <div className="flex items-center justify-between rounded-2xl border px-4 py-3 backdrop-blur-xl" style={{ background: c.panel, borderColor: c.border }}>
            <div>
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.primary }} />
                South Florida Digital Twin
              </div>
              <div className="text-sm" style={{ color: c.muted }}>
                Cargo · Water · Utilities · Crime over time
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: c.border, background: c.panel2 }} onClick={() => setTheme(theme === "dark" ? "light" : theme === "light" ? "neon" : "dark")}>
                {theme === "dark" ? <MoonStar size={16} /> : <SunMedium size={16} />}
              </button>
              <button className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: c.border, background: c.panel2 }} onClick={() => setIsPlaying((v) => !v)}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: c.border, background: c.panel2 }} onClick={() => { crimeQ.refetch(); reqQ.refetch(); permitQ.refetch(); waterQ.refetch(); reportQ.refetch(); }}>
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </header>

        <div className="px-4 pt-3 md:px-6">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex items-center gap-3 rounded-2xl border px-4 py-3" style={{ background: c.panel, borderColor: c.border }}>
              <Layers3 size={18} color={c.primary} />
              <button className="flex-1 text-left text-sm" onClick={() => setOpenLayers((v) => !v)}>
                {activeCount} layers active · click to configure
              </button>
              {openLayers ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            <div className="flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ background: c.panel, borderColor: c.border }}>
              <LocateFixed size={16} color={c.primary} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search neighborhood"
                className="w-56 bg-transparent text-sm outline-none placeholder:opacity-60"
                style={{ color: c.text }}
              />
            </div>
          </div>

          <div className={cls("mt-3 overflow-hidden rounded-3xl border shadow-2xl", theme === "neon" && "ring-1")} style={{ background: c.panel, borderColor: c.border }}>
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3" style={{ borderColor: c.border }}>
              {TIME_FILTERS.map((f) => (
                <button key={f} onClick={() => setTimeFilter(f)} className="rounded-full border px-3 py-1.5 text-sm" style={{ background: f === timeFilter ? c.primary : c.panel2, borderColor: c.border, color: f === timeFilter ? (theme === "light" ? "#fff" : "#fff") : c.text }}>
                  {f}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2 text-sm" style={{ color: c.muted }}>
                <Eye size={16} /> {all.length} points
              </div>
            </div>

            <div className="relative h-[calc(100vh-310px)] min-h-[600px] overflow-hidden">
              <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 20% 20%, ${c.primary}22 0%, transparent 25%), radial-gradient(circle at 80% 30%, ${c.accent}18 0%, transparent 24%), radial-gradient(circle at 50% 80%, ${c.cargo}15 0%, transparent 20%)` }} />

              {/* cargo route */}
              {visible.cargo && (
                <>
                  <svg className="absolute inset-0 h-full w-full">
                    <defs>
                      <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={c.cargo} stopOpacity="0.1" />
                        <stop offset="50%" stopColor={c.cargo} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={c.cargo} stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    <polyline
                      fill="none"
                      stroke="url(#routeGrad)"
                      strokeWidth="3"
                      strokeDasharray="10 8"
                      points={cargoPoints.map((p) => `${project(p.latitude, p.longitude).x},${project(p.latitude, p.longitude).y}`).join(" ")}
                    />
                  </svg>
                  <div className="absolute rounded-full border-2" style={{ left: `${portP.x}%`, top: `${portP.y}%`, borderColor: c.cargo, background: `${c.cargo}22`, width: 14, height: 14, transform: "translate(-50%, -50%)" }} />
                  <div className="absolute rounded-full border-2" style={{ left: `${doralP.x}%`, top: `${doralP.y}%`, borderColor: c.cargo, background: `${c.cargo}22`, width: 14, height: 14, transform: "translate(-50%, -50%)" }} />
                  <div className="absolute rounded-md" style={{ left: `${truckP.x}%`, top: `${truckP.y}%`, background: c.cargo, width: 14, height: 14, transform: "translate(-50%, -50%) rotate(10deg)", boxShadow: `0 0 24px ${c.cargo}` }} />
                  <div className="absolute rounded-full border" style={{ left: `${truckP.x}%`, top: `${truckP.y}%`, width: 28 + (pulse % 20), height: 28 + (pulse % 20), transform: "translate(-50%, -50%)", opacity: 0.4, borderColor: c.cargo }} />
                </>
              )}

              {/* incidents */}
              {(all.filter((i) => visible[i.type] !== false) as Incident[]).map((incident) => {
                const p = project(incident.lat, incident.lon);
                const color = c[incident.type] ?? c.primary;
                return (
                  <button
                    key={incident.id}
                    onClick={() => setSelected(incident)}
                    className="absolute rounded-full transition-transform hover:scale-125"
                    style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
                  >
                    <span className="absolute -inset-2 rounded-full animate-ping opacity-30" style={{ background: color }} />
                    <span className="relative block h-3 w-3 rounded-full border border-white/40" style={{ background: color, boxShadow: `0 0 14px ${color}` }} />
                  </button>
                );
              })}

              <div className="absolute left-1/2 top-[72%] w-[min(520px,92%)] -translate-x-1/2 rounded-2xl border p-5 text-center shadow-2xl" style={{ background: c.panel, borderColor: c.border }}>
                <div className="mb-1 text-lg font-bold">Digital Twin of South Florida</div>
                <div className="text-sm" style={{ color: c.muted }}>
                  Live cargo motion, utilities, water quality, and crime trends — pull new data on demand.
                </div>
              </div>
            </div>
          </div>
        </div>

        {openLayers && (
          <div className="mx-4 mt-3 rounded-3xl border p-4 shadow-2xl md:mx-6" style={{ background: c.panel, borderColor: c.border }}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: c.muted }}>Layers</div>
                <div className="text-sm" style={{ color: c.muted }}>Add or hide systems without changing the layout</div>
              </div>
              <button className="rounded-full border px-3 py-2 text-sm" style={{ background: c.panel2, borderColor: c.border }} onClick={() => setOpenLayers(false)}>Close</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {LAYERS.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setVisible((v) => ({ ...v, [key]: !v[key] }))} className="flex items-center gap-3 rounded-2xl border p-3 text-left" style={{ background: visible[key] ? c.panel2 : c.bg, borderColor: visible[key] ? c.primary : c.border }}>
                  <div className="rounded-xl p-2" style={{ background: `${c[key]}22` }}><Icon size={18} color={c[key]} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{label}</div>
                    <div className="text-xs" style={{ color: c.muted }}>{visible[key] ? "Visible" : "Hidden"}</div>
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em]" style={{ color: c.muted }}>{visible[key] ? "On" : "Off"}</div>
                </button>
              ))}
              {COMING_SOON.map((n) => (
                <div key={n} className="rounded-2xl border border-dashed p-3 opacity-70" style={{ borderColor: c.border }}>
                  <div className="text-sm font-semibold">{n}</div>
                  <div className="text-xs" style={{ color: c.muted }}>Coming soon</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-auto px-4 py-4 md:px-6">
          <div className="grid gap-3 md:grid-cols-3">
            <Stat label="Crime this month" value={crimeQ.data?.length ?? 0} sub="Nearby incidents" color={c.crime} />
            <Stat label="Water health" value={reportQ.data ? `${reportQ.data.waterGrade}` : "—"} sub={reportQ.data?.waterLabel ?? "Pull report"} color={c.water} />
            <Stat label="Open 311" value={reqQ.data?.filter((d) => d.status !== "Closed").length ?? 0} sub="On demand" color={c.requests311} />
          </div>
        </footer>
      </div>

      {selected && createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-xl rounded-3xl border p-5 shadow-2xl" style={{ background: c.panel, borderColor: c.border }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.2em]" style={{ color: c.muted }}>{selected.type}</div>
              <button className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: c.border, background: c.panel2 }} onClick={() => setSelected(null)}>Close</button>
            </div>
            <div className="text-2xl font-bold">{selected.title}</div>
            <div className="mt-1 text-sm" style={{ color: c.muted }}>{selected.description}</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border p-3" style={{ background: c.panel2, borderColor: c.border }}><div className="text-xs" style={{ color: c.muted }}>Date</div><div className="font-semibold">{formatDate(selected.date)}</div></div>
              <div className="rounded-2xl border p-3" style={{ background: c.panel2, borderColor: c.border }}><div className="text-xs" style={{ color: c.muted }}>Status</div><div className="font-semibold">{selected.status}</div></div>
              <div className="rounded-2xl border p-3" style={{ background: c.panel2, borderColor: c.border }}><div className="text-xs" style={{ color: c.muted }}>Neighborhood</div><div className="font-semibold">{selected.neighborhood ?? "Miami"}</div></div>
            </div>
          </div>
        </div>, document.body
      )}

      {reportQ.data && (
        <div className="fixed right-4 top-24 z-40 w-[min(360px,calc(100vw-2rem))] rounded-3xl border p-4 shadow-2xl" style={{ background: c.panel, borderColor: c.border }}>
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em]" style={{ color: c.muted }}>Neighborhood report</div>
              <div className="text-lg font-bold">{reportPoint?.name}</div>
            </div>
            <button className="rounded-full border px-3 py-2 text-xs" style={{ borderColor: c.border, background: c.panel2 }} onClick={() => reportQ.refetch()}>Update</button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Mini label="Crime" value={reportQ.data.crimeLabel} color={reportQ.data.crimeColor} />
            <Mini label="Water" value={`${reportQ.data.waterGrade} · ${reportQ.data.waterLabel}`} color={reportQ.data.waterColor} />
            <Mini label="311 open" value={`${reportQ.data.requests311Count}`} color={c.requests311} />
            <Mini label="Permits" value={`${reportQ.data.permitsCount}`} color={c.permits} />
          </div>
          {reportQ.data.waterAdvisory && <div className="mt-3 rounded-2xl border p-3 text-sm" style={{ background: `${c.crime}14`, borderColor: `${c.crime}40` }}>Water alert: {reportQ.data.waterAdvisory}</div>}
        </div>
      )}

      {search && (
        <div className="fixed left-4 top-24 z-40 w-[min(320px,calc(100vw-2rem))] rounded-3xl border p-3 shadow-2xl" style={{ background: c.panel, borderColor: c.border }}>
          <div className="mb-2 text-xs uppercase tracking-[0.2em]" style={{ color: c.muted }}>Neighborhoods</div>
          <div className="max-h-72 overflow-auto">
            {filteredNeighborhoods.map((n) => (
              <button key={n.name} className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left hover:bg-white/5" onClick={() => setReportPoint(n)}>
                <span className="text-sm font-medium">{n.name}</span>
                <LocateFixed size={14} color={c.muted} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: string }) {
  return (
    <div className="rounded-3xl border p-4 shadow-xl" style={{ background: THEMES.dark.panel, borderColor: color }}>
      <div className="text-xs uppercase tracking-[0.2em]" style={{ color: "#8AA0C7" }}>{label}</div>
      <div className="mt-1 text-3xl font-bold" style={{ color }}>{value}</div>
      <div className="mt-1 text-sm" style={{ color: "#8AA0C7" }}>{sub}</div>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border p-3" style={{ background: "rgba(255,255,255,0.03)", borderColor: `${color}40` }}>
      <div className="text-xs" style={{ color: "#8AA0C7" }}>{label}</div>
      <div className="font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

export default DigitalTwin;
