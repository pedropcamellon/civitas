import React from "react";
import { Shield, MessageSquare, Wrench, Droplets } from "lucide-react";
import { useColors } from "@/hooks/useColors";
import { useMapContext, type LayerKey } from "@/context/MapContext";

const LAYERS: { key: LayerKey; label: string; Icon: React.ElementType }[] = [
  { key: "crime",       label: "Crime",   Icon: Shield       },
  { key: "requests311", label: "311",     Icon: MessageSquare },
  { key: "permits",     label: "Permits", Icon: Wrench        },
  { key: "water",       label: "Water",   Icon: Droplets      },
];

const COLOR_KEY: Record<LayerKey, keyof ReturnType<typeof useColors>> = {
  crime:       "crime",
  requests311: "requests311",
  permits:     "permits",
  water:       "water",
  cargo:       "cargo",
};

export function LayerControls() {
  const colors = useColors();
  const { layers, toggleLayer } = useMapContext();

  return (
    <div style={{ display: "flex", gap: 6, padding: "0 16px 8px", flexWrap: "wrap" }}>
      {LAYERS.map(({ key, label, Icon }) => {
        const active = layers[key];
        const color = colors[COLOR_KEY[key]] as string;
        return (
          <button
            key={key}
            onClick={() => toggleLayer(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 20,
              border: `1px solid ${active ? color : colors.border}`,
              backgroundColor: active ? color + "22" : "transparent",
              color: active ? color : colors.mutedForeground,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
