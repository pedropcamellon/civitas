import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useMapContext, TimeFilter } from "@/context/MapContext";

const FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
];

export function TimelineBar() {
  const colors = useColors();
  const { timeFilter, setTimeFilter } = useMapContext();

  return (
    <View style={styles.row}>
      {FILTERS.map((f) => {
        const active = timeFilter === f.key;
        return (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.pill,
              {
                backgroundColor: active
                  ? colors.primary + "30"
                  : colors.card + "CC",
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setTimeFilter(f.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.primary : colors.mutedForeground },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
