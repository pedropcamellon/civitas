import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMapContext, LayerKey } from "@/context/MapContext";

const SHEET_HEIGHT = 300;

function getTypeLabel(type: LayerKey) {
  if (type === "crime") return "Criminal Incident";
  if (type === "requests311") return "311 Service Request";
  return "Building Permit";
}

function getTypeIcon(type: LayerKey): keyof typeof Ionicons.glyphMap {
  if (type === "crime") return "shield";
  if (type === "requests311") return "chatbubble";
  return "construct";
}

function formatDate(dateStr: string) {
  if (!dateStr) return "Unknown date";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function IncidentSheet() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedIncident, setSelectedIncident } = useMapContext();

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT + 100)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 80 || gs.vy > 0.5) {
          closeSheet();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT + 100,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setSelectedIncident(null));
  };

  useEffect(() => {
    if (selectedIncident) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      translateY.setValue(SHEET_HEIGHT + 100);
    }
  }, [selectedIncident]);

  if (!selectedIncident) return null;

  const typeColorMap: Record<LayerKey, string> = {
    crime: colors.crime as string,
    requests311: colors.requests311 as string,
    permits: colors.permits as string,
  };
  const typeColor = typeColorMap[selectedIncident.type];
  const bottomPad =
    Platform.OS === "web" ? 34 : insets.bottom + 4;

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          paddingBottom: bottomPad + 16,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Drag handle area */}
      <View {...panResponder.panHandlers} style={styles.handleArea}>
        <View style={[styles.handle, { backgroundColor: colors.mutedForeground + "50" }]} />

        <View style={styles.header}>
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: typeColor + "20",
                borderColor: typeColor + "60",
              },
            ]}
          >
            <Ionicons
              name={getTypeIcon(selectedIncident.type)}
              size={13}
              color={typeColor}
            />
            <Text style={[styles.typeText, { color: typeColor }]}>
              {getTypeLabel(selectedIncident.type)}
            </Text>
          </View>
          <TouchableOpacity onPress={closeSheet} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <Text
        style={[styles.title, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {selectedIncident.title}
      </Text>

      {selectedIncident.description !== "" &&
        selectedIncident.description !== selectedIncident.title && (
          <Text
            style={[styles.description, { color: colors.mutedForeground }]}
            numberOfLines={2}
          >
            {selectedIncident.description}
          </Text>
        )}

      <View style={styles.metaRow}>
        {selectedIncident.date !== "" && (
          <View style={styles.metaItem}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={colors.mutedForeground}
            />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {formatDate(selectedIncident.date)}
            </Text>
          </View>
        )}
        {selectedIncident.status !== "" && (
          <View
            style={[styles.statusBadge, { backgroundColor: colors.muted }]}
          >
            <Text style={[styles.statusText, { color: colors.foreground }]}>
              {selectedIncident.status}
            </Text>
          </View>
        )}
      </View>

      {selectedIncident.address !== "" && (
        <View style={styles.metaItem}>
          <Ionicons
            name="location-outline"
            size={13}
            color={colors.mutedForeground}
          />
          <Text
            style={[styles.metaText, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {selectedIncident.address}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  handleArea: {
    paddingTop: 10,
    marginBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
    lineHeight: 25,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
