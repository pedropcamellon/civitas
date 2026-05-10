import React, { useEffect } from "react";
import { useColors } from "@/hooks/useColors";
import { useMapContext } from "@/context/MapContext";
import { useDataMeta } from "@/hooks/useCivicData";

export function TimelineBar() {
  const colors = useColors();
  const { timeFilter, setTimeFilter } = useMapContext();
  const { data: meta } = useDataMeta();

  // Once meta loads, default to the most recent year if no year is selected.
  useEffect(() => {
    if (!timeFilter && meta?.years?.length) {
      setTimeFilter(String(meta.years[meta.years.length - 1]));
    }
  }, [meta, timeFilter, setTimeFilter]);

  const years: number[] = meta?.years ?? [];

  return (
    <div style={{ display: "flex", gap: 6, padding: "0 16px 8px" }}>
      {years.map((year) => {
        const key = String(year);
        const active = timeFilter === key;
        return (
          <button
            key={key}
            onClick={() => setTimeFilter(key)}
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
            {year}
          </button>
        );
      })}
    </div>
  );
}
