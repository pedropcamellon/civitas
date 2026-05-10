import { createPortal } from "react-dom";
import { X, MapPin, Calendar, Info, Hash } from "lucide-react";
import type { Incident, Theme } from "./types";

interface IncidentModalProps {
  incident: Incident;
  onClose: () => void;
  c: Theme;
}

const TYPE_LABELS: Record<string, string> = {
  crime: "Crime Incident",
  "311": "311 Service Request",
  permit: "Building Permit",
  water: "Water Quality",
};

export function IncidentModal({ incident, onClose, c }: IncidentModalProps) {
  const typeLabel = TYPE_LABELS[incident.type] ?? incident.type;
  const typeColor = incident.type === "crime" ? c.crime
    : incident.type === "311" ? c.requests311
    : incident.type === "permit" ? c.permits
    : c.water;

  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    padding: "0 16px 24px",
  };

  const sheet: React.CSSProperties = {
    width: "min(560px, 100%)",
    background: c.panel,
    border: `1px solid ${c.border}`,
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 -4px 60px rgba(0,0,0,0.5)",
  };

  return createPortal(
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: typeColor,
              background: typeColor + "18", padding: "3px 10px", borderRadius: 99,
              border: `1px solid ${typeColor}33`,
            }}>
              {typeLabel}
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.text, marginTop: 8, lineHeight: 1.2 }}>
              {incident.title}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: c.panel2, border: `1px solid ${c.border}`,
            borderRadius: 10, padding: "7px 8px", cursor: "pointer", color: c.muted,
            display: "flex", alignItems: "center",
          }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ fontSize: 14, color: c.muted, marginBottom: 18, lineHeight: 1.6 }}>
          {incident.description}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          <Detail icon={<MapPin size={13} />} label="Address" value={incident.address} c={c} />
          <Detail icon={<Hash size={13} />} label="Status" value={incident.status} c={c} />
          <Detail icon={<Calendar size={13} />} label="Date" value={new Date(incident.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} c={c} />
          <Detail icon={<Info size={13} />} label="Neighborhood" value={incident.neighborhood} c={c} />
        </div>

        <div style={{ fontSize: 10, color: c.muted, textAlign: "center" }}>
          ID: {incident.id}
        </div>
      </div>
    </div>,
    document.body
  );
}

function Detail({ icon, label, value, c }: { icon: React.ReactNode; label: string; value: string; c: Theme }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 12, background: c.panel2, border: `1px solid ${c.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: c.muted, marginBottom: 4, fontSize: 11 }}>
        {icon}
        <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{value}</div>
    </div>
  );
}
