import { useEffect, useRef, useState } from "react";
import { Polyline, Marker, useMap } from "react-leaflet";
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

function TruckMarker({ progress, c }: { progress: number; c: Theme }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const pulseRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    const pos = getCargoPos(progress);

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

    if (!markerRef.current) {
      markerRef.current = L.marker(pos, { icon, zIndexOffset: 1000 }).addTo(map);
    } else {
      markerRef.current.setLatLng(pos);
      markerRef.current.setIcon(icon);
    }

    if (!pulseRef.current) {
      pulseRef.current = L.circle(pos, {
        radius: 400,
        color: c.cargo,
        fillColor: c.cargo,
        fillOpacity: 0.08,
        weight: 1.5,
        opacity: 0.5,
      }).addTo(map);
    } else {
      pulseRef.current.setLatLng(pos);
      pulseRef.current.setStyle({ color: c.cargo, fillColor: c.cargo });
    }

    return () => {};
  }, [progress, map, c]);

  useEffect(() => {
    return () => {
      markerRef.current?.remove();
      pulseRef.current?.remove();
      markerRef.current = null;
      pulseRef.current = null;
    };
  }, []);

  return null;
}

interface CargoLayerProps {
  visible: boolean;
  isPlaying: boolean;
  c: Theme;
}

export function CargoLayer({ visible, isPlaying, c }: CargoLayerProps) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    if (!visible || !isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
      return;
    }

    function tick(now: number) {
      if (lastRef.current === null) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;

      progressRef.current = (progressRef.current + dt / 14) % 1;
      setProgress(progressRef.current);
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = null;
    };
  }, [visible, isPlaying]);

  if (!visible) return null;

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
      <TruckMarker progress={progress} c={c} />
    </>
  );
}
