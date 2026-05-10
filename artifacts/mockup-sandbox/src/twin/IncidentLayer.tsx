import { CircleMarker, Tooltip } from "react-leaflet";
import type { Incident, Theme } from "./types";

interface IncidentLayerProps {
  incidents: Incident[];
  colorKey: string;
  visible: boolean;
  c: Theme;
  simDayOffset: number;
  onSelect: (inc: Incident) => void;
}

function getAge(date: string, simDayOffset: number): number {
  const now = Date.now();
  const simNow = now - simDayOffset * 86400000;
  const daysAgo = (simNow - new Date(date).getTime()) / 86400000;
  return daysAgo;
}

export function IncidentLayer({ incidents, colorKey, visible, c, simDayOffset, onSelect }: IncidentLayerProps) {
  if (!visible) return null;

  const color = c[colorKey as keyof Theme] as string ?? c.primary;

  return (
    <>
      {incidents.map((inc) => {
        const age = getAge(inc.date, simDayOffset);
        if (age < 0 || age > 30) return null;

        const freshness = Math.max(0, 1 - age / 30);
        const radius = 5 + freshness * 5;
        const opacity = 0.35 + freshness * 0.65;

        return (
          <CircleMarker
            key={inc.id}
            center={[inc.lat, inc.lon]}
            radius={radius}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: opacity,
              weight: 1.5,
              opacity: 0.9,
            }}
            eventHandlers={{ click: () => onSelect(inc) }}
          >
            <Tooltip sticky>
              <strong>{inc.title}</strong>
              <br />
              <span style={{ color: "#888" }}>{inc.neighborhood}</span>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
