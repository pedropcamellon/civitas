import { CircleMarker, Marker, Tooltip } from "react-leaflet";
import L from "leaflet";
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

function makeInfraIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
    <polygon points="11,2 20,11 11,20 2,11" fill="${color}" stroke="#fff" stroke-width="1.5" opacity="0.95"/>
    <circle cx="11" cy="11" r="3.5" fill="#fff" opacity="0.85"/>
  </svg>`;
  return L.divIcon({
    className: "",
    html: svg,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export function IncidentLayer({ incidents, colorKey, visible, c, simDayOffset, onSelect }: IncidentLayerProps) {
  if (!visible) return null;

  const color = c[colorKey as keyof Theme] as string ?? c.primary;
  const infraIcon = makeInfraIcon(color);

  return (
    <>
      {incidents.map((inc) => {
        if (inc.subtype === "infrastructure") {
          return (
            <Marker
              key={inc.id}
              position={[inc.lat, inc.lon]}
              icon={infraIcon}
              eventHandlers={{ click: () => onSelect(inc) }}
            >
              <Tooltip sticky>
                <strong>{inc.title}</strong><br />
                <span style={{ color: "#888" }}>{inc.status} · {inc.neighborhood}</span>
              </Tooltip>
            </Marker>
          );
        }

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
