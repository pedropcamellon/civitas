import { useEffect, useRef } from "react";
import { Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import { useColors } from "@/hooks/useColors";

const WAYPOINTS: [number, number][] = [
  [25.7730, -80.1718],
  [25.7748, -80.1820],
  [25.7732, -80.1960],
  [25.7718, -80.2095],
  [25.7730, -80.2280],
  [25.7745, -80.2490],
  [25.7790, -80.2720],
  [25.7910, -80.2848],
  [25.7980, -80.3050],
  [25.8090, -80.3260],
  [25.8160, -80.3430],
  [25.8196, -80.3568],
];

const TOTAL_STEPS = 240;

function positionAtStep(step: number): [number, number] {
  const segCount = WAYPOINTS.length - 1;
  const progress = (step % TOTAL_STEPS) / TOTAL_STEPS;
  const rawSeg = progress * segCount;
  const segIdx = Math.min(Math.floor(rawSeg), segCount - 1);
  const t = rawSeg - segIdx;
  const [fLat, fLon] = WAYPOINTS[segIdx];
  const [toLat, toLon] = WAYPOINTS[segIdx + 1];
  return [fLat + (toLat - fLat) * t, fLon + (toLon - fLon) * t];
}

export function CargoRoute() {
  const colors = useColors();
  const map = useMap();
  const markerRef = useRef<L.CircleMarker | null>(null);
  const stepRef = useRef(0);

  useEffect(() => {
    const circle = L.circleMarker(WAYPOINTS[0], {
      radius: 6,
      color: colors.cargo,
      fillColor: colors.cargo,
      fillOpacity: 1,
      weight: 2,
    }).addTo(map);
    markerRef.current = circle;

    const id = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % TOTAL_STEPS;
      circle.setLatLng(positionAtStep(stepRef.current));
    }, 50);

    return () => {
      clearInterval(id);
      circle.remove();
    };
  }, [map, colors.cargo]);

  return (
    <>
      <Polyline
        positions={WAYPOINTS}
        pathOptions={{ color: colors.cargo, opacity: 0.5, weight: 2, dashArray: "6 6" }}
      />
      {([WAYPOINTS[0], WAYPOINTS[WAYPOINTS.length - 1]] as [number, number][]).map(([lat, lon], i) => (
        <CircleMarker
          key={i}
          center={[lat, lon]}
          radius={5}
          pathOptions={{ color: colors.cargo, fill: false, weight: 2 }}
        />
      ))}
    </>
  );
}
