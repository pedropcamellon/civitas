import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  Switch,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useMapContext, LayerKey } from "@/context/MapContext";

interface LayerDef {
  key: LayerKey;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorKey: "crime" | "requests311" | "permits" | "water" | "cargo";
  badge?: string;
}

interface ComingSoon {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const ACTIVE_LAYERS: LayerDef[] = [
  {
    key: "crime",
    label: "Crime Incidents",
    description: "Police reports & criminal activity",
    icon: "shield-outline",
    colorKey: "crime",
  },
  {
    key: "requests311",
    label: "311 Requests",
    description: "Service requests & complaints",
    icon: "chatbubble-outline",
    colorKey: "requests311",
  },
  {
    key: "permits",
    label: "Building Permits",
    description: "Issued construction & renovation permits",
    icon: "construct-outline",
    colorKey: "permits",
  },
  {
    key: "water",
    label: "Water Quality",
    description: "Advisories, breaks & contamination alerts",
    icon: "water-outline",
    colorKey: "water",
  },
  {
    key: "cargo",
    label: "Cargo Routes",
    description: "Live truck route: Port → Doral warehouses",
    icon: "cube-outline",
    colorKey: "cargo",
    badge: "LIVE",
  },
];

const COMING_SOON: ComingSoon[] = [
  { label: "Traffic Flow",       description: "Real-time congestion & accidents",    icon: "car-outline"         },
  { label: "Flood Risk Zones",   description: "FEMA & storm surge risk areas",       icon: "rainy-outline"       },
  { label: "Transit Lines",      description: "Metrorail, Metrobus & trolley routes",icon: "bus-outline"         },
  { label: "Air Quality",        description: "EPA PM2.5 & AQI index overlay",       icon: "leaf-outline"        },
];

const SHEET_HEIGHT = 520;

export function LayerSheet() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { layers, toggleLayer, isLayerSheetOpen, setIsLayerSheetOpen } = useMapContext();

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
            tension: 60,
            friction: 12,
          }).start();
        }
      },
    })
  ).current;

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT + 100,
      duration: 240,
      useNativeDriver: true,
    }).start(() => setIsLayerSheetOpen(false));
  };

  useEffect(() => {
    if (isLayerSheetOpen) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 55,
        friction: 12,
      }).start();
    } else {
      translateY.setValue(SHEET_HEIGHT + 100);
    }
  }, [isLayerSheetOpen]);

  if (!isLayerSheetOpen) return null;

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 4;
  const activeCount = Object.values(layers).filter(Boolean).length;

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={closeSheet}
      />

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: bottomPad + 8,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Handle */}
        <View {...panResponder.panHandlers} style={styles.handleArea}>
          <View style={[styles.handle, { backgroundColor: colors.mutedForeground + "50" }]} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                Map Layers
              </Text>
              <Text style={[styles.sheetSub, { color: colors.mutedForeground as string }]}>
                {activeCount} of {ACTIVE_LAYERS.length} active
              </Text>
            </View>
            <TouchableOpacity
              onPress={closeSheet}
              style={[styles.closeBtn, { backgroundColor: colors.muted }]}
            >
              <Ionicons name="close" size={16} color={colors.mutedForeground as string} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
          {/* Active layers */}
          {ACTIVE_LAYERS.map((layer, i) => {
            const isOn = layers[layer.key];
            const color = colors[layer.colorKey] as string;
            return (
              <TouchableOpacity
                key={layer.key}
                style={[
                  styles.layerRow,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: i < ACTIVE_LAYERS.length - 1 ? StyleSheet.hairlineWidth : 0,
                  },
                ]}
                onPress={() => toggleLayer(layer.key)}
                activeOpacity={0.7}
              >
                {/* Color indicator */}
                <View
                  style={[
                    styles.colorDot,
                    {
                      backgroundColor: isOn ? color : colors.muted,
                      shadowColor: isOn ? color : "transparent",
                    },
                  ]}
                />

                {/* Icon */}
                <View style={[styles.iconWrap, { backgroundColor: isOn ? color + "18" : colors.muted }]}>
                  <Ionicons
                    name={layer.icon}
                    size={18}
                    color={isOn ? color : (colors.mutedForeground as string)}
                  />
                </View>

                {/* Label */}
                <View style={styles.layerText}>
                  <View style={styles.labelRow}>
                    <Text
                      style={[
                        styles.layerLabel,
                        { color: isOn ? colors.foreground : colors.mutedForeground },
                      ]}
                    >
                      {layer.label}
                    </Text>
                    {layer.badge && (
                      <View style={[styles.liveBadge, { backgroundColor: color + "25", borderColor: color + "60" }]}>
                        <View style={[styles.liveDot, { backgroundColor: color }]} />
                        <Text style={[styles.liveText, { color }]}>{layer.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.layerDesc, { color: colors.mutedForeground as string }]} numberOfLines={1}>
                    {layer.description}
                  </Text>
                </View>

                {/* Toggle */}
                <Switch
                  value={isOn}
                  onValueChange={() => toggleLayer(layer.key)}
                  trackColor={{ false: colors.muted, true: color + "60" }}
                  thumbColor={isOn ? color : colors.mutedForeground as string}
                  ios_backgroundColor={colors.muted}
                />
              </TouchableOpacity>
            );
          })}

          {/* Divider */}
          <View style={styles.sectionLabel}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.sectionText, { color: colors.mutedForeground as string }]}>
              COMING SOON
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Future layers */}
          {COMING_SOON.map((layer) => (
            <View key={layer.label} style={[styles.layerRow, { opacity: 0.45 }]}>
              <View style={[styles.colorDot, { backgroundColor: colors.muted }]} />
              <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
                <Ionicons name={layer.icon} size={18} color={colors.mutedForeground as string} />
              </View>
              <View style={styles.layerText}>
                <View style={styles.labelRow}>
                  <Text style={[styles.layerLabel, { color: colors.mutedForeground as string }]}>
                    {layer.label}
                  </Text>
                  <View style={[styles.soonBadge, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.soonText, { color: colors.mutedForeground as string }]}>
                      SOON
                    </Text>
                  </View>
                </View>
                <Text style={[styles.layerDesc, { color: colors.mutedForeground as string }]} numberOfLines={1}>
                  {layer.description}
                </Text>
              </View>
              <Switch
                value={false}
                disabled
                trackColor={{ false: colors.muted, true: colors.muted }}
                thumbColor={colors.mutedForeground as string}
                ios_backgroundColor={colors.muted}
              />
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    maxHeight: "85%",
  },
  handleArea: {
    paddingTop: 12,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.4,
  },
  sheetSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    paddingHorizontal: 20,
  },
  layerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  layerText: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  layerLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  layerDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  liveText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  soonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  soonText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  sectionText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
});
