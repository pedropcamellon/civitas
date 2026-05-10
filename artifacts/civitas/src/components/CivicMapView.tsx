import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Polyline, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { useColors } from "@/hooks/useColors";
import type { CivicIncident } from "@/context/MapContext";
import { useMapContext } from "@/context/MapContext";
import { CargoRoute } from "@/components/CargoRoute";

const MIAMI_CENTER: [number, number] = [25.7617, -80.1918];
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://carto.com/">CARTO</a>';

interface Props {
  incidents: CivicIncident[];
  userHasLocation: boolean;
  onMarkerPress: (incident: CivicIncident) => void;
  onMapPress: () => void;
  mapRef: React.MutableRefObject<LeafletMap | null>;
}

function MapRefCapture({ mapRef }: { mapRef: React.MutableRefObject<LeafletMap | null> }) {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
}

export function CivicMapView({ incidents, userHasLocation, onMarkerPress, onMapPress, mapRef }: Props) {
  const colors = useColors();
  const { layers, userLocation } = useMapContext();

  const colorMap: Record<CivicIncident["type"], string> = {
    crime:       colors.crime,
    requests311: colors.requests311,
    permits:     colors.permits,
    water:       colors.water,
    cargo:       colors.cargo,
  };

  return (
    <MapContainer
      center={MIAMI_CENTER}
      zoom={11}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      <MapRefCapture mapRef={mapRef} />
      <TileLayer url={TILE_URL} attribution={TILE_ATTR} />

      {incidents.map((incident) => (
        <CircleMarker
          key={incident.id}
          center={[incident.lat, incident.lon]}
          radius={6}
          pathOptions={{
            color: colorMap[incident.type],
            fillColor: colorMap[incident.type],
            fillOpacity: 0.85,
            weight: 1,
          }}
          eventHandlers={{ click: () => onMarkerPress(incident) }}
        />
      ))}

      {userHasLocation && userLocation && (
        <CircleMarker
          center={[userLocation.latitude, userLocation.longitude]}
          radius={8}
          pathOptions={{ color: colors.primary, fillColor: colors.primary, fillOpacity: 1, weight: 2 }}
        />
      )}

      {layers.cargo && <CargoRoute />}
    </MapContainer>
  );
}
