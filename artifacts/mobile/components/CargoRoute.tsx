import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

// Web fallback — animated cargo route using the same coordinate mapping
// as CivicMapView.tsx (lon+80.45)/0.55 × 100 and (lat-25.6)/0.35 × 100

const WAYPOINTS = [
  { lat: 25.7730, lon: -80.1718 },
  { lat: 25.7748, lon: -80.1820 },
  { lat: 25.7732, lon: -80.1960 },
  { lat: 25.7718, lon: -80.2095 },
  { lat: 25.7730, lon: -80.2280 },
  { lat: 25.7745, lon: -80.2490 },
  { lat: 25.7790, lon: -80.2720 },
  { lat: 25.7910, lon: -80.2848 },
  { lat: 25.7980, lon: -80.3050 },
  { lat: 25.8090, lon: -80.3260 },
  { lat: 25.8160, lon: -80.3430 },
  { lat: 25.8196, lon: -80.3568 },
];

const TOTAL_STEPS = 240;

function toXY(lat: number, lon: number) {
  const x = ((lon + 80.45) / 0.55) * 100;
  const y = 100 - ((lat - 25.6) / 0.35) * 100;
  return { x, y };
}

function interpolate(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function positionAtStep(step: number) {
  const segCount = WAYPOINTS.length - 1;
  const progress = (step % TOTAL_STEPS) / TOTAL_STEPS;
  const rawSeg = progress * segCount;
  const segIdx = Math.min(Math.floor(rawSeg), segCount - 1);
  const t = rawSeg - segIdx;
  const from = WAYPOINTS[segIdx];
  const to = WAYPOINTS[segIdx + 1];
  return {
    lat: interpolate(from.lat, to.lat, t),
    lon: interpolate(from.lon, to.lon, t),
  };
}

export function CargoRouteWeb() {
  const colors = useColors();
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % TOTAL_STEPS;
      setStep(stepRef.current);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const pos = positionAtStep(step);
  const { x: px, y: py } = toXY(pos.lat, pos.lon);

  // Build SVG-like polyline as a series of line segments using absolute positioned divs
  const segments = WAYPOINTS.slice(0, -1).map((from, i) => {
    const to = WAYPOINTS[i + 1];
    const p1 = toXY(from.lat, from.lon);
    const p2 = toXY(to.lat, to.lon);
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return { x: p1.x, y: p1.y, length, angle };
  });

  return (
    <>
      {/* Route segments */}
      {segments.map((seg, i) => (
        <View
          key={i}
          style={[
            styles.segment,
            {
              left: `${seg.x}%` as any,
              top: `${seg.y}%` as any,
              width: `${seg.length * 0.6}%` as any,
              borderColor: colors.cargo + "70",
              transform: [{ rotate: `${seg.angle}deg` }],
            },
          ]}
        />
      ))}

      {/* Moving truck dot */}
      <View
        style={[
          styles.truck,
          {
            left: `${px}%` as any,
            top: `${py}%` as any,
            backgroundColor: colors.cargo,
            shadowColor: colors.cargo,
          },
        ]}
      />

      {/* Origin / destination */}
      {[WAYPOINTS[0], WAYPOINTS[WAYPOINTS.length - 1]].map((wp, i) => {
        const { x, y } = toXY(wp.lat, wp.lon);
        return (
          <View
            key={`terminal-${i}`}
            style={[
              styles.terminal,
              {
                left: `${x}%` as any,
                top: `${y}%` as any,
                borderColor: colors.cargo,
              },
            ]}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  segment: {
    position: "absolute",
    height: 2,
    borderBottomWidth: 2,
    borderStyle: "dashed",
    transformOrigin: "0 50%",
  } as any,
  truck: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 3,
    marginLeft: -6,
    marginTop: -6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  terminal: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    marginLeft: -6,
    marginTop: -6,
    backgroundColor: "transparent",
  },
});
