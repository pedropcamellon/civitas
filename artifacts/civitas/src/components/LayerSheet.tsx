import React, { useEffect, useRef, useCallback } from "react";
import { X, Shield, MessageSquare, Wrench, Droplets, Package, Car, CloudRain, Bus, Wind } from "lucide-react";
import { useColors } from "@/hooks/useColors";
import { useMapContext, type LayerKey } from "@/context/MapContext";

interface LayerDef {
  key: LayerKey;
  label: string;
  description: string;
  Icon: React.ElementType;
  colorKey: LayerKey;
  badge?: string;
}

interface ComingSoonDef {
  label: string;
  description: string;
  Icon: React.ElementType;
}

const ACTIVE_LAYERS: LayerDef[] = [
  { key: "crime",       label: "Crime Incidents",  description: "Police reports & criminal activity",          Icon: Shield,        colorKey: "crime"       },
  { key: "requests311", label: "311 Requests",     description: "Service requests & complaints",               Icon: MessageSquare, colorKey: "requests311" },
  { key: "permits",     label: "Building Permits", description: "Issued construction & renovation permits",    Icon: Wrench,        colorKey: "permits"     },
  { key: "water",       label: "Water Quality",    description: "Advisories, breaks & contamination alerts",  Icon: Droplets,      colorKey: "water"       },
  { key: "cargo",       label: "Logistics",       description: "Freight: trucks, ships & air",         Icon: Package,       colorKey: "cargo", badge: "LIVE" },
];

const COMING_SOON: ComingSoonDef[] = [
  { label: "Traffic Flow",     description: "Real-time congestion & accidents",     Icon: Car       },
  { label: "Flood Risk Zones", description: "FEMA & storm surge risk areas",        Icon: CloudRain },
  { label: "Transit Lines",    description: "Metrorail, Metrobus & trolley routes", Icon: Bus       },
  { label: "Air Quality",      description: "EPA PM2.5 & AQI index overlay",        Icon: Wind      },
];

export function LayerSheet() {
  const colors = useColors();
  const { layers, toggleLayer, isLayerSheetOpen, setIsLayerSheetOpen } = useMapContext();
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ y: number; time: number } | null>(null);

  const close = useCallback(() => setIsLayerSheetOpen(false), [setIsLayerSheetOpen]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = { y: e.clientY, time: Date.now() };
  };

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragStart.current || !sheetRef.current) return;
      const dy = e.clientY - dragStart.current.y;
      if (dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragStart.current) return;
      const dy = e.clientY - dragStart.current.y;
      const dt = Date.now() - dragStart.current.time;
      if (dy > 80 || dy / dt > 0.5) close();
      else if (sheetRef.current) sheetRef.current.style.transform = "";
      dragStart.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [close]);

  if (!isLayerSheetOpen) return null;

  const activeCount = Object.values(layers).filter(Boolean).length;

  return (
    <>
      <div onClick={close} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.45)", zIndex: 490 }} />
      <div
        ref={sheetRef}
        className="sheet-open"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          backgroundColor: colors.card, borderTop: `1px solid ${colors.border}`,
          borderRadius: "24px 24px 0 0", zIndex: 500,
          maxHeight: "75vh", display: "flex", flexDirection: "column",
          boxShadow: "0 -6px 24px rgba(0,0,0,0.4)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
          transition: "transform 220ms ease-out", willChange: "transform",
        }}
      >
        {/* Handle */}
        <div onPointerDown={onPointerDown} style={{ padding: "10px 20px 0", cursor: "grab" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.mutedForeground + "50", margin: "0 auto 14px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: colors.foreground }}>Map Layers</p>
              <p style={{ margin: 0, fontSize: 13, color: colors.mutedForeground }}>{activeCount} of {ACTIVE_LAYERS.length} active</p>
            </div>
            <button onClick={close} style={{ padding: "6px 8px", borderRadius: 8, backgroundColor: colors.muted, border: "none", cursor: "pointer", color: colors.mutedForeground }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", padding: "0 20px" }}>
          {ACTIVE_LAYERS.map((layer) => {
            const isOn = layers[layer.key];
            const color = colors[layer.colorKey] as string;
            return (
              <div
                key={layer.key}
                onClick={() => toggleLayer(layer.key)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${colors.border}`, cursor: "pointer" }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isOn ? color : colors.muted, flexShrink: 0 }} />
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isOn ? color + "18" : colors.muted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <layer.Icon size={18} color={isOn ? color : colors.mutedForeground} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: isOn ? colors.foreground : colors.mutedForeground }}>{layer.label}</span>
                    {layer.badge && (
                      <span style={{ fontSize: 10, fontWeight: 700, color, backgroundColor: color + "25", border: `1px solid ${color}60`, padding: "1px 6px", borderRadius: 6 }}>{layer.badge}</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: colors.mutedForeground }}>{layer.description}</span>
                </div>
                <div style={{
                  width: 40, height: 22, borderRadius: 11, position: "relative",
                  backgroundColor: isOn ? color + "60" : colors.muted, flexShrink: 0,
                  transition: "background-color 200ms",
                }}>
                  <div style={{
                    position: "absolute", top: 3, left: isOn ? 21 : 3, width: 16, height: 16,
                    borderRadius: 8, backgroundColor: isOn ? color : colors.mutedForeground,
                    transition: "left 200ms",
                  }} />
                </div>
              </div>
            );
          })}

          {/* Coming soon divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0 10px" }}>
            <div style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: colors.mutedForeground, letterSpacing: "0.8px" }}>COMING SOON</span>
            <div style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </div>

          {COMING_SOON.map((layer) => (
            <div key={layer.label} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", opacity: 0.4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.muted, flexShrink: 0 }} />
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.muted, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <layer.Icon size={18} color={colors.mutedForeground} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.mutedForeground }}>{layer.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: colors.mutedForeground, backgroundColor: colors.muted, padding: "1px 6px", borderRadius: 6 }}>SOON</span>
                </div>
                <span style={{ fontSize: 12, color: colors.mutedForeground }}>{layer.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
