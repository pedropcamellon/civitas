import React, { useEffect, useRef, useCallback } from "react";
import { X, Shield, MessageSquare, Wrench, Droplets, Package, CalendarDays, MapPin } from "lucide-react";
import { useColors } from "@/hooks/useColors";
import { useMapContext, type LayerKey } from "@/context/MapContext";

const LABEL: Record<LayerKey, string> = {
  crime:       "Criminal Incident",
  requests311: "311 Service Request",
  permits:     "Building Permit",
  water:       "Water Quality Alert",
  cargo:       "Cargo Route",
};

const ICON: Record<LayerKey, React.ElementType> = {
  crime:       Shield,
  requests311: MessageSquare,
  permits:     Wrench,
  water:       Droplets,
  cargo:       Package,
};

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return dateStr; }
}

export function IncidentSheet() {
  const colors = useColors();
  const { selectedIncident, setSelectedIncident } = useMapContext();
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ y: number; time: number } | null>(null);

  const close = useCallback(() => setSelectedIncident(null), [setSelectedIncident]);

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
      if (dy > 80 || dy / dt > 0.5) {
        close();
      } else if (sheetRef.current) {
        sheetRef.current.style.transform = "";
      }
      dragStart.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [close]);

  const incident = selectedIncident;
  if (!incident) return null;

  const typeColor = colors[incident.type] as string;
  const TypeIcon = ICON[incident.type];

  return (
    <div
      ref={sheetRef}
      className={incident ? "sheet-open" : "sheet-closed"}
      style={{
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        backgroundColor: colors.card,
        borderTop: `1px solid ${colors.border}`,
        borderRadius: "24px 24px 0 0",
        padding: "0 20px calc(env(safe-area-inset-bottom, 0px) + 20px)",
        boxShadow: "0 -6px 24px rgba(0,0,0,0.4)",
        zIndex: 500,
        transition: "transform 220ms ease-out",
        willChange: "transform",
      }}
    >
      {/* Drag handle */}
      <div onPointerDown={onPointerDown} style={{ paddingTop: 10, marginBottom: 4, cursor: "grab" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.mutedForeground + "50", margin: "0 auto 14px" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 12, border: `1px solid ${typeColor}60`, backgroundColor: typeColor + "20" }}>
            <TypeIcon size={13} color={typeColor} />
            <span style={{ fontSize: 11, fontWeight: 600, color: typeColor, textTransform: "uppercase", letterSpacing: "0.6px" }}>
              {LABEL[incident.type]}
            </span>
          </div>
          <button onClick={close} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: colors.mutedForeground }}>
            <X size={18} />
          </button>
        </div>
      </div>

      <p style={{ fontSize: 19, fontWeight: 700, color: colors.foreground, margin: "0 0 6px", lineHeight: 1.3 }}>
        {incident.title}
      </p>

      {incident.description && incident.description !== incident.title && (
        <p style={{ fontSize: 14, color: colors.mutedForeground, margin: "0 0 14px", lineHeight: 1.5 }}>
          {incident.description}
        </p>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
        {incident.date && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: colors.mutedForeground }}>
            <CalendarDays size={13} />
            <span style={{ fontSize: 13 }}>{formatDate(incident.date)}</span>
          </div>
        )}
        {incident.status && (
          <div style={{ padding: "3px 10px", borderRadius: 8, backgroundColor: colors.muted, fontSize: 12, fontWeight: 600, color: colors.foreground }}>
            {incident.status}
          </div>
        )}
      </div>

      {incident.address && (
        <div style={{ display: "flex", alignItems: "center", gap: 5, color: colors.mutedForeground }}>
          <MapPin size={13} />
          <span style={{ fontSize: 13 }}>{incident.address}</span>
        </div>
      )}
    </div>
  );
}
