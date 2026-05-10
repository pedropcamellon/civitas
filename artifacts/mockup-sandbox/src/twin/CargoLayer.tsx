import { useMemo } from "react";
import { Circle, Polyline, Marker } from "react-leaflet";
import L from "leaflet";
import { CARGO_ROUTE } from "./types";
import type { Theme } from "./types";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getCargoPos(progress: number): [number, number] {
  const total = CARGO_ROUTE.length - 1;
  const raw = progress * total;
  const seg = Math.min(Math.floor(raw), total - 1);
  const t = raw - seg;
  const a = CARGO_ROUTE[seg];
  const b = CARGO_ROUTE[seg + 1] ?? a;
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

interface CargoLayerProps {
  visible: boolean;
  c: Theme;
  progress: number;
}

export function CargoLayer({ visible, c, progress }: CargoLayerProps) {
  const pos = useMemo(() => getCargoPos(progress), [progress]);

  if (!visible) return null;

  const icon = L.divIcon({
    className: "",
    html: `
      <div style="
        width:20px;height:20px;border-radius:4px;
        background:${c.cargo};
        box-shadow:0 0 16px 4px ${c.cargo}99;
        display:flex;align-items:center;justify-content:center;
        font-size:11px;line-height:1;
        transform:rotate(-8deg);
      ">🚛</div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <>
      <Polyline
        positions={CARGO_ROUTE}
        pathOptions={{
          color: c.cargo,
          weight: 3,
          opacity: 0.7,
          dashArray: "12 8",
        }}
      />
      <Marker position={pos} icon={icon} />
      <Circle
        center={pos}
        radius={450}
        pathOptions={{
          color: c.cargo,
          fillColor: c.cargo,
          fillOpacity: 0.08,
          weight: 1.5,
          opacity: 0.5,
        }}
      />
    </>
  );
}
