import React, { createContext, useContext, useState } from "react";

export type LayerKey = "crime" | "requests311" | "permits";
export type TimeFilter = "24h" | "7d" | "30d";

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
}

interface LayerState {
  crime: boolean;
  requests311: boolean;
  permits: boolean;
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
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [layers, setLayers] = useState<LayerState>({
    crime: true,
    requests311: true,
    permits: true,
  });
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("7d");
  const [selectedIncident, setSelectedIncident] = useState<CivicIncident | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const toggleLayer = (layer: LayerKey) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

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
