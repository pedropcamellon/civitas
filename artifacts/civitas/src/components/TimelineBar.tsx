import React from "react";
import { useColors } from "@/hooks/useColors";
import { useMapContext, type TimeFilter } from "@/context/MapContext";

const FILTERS: { key: TimeFilter; label: string }[] = [
  { key: "24h", label: "24h" },
  { key: "7d",  label: "7 days" },
  { key: "30d", label: "30 days" },
];

export function TimelineBar() {
  const colors = useColors();
  const { timeFilter, setTimeFilter } = useMapContext();

  return (
    <div style={{ display: "flex", gap: 6, padding: "0 16px 8px" }}>
      {FILTERS.map((f) => {
        const active = timeFilter === f.key;
        return (
          <button
            key={f.key}
            onClick={() => setTimeFilter(f.key)}
            style={{
              padding: "7px 14px",
              borderRadius: 20,
              border: `1px solid ${active ? colors.primary : colors.border}`,
              backgroundColor: active ? colors.primary + "30" : colors.card + "CC",
              color: active ? colors.primary : colors.mutedForeground,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
