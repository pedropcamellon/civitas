import React, { createContext, useContext, useState } from "react";

export type LayerKey = "crime" | "requests311" | "permits" | "water" | "cargo";
/** A calendar year that exists in the ingested dataset, e.g. "2023". */
export type TimeFilter = string;

export interface CivicIncident {
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
}

export interface NeighborhoodReport {
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
}

interface LayerState {
  crime: boolean;
  requests311: boolean;
  permits: boolean;
  water: boolean;
  cargo: boolean;
}

interface MapContextType {
  layers: LayerState;
  toggleLayer: (layer: LayerKey) => void;
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;
  selectedIncident: CivicIncident | null;
  setSelectedIncident: (incident: CivicIncident | null) => void;
  userLocation: { latitude: number; longitude: number } | null;
  setUserLocation: (loc: { latitude: number; longitude: number } | null) => void;
  neighborhoodReport: NeighborhoodReport | null;
  setNeighborhoodReport: (report: NeighborhoodReport | null) => void;
  isReportOpen: boolean;
  setIsReportOpen: (open: boolean) => void;
  isLayerSheetOpen: boolean;
  setIsLayerSheetOpen: (open: boolean) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [layers, setLayers] = useState<LayerState>({
    crime: true,
    requests311: true,
    permits: true,
    water: true,
    cargo: true,
  });
  const [timeFilter, setTimeFilter] = useState<TimeFilter>(""); // set to latest year by TimelineBar on mount
  const [selectedIncident, setSelectedIncident] = useState<CivicIncident | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [neighborhoodReport, setNeighborhoodReport] = useState<NeighborhoodReport | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLayerSheetOpen, setIsLayerSheetOpen] = useState(false);

  const toggleLayer = (layer: LayerKey) =>
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));

  return (
    <MapContext.Provider
      value={{
        layers,
        toggleLayer,
        timeFilter,
        setTimeFilter,
        selectedIncident,
        setSelectedIncident,
        userLocation,
        setUserLocation,
        neighborhoodReport,
        setNeighborhoodReport,
        isReportOpen,
        setIsReportOpen,
        isLayerSheetOpen,
        setIsLayerSheetOpen,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMapContext() {
  const ctx = useContext(MapContext);
  if (!ctx) throw new Error("useMapContext must be used inside MapProvider");
  return ctx;
}
