import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { CivicIncident } from "@/context/MapContext";

// Web fallback — react-native-maps is native-only.
// The full interactive map is available in Expo Go on your device.

export const MIAMI_REGION = {
  latitude: 25.7617,
  longitude: -80.1918,
  latitudeDelta: 0.15,
  longitudeDelta: 0.1,
};

interface Props {
  mapRef: React.RefObject<null>;
  incidents: CivicIncident[];
  userHasLocation: boolean;
  onMarkerPress: (incident: CivicIncident) => void;
  onMapPress: () => void;
}

export function CivicMapView({ incidents, onMarkerPress }: Props) {
  const colors = useColors();

  const colorMap: Record<string, string> = {
    crime: colors.crime as string,
    requests311: colors.requests311 as string,
    permits: colors.permits as string,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Grid lines to suggest a map */}
      <View style={styles.gridOverlay} pointerEvents="none">
        {[...Array(8)].map((_, i) => (
          <View
            key={`h${i}`}
            style={[styles.hLine, { top: `${(i + 1) * 11}%` as any, borderColor: colors.border + "40" }]}
          />
        ))}
        {[...Array(6)].map((_, i) => (
          <View
            key={`v${i}`}
            style={[styles.vLine, { left: `${(i + 1) * 14}%` as any, borderColor: colors.border + "40" }]}
          />
        ))}
      </View>

      <View style={styles.hint}>
        <Text style={[styles.hintTitle, { color: colors.foreground }]}>
          Interactive Map
        </Text>
        <Text style={[styles.hintSub, { color: colors.mutedForeground }]}>
          Scan the QR code with Expo Go{"\n"}for the full map experience
        </Text>
      </View>

      {/* Incident dots scattered on mock map */}
      {incidents.slice(0, 60).map((incident, i) => {
        const color = colorMap[incident.type] ?? (colors.primary as string);
        const x = ((incident.lon + 80.45) / 0.55) * 100;
        const y = ((incident.lat - 25.6) / 0.35) * 100;
        if (x < 2 || x > 98 || y < 2 || y > 98) return null;
        return (
          <View
            key={incident.id}
            style={[
              styles.webDot,
              {
                backgroundColor: color,
                left: `${x}%` as any,
                top: `${100 - y}%` as any,
              },
            ]}
            // @ts-ignore – web-only onClick
            onClick={() => onMarkerPress(incident)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  hLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  vLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  hint: {
    position: "absolute",
    bottom: 160,
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "rgba(22,32,56,0.85)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  hintTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  hintSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
  },
  webDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.85,
    cursor: "pointer",
  } as any,
});
