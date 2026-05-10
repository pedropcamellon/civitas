import { useEffect, useState } from "react";
import {
  Layers3,
  ShieldAlert,
  Building2,
  Package,
  Droplets,
  Truck,
  ChevronDown,
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

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

export function ControlPanel({ visible, onToggle, c }: ControlPanelProps) {
  const [layersOpen, setLayersOpen] = useState(true);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const isMobile = useIsMobile();

  const activeCount = Object.values(visible).filter(Boolean).length;

  // ── Mobile: bottom bar ───────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        position: "fixed", bottom: 80, left: 10, right: 10, zIndex: 900,
        background: c.panel, border: `1px solid ${c.border}`,
        borderRadius: 16, padding: "8px 10px",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
        display: "flex", alignItems: "center", gap: 6,
      }}>
        <Layers3 size={14} color={c.primary} style={{ flexShrink: 0 }} />
        <div style={{ display: "flex", gap: 5, flex: 1, flexWrap: "wrap" }}>
          {LAYER_CONFIG.map(({ key, label, colorKey }) => {
            const Icon = ICONS[key];
            const color = c[colorKey as keyof Theme] as string;
            const on = visible[key];
            return (
              <button
                key={key}
                onClick={() => onToggle(key)}
                title={label}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 8px", borderRadius: 8,
                  border: `1px solid ${on ? color + "66" : c.border}`,
                  background: on ? color + "22" : "transparent",
                  cursor: "pointer",
                }}
              >
                <Icon size={12} color={on ? color : c.muted} />
                <span style={{ fontSize: 11, fontWeight: 600, color: on ? c.text : c.muted }}>{label}</span>
              </button>
            );
          })}
        </div>
        <span style={{
          fontSize: 10, background: c.primary + "22", color: c.primary,
          borderRadius: 99, padding: "2px 6px", fontWeight: 700, flexShrink: 0,
        }}>{activeCount}</span>
      </div>
    );
  }

  // ── Desktop: left sidebar ────────────────────────────────────────────────
  return (
    <div style={{
      position: "fixed",
      left: 12,
      top: 14,
      width: 220,
      background: c.panel,
      border: `1px solid ${c.border}`,
      borderRadius: 18,
      padding: "10px 12px",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      zIndex: 900,
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      {/* Collapsible header */}
      <button
        onClick={() => setLayersOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6, width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "2px 0",
          marginBottom: layersOpen ? 10 : 0,
        }}
      >
        <Layers3 size={14} color={c.primary} />
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: c.muted }}>
          Layers
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 10, background: c.primary + "22",
          color: c.primary, borderRadius: 99, padding: "1px 7px", fontWeight: 700,
        }}>
          {activeCount} on
        </span>
        <ChevronDown
          size={12}
          color={c.muted}
          style={{ transform: layersOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
        />
      </button>

      {layersOpen && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {LAYER_CONFIG.map(({ key, label, colorKey }) => {
              const Icon = ICONS[key];
              const color = c[colorKey as keyof Theme] as string;
              const on = visible[key];

              return (
                <button
                  key={key}
                  onClick={() => onToggle(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 8px", borderRadius: 10,
                    border: `1px solid ${on ? color + "55" : c.border}`,
                    background: on ? color + "18" : "transparent",
                    cursor: "pointer", transition: "all 0.15s ease",
                    textAlign: "left", width: "100%",
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: 7,
                    background: on ? color + "33" : c.panel2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={13} color={on ? color : c.muted} />
                  </div>
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: on ? c.text : c.muted }}>{label}</span>
                  <div style={{
                    width: 28, height: 16, borderRadius: 99,
                    background: on ? color : c.panel2,
                    border: `1px solid ${on ? color : c.border}`,
                    position: "relative", flexShrink: 0, transition: "background 0.2s ease",
                  }}>
                    <div style={{
                      position: "absolute", top: 2, left: on ? 12 : 2,
                      width: 10, height: 10, borderRadius: "50%",
                      background: on ? "#fff" : c.muted, transition: "left 0.2s ease",
                    }} />
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setComingSoonOpen((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 4, width: "100%",
              marginTop: 10, paddingTop: 8, borderTop: `1px solid ${c.border}`,
              background: "none", border: "none", cursor: "pointer",
              fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: c.muted,
            }}
          >
            Coming soon
            <ChevronDown
              size={10}
              color={c.muted}
              style={{ marginLeft: "auto", transform: comingSoonOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            />
          </button>

          {comingSoonOpen && (
            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
              {COMING_SOON_LAYERS.map(({ label }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "5px 8px",
                  borderRadius: 8, border: `1px dashed ${c.border}`, opacity: 0.45,
                }}>
                  <Lock size={10} color={c.muted} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.muted }}>{label}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
