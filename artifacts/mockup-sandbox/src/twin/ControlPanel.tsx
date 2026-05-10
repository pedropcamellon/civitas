import { useState } from "react";
import {
  Layers3,
  ShieldAlert,
  Building2,
  Package,
  Droplets,
  Truck,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";
import type { Theme, LayerKey } from "./types";
import { LAYER_CONFIG, COMING_SOON_LAYERS } from "./types";

interface ControlPanelProps {
  visible: Record<LayerKey, boolean>;
  onToggle: (key: LayerKey) => void;
  c: Theme;
}

const ICONS: Record<LayerKey, typeof ShieldAlert> = {
  crime: ShieldAlert,
  requests311: Building2,
  permits: Package,
  water: Droplets,
  cargo: Truck,
};

export function ControlPanel({ visible, onToggle, c }: ControlPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const activeCount = Object.values(visible).filter(Boolean).length;

  const panel: React.CSSProperties = {
    position: "fixed",
    left: collapsed ? -220 : 12,
    top: "50%",
    transform: "translateY(-50%)",
    width: 232,
    background: c.panel,
    border: `1px solid ${c.border}`,
    borderRadius: 20,
    padding: collapsed ? 0 : 16,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    zIndex: 900,
    transition: "left 0.3s ease",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  };

  const toggleBtn: React.CSSProperties = {
    position: "absolute",
    right: -14,
    top: "50%",
    transform: "translateY(-50%)",
    width: 28,
    height: 52,
    background: c.panel,
    border: `1px solid ${c.border}`,
    borderRadius: "0 10px 10px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: c.muted,
    backdropFilter: "blur(20px)",
  };

  return (
    <div style={panel}>
      {!collapsed && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Layers3 size={16} color={c.primary} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: c.muted }}>
              Layers
            </span>
            <span style={{
              marginLeft: "auto", fontSize: 11, background: c.primary + "22",
              color: c.primary, borderRadius: 99, padding: "2px 8px", fontWeight: 700,
            }}>
              {activeCount} on
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {LAYER_CONFIG.map(({ key, label, description, colorKey }) => {
              const Icon = ICONS[key];
              const color = c[colorKey as keyof Theme] as string;
              const on = visible[key];

              return (
                <button
                  key={key}
                  onClick={() => onToggle(key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 10px",
                    borderRadius: 12,
                    border: `1px solid ${on ? color + "55" : c.border}`,
                    background: on ? color + "18" : "transparent",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: on ? color + "33" : c.panel2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={15} color={on ? color : c.muted} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: on ? c.text : c.muted }}>{label}</div>
                    <div style={{ fontSize: 11, color: c.muted, marginTop: 1 }}>{description}</div>
                  </div>
                  <div style={{
                    width: 32, height: 18, borderRadius: 99,
                    background: on ? color : c.panel2,
                    border: `1px solid ${on ? color : c.border}`,
                    position: "relative",
                    flexShrink: 0,
                    transition: "background 0.2s ease",
                  }}>
                    <div style={{
                      position: "absolute",
                      top: 2, left: on ? 14 : 2,
                      width: 12, height: 12,
                      borderRadius: "50%",
                      background: on ? "#fff" : c.muted,
                      transition: "left 0.2s ease",
                    }} />
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 14, borderTop: `1px solid ${c.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: c.muted, marginBottom: 8 }}>
              Coming soon
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {COMING_SOON_LAYERS.map(({ label, description }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                  borderRadius: 10, border: `1px dashed ${c.border}`, opacity: 0.5,
                }}>
                  <Lock size={12} color={c.muted} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.muted }}>{label}</div>
                    <div style={{ fontSize: 10, color: c.muted }}>{description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <button onClick={() => setCollapsed((v) => !v)} style={toggleBtn}>
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
}
