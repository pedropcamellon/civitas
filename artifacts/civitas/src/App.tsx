import React, { useRef, useCallback, useState, useEffect } from "react";
import type { Map as LeafletMap } from "leaflet";
import { Layers, Navigation, Search, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useTheme } from "@/context/ThemeContext";
import { useMapContext, type CivicIncident } from "@/context/MapContext";
import { use311Data, useCrimeData, usePermitData, useWaterData, useNeighborhoodReport } from "@/hooks/useCivicData";
import { useUserLocation } from "@/hooks/useUserLocation";
import { THEME_META } from "@/constants/colors";
import { CivicMapView } from "@/components/CivicMapView";
import { TimelineBar } from "@/components/TimelineBar";
import { IncidentSheet } from "@/components/IncidentSheet";
import { LayerSheet } from "@/components/LayerSheet";
import { NeighborhoodReport } from "@/components/NeighborhoodReport";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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

export function App() {
  const colors = useColors();
  const { themeName, cycleTheme } = useTheme();
  const mapRef = useRef<LeafletMap | null>(null);
  const queryClient = useQueryClient();

  const {
    layers, timeFilter, selectedIncident, setSelectedIncident,
    setUserLocation, neighborhoodReport, setNeighborhoodReport,
    isReportOpen, setIsReportOpen, isLayerSheetOpen, setIsLayerSheetOpen,
  } = useMapContext();

  const { location, loading: locLoading, requestLocation } = useUserLocation();
  const [reportLat, setReportLat] = useState<number | null>(null);
  const [reportLon, setReportLon] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Data loaded on demand — each query only enabled when its layer is active
  const { data: data311 = [],    isLoading: l311,     isError: e311     } = use311Data(timeFilter, layers.requests311);
  const { data: crimeData = [],  isLoading: lCrime,   isError: eCrime   } = useCrimeData(timeFilter, layers.crime);
  const { data: permitData = [], isLoading: lPermits, isError: ePermits } = usePermitData(timeFilter, layers.permits);
  const { data: waterData = [],  isLoading: lWater,   isError: eWater   } = useWaterData(timeFilter, layers.water);

  const { data: reportData, isLoading: reportLoading, refetch: refetchReport } =
    useNeighborhoodReport(reportLat, reportLon, isReportOpen);

  useEffect(() => { if (reportData) setNeighborhoodReport(reportData); }, [reportData, setNeighborhoodReport]);

  const isLoading = l311 || lCrime || lPermits || lWater;
  const hasError  = e311 || eCrime || ePermits || eWater;

  const visibleIncidents: CivicIncident[] = [
    ...(layers.requests311 ? data311    : []),
    ...(layers.crime        ? crimeData  : []),
    ...(layers.permits      ? permitData : []),
    ...(layers.water        ? waterData  : []),
  ];

  const handleMarkerPress = useCallback((incident: CivicIncident) => {
    setIsReportOpen(false); setIsLayerSheetOpen(false); setSelectedIncident(incident);
  }, [setSelectedIncident, setIsReportOpen, setIsLayerSheetOpen]);

  const handleMapPress = useCallback(() => {
    if (selectedIncident) setSelectedIncident(null);
    if (searchFocused) { setSearchFocused(false); setSearchQuery(""); }
  }, [selectedIncident, setSelectedIncident, searchFocused]);

  const handleNearMe = useCallback(async () => {
    const loc = await requestLocation();
    if (loc) {
      setUserLocation(loc);
      setReportLat(loc.latitude); setReportLon(loc.longitude);
      setIsReportOpen(true); setIsLayerSheetOpen(false); setSelectedIncident(null);
      mapRef.current?.flyTo([loc.latitude, loc.longitude], 14, { duration: 0.8 });
    }
  }, [requestLocation, setUserLocation, setIsReportOpen, setIsLayerSheetOpen, setSelectedIncident]);

  const handleNeighborhoodSelect = useCallback((nb: (typeof NEIGHBORHOODS)[number]) => {
    setSearchQuery(nb.name); setSearchFocused(false);
    setReportLat(nb.lat); setReportLon(nb.lon);
    setIsReportOpen(true); setIsLayerSheetOpen(false); setSelectedIncident(null);
    mapRef.current?.flyTo([nb.lat, nb.lon], 13, { duration: 0.8 });
  }, [setIsReportOpen, setIsLayerSheetOpen, setSelectedIncident]);

  const handleRefreshReport = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["neighborhood-report"] });
    refetchReport();
  }, [queryClient, refetchReport]);

  const filteredNeighborhoods = searchQuery.length > 0
    ? NEIGHBORHOODS.filter((nb) => nb.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : NEIGHBORHOODS;

  const activeLayerCount = Object.values(layers).filter(Boolean).length;
  const themeIcon = THEME_META[themeName].icon;

  return (
    <ErrorBoundary>
      <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", backgroundColor: colors.background }}>
        {/* Map fills background */}
        <div style={{ position: "absolute", inset: 0 }}>
          <CivicMapView
            mapRef={mapRef}
            incidents={visibleIncidents}
            userHasLocation={!!location}
            onMarkerPress={handleMarkerPress}
            onMapPress={handleMapPress}
          />
        </div>

        {/* Top overlay */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: "max(67px, env(safe-area-inset-top, 0px) + 10px)" }}>
          {/* Header card */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 16px 8px", padding: "11px 14px", borderRadius: 18, border: `1px solid ${colors.border}`, backgroundColor: colors.card + "F2", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: colors.foreground }}>Civitas</span>
              <span style={{ fontSize: 14, color: colors.mutedForeground }}>Miami</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isLoading ? (
                <div style={{ width: 16, height: 16, border: `2px solid ${colors.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              ) : hasError ? (
                <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 8, backgroundColor: colors.destructive + "20", fontSize: 11, color: colors.destructive }}>
                  ⚠ Limited data
                </div>
              ) : null}
              <span style={{ fontSize: 12, color: colors.mutedForeground }}>{visibleIncidents.length} events</span>
              <button onClick={cycleTheme} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.muted, border: "none", cursor: "pointer", fontSize: 14 }}>
                {themeIcon}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 16px 8px", padding: "9px 12px", borderRadius: 14, border: `1px solid ${searchFocused ? colors.primary : colors.border}`, backgroundColor: colors.card + "F5" }}>
            <Search size={15} color={searchFocused ? colors.primary : colors.mutedForeground} />
            <input
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: colors.foreground, fontSize: 14, fontFamily: "inherit" }}
              placeholder="Search neighborhood…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: colors.mutedForeground, padding: 0 }}>
                <X size={16} />
              </button>
            )}
          </div>

          {/* Neighborhood dropdown */}
          {searchFocused && (
            <div style={{ margin: "0 16px 8px", borderRadius: 14, border: `1px solid ${colors.border}`, backgroundColor: colors.card, maxHeight: 220, overflowY: "auto" }}>
              {filteredNeighborhoods.map((nb) => (
                <button key={nb.name} onMouseDown={() => handleNeighborhoodSelect(nb)} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", border: "none", borderBottom: `1px solid ${colors.border}`, backgroundColor: "transparent", cursor: "pointer", color: colors.foreground, fontSize: 14, textAlign: "left", fontFamily: "inherit" }}>
                  🔍 {nb.name}
                </button>
              ))}
            </div>
          )}

          <TimelineBar />
        </div>

        {/* Near Me FAB (right) */}
        <button
          onClick={handleNearMe}
          style={{
            position: "absolute", right: 20,
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 78px + 20px)",
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: isReportOpen ? colors.secondary : colors.primary,
            border: isReportOpen ? `1px solid ${colors.primary}` : "none",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 400,
          }}
        >
          {locLoading
            ? <div style={{ width: 18, height: 18, border: `2px solid ${colors.primaryForeground}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            : <Navigation size={20} color={isReportOpen ? colors.primary : colors.primaryForeground} />
          }
        </button>

        {/* Layers FAB (left) */}
        <button
          onClick={() => { setIsLayerSheetOpen(true); setIsReportOpen(false); setSelectedIncident(null); }}
          style={{
            position: "absolute", left: 20,
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 78px + 20px)",
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: isLayerSheetOpen ? colors.primary : colors.card,
            border: `1px solid ${isLayerSheetOpen ? colors.primary : colors.border}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)", zIndex: 400,
          }}
        >
          <Layers size={18} color={isLayerSheetOpen ? colors.primaryForeground : colors.foreground} />
          <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: colors.primaryForeground }}>
            {activeLayerCount}
          </div>
        </button>

        {/* Bottom bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "10px 20px calc(env(safe-area-inset-bottom, 0px) + 10px)",
          backgroundColor: colors.card + "E8", borderTop: `1px solid ${colors.border}`,
          zIndex: 300,
        }}>
          <span style={{ fontSize: 13, color: colors.mutedForeground }}>
            {activeLayerCount} layer{activeLayerCount !== 1 ? "s" : ""} active ·{" "}
            <span style={{ color: colors.primary }}>Layers</span> to configure
          </span>
        </div>

        {/* Sheets */}
        <IncidentSheet />
        <NeighborhoodReport report={neighborhoodReport} isLoading={reportLoading} onRefresh={handleRefreshReport} />
        <LayerSheet />
      </div>
    </ErrorBoundary>
  );
}
