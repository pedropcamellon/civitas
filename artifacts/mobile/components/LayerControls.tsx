import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useMapContext, LayerKey } from "@/context/MapContext";

const LAYERS: { key: LayerKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "crime", label: "Crime", icon: "shield-outline" },
  { key: "requests311", label: "311", icon: "chatbubble-outline" },
  { key: "permits", label: "Permits", icon: "construct-outline" },
];

const LAYER_COLOR_MAP: Record<LayerKey, "crime" | "requests311" | "permits"> = {
  crime: "crime",
  requests311: "requests311",
  permits: "permits",
};

export function LayerControls() {
  const colors = useColors();
  const { layers, toggleLayer } = useMapContext();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card + "F2",
          borderTopColor: colors.border,
        },
      ]}
    >
      {LAYERS.map((layer) => {
        const active = layers[layer.key];
        const colorKey = LAYER_COLOR_MAP[layer.key];
        const layerColor = colors[colorKey] as string;
        return (
          <TouchableOpacity
            key={layer.key}
            style={[
              styles.pill,
              {
                backgroundColor: active ? layerColor + "22" : "transparent",
                borderColor: active ? layerColor : colors.border,
              },
            ]}
            onPress={() => toggleLayer(layer.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={layer.icon}
              size={15}
              color={active ? layerColor : colors.mutedForeground}
            />
            <Text
              style={[
                styles.label,
                { color: active ? layerColor : colors.mutedForeground },
              ]}
            >
              {layer.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});
