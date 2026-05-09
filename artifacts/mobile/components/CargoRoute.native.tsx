import React, { useEffect, useRef, useState } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { Marker, Polyline } from "react-native-maps";
import { useColors } from "@/hooks/useColors";

// Port of Miami → SR-836 → Airport → Doral warehouse district
const WAYPOINTS = [
  { latitude: 25.7730, longitude: -80.1718 }, // Port of Miami terminal
  { latitude: 25.7748, longitude: -80.1820 }, // MacArthur Causeway
  { latitude: 25.7732, longitude: -80.1960 }, // Brickell
  { latitude: 25.7718, longitude: -80.2095 }, // Downtown west
  { latitude: 25.7730, longitude: -80.2280 }, // SR-836 onramp
  { latitude: 25.7745, longitude: -80.2490 }, // 836 mid
  { latitude: 25.7790, longitude: -80.2720 }, // 836 west
  { latitude: 25.7910, longitude: -80.2848 }, // Airport interchange
  { latitude: 25.7980, longitude: -80.3050 }, // NW 74th Ave
  { latitude: 25.8090, longitude: -80.3260 }, // Doral entry
  { latitude: 25.8160, longitude: -80.3430 }, // Doral mid
  { latitude: 25.8196, longitude: -80.3568 }, // Doral warehouse
];

const TOTAL_STEPS = 240; // 240 × 50ms = 12s per loop

function interpolate(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function positionAtStep(step: number) {
  const segmentCount = WAYPOINTS.length - 1;
  const progress = (step % TOTAL_STEPS) / TOTAL_STEPS;
  const rawSeg = progress * segmentCount;
  const segIdx = Math.min(Math.floor(rawSeg), segmentCount - 1);
  const t = rawSeg - segIdx;
  const from = WAYPOINTS[segIdx];
  const to = WAYPOINTS[segIdx + 1];
  return {
    latitude: interpolate(from.latitude, to.latitude, t),
    longitude: interpolate(from.longitude, to.longitude, t),
  };
}

export function CargoRoute() {
  const colors = useColors();
  const stepRef = useRef(0);
  const [position, setPosition] = useState(positionAtStep(0));
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      stepRef.current = (stepRef.current + 1) % TOTAL_STEPS;
      setPosition(positionAtStep(stepRef.current));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Pulse ring on the truck
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] });

  return (
    <>
      {/* Route polyline */}
      <Polyline
        coordinates={WAYPOINTS}
        strokeColor={colors.cargo + "90"}
        strokeWidth={3}
        lineDashPattern={[8, 6]}
        lineCap="round"
      />

      {/* Moving truck marker */}
      <Marker coordinate={position} tracksViewChanges anchor={{ x: 0.5, y: 0.5 }}>
        <View style={styles.markerWrap}>
          <Animated.View
            style={[
              styles.pulse,
              {
                borderColor: colors.cargo,
                transform: [{ scale: pulseScale }],
                opacity: pulseOpacity,
              },
            ]}
          />
          <View style={[styles.truck, { backgroundColor: colors.cargo }]}>
            <View style={[styles.truckInner, { backgroundColor: colors.cargo + "BB" }]} />
          </View>
        </View>
      </Marker>

      {/* Origin & destination markers */}
      <Marker
        coordinate={WAYPOINTS[0]}
        tracksViewChanges={false}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={[styles.terminal, { borderColor: colors.cargo, backgroundColor: colors.cargo + "25" }]}>
          <View style={[styles.terminalDot, { backgroundColor: colors.cargo }]} />
        </View>
      </Marker>
      <Marker
        coordinate={WAYPOINTS[WAYPOINTS.length - 1]}
        tracksViewChanges={false}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={[styles.terminal, { borderColor: colors.cargo, backgroundColor: colors.cargo + "25" }]}>
          <View style={[styles.terminalDot, { backgroundColor: colors.cargo }]} />
        </View>
      </Marker>
    </>
  );
}

const styles = StyleSheet.create({
  markerWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  truck: {
    width: 14,
    height: 14,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  truckInner: {
    width: 7,
    height: 7,
    borderRadius: 1,
  },
  terminal: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  terminalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
