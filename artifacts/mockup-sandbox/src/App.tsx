import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import {
  MoonStar,
  SunMedium,
  Sparkles,
  RefreshCw,
  Search,
  X,
  ChevronDown,
} from "lucide-react";

import { THEMES, SF_CENTER, SF_ZOOM } from "./twin/types";
import type { ThemeName, LayerKey, Incident, NeighborhoodReport } from "./twin/types";
import { useAllIncidents, useNeighborhoodReport } from "./twin/useIncidents";
import { CargoLayer } from "./twin/CargoLayer";
import { IncidentLayer } from "./twin/IncidentLayer";
import { ControlPanel } from "./twin/ControlPanel";
import { TimeControls } from "./twin/TimeControls";
import { NeighborhoodPanel } from "./twin/NeighborhoodPanel";
import { IncidentModal } from "./twin/IncidentModal";

const NEIGHBORHOODS = [
  { name: "Downtown Miami",    lat: 25.7685, lon: -80.1937 },
  { name: "Brickell",          lat: 25.7617, lon: -80.1918 },
  { name: "Coconut Grove",     lat: 25.7550, lon: -80.2100 },
  { name: "Wynwood",           lat: 25.7959, lon: -80.1997 },
  { name: "Edgewater",         lat: 25.8050, lon: -80.1913 },
  { name: "Midtown",           lat: 25.7882, lon: -80.1840 },
  { name: "Little Havana",     lat: 25.7653, lon: -80.2278 },
  { name: "Coral Gables",      lat: 25.7215, lon: -80.2684 },
  { name: "South Beach",       lat: 25.7725, lon: -80.1330 },
  { name: "Miami Beach",       lat: 25.7907, lon: -80.1300 },
  { name: "North Beach",       lat: 25.8150, lon: -80.1220 },
  { name: "Design District",   lat: 25.8140, lon: -80.1978 },
  { name: "Liberty City",      lat: 25.8320, lon: -80.2100 },
  { name: "Overtown",          lat: 25.7888, lon: -80.2098 },
  { name: "Allapattah",        lat: 25.8012, lon: -80.2338 },
  { name: "Doral",             lat: 25.8196, lon: -80.3568 },
  { name: "Fontainebleau",     lat: 25.7738, lon: -80.3412 },
  { name: "Hialeah",           lat: 25.8576, lon: -80.2781 },
  { name: "Kendall",           lat: 25.6847, lon: -80.4178 },
  { name: "South Miami",       lat: 25.7063, lon: -80.2892 },
  { name: "Homestead",         lat: 25.4750, lon: -80.4773 },
  { name: "North Miami",       lat: 25.8893, lon: -80.1867 },
  { name: "North Miami Beach", lat: 25.9215, lon: -80.1578 },
];

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function App() {
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [visible, setVisible] = useState<Record<LayerKey, boolean>>({
    crime: true,
    requests311: true,
    permits: false,
    water: true,
    cargo: true,
  });
  const [simDayOffset, setSimDayOffset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [selected, setSelected] = useState<Incident | null>(null);
  const [reportCoord, setReportCoord] = useState<{ lat: number; lon: number; name: string } | null>({
    lat: 25.7617, lon: -80.1918, name: "Brickell",
  });
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const playRef = useRef<number | null>(null);
  const lastPlayRef = useRef<number | null>(null);
  const [cargoProgress, setCargoProgress] = useState(0);
  const cargoRef = useRef<number | null>(null);
  const cargoLastRef = useRef<number | null>(null);

  const c = THEMES[theme];

  const simCutoffIso = useMemo(() => {
    const d = new Date(Date.now() - 30 * 86400000);
    return d.toISOString();
  }, []);

  const { crime, requests311, permits, water, loading, refresh } = useAllIncidents(simCutoffIso);
  const { data: reportRaw, loading: reportLoading, refresh: refreshReport } = useNeighborhoodReport(
    reportCoord?.lat ?? null,
    reportCoord?.lon ?? null,
  );

  const report = reportRaw as NeighborhoodReport | null;

  useEffect(() => {
    if (!isPlaying) {
      if (playRef.current) cancelAnimationFrame(playRef.current);
      playRef.current = null;
      lastPlayRef.current = null;
      return;
    }

    function tick(now: number) {
      if (lastPlayRef.current === null) lastPlayRef.current = now;
      const dt = (now - lastPlayRef.current) / 1000;
      lastPlayRef.current = now;

      setSimDayOffset((prev) => {
        const next = prev - dt * speed;
        if (next <= 0) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });

      playRef.current = requestAnimationFrame(tick);
    }

    playRef.current = requestAnimationFrame(tick);

    return () => {
      if (playRef.current) cancelAnimationFrame(playRef.current);
      playRef.current = null;
      lastPlayRef.current = null;
    };
  }, [isPlaying, speed]);

  useEffect(() => {
    if (!visible.cargo || !isPlaying) {
      if (cargoRef.current) cancelAnimationFrame(cargoRef.current);
      cargoRef.current = null;
      cargoLastRef.current = null;
      return;
    }

    function tick(now: number) {
      if (cargoLastRef.current === null) cargoLastRef.current = now;
      const dt = (now - cargoLastRef.current) / 1000;
      cargoLastRef.current = now;
      setCargoProgress((prev) => (prev + dt / 14) % 1);
      cargoRef.current = requestAnimationFrame(tick);
    }

    cargoRef.current = requestAnimationFrame(tick);
    return () => {
      if (cargoRef.current) cancelAnimationFrame(cargoRef.current);
      cargoRef.current = null;
      cargoLastRef.current = null;
    };
  }, [visible.cargo, isPlaying]);

  const handleToggleLayer = useCallback((key: LayerKey) => {
    setVisible((v) => ({ ...v, [key]: !v[key] }));
  }, []);

  const handleMapClick = useCallback((lat: number, lon: number) => {
    let best = NEIGHBORHOODS[0];
    let bestD = Infinity;
    for (const nb of NEIGHBORHOODS) {
      const d = Math.hypot(nb.lat - lat, nb.lon - lon);
      if (d < bestD) { bestD = d; best = nb; }
    }
    setReportCoord({ lat: best.lat, lon: best.lon, name: best.name });
  }, []);

  const cycleTheme = () => {
    setTheme((t) => t === "dark" ? "light" : t === "light" ? "neon" : "dark");
  };

  const themeIcon = theme === "dark" ? <MoonStar size={16} /> : theme === "light" ? <SunMedium size={16} /> : <Sparkles size={16} />;
  const themeLabel = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "Neon";

  const filteredNeighborhoods = NEIGHBORHOODS.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalVisible = [
    ...(visible.crime ? crime : []),
    ...(visible.requests311 ? requests311 : []),
    ...(visible.permits ? permits : []),
    ...(visible.water ? water : []),
  ].filter((inc) => {
    const age = (Date.now() - simDayOffset * 86400000 - new Date(inc.date).getTime()) / 86400000;
    return age >= 0;
  }).length;

  const topStyle: React.CSSProperties = {
    position: "fixed",
    top: 14,
    left: 260,
    right: reportCoord ? 372 : 16,
    zIndex: 900,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const glassCard: React.CSSProperties = {
    background: c.panel,
    border: `1px solid ${c.border}`,
    borderRadius: 14,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", background: c.bg, overflow: "hidden" }}>
      <style>{`
        .leaflet-container { background: ${c.bg}; }
        .leaflet-control-attribution { background: ${c.panel} !important; color: ${c.muted} !important; }
        .leaflet-control-attribution a { color: ${c.muted} !important; }
        .leaflet-tooltip { background: ${c.panel}; color: ${c.text}; border: 1px solid ${c.border}; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); font-size: 12px; }
        .leaflet-tooltip-top::before { border-top-color: ${c.border}; }
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${c.primary}; cursor: pointer; box-shadow: 0 0 8px ${c.primary}88; }
        input[type=range]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: ${c.primary}; cursor: pointer; border: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${c.border}; border-radius: 99px; }
      `}</style>

      <MapContainer
        center={SF_CENTER}
        zoom={SF_ZOOM}
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
      >
        <TileLayer url={c.tileUrl} attribution={c.tileAttribution} maxZoom={19} />

        <MapClickHandler onMapClick={handleMapClick} />

        <IncidentLayer
          incidents={crime}
          colorKey="crime"
          visible={visible.crime}
          c={c}
          simDayOffset={simDayOffset}
          onSelect={setSelected}
        />
        <IncidentLayer
          incidents={requests311}
          colorKey="requests311"
          visible={visible.requests311}
          c={c}
          simDayOffset={simDayOffset}
          onSelect={setSelected}
        />
        <IncidentLayer
          incidents={permits}
          colorKey="permits"
          visible={visible.permits}
          c={c}
          simDayOffset={simDayOffset}
          onSelect={setSelected}
        />
        <IncidentLayer
          incidents={water}
          colorKey="water"
          visible={visible.water}
          c={c}
          simDayOffset={simDayOffset}
          onSelect={setSelected}
        />

        <CargoLayer visible={visible.cargo} isPlaying={isPlaying} c={c} progress={cargoProgress} />
      </MapContainer>

      <div style={{ position: "fixed", top: 14, left: 14, zIndex: 950 }}>
        <div style={{ ...glassCard, padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.primary, boxShadow: `0 0 8px ${c.primary}` }} />
            <span style={{ fontWeight: 800, fontSize: 15, color: c.text }}>South Florida</span>
          </div>
          <div style={{ fontSize: 11, color: c.muted }}>Digital Twin</div>
        </div>
      </div>

      <div style={topStyle}>
        <div style={{ ...glassCard, padding: "8px 16px", display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: c.muted, fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: c.text, fontSize: 14 }}>{totalVisible}</span>
            events visible
          </div>
          <div style={{ width: 1, height: 16, background: c.border }} />
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: c.muted }}>
              <RefreshCw size={12} className="animate-spin" /> Loading…
            </div>
          )}
          {!loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: c.muted }}>
              <Dot color={c.crime} /> {crime.length} crime
              <Dot color={c.requests311} /> {requests311.length} 311
              <Dot color={c.water} /> {water.length} water
              <Dot color={c.permits} /> {permits.length} permits
            </div>
          )}
          <button onClick={refresh} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: c.muted, display: "flex", alignItems: "center" }}>
            <RefreshCw size={14} />
          </button>
        </div>

        <div style={{ ...glassCard, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, minWidth: 200, position: "relative" }}>
          <Search size={14} color={c.muted} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search neighborhood…"
            style={{ background: "none", border: "none", outline: "none", fontSize: 13, color: c.text, width: 160 }}
          />
          {search && (
            <button onClick={() => { setSearch(""); setSearchOpen(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: c.muted, display: "flex" }}>
              <X size={12} />
            </button>
          )}

          {searchOpen && search && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, marginTop: 6,
              background: c.panel, border: `1px solid ${c.border}`, borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)", overflow: "hidden", zIndex: 9999,
              backdropFilter: "blur(20px)",
            }}>
              {filteredNeighborhoods.slice(0, 6).map((nb) => (
                <button
                  key={nb.name}
                  onClick={() => {
                    setReportCoord({ lat: nb.lat, lon: nb.lon, name: nb.name });
                    setSearch("");
                    setSearchOpen(false);
                  }}
                  style={{
                    width: "100%", textAlign: "left", padding: "9px 14px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 13, color: c.text, borderBottom: `1px solid ${c.border}`,
                  }}
                >
                  {nb.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={cycleTheme}
          style={{ ...glassCard, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", color: c.text, fontSize: 12, fontWeight: 600, border: `1px solid ${c.border}` }}
        >
          {themeIcon}
          {themeLabel}
        </button>
      </div>

      <ControlPanel visible={visible} onToggle={handleToggleLayer} c={c} />

      <TimeControls
        simDayOffset={simDayOffset}
        onSimDayOffsetChange={setSimDayOffset}
        isPlaying={isPlaying}
        onPlayPause={() => {
          if (!isPlaying) {
            if (simDayOffset <= 0) setSimDayOffset(30);
          }
          setIsPlaying((v) => !v);
        }}
        speed={speed}
        onSpeedChange={setSpeed}
        c={c}
      />

      {reportCoord && report && (
        <NeighborhoodPanel
          report={report}
          loading={reportLoading}
          onClose={() => setReportCoord(null)}
          onRefresh={refreshReport}
          c={c}
        />
      )}

      {selected && (
        <IncidentModal
          incident={selected}
          onClose={() => setSelected(null)}
          c={c}
        />
      )}

      <Legend c={c} visible={visible} />
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
    </span>
  );
}

function Legend({ c, visible }: { c: typeof THEMES.dark; visible: Record<LayerKey, boolean> }) {
  const items: { key: LayerKey; label: string; colorKey: keyof typeof c }[] = [
    { key: "crime",       label: "Crime",    colorKey: "crime"       },
    { key: "requests311", label: "311",       colorKey: "requests311" },
    { key: "permits",     label: "Permits",  colorKey: "permits"     },
    { key: "water",       label: "Water",    colorKey: "water"       },
    { key: "cargo",       label: "Cargo",    colorKey: "cargo"       },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 90, right: 16, zIndex: 900,
      background: c.panel, border: `1px solid ${c.border}`,
      borderRadius: 12, padding: "10px 14px",
      backdropFilter: "blur(20px)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: c.muted, marginBottom: 6 }}>
        Legend
      </div>
      {items.map(({ key, label, colorKey }) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", opacity: visible[key] ? 1 : 0.35 }}>
          <span style={{ width: 9, height: 9, borderRadius: "50%", background: c[colorKey] as string, display: "inline-block", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: c.text }}>{label}</span>
        </div>
      ))}
      <div style={{ marginTop: 6, borderTop: `1px solid ${c.border}`, paddingTop: 5, fontSize: 10, color: c.muted }}>
        Click map to inspect area
      </div>
    </div>
  );
}
